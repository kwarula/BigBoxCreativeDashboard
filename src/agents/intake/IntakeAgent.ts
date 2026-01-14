/**
 * AI INTAKE AGENT
 *
 * Mandate: Qualify leads and schedule meetings
 * Subscribes to: LEAD_RECEIVED
 * Emits: LEAD_QUALIFIED, MEETING_SCHEDULED
 * Failure Mode: Low confidence → HUMAN_APPROVAL_REQUESTED
 */

import { AutonomicAgent } from '../../core/agents/AutonomicAgent.js';
import { EventBus } from '../../core/bus/EventBus.js';
import { EventEnvelope, LeadReceivedPayload } from '../../core/events/types.js';

export class IntakeAgent extends AutonomicAgent {
  constructor(eventBus: EventBus) {
    super(
      {
        name: 'AI Intake Agent',
        description: 'Qualifies incoming leads and schedules discovery meetings',
        subscribesTo: ['LEAD_RECEIVED' as any],
        emits: ['LEAD_QUALIFIED' as any, 'MEETING_SCHEDULED' as any],
        confidenceThreshold: 0.75,
      },
      eventBus
    );
  }

  protected async processEvent(event: EventEnvelope): Promise<void> {
    if (event.event_type !== 'LEAD_RECEIVED') {
      return;
    }

    const payload = event.payload as unknown as LeadReceivedPayload;

    this.logger.info('Processing lead', {
      lead_id: event.entity_id,
      lead_source: payload.lead_source,
      contact_name: payload.contact_name,
    });

    // Analyze lead quality using AI (placeholder for Gemini integration)
    const qualificationResult = await this.qualifyLead(payload);

    if (qualificationResult.confidence < this.mandate.confidenceThreshold) {
      await this.requestHumanApproval(
        'lead_qualification',
        'Lead qualification confidence below threshold',
        {
          lead: payload,
          qualification_result: qualificationResult,
        },
        qualificationResult.suggested_action,
        'medium'
      );
      return;
    }

    // Emit LEAD_QUALIFIED event
    await this.emitEvent(
      'LEAD_QUALIFIED' as any,
      'LEAD',
      event.entity_id,
      {
        lead_id: event.entity_id,
        qualification_score: qualificationResult.score,
        budget_range: qualificationResult.budget_range,
        timeline: qualificationResult.timeline,
        project_type: qualificationResult.project_type,
        qualification_notes: qualificationResult.notes,
      },
      qualificationResult.confidence,
      false
    );

    // Auto-schedule meeting if confidence is high
    if (qualificationResult.confidence >= 0.85 && qualificationResult.score >= 70) {
      await this.scheduleMeeting(event.entity_id, payload);
    }
  }

  /**
   * Qualify lead using AI analysis
   * In production, this would call Gemini API
   */
  private async qualifyLead(lead: LeadReceivedPayload): Promise<{
    score: number;
    confidence: number;
    budget_range?: string;
    timeline?: string;
    project_type?: string;
    notes: string;
    suggested_action?: string;
  }> {
    // PLACEHOLDER: In production, this would use Gemini API
    // For now, simple heuristic
    let score = 50;
    let confidence = 0.7;
    const notes: string[] = [];

    // Check for urgency
    if (lead.urgency === 'high') {
      score += 20;
      notes.push('High urgency indicated');
    }

    // Check for company name
    if (lead.company_name) {
      score += 10;
      notes.push('Company identified');
    }

    // Check for completeness
    if (lead.contact_email && lead.contact_phone) {
      score += 10;
      confidence += 0.1;
      notes.push('Complete contact information');
    }

    // Check message quality
    if (lead.initial_message.length > 100) {
      score += 10;
      confidence += 0.05;
      notes.push('Detailed inquiry');
    }

    return {
      score: Math.min(100, score),
      confidence: Math.min(1.0, confidence),
      budget_range: 'TBD',
      timeline: 'TBD',
      project_type: 'TBD',
      notes: notes.join('; '),
      suggested_action: score >= 70 ? 'Schedule discovery meeting' : 'Manual review required',
    };
  }

  /**
   * Schedule discovery meeting
   */
  private async scheduleMeeting(leadId: string, lead: LeadReceivedPayload): Promise<void> {
    // PLACEHOLDER: In production, this would integrate with calendar API

    const meetingDatetime = new Date();
    meetingDatetime.setDate(meetingDatetime.getDate() + 2); // Schedule 2 days out

    await this.emitEvent(
      'MEETING_SCHEDULED' as any,
      'LEAD',
      leadId,
      {
        lead_id: leadId,
        meeting_datetime: meetingDatetime.toISOString(),
        meeting_type: 'discovery',
        attendees: [lead.contact_email],
      },
      0.95,
      false
    );

    this.logger.info('Meeting scheduled', {
      lead_id: leadId,
      meeting_datetime: meetingDatetime.toISOString(),
    });
  }
}
