/**
 * AI MEETING INTELLIGENCE AGENT
 *
 * Mandate: Analyze meetings and infer client intent
 * Subscribes to: MEETING_COMPLETED
 * Emits: INTENT_INFERRED, TASK_CREATED, RISK_DETECTED
 */

import { AutonomicAgent } from '../../core/agents/AutonomicAgent.js';
import { EventBus } from '../../core/bus/EventBus.js';
import { EventEnvelope, MeetingCompletedPayload } from '../../core/events/types.js';

export class MeetingAgent extends AutonomicAgent {
  constructor(eventBus: EventBus) {
    super(
      {
        name: 'AI Meeting Intelligence Agent',
        description: 'Analyzes meeting outcomes and infers client intent',
        subscribesTo: ['MEETING_COMPLETED' as any],
        emits: ['INTENT_INFERRED' as any, 'TASK_CREATED' as any, 'RISK_DETECTED' as any],
        confidenceThreshold: 0.75,
      },
      eventBus
    );
  }

  protected async processEvent(event: EventEnvelope): Promise<void> {
    if (event.event_type !== 'MEETING_COMPLETED') {
      return;
    }

    const payload = event.payload as unknown as MeetingCompletedPayload;

    this.logger.info('Analyzing meeting', {
      meeting_id: payload.meeting_id,
      sentiment: payload.sentiment,
      action_items: payload.action_items.length,
    });

    // Analyze meeting using AI
    const analysis = await this.analyzeMeeting(payload);

    // Emit INTENT_INFERRED event
    await this.emitEvent(
      'INTENT_INFERRED' as any,
      'CLIENT',
      event.entity_id,
      {
        meeting_id: payload.meeting_id,
        client_id: event.entity_id,
        inferred_needs: analysis.needs,
        suggested_services: analysis.services,
        estimated_budget_range: analysis.budget_range,
        estimated_timeline: analysis.timeline,
        confidence_factors: analysis.confidence_factors,
      },
      analysis.confidence,
      analysis.confidence < this.mandate.confidenceThreshold
    );

    // Create tasks from action items
    for (const actionItem of payload.action_items) {
      await this.createTaskFromActionItem(event.entity_id, actionItem);
    }

    // Detect risks
    if (payload.sentiment === 'negative') {
      await this.emitEvent(
        'RISK_DETECTED' as any,
        'CLIENT',
        event.entity_id,
        {
          risk_type: 'relationship',
          severity: 'medium',
          description: 'Negative meeting sentiment detected',
          affected_entity_type: 'CLIENT',
          affected_entity_id: event.entity_id,
          mitigation_suggestions: [
            'Schedule follow-up call',
            'Review meeting transcript',
            'Assign senior account manager',
          ],
        },
        0.85,
        true
      );
    }
  }

  /**
   * Analyze meeting using AI
   * In production, this would call Gemini API
   */
  private async analyzeMeeting(meeting: MeetingCompletedPayload): Promise<{
    needs: string[];
    services: string[];
    budget_range: string;
    timeline: string;
    confidence: number;
    confidence_factors: Record<string, number>;
  }> {
    // PLACEHOLDER: In production, this would use Gemini API
    const needs: string[] = [];
    const services: string[] = [];
    let confidence = 0.8;

    // Simple keyword analysis
    const summary = meeting.summary.toLowerCase();

    if (summary.includes('brand') || summary.includes('logo')) {
      needs.push('Brand identity development');
      services.push('Branding & Identity');
      confidence += 0.05;
    }

    if (summary.includes('website') || summary.includes('digital')) {
      needs.push('Digital presence');
      services.push('Web Design & Development');
      confidence += 0.05;
    }

    if (summary.includes('social') || summary.includes('content')) {
      needs.push('Social media strategy');
      services.push('Content Creation');
      confidence += 0.05;
    }

    return {
      needs: needs.length > 0 ? needs : ['General creative services'],
      services: services.length > 0 ? services : ['To be determined'],
      budget_range: '$10k - $50k',
      timeline: '3-6 months',
      confidence: Math.min(1.0, confidence),
      confidence_factors: {
        summary_clarity: 0.8,
        action_items: meeting.action_items.length > 0 ? 0.9 : 0.5,
        sentiment: meeting.sentiment === 'positive' ? 0.9 : 0.6,
      },
    };
  }

  /**
   * Create task from action item
   */
  private async createTaskFromActionItem(
    clientId: string,
    actionItem: { description: string; assignee?: string; due_date?: string }
  ): Promise<void> {
    await this.emitEvent(
      'TASK_CREATED' as any,
      'CLIENT',
      clientId,
      {
        task_title: actionItem.description,
        task_description: `Follow-up task from meeting`,
        priority: 'medium',
        due_date: actionItem.due_date,
      },
      0.9,
      false
    );
  }
}
