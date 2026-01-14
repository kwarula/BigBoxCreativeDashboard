/**
 * AI FINANCE AGENT
 *
 * Mandate: Manage invoicing and payment tracking
 * Subscribes to: QUOTE_APPROVED, PROJECT_STARTED
 * Emits: INVOICE_ISSUED, PAYMENT_REMINDER_SENT
 */

import { AutonomicAgent } from '../../core/agents/AutonomicAgent.js';
import { EventBus } from '../../core/bus/EventBus.js';
import { EventEnvelope, QuoteApprovedPayload, ProjectStartedPayload } from '../../core/events/types.js';

export class FinanceAgent extends AutonomicAgent {
  constructor(eventBus: EventBus) {
    super(
      {
        name: 'AI Finance Agent',
        description: 'Automates financial operations and payment tracking',
        subscribesTo: ['QUOTE_APPROVED' as any, 'PROJECT_STARTED' as any],
        emits: ['INVOICE_ISSUED' as any, 'PAYMENT_REMINDER_SENT' as any],
        confidenceThreshold: 0.85, // Higher threshold for financial operations
      },
      eventBus
    );
  }

  protected async processEvent(event: EventEnvelope): Promise<void> {
    switch (event.event_type) {
      case 'QUOTE_APPROVED':
        await this.handleQuoteApproved(event);
        break;
      case 'PROJECT_STARTED':
        await this.handleProjectStarted(event);
        break;
    }
  }

  private async handleQuoteApproved(event: EventEnvelope): Promise<void> {
    const payload = event.payload as unknown as QuoteApprovedPayload;

    this.logger.info('Processing approved quote', {
      quote_id: payload.quote_id,
    });

    // Generate and issue invoice
    await this.issueInvoice(event.entity_id, payload);
  }

  private async handleProjectStarted(event: EventEnvelope): Promise<void> {
    const payload = event.payload as unknown as ProjectStartedPayload;

    this.logger.info('Setting up payment schedule', {
      project_id: event.entity_id,
      budget: payload.budget,
    });

    // Create initial invoice (deposit)
    const depositAmount = payload.budget * 0.5; // 50% deposit

    await this.emitEvent(
      'INVOICE_ISSUED' as any,
      'PROJECT',
      event.entity_id,
      {
        invoice_number: `INV-${Date.now()}`,
        client_id: payload.client_id,
        project_id: event.entity_id,
        amount: depositAmount,
        due_date: this.calculateDueDate(14), // 14 days
        payment_link: `https://payment.bigbox.com/invoice/${event.entity_id}`,
      },
      1.0,
      false
    );
  }

  /**
   * Issue invoice
   */
  private async issueInvoice(quoteId: string, quote: QuoteApprovedPayload): Promise<void> {
    await this.emitEvent(
      'INVOICE_ISSUED' as any,
      'QUOTE',
      quoteId,
      {
        invoice_number: `INV-${Date.now()}`,
        client_id: 'unknown', // Would come from context
        amount: 0, // Would come from quote
        due_date: this.calculateDueDate(30),
        payment_link: `https://payment.bigbox.com/invoice/${quoteId}`,
      },
      0.95,
      false
    );

    this.logger.info('Invoice issued', { quote_id: quoteId });
  }

  /**
   * Calculate due date
   */
  private calculateDueDate(daysFromNow: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString();
  }
}
