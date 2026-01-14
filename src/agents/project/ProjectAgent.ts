/**
 * AI PROJECT CONTROL AGENT
 *
 * Mandate: Manage project execution and detect risks
 * Subscribes to: TASK_CREATED, PROJECT_STARTED
 * Emits: TASK_ASSIGNED, PROJECT_AT_RISK
 */

import { AutonomicAgent } from '../../core/agents/AutonomicAgent.js';
import { EventBus } from '../../core/bus/EventBus.js';
import { EventEnvelope, TaskCreatedPayload, ProjectStartedPayload } from '../../core/events/types.js';

export class ProjectAgent extends AutonomicAgent {
  constructor(eventBus: EventBus) {
    super(
      {
        name: 'AI Project Control Agent',
        description: 'Manages project execution and resource allocation',
        subscribesTo: ['TASK_CREATED' as any, 'PROJECT_STARTED' as any],
        emits: ['TASK_ASSIGNED' as any, 'PROJECT_AT_RISK' as any],
        confidenceThreshold: 0.75,
      },
      eventBus
    );
  }

  protected async processEvent(event: EventEnvelope): Promise<void> {
    switch (event.event_type) {
      case 'TASK_CREATED':
        await this.handleTaskCreated(event);
        break;
      case 'PROJECT_STARTED':
        await this.handleProjectStarted(event);
        break;
    }
  }

  private async handleTaskCreated(event: EventEnvelope): Promise<void> {
    const payload = event.payload as unknown as TaskCreatedPayload;

    this.logger.info('Assigning task', {
      task_id: event.entity_id,
      priority: payload.priority,
    });

    // Assign task using AI-based resource allocation
    const assignment = await this.assignTask(payload);

    await this.emitEvent(
      'TASK_ASSIGNED' as any,
      'TASK',
      event.entity_id,
      {
        task_id: event.entity_id,
        assigned_to: assignment.assignee,
        assigned_by: 'ai_project_agent',
        assignment_reason: assignment.reason,
      },
      assignment.confidence,
      assignment.confidence < this.mandate.confidenceThreshold
    );
  }

  private async handleProjectStarted(event: EventEnvelope): Promise<void> {
    const payload = event.payload as unknown as ProjectStartedPayload;

    this.logger.info('Monitoring project', {
      project_id: event.entity_id,
      project_name: payload.project_name,
      budget: payload.budget,
    });

    // Perform initial risk assessment
    const riskAssessment = await this.assessProjectRisk(payload);

    if (riskAssessment.risks.length > 0) {
      await this.emitEvent(
        'PROJECT_AT_RISK' as any,
        'PROJECT',
        event.entity_id,
        {
          project_id: event.entity_id,
          risk_factors: riskAssessment.risks,
          current_status: 'just_started',
          recommended_actions: riskAssessment.recommendations,
        },
        riskAssessment.confidence,
        riskAssessment.severity === 'high'
      );
    }
  }

  /**
   * Assign task using AI-based resource allocation
   * In production, this would consider team capacity, skills, and workload
   */
  private async assignTask(task: TaskCreatedPayload): Promise<{
    assignee: string;
    reason: string;
    confidence: number;
  }> {
    // PLACEHOLDER: In production, this would use team capacity API + Gemini
    const availableTeam = ['designer_1', 'developer_1', 'manager_1'];

    // Simple priority-based assignment
    let assignee = availableTeam[0];
    let reason = 'Based on availability and skills';

    if (task.priority === 'urgent') {
      assignee = 'manager_1';
      reason = 'Urgent priority requires senior oversight';
    }

    return {
      assignee,
      reason,
      confidence: 0.8,
    };
  }

  /**
   * Assess project risk
   */
  private async assessProjectRisk(project: ProjectStartedPayload): Promise<{
    risks: string[];
    recommendations: string[];
    severity: 'low' | 'medium' | 'high';
    confidence: number;
  }> {
    // PLACEHOLDER: In production, this would use Gemini API
    const risks: string[] = [];
    const recommendations: string[] = [];
    let severity: 'low' | 'medium' | 'high' = 'low';

    // Check timeline
    if (project.timeline_weeks < 4) {
      risks.push('Aggressive timeline may cause quality issues');
      recommendations.push('Consider timeline extension');
      severity = 'medium';
    }

    // Check team size
    if (project.team_members.length < 2) {
      risks.push('Small team size - single point of failure');
      recommendations.push('Add backup resources');
      severity = 'medium';
    }

    return {
      risks,
      recommendations,
      severity,
      confidence: 0.75,
    };
  }
}
