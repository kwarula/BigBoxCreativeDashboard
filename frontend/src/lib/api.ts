const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

interface RequestOptions extends RequestInit {
    token?: string
}

export async function apiRequest<T>(
    endpoint: string,
    options: RequestOptions = {}
): Promise<T> {
    const { token, ...fetchOptions } = options

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...fetchOptions,
        headers,
    })

    if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
}

// Health check
export const getHealth = () => apiRequest<{
    status: string
    uptime: number
    agents: Array<{ name: string; active: boolean }>
}>('/health')

// Agents
export const getAgents = () => apiRequest<Array<{
    name: string
    active: boolean
    subscriptions: number
}>>('/api/agents')

// Client projections
export const getClientHealth = () => apiRequest<Array<{
    client_id: string
    health_score: number
    active_projects: number
}>>('/api/projections/client-health')

export const getClientHealthById = (clientId: string) =>
    apiRequest<{
        client_id: string
        health_score: number
        active_projects: number
    }>(`/api/projections/client-health/${clientId}`)

// Oversight
export const getOversightStats = () =>
    apiRequest<{
        total_events: number
        events_requiring_human: number
    }>('/api/oversight/stats')

export const getOversightDecisions = () =>
    apiRequest<Array<{
        event_id: string
        decision_type: string
        timestamp: string
    }>>('/api/oversight/decisions')

// Events
export const getEvents = (query: Record<string, unknown> = {}) =>
    apiRequest<Array<{
        event_id: string
        event_type: string
        created_at: string
    }>>('/api/events/query', {
        method: 'POST',
        body: JSON.stringify(query),
    })

export const getEntityEvents = (entityType: string, entityId: string) =>
    apiRequest<Array<{
        event_id: string
        event_type: string
        created_at: string
    }>>(`/api/events/entity/${entityType}/${entityId}`)

// ============================================================================
// APPROVAL MANAGEMENT
// ============================================================================

export interface Approval {
    id: string
    type: string
    agent: string
    client: string
    amount: number | null
    date: string
    status: 'pending' | 'approved' | 'rejected'
    confidence: number
    context: Record<string, unknown>
    timeout_at: string
}

export const getApprovals = (params?: { status?: string; limit?: number }) => {
    const queryParams = new URLSearchParams()
    if (params?.status) queryParams.append('status', params.status)
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    const query = queryParams.toString() ? `?${queryParams.toString()}` : ''
    return apiRequest<{ count: number; approvals: Approval[] }>(`/api/approvals${query}`)
}

