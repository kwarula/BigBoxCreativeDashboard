/**
 * SOP RESOLVER
 *
 * Resolves which SOP applies to a given event/context.
 * Loads SOP definitions and provides them to agents.
 *
 * Critical: This sits BETWEEN events and agent reasoning.
 */

import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { parse } from 'yaml';
import { SOPDefinition, SOPPrecondition, validateSOP, SOPExecutionContext } from './types.js';
import { EventEnvelope, EntityType } from '../events/types.js';
import { Logger } from '../../utils/logger.js';

export class SOPResolver {
  private sops: Map<string, SOPDefinition>;
  private logger: Logger;
  private sopDirectory: string;

  constructor(sopDirectory: string = './sops') {
    this.sops = new Map();
    this.logger = new Logger('SOPResolver');
    this.sopDirectory = sopDirectory;
  }

  /**
   * Load all SOP definitions from directory
   */
  async initialize(): Promise<void> {
    this.logger.info('Loading SOP definitions', { directory: this.sopDirectory });

    try {
      const files = await readdir(this.sopDirectory);
      const sopFiles = files.filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'));

      for (const file of sopFiles) {
        await this.loadSOP(join(this.sopDirectory, file));
      }

      this.logger.info('SOP definitions loaded', { count: this.sops.size });
    } catch (error) {
      this.logger.error('Failed to load SOPs', { error });
      throw error;
    }
  }

  /**
   * Load single SOP from file
   */
  private async loadSOP(filepath: string): Promise<void> {
    try {
      const content = await readFile(filepath, 'utf-8');
      const sopData = parse(content);

      if (!validateSOP(sopData)) {
        throw new Error(`Invalid SOP definition in ${filepath}`);
      }

      this.sops.set(sopData.metadata.id, sopData);

      this.logger.info('SOP loaded', {
        id: sopData.metadata.id,
        name: sopData.metadata.name,
        version: sopData.metadata.version,
      });
    } catch (error) {
      this.logger.error('Failed to load SOP', { filepath, error });
      throw error;
    }
  }

  /**
   * Resolve which SOP applies to an event
   */
  resolve(event: EventEnvelope, context?: Record<string, unknown>): SOPDefinition | null {
    for (const sop of this.sops.values()) {
      if (sop.metadata.status !== 'active') {
        continue;
      }

      if (this.matchesPreconditions(sop.preconditions, event, context)) {
        this.logger.debug('SOP resolved', {
          sop_id: sop.metadata.id,
          event_type: event.event_type,
          entity_id: event.entity_id,
        });
        return sop;
      }
    }

    this.logger.debug('No SOP matched', {
      event_type: event.event_type,
      entity_type: event.entity_type,
    });

    return null;
  }

  /**
   * Get SOP by ID
   */
  getSOPById(sopId: string): SOPDefinition | null {
    return this.sops.get(sopId) || null;
  }

  /**
   * Get all active SOPs
   */
  getActiveSOPs(): SOPDefinition[] {
    return Array.from(this.sops.values()).filter((sop) => sop.metadata.status === 'active');
  }

  /**
   * Check if event/context matches SOP preconditions
   */
  private matchesPreconditions(
    preconditions: SOPPrecondition,
    event: EventEnvelope,
    context?: Record<string, unknown>
  ): boolean {
    // Check required events
    if (preconditions.required_events) {
      if (!preconditions.required_events.includes(event.event_type)) {
        return false;
      }
    }

    // Check entity types
    if (preconditions.entity_types) {
      if (!preconditions.entity_types.includes(event.entity_type)) {
        return false;
      }
    }

    // Check budget range
    if (preconditions.budget_range && context?.budget) {
      const budget = context.budget as number;
      if (preconditions.budget_range.min && budget < preconditions.budget_range.min) {
        return false;
      }
      if (preconditions.budget_range.max && budget > preconditions.budget_range.max) {
        return false;
      }
    }

    // Check service type
    if (preconditions.service_type && context?.service_type) {
      if (!preconditions.service_type.includes(context.service_type as string)) {
        return false;
      }
    }

    // Check client tier
    if (preconditions.client_tier && preconditions.client_tier !== 'all') {
      if (context?.client_tier !== preconditions.client_tier) {
        return false;
      }
    }

    // Check custom conditions
    if (preconditions.custom_conditions && context) {
      for (const [key, value] of Object.entries(preconditions.custom_conditions)) {
        if (context[key] !== value) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Create execution context for SOP
   */
  createExecutionContext(
    sop: SOPDefinition,
    event: EventEnvelope,
    variables: Record<string, unknown> = {}
  ): SOPExecutionContext {
    return {
      sop_id: sop.metadata.id,
      execution_id: crypto.randomUUID(),
      started_at: new Date().toISOString(),
      current_step: sop.steps[0]?.step_id || '',
      entity_type: event.entity_type,
      entity_id: event.entity_id,
      variables,
      automation_decisions: [],
      human_interventions: [],
    };
  }

  /**
   * Check if automation is allowed for step
   */
  canAutomate(sop: SOPDefinition, stepId: string, confidence: number): boolean {
    const step = sop.steps.find((s) => s.step_id === stepId);
    if (!step) {
      return false;
    }

    // Check automation level
    if (step.automation_level === 'manual') {
      return false;
    }

    // Check confidence threshold
    if (confidence < sop.automation_policy.confidence_threshold) {
      return false;
    }

    // Check if step requires human
    if (step.requires_human) {
      return false;
    }

    return true;
  }

  /**
   * Get escalation rule for trigger
   */
  getEscalationRule(sop: SOPDefinition, trigger: string) {
    return sop.escalation_rules.find((rule) => rule.trigger === trigger);
  }

  /**
   * Reload SOPs (for development/updates)
   */
  async reload(): Promise<void> {
    this.sops.clear();
    await this.initialize();
  }

  /**
   * Get SOP statistics
   */
  getStats(): {
    total_sops: number;
    active_sops: number;
    sops_by_status: Record<string, number>;
  } {
    const stats = {
      total_sops: this.sops.size,
      active_sops: 0,
      sops_by_status: {} as Record<string, number>,
    };

    for (const sop of this.sops.values()) {
      stats.sops_by_status[sop.metadata.status] =
        (stats.sops_by_status[sop.metadata.status] || 0) + 1;

      if (sop.metadata.status === 'active') {
        stats.active_sops++;
      }
    }

    return stats;
  }
}
