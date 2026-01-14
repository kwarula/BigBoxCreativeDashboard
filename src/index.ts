/**
 * THE BIG BOX AUTONOMIC ENGINE
 * Main Entry Point
 *
 * "The system runs itself. Humans intervene only when the machine requests judgment."
 */

import dotenv from 'dotenv';
import express from 'express';
import { EventBus, eventBus } from './core/bus/EventBus.js';
import { EventStore } from './core/store/EventStore.js';
import { SOPResolver } from './core/sop/SOPResolver.js';
import { IntakeAgent } from './agents/intake/IntakeAgent.js';
import { MeetingAgent } from './agents/meeting/MeetingAgent.js';
import { StrategyAgent } from './agents/strategy/StrategyAgent.js';
import { ProjectAgent } from './agents/project/ProjectAgent.js';
import { FinanceAgent } from './agents/finance/FinanceAgent.js';
import { OversightAgent } from './agents/oversight/OversightAgent.js';
import { EconomicAgent } from './agents/economic/EconomicAgent.js';
import { AutomationCoverageAgent } from './agents/coverage/AutomationCoverageAgent.js';
import { ClientHealthView } from './projections/client/ClientHealthView.js';
import { Logger } from './utils/logger.js';
import { setupEventAPI } from './api/controllers/eventController.js';

dotenv.config();

const logger = new Logger('AutonomicEngine');

/**
 * Autonomic Engine orchestrator
 */
class AutonomicEngine {
  private eventBus: EventBus;
  private eventStore: EventStore;
  private sopResolver: SOPResolver;
  private agents: Array<any>;
  private projections: Array<any>;
  private app: express.Application;
  private isRunning: boolean;

  constructor() {
    this.eventBus = eventBus;
    this.eventStore = new EventStore({
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DB || 'bigbox_autonomic',
      user: process.env.POSTGRES_USER || 'bigbox',
      password: process.env.POSTGRES_PASSWORD || '',
    });
    this.sopResolver = new SOPResolver('./sops');

    this.agents = [];
    this.projections = [];
    this.app = express();
    this.isRunning = false;
  }

  /**
   * Initialize the autonomic engine
   */
  async initialize(): Promise<void> {
    logger.info('Initializing Autonomic Engine');

    // Initialize SOP definitions
    logger.info('Loading SOP definitions');
    await this.sopResolver.initialize();

    // Initialize event store
    await this.eventStore.initialize();

    // Wire event bus to event store (persist all events)
    this.eventBus.subscribe(async (event) => {
      await this.eventStore.append(event);
    });

    // Initialize all agents
    logger.info('Initializing autonomic agents');

    const intakeAgent = new IntakeAgent(this.eventBus);
    const meetingAgent = new MeetingAgent(this.eventBus);
    const strategyAgent = new StrategyAgent(this.eventBus);
    const projectAgent = new ProjectAgent(this.eventBus);
    const financeAgent = new FinanceAgent(this.eventBus);
    const economicAgent = new EconomicAgent(this.eventBus, this.sopResolver);
    const coverageAgent = new AutomationCoverageAgent(this.eventBus, this.sopResolver);
    const oversightAgent = new OversightAgent(this.eventBus, {
      financial_limit: parseInt(process.env.FINANCIAL_LIMIT || '10000'),
      confidence_threshold: parseFloat(process.env.CONFIDENCE_THRESHOLD || '0.75'),
      auto_approval_enabled: process.env.AUTO_APPROVAL_ENABLED === 'true',
    });

    this.agents = [
      intakeAgent,
      meetingAgent,
      strategyAgent,
      projectAgent,
      financeAgent,
      economicAgent,
      coverageAgent,
      oversightAgent, // Oversight must be last - it monitors all others
    ];

    for (const agent of this.agents) {
      await agent.initialize();
    }

    // Initialize projections
    logger.info('Initializing state projections');

    const clientHealthView = new ClientHealthView(this.eventBus, this.eventStore);
    this.projections = [clientHealthView];

    for (const projection of this.projections) {
      await projection.initialize();
    }

    // Setup API
    this.setupAPI();

    this.isRunning = true;
    logger.info('Autonomic Engine initialized successfully');
  }

  /**
   * Setup REST API
   */
  private setupAPI(): void {
    this.app.use(express.json());

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        uptime: process.uptime(),
        agents: this.agents.map((a) => a.getStatus()),
        event_stats: this.eventBus.getStats(),
      });
    });

    // Event API
    setupEventAPI(this.app, this.eventBus, this.eventStore);

    // Projections API
    this.app.get('/api/projections/client-health', (req, res) => {
      const view = this.projections[0] as ClientHealthView;
      const allState = Array.from(view.getAllState().values());
      res.json(allState);
    });

    this.app.get('/api/projections/client-health/:clientId', (req, res) => {
      const view = this.projections[0] as ClientHealthView;
      const state = view.getState(req.params.clientId);
      if (state) {
        res.json(state);
      } else {
        res.status(404).json({ error: 'Client not found' });
      }
    });

    // Agent status
    this.app.get('/api/agents', (req, res) => {
      res.json(this.agents.map((a) => a.getStatus()));
    });

    // Oversight statistics
    this.app.get('/api/oversight/stats', (req, res) => {
      const oversightAgent = this.agents[5] as OversightAgent;
      res.json(oversightAgent.getOversightStats());
    });

    this.app.get('/api/oversight/decisions', (req, res) => {
      const oversightAgent = this.agents[5] as OversightAgent;
      res.json(oversightAgent.getDecisionLog());
    });
  }

  /**
   * Start the engine
   */
  async start(): Promise<void> {
    if (!this.isRunning) {
      await this.initialize();
    }

    const port = parseInt(process.env.PORT || '3000');
    this.app.listen(port, () => {
      logger.info(`Autonomic Engine running on port ${port}`);
      logger.info('System is now autonomous. Humans will be notified only when required.');
    });
  }

  /**
   * Shutdown the engine gracefully
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down Autonomic Engine');

    // Shutdown agents
    for (const agent of this.agents) {
      await agent.shutdown();
    }

    // Shutdown projections
    for (const projection of this.projections) {
      await projection.shutdown();
    }

    // Close event store
    await this.eventStore.close();

    this.isRunning = false;
    logger.info('Autonomic Engine shut down successfully');
  }
}

/**
 * Main execution
 */
const engine = new AutonomicEngine();

// Handle shutdown signals
process.on('SIGTERM', async () => {
  await engine.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await engine.shutdown();
  process.exit(0);
});

// Start the engine
engine.start().catch((error) => {
  logger.error('Failed to start Autonomic Engine', { error });
  process.exit(1);
});

export { AutonomicEngine };
