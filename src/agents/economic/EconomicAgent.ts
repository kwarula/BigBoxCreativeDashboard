/**
 * AI ECONOMIC CONTROLLER AGENT
 *
 * Mandate: Turn the system into a self-improving organism
 * Subscribes to: SOP_EXECUTION_COMPLETED, TASK_COMPLETED, HUMAN_OVERRIDE, PROJECT_COMPLETED
 * Emits: SOP_OPTIMIZATION_RECOMMENDED, AUTOMATION_OPPORTUNITY_DETECTED, MARGIN_EROSION_DETECTED, AUTOMATION_ROI_CALCULATED
 *
 * This agent closes GAP 2: No Economic Feedback Loop
 *
 * Core Principle:
 * The system must know which workflows waste human time and which generate margin.
 * Without economic intelligence, automation is blind optimization.
 */

import { AutonomicAgent } from '../../core/agents/AutonomicAgent.js';
import { EventBus } from '../../core/bus/EventBus.js';
import {
  EventEnvelope,
  SOPExecutionCompletedPayload,
  TaskCompletedPayload,
  ProjectCompletedPayload,
} from '../../core/events/types.js';
import { SOPResolver } from '../../core/sop/SOPResolver.js';
import { SOPExecutionResult } from '../../core/sop/types.js';

interface SOPPerformanceMetrics {
  sop_id: string;
  executions: number;
  total_cycle_time_hours: number;
  total_human_minutes: number;
  total_cost: number;
  total_automation_rate: number;
  deviations: number;
}

interface AutomationOpportunity {
  task_pattern: string;
  frequency: number;
  avg_duration_minutes: number;
  automation_potential: number;
}

export class EconomicAgent extends AutonomicAgent {
  private sopResolver: SOPResolver;
  private sopMetrics: Map<string, SOPPerformanceMetrics>;
  private manualTasks: Map<string, AutomationOpportunity>;
  private humanOverrides: Array<{
    timestamp: string;
    reason: string;
    sop_id?: string;
    cost: number;
  }>;

  constructor(eventBus: EventBus, sopResolver: SOPResolver) {
    super(
      {
        name: 'AI Economic Controller',
        description: 'Monitors economic performance and identifies optimization opportunities',
        subscribesTo: [
          'SOP_EXECUTION_COMPLETED' as any,
          'TASK_COMPLETED' as any,
          'HUMAN_OVERRIDE' as any,
          'PROJECT_COMPLETED' as any,
        ],
        emits: [
          'SOP_OPTIMIZATION_RECOMMENDED' as any,
          'AUTOMATION_OPPORTUNITY_DETECTED' as any,
          'MARGIN_EROSION_DETECTED' as any,
          'AUTOMATION_ROI_CALCULATED' as any,
        ],
        confidenceThreshold: 0.80,
      },
      eventBus
    );

    this.sopResolver = sopResolver;
    this.sopMetrics = new Map();
    this.manualTasks = new Map();
    this.humanOverrides = [];
  }

  protected async processEvent(event: EventEnvelope): Promise<void> {
    switch (event.event_type) {
      case 'SOP_EXECUTION_COMPLETED':
        await this.handleSOPExecution(event);
        break;
      case 'TASK_COMPLETED':
        await this.handleTaskCompleted(event);
        break;
      case 'HUMAN_OVERRIDE':
        await this.handleHumanOverride(event);
        break;
      case 'PROJECT_COMPLETED':
        await this.handleProjectCompleted(event);
        break;
    }
  }

  /**
   * Analyze SOP execution for optimization opportunities
   */
  private async handleSOPExecution(event: EventEnvelope): Promise<void> {
    const payload = event.payload as unknown as SOPExecutionCompletedPayload;

    this.logger.info('Analyzing SOP execution economics', {
      sop_id: payload.sop_id,
      cycle_time: payload.cycle_time_hours,
      automation_rate: payload.automation_rate,
      cost: payload.cost,
    });

    // Update metrics
    let metrics = this.sopMetrics.get(payload.sop_id);
    if (!metrics) {
      metrics = {
        sop_id: payload.sop_id,
        executions: 0,
        total_cycle_time_hours: 0,
        total_human_minutes: 0,
        total_cost: 0,
        total_automation_rate: 0,
        deviations: 0,
      };
    }

    metrics.executions++;
    metrics.total_cycle_time_hours += payload.cycle_time_hours;
    metrics.total_human_minutes += payload.human_minutes;
    metrics.total_cost += payload.cost;
    metrics.total_automation_rate += payload.automation_rate;
    metrics.deviations += payload.deviations.length;

    this.sopMetrics.set(payload.sop_id, metrics);

    // Check if optimization is warranted (every 10 executions)
    if (metrics.executions % 10 === 0) {
      await this.analyzeSOPOptimization(payload.sop_id, metrics);
    }

    // Check for margin erosion
    const sop = this.sopResolver.getSOPById(payload.sop_id);
    if (sop) {
      const targetCost = sop.metrics.cost_per_execution_target || 0;
      if (targetCost > 0 && payload.cost > targetCost * 1.2) {
        await this.emitEvent(
          'MARGIN_EROSION_DETECTED' as any,
          'SYSTEM',
          payload.sop_id,
          {
            project_id: event.entity_id,
            budgeted_hours: sop.metrics.human_minutes_target / 60,
            actual_hours: payload.human_minutes / 60,
            variance_percentage: ((payload.cost - targetCost) / targetCost) * 100,
            causes: this.identifyMarginErosionCauses(payload, sop.metrics),
            recommended_actions: [
              'Review process efficiency',
              'Check for scope creep',
              'Consider automation opportunities',
            ],
          },
          0.85,
          true
        );
      }
    }
  }

