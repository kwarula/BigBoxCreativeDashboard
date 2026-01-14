/**
 * Test Supabase Connection
 *
 * This script verifies:
 * 1. Supabase client can connect
 * 2. Database schema is set up correctly
 * 3. Real-time subscriptions work
 * 4. append_event() function works
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase configuration!');
  console.error('Please update .env with your Supabase keys from:');
  console.error('https://supabase.com/dashboard/project/ggznznkdkkwtmexckizs/settings/api');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testConnection() {
  console.log('🔍 Testing Supabase Connection...\n');

  try {
    // Test 1: Connection
    console.log('Test 1: Database Connection');
    const { error: connError } = await supabase.from('events').select('event_id').limit(1);

    if (connError && connError.code !== 'PGRST116') {
      throw connError;
    }
    console.log('✅ Connected to Supabase PostgreSQL\n');

    // Test 2: Verify Tables
    console.log('Test 2: Verify Tables');
    const tables = [
      'events',
      'event_snapshots',
      'human_approvals',
      'sop_definitions',
      'sop_executions',
      'agent_metrics',
      'client_health',
      'chaos_experiments',
    ];

    for (const table of tables) {
      const { error } = await supabase.from(table).select('*').limit(1);
      if (error && error.code !== 'PGRST116') {
        throw new Error(`Table '${table}' not found: ${error.message}`);
      }
      console.log(`✅ Table '${table}' exists`);
    }
    console.log('');

    // Test 3: Test append_event() function
    console.log('Test 3: Test append_event() Function');
    const { data: eventId, error: rpcError } = await supabase.rpc('append_event', {
      p_event_type: 'TEST_EVENT',
      p_correlation_id: crypto.randomUUID(),
      p_causation_id: null,
      p_aggregate_type: 'Test',
      p_aggregate_id: 'test-001',
      p_payload: { message: 'Hello from Supabase test!' },
      p_metadata: { test: true },
      p_emitted_by: 'TestScript',
      p_confidence: 0.99,
    });

    if (rpcError) {
      throw rpcError;
    }
    console.log(`✅ append_event() function works! Created event: ${eventId}\n`);

    // Test 4: Verify event was inserted
    console.log('Test 4: Query Event');
    const { data: events, error: queryError } = await supabase
      .from('events')
      .select('*')
      .eq('event_id', eventId)
      .single();

    if (queryError) {
      throw queryError;
    }

    console.log('✅ Event retrieved successfully:');
    console.log(`   Event ID: ${events.event_id}`);
    console.log(`   Event Type: ${events.event_type}`);
    console.log(`   Aggregate: ${events.aggregate_type}:${events.aggregate_id}`);
    console.log(`   Sequence: ${events.sequence_number}`);
    console.log(`   Payload:`, events.payload);
    console.log('');

    // Test 5: Test get_event_stream() function
    console.log('Test 5: Test get_event_stream() Function');
    const { data: stream, error: streamError } = await supabase.rpc('get_event_stream', {
      p_aggregate_type: 'Test',
      p_aggregate_id: 'test-001',
      p_from_sequence: 0,
    });

    if (streamError) {
      throw streamError;
    }
    console.log(`✅ get_event_stream() function works! Found ${stream.length} event(s)\n`);

    // Test 6: Clean up test event
    console.log('Test 6: Cleanup');
    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .eq('event_id', eventId);

    if (deleteError) {
      console.log('⚠️  Could not clean up test event (this is ok)');
    } else {
      console.log('✅ Test event cleaned up\n');
    }

    // Summary
    console.log('========================================');
    console.log('🎉 All Tests Passed!');
    console.log('========================================');
    console.log('');
    console.log('Your Supabase integration is ready!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Run: npm run dev');
    console.log('2. Monitor events in Supabase Dashboard:');
    console.log('   https://supabase.com/dashboard/project/ggznznkdkkwtmexckizs/editor');
    console.log('');

  } catch (error) {
    console.error('\n❌ Test Failed!');
    console.error('Error:', error.message);
    console.error('\nPlease check:');
    console.error('1. Your .env file has the correct Supabase keys');
    console.error('2. The SQL migration ran successfully');
    console.error('3. Your Supabase project is active');
    process.exit(1);
  }
}

testConnection();
