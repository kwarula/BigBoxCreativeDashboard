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