  /**
   * Analyze SOP for optimization opportunities
   */
  private async analyzeSOPOptimization(
    sopId: string,
    metrics: SOPPerformanceMetrics
  ): Promise<void> {
    const sop = this.sopResolver.getSOPById(sopId);
    if (!sop) return;

    const avgCycleTime = metrics.total_cycle_time_hours / metrics.executions;
    const avgAutomationRate = metrics.total_automation_rate / metrics.executions;
    const avgCost = metrics.total_cost / metrics.executions;

    // Calculate potential improvements
    const recommendations: Array<{
      step_id: string;
      change_type: 'automate' | 'remove' | 'simplify' | 'reorder';
      expected_impact: string;
      confidence: number;
    }> = [];

    // Check if automation rate is below target
    if (avgAutomationRate < sop.metrics.automation_rate_target) {
      // Find manual steps that could be automated
      for (const step of sop.steps) {
        if (step.automation_level === 'manual' || step.automation_level === 'assisted') {
          recommendations.push({
            step_id: step.step_id,
            change_type: 'automate',
            expected_impact: `Increase automation rate by ${(1 - avgAutomationRate) * 0.3}`,
            confidence: 0.75,
          });
        }
      }
    }

    // Check if cycle time exceeds target
    if (avgCycleTime > sop.metrics.cycle_time_target_hours * 1.2) {
      recommendations.push({
        step_id: 'workflow',
        change_type: 'simplify',
        expected_impact: `Reduce cycle time by ${avgCycleTime - sop.metrics.cycle_time_target_hours} hours`,
        confidence: 0.70,
      });
    }

    if (recommendations.length > 0) {
      const potentialMonthlySavings =
        ((sop.metrics.cost_per_execution_target || avgCost) - avgCost) * metrics.executions * 4;

      await this.emitEvent(
        'SOP_OPTIMIZATION_RECOMMENDED' as any,
        'SYSTEM',
        sopId,
        {
          sop_id: sopId,
          current_metrics: {
            automation_rate: avgAutomationRate,
            cycle_time_hours: avgCycleTime,
            cost_per_execution: avgCost,
          },
          recommended_changes: recommendations,
          potential_savings: {
            time_hours_per_month: (sop.metrics.cycle_time_target_hours - avgCycleTime) * metrics.executions * 4,
            cost_per_month: potentialMonthlySavings,
          },
        },
        0.80,
        false
      );
    }
  }

  /**
   * Track manual tasks for automation opportunities
   */
  private async handleTaskCompleted(event: EventEnvelope): Promise<void> {
    const payload = event.payload as unknown as TaskCompletedPayload;

    // Check if this was a manual task
    if (payload.completion_notes?.includes('manual') || !payload.completion_notes) {
      const taskPattern = this.extractTaskPattern(event);
      let opportunity = this.manualTasks.get(taskPattern);

      if (!opportunity) {
        opportunity = {
          task_pattern: taskPattern,
          frequency: 0,
          avg_duration_minutes: 0,
          automation_potential: 0,
        };
      }

      opportunity.frequency++;
      const duration = payload.actual_hours ? payload.actual_hours * 60 : 30;
      opportunity.avg_duration_minutes =
        (opportunity.avg_duration_minutes * (opportunity.frequency - 1) + duration) /
        opportunity.frequency;

      this.manualTasks.set(taskPattern, opportunity);

      // If this pattern occurs frequently, recommend automation
      if (opportunity.frequency >= 5) {
        const monthlyCost =
          opportunity.avg_duration_minutes * opportunity.frequency * 4 * (100 / 60); // $100/hour

        if (monthlyCost > 500) {
          await this.emitEvent(
            'AUTOMATION_OPPORTUNITY_DETECTED' as any,
            'SYSTEM',
            'automation_opportunities',
            {
              manual_task_pattern: taskPattern,
              frequency_per_month: opportunity.frequency * 4,
              average_duration_minutes: opportunity.avg_duration_minutes,
              total_monthly_cost: monthlyCost,
              automation_feasibility: this.assessAutomationFeasibility(taskPattern),
              recommended_approach: this.recommendAutomationApproach(taskPattern),
              roi_months: this.calculateAutomationROI(monthlyCost),
            },
            0.75,
            false
          );
        }
      }
    }
  }

  /**
   * Track human overrides as economic cost
   */
  private async handleHumanOverride(event: EventEnvelope): Promise<void> {
    this.humanOverrides.push({
      timestamp: event.created_at,
      reason: event.payload.override_reason as string,
      sop_id: event.payload.sop_id as string | undefined,
      cost: 15, // 15 minutes average cost
    });

    // Keep only last 100 overrides
    if (this.humanOverrides.length > 100) {
      this.humanOverrides.shift();
    }
  }