export const resolveApproval = (
    approvalId: string,
    decision: 'approved' | 'rejected',
    notes?: string,
    resolved_by?: string
) =>
    apiRequest<{
        success: boolean
        approval_id: string
        decision: string
        resolved_at: string
    }>(`/api/approvals/${approvalId}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ decision, notes, resolved_by }),
    })

export const getApprovalStats = () =>
    apiRequest<{
        pending: number
        approved: number
        rejected: number
        total: number
        avg_confidence: number
    }>('/api/approvals/stats')

// ============================================================================
// CEO DASHBOARD
// ============================================================================

export interface CEOInterrupt {
    id: string
    category: string
    type: string
    description: string
    amount?: number
    requested_at: string
    timeout_at: string
    agent_id: string
    confidence: number
}

export const getCEOInterrupts = (limit?: number) => {
    const query = limit ? `?limit=${limit}` : ''
    return apiRequest<{ count: number; interrupts: CEOInterrupt[] }>(
        `/api/ceo/interrupts${query}`
    )
}

export const resolveCEODecision = (
    decisionId: string,
    decision: 'approved' | 'rejected',
    notes?: string
) =>
    apiRequest<{
        success: boolean
        decision_id: string
        decision: string
        resolved_at: string
    }>(`/api/ceo/decisions/${decisionId}`, {
        method: 'POST',
        body: JSON.stringify({ decision, notes }),
    })

export const getCEOAutomationReport = (period: '7d' | '30d' | '90d' = '7d') =>
    apiRequest<{
        period: string
        date_range: { start: string; end: string }
        metrics: {
            automation_rate: number
            human_hours_saved: number
            cost_savings: number
            sop_executions: number
        }
        ceo_interrupts: number
        ceo_interrupt_target: number
        status: string
    }>(`/api/ceo/automation-report?period=${period}`)

export const getCEOSystemHealth = () =>
    apiRequest<{
        overall_status: string
        agents: {
            total: number
            active: number
            degraded: number
            offline: number
        }
        automation: {
            current_rate: number
            target_rate: number
            trend: string
        }
        client_health: {
            total_clients: number
            healthy: number
            at_risk: number
            avg_trust_score: number
        }
        drift_alerts: {
            active: number
            critical: number
        }
        last_updated: string
    }>('/api/ceo/system-health')

// ============================================================================
// CLIENT AUTONOMY APIS
// ============================================================================

export const getClientSignals = (clientId: string, limit?: number) => {
    const query = limit ? `?limit=${limit}` : ''
    return apiRequest<{
        client_id: string
        signals: {
            automation_level: number
            human_touch_points: number
            proactive_interventions: number
            response_time: {
                avg_hours: number
                target_hours: number
                status: string
            }
            quality_metrics: {
                deliverable_acceptance_rate: number
                revision_requests: number
                client_satisfaction: number
            }
        }
        recent_actions: Array<{
            timestamp: string
            type: string
            description: string
        }>
    }>(`/api/clients/${clientId}/signals${query}`)
}

export const getClientTrustScore = (clientId: string) =>
    apiRequest<{
        client_id: string
        trust_score: number
        components: {
            transparency: number
            reliability: number
            proactivity: number
        }
        trend: string
        last_updated: string
    }>(`/api/clients/${clientId}/trust-score`)

export const getClientProjects = (clientId: string) =>
    apiRequest<{
        client_id: string
        count: number
        projects: Array<{
            id: string
            name: string
            status: string
            progress: number
            start_date: string
            target_date: string
            automation_rate: number
        }>
    }>(`/api/clients/${clientId}/projects`)

export const getClientTimeline = (clientId: string, limit?: number) => {
    const query = limit ? `?limit=${limit}` : ''
    return apiRequest<{
        client_id: string
        count: number
        timeline: Array<{
            timestamp: string
            category: string
            title: string
            description: string
        }>
    }>(`/api/clients/${clientId}/timeline${query}`)
}

// ============================================================================
// SOP MANAGEMENT
// ============================================================================

export interface SOPDefinition {
    sop_id: string
    version: number
    name: string
    automation_target: number
    activated_at: string
    approval_mechanism: string
}

export const getSOPDefinitions = () =>
    apiRequest<{ count: number; sops: SOPDefinition[] }>('/api/sop/definitions')

export const getSOPExecutions = (params?: {
    sop_id?: string
    status?: string
    limit?: number
}) => {
    const queryParams = new URLSearchParams()
    if (params?.sop_id) queryParams.append('sop_id', params.sop_id)
    if (params?.status) queryParams.append('status', params.status)
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    const query = queryParams.toString() ? `?${queryParams.toString()}` : ''
    return apiRequest<{
        count: number
        executions: Array<{
            execution_id: string
            sop_id: string
            version: number
            status: string
            started_at: string
            completed_at: string
            automation_rate: number
            human_hours: number
            agent_id: string
        }>
    }>(`/api/sop/executions${query}`)
}

export const getSOPProposals = () =>
    apiRequest<{
        count: number
        proposals: Array<{
            proposal_id: string
            sop_id: string
            current_version: number
            proposed_version: number
            proposed_by: string
            rationale: string
            changes: unknown[]
            created_at: string
        }>
    }>('/api/sop/proposals')

export const approveSOPProposal = (proposalId: string) =>
    apiRequest<{
        success: boolean
        proposal_id: string
        activated: boolean
    }>(`/api/sop/proposals/${proposalId}/approve`, {
        method: 'POST',
    })

export const rejectSOPProposal = (proposalId: string, reason?: string) =>
    apiRequest<{
        success: boolean
        proposal_id: string
        rejected: boolean
    }>(`/api/sop/proposals/${proposalId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
    })

