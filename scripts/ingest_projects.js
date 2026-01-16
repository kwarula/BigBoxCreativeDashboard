import fs from 'fs';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const html = fs.readFileSync('ALL BB ACCOUNTS.html', 'utf8');
const $ = cheerio.load(html);

async function ingest() {
    console.log('Cleaning up existing data...');
    await supabase.from('milestones').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('projects').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('clients').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    const rows = $('tr');
    const projects = [];

    let currentProjects = [null, null]; // Supports up to 2 side-by-side slots

    rows.each((i, row) => {
        const tds = $(row).find('td');

        // Check for project headers (colspan=8 or large font)
        tds.each((j, td) => {
            const colspan = parseInt($(td).attr('colspan') || '1');
            const text = $(td).text().trim();

            if (colspan >= 8 && text && text !== 'PROJECTS' && text !== 'ALL BB ACCOUNTS') {
                const slotIndex = j < 10 ? 0 : 1;
                currentProjects[slotIndex] = {
                    name: text,
                    staff_in_charge: '',
                    what: '',
                    where: '',
                    when: '',
                    notes: '',
                    contact: '',
                    priority: 'medium',
                    status: 'not_started'
                };
            }
        });

        // Extract fields
        tds.each((j, td) => {
            const label = $(td).text().trim().toLowerCase();
            const valueTd = $(td).next('td');
            const value = valueTd.text().trim();
            const slotIndex = j < 10 ? 0 : 1;
            const p = currentProjects[slotIndex];

            if (p) {
                if (label === 'staff in charge' || label === 'stafff in charge') p.staff_in_charge = value;
                else if (label === 'what') p.what = value;
                else if (label === 'where') p.where = value;
                else if (label === 'when') p.when = value;
                else if (label === 'notes') p.notes = value;
                else if (label === 'contact person' || label === 'contact') p.contact = value;
            }
        });

        // If we hit an empty row or a spacer, we might be ending a block
        // But rows can have partial data. Actually, the best way is to collect all and then deduplicate or finalize.
        // For now, let's just collect everything and push unique names at the end.
        currentProjects.forEach((p, idx) => {
            if (p && p.name) {
                const existing = projects.find(proj => proj.name === p.name);
                if (!existing) {
                    projects.push(p);
                } else {
                    // Merge data if needed
                    if (p.staff_in_charge) existing.staff_in_charge = p.staff_in_charge;
                    if (p.what) existing.what = p.what;
                    if (p.where) existing.where = p.where;
                    if (p.when) existing.when = p.when;
                    if (p.notes) existing.notes = p.notes;
                    if (p.contact) existing.contact = p.contact;
                }
            }
        });
    });

    console.log(`Extracted ${projects.length} potential projects.`);

    for (const p of projects) {
        if (!p.name) continue;

        // Determine client name (simple heuristic: first word or full name if short)
        let clientName = p.name.split(' ')[0];
        if (p.name.length < 15) clientName = p.name;

        // Override for known clients
        if (p.name.includes('SHECONOMY')) clientName = 'SHECONOMY';
        if (p.name.includes('RFH')) clientName = 'RFH';
        if (p.name.includes('SHELL')) clientName = 'SHELL VIVO';
        if (p.name.includes('FINTECH')) clientName = 'FINTECH';
        if (p.name.includes('KIBO')) clientName = 'KIBO BIKES';
        if (p.name.includes('CHICKING')) clientName = 'CHICKING';

        // 1. Get or Create Client
        let { data: client, error: clientErr } = await supabase
            .from('clients')
            .select('id')
            .eq('name', clientName)
            .single();

        if (!client) {
            const { data: newClient, error: createErr } = await supabase
                .from('clients')
                .insert({ name: clientName })
                .select()
                .single();
            client = newClient;
        }

        if (!client) continue;

        // 2. Create Project
        const { data: project, error: projErr } = await supabase
            .from('projects')
            .insert({
                client_id: client.id,
                name: p.name,
                staff_in_charge: p.staff_in_charge,
                description: p.what,
                location: p.where,
                notes: p.notes,
                priority: p.priority,
                status: p.status
            })
            .select()
            .single();

        if (projErr) {
            console.error(`Error inserting project ${p.name}:`, projErr);
            continue;
        }

        // 3. Create Default Tasks
        const defaultTasks = [
            { project_id: project.id, title: 'Initial Client Briefing', priority: 'high', status: 'completed', due_date: 'Yesterday' },
            { project_id: project.id, title: 'Resource Allocation', priority: 'medium', status: 'pending', due_date: 'Today' },
            { project_id: project.id, title: 'First Deliverable Draft', priority: 'medium', status: 'pending', due_date: 'In 2 days' }
        ];

        await supabase.from('tasks').insert(defaultTasks);

        // 4. Create Default Milestones
        const defaultMilestones = [
            { project_id: project.id, name: 'Kickoff Meeting', status: 'completed', date: '2026-01-01' },
            { project_id: project.id, name: 'Concept Approval', status: 'completed', date: '2026-01-10' },
            { project_id: project.id, name: 'Development Phase', status: 'in_progress', date: '2026-01-25' },
            { project_id: project.id, name: 'Final Handover', status: 'pending', date: '2026-02-15' }
        ];

        await supabase.from('milestones').insert(defaultMilestones);

        console.log(`Ingested project, tasks, and milestones: ${p.name}`);
    }

    console.log('Ingestion complete!');
}

ingest().catch(console.error);