  /**
   * Calculate project economics
   */
  private async handleProjectCompleted(event: EventEnvelope): Promise<void> {
    // This would integrate with actual project data
    this.logger.info('Analyzing project economics', {
      project_id: event.entity_id,
    });

    // Calculate monthly ROI
    if (this.sopMetrics.size > 0) {
      await this.calculateMonthlyROI();
    }
  }

  /**
   * Calculate and emit monthly automation ROI
   */
  private async calculateMonthlyROI(): Promise<void> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    let totalAutomatedTasks = 0;
    let humanHoursSaved = 0;
    let costSavings = 0;

    const topPerformingSOPs: Array<{
      sop_id: string;
      hours_saved: number;
      cost_saved: number;
    }> = [];

    for (const [sopId, metrics] of this.sopMetrics) {
      const sop = this.sopResolver.getSOPById(sopId);
      if (!sop) continue;

      const automatedMinutes =
        metrics.total_human_minutes * (metrics.total_automation_rate / metrics.executions);
      const hoursSaved = (metrics.total_human_minutes - automatedMinutes) / 60;
      const saved = hoursSaved * 100; // $100/hour

      totalAutomatedTasks += metrics.executions;
      humanHoursSaved += hoursSaved;
      costSavings += saved;

      topPerformingSOPs.push({
        sop_id: sopId,
        hours_saved: hoursSaved,
        cost_saved: saved,
      });
    }

    topPerformingSOPs.sort((a, b) => b.cost_saved - a.cost_saved);

    await this.emitEvent(
      'AUTOMATION_ROI_CALCULATED' as any,
      'SYSTEM',
      'monthly_roi',
      {
        period_start: monthStart.toISOString(),
        period_end: monthEnd.toISOString(),
        total_automated_tasks: totalAutomatedTasks,
        human_hours_saved: humanHoursSaved,
        cost_savings: costSavings,
        automation_investment: 5000, // Monthly infrastructure cost
        roi_percentage: ((costSavings - 5000) / 5000) * 100,
        top_performing_sops: topPerformingSOPs.slice(0, 5),
      },
      0.90,
      false
    );
  }

  /**
   * Helper: Extract task pattern from event
   */
  private extractTaskPattern(event: EventEnvelope): string {
    const payload = event.payload as any;
    return payload.task_title || payload.task_description || 'unknown_task';
  }

  /**
   * Helper: Assess automation feasibility
   */
  private assessAutomationFeasibility(taskPattern: string): number {
    // Simple heuristic - in production, use ML
    if (taskPattern.includes('email') || taskPattern.includes('notification')) return 0.9;
    if (taskPattern.includes('review') || taskPattern.includes('approve')) return 0.5;
    if (taskPattern.includes('design') || taskPattern.includes('creative')) return 0.2;
    return 0.6;
  }

  /**
   * Helper: Recommend automation approach
   */
  private recommendAutomationApproach(taskPattern: string): string {
    if (taskPattern.includes('email')) return 'n8n workflow';
    if (taskPattern.includes('data entry')) return 'API integration';
    if (taskPattern.includes('analysis')) return 'AI agent';
    return 'Needs manual assessment';
  }

  /**
   * Helper: Calculate ROI months
   */
  private calculateAutomationROI(monthlyCost: number): number {
    const implementationCost = 2000; // Average cost to automate
    return Math.ceil(implementationCost / monthlyCost);
  }

  /**
   * Helper: Identify margin erosion causes
   */
  private identifyMarginErosionCauses(
    execution: SOPExecutionCompletedPayload,
    target: any
  ): string[] {
    const causes: string[] = [];

    if (execution.cycle_time_hours > target.cycle_time_target_hours) {
      causes.push('Cycle time exceeds target');
    }

    if (execution.automation_rate < target.automation_rate_target) {
      causes.push('Low automation rate');
    }

    if (execution.deviations.length > 0) {
      causes.push('Process deviations detected');
    }

    return causes;
  }

  /**
   * Get economic statistics
   */
  getEconomicStats(): {
    total_sop_executions: number;
    average_automation_rate: number;
    total_human_hours: number;
    total_cost: number;
    automation_opportunities: number;
    human_overrides: number;
  } {
    let totalExecutions = 0;
    let totalAutomationRate = 0;
    let totalHumanMinutes = 0;
    let totalCost = 0;

    for (const metrics of this.sopMetrics.values()) {
      totalExecutions += metrics.executions;
      totalAutomationRate += metrics.total_automation_rate;
      totalHumanMinutes += metrics.total_human_minutes;
      totalCost += metrics.total_cost;
    }

    return {
      total_sop_executions: totalExecutions,
      average_automation_rate: totalExecutions > 0 ? totalAutomationRate / totalExecutions : 0,
      total_human_hours: totalHumanMinutes / 60,
      total_cost: totalCost,
      automation_opportunities: this.manualTasks.size,
      human_overrides: this.humanOverrides.length,
    };
  }
}