// ============================================================================
// DRIFT DETECTION
// ============================================================================

export interface DriftAlert {
    id: string
    type: 'process_drift' | 'human_fatigue' | 'client_decay' | 'sop_degradation'
    severity: 'low' | 'medium' | 'high' | 'critical'
    title: string
    description: string
    detected_at: string
    acknowledged_at?: string
    acknowledged_by?: string
    resolution_note?: string
    metadata: {
        agent?: string
        client_id?: string
        sop_id?: string
        metric_value?: number
        threshold?: number
        trend?: string
    }
}

export const getDriftAlerts = (params?: {
    status?: 'active' | 'acknowledged' | 'all'
    severity?: 'low' | 'medium' | 'high' | 'critical'
    type?: 'process_drift' | 'human_fatigue' | 'client_decay' | 'sop_degradation'
}) => {
    const queryParams = new URLSearchParams()
    if (params?.status) queryParams.append('status', params.status)
    if (params?.severity) queryParams.append('severity', params.severity)
    if (params?.type) queryParams.append('type', params.type)

    const query = queryParams.toString() ? `?${queryParams.toString()}` : ''
    return apiRequest<{ count: number; alerts: DriftAlert[] }>(
        `/api/drift/alerts${query}`
    )
}

export const acknowledgeDriftAlert = (
    alertId: string,
    acknowledged_by: string,
    resolution_note?: string
) =>
    apiRequest<{
        success: boolean
        alert_id: string
        acknowledged_at: string
    }>(`/api/drift/alerts/${alertId}/acknowledge`, {
        method: 'POST',
        body: JSON.stringify({ acknowledged_by, resolution_note }),
    })

export const getDriftSummary = () =>
    apiRequest<{
        total_alerts: number
        by_severity: {
            critical: number
            high: number
            medium: number
            low: number
        }
        by_type: {
            process_drift: number
            human_fatigue: number
            client_decay: number
            sop_degradation: number
        }
        active_alerts: number
        acknowledged_alerts: number
        trend: 'improving' | 'stable' | 'worsening'
    }>('/api/drift/summary')

// ============================================================================
// ENHANCED AGENT METRICS
// ============================================================================

export const getAgentMetrics = (period: '24h' | '7d' | '30d' | '90d' = '7d') =>
    apiRequest<{
        period: string
        count: number
        metrics: Array<{
            agent_name: string
            total_events: number
            avg_confidence: number
            event_types: Record<string, number>
            latest_status: string
            uptime_percentage: number
            avg_processing_time_ms: number
            error_count: number
            last_seen: string | null
        }>
    }>(`/api/agents/metrics?period=${period}`)

export const getAgentHistory = (
    agentName: string,
    params?: { limit?: number; event_type?: string }
) => {
    const queryParams = new URLSearchParams()
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.event_type) queryParams.append('event_type', params.event_type)

    const query = queryParams.toString() ? `?${queryParams.toString()}` : ''
    return apiRequest<{
        agent_name: string
        count: number
        events: Array<{
            event_id: string
            event_type: string
            aggregate_type: string
            aggregate_id: string
            timestamp: string
            confidence: number
            payload: Record<string, unknown>
            metadata: Record<string, unknown>
        }>
    }>(`/api/agents/${agentName}/history${query}`)
}

export const getAgentPerformance = (
    agentName: string,
    period: '24h' | '7d' | '30d' = '7d'
) =>
    apiRequest<{
        agent_name: string
        period: string
        total_events: number
        avg_confidence: number
        confidence_trend: 'improving' | 'stable' | 'declining'
        uptime_percentage: number
        error_rate: number
        avg_processing_time_ms: number
        event_timeline: Array<{
            timestamp: string
            event_type: string
            confidence: number
        }>
    }>(`/api/agents/${agentName}/performance?period=${period}`)

export const getAgentHealth = () =>
    apiRequest<{
        total_agents: number
        status_counts: {
            active: number
            idle: number
            error: number
            unknown: number
        }
        health_percentage: number
        status: 'healthy' | 'degraded' | 'critical'
        timestamp: string
    }>('/api/agents/health')
