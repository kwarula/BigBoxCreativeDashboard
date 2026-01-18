/**
 * useEventStream Hook
 * Real-time event streaming using Server-Sent Events (SSE)
 */

import { useEffect, useRef, useState } from 'react'

export interface StreamEvent {
  id: string
  type: string
  timestamp: string
  data: {
    aggregate_id: string
    emitted_by: string
    payload: any
  }
}

interface UseEventStreamOptions {
  role?: 'ceo' | 'employee' | 'client'
  userId?: string
  enabled?: boolean
  onEvent?: (event: StreamEvent) => void
  onConnect?: () => void
  onDisconnect?: () => void
}

export function useEventStream(options: UseEventStreamOptions = {}) {
  const {
    role = 'employee',
    userId = 'anonymous',
    enabled = true,
    onEvent,
    onConnect,
    onDisconnect,
  } = options

  const [isConnected, setIsConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<StreamEvent | null>(null)
  const [events, setEvents] = useState<StreamEvent[]>([])
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!enabled) {
      return
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    const url = `${apiUrl}/api/events/stream?role=${role}&userId=${userId}`

    console.log('[SSE] Connecting to event stream:', url)

    const eventSource = new EventSource(url)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      console.log('[SSE] Connected to event stream')
      setIsConnected(true)
      onConnect?.()
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        // Skip connection confirmation messages
        if (data.type === 'connected') {
          console.log('[SSE] Connection confirmed:', data.clientId)
          return
        }

        console.log('[SSE] Received event:', data.type)

        const streamEvent: StreamEvent = {
          id: data.id,
          type: data.type,
          timestamp: data.timestamp,
          data: data.data,
        }

        setLastEvent(streamEvent)
        setEvents((prev) => [streamEvent, ...prev].slice(0, 100)) // Keep last 100 events
        onEvent?.(streamEvent)
      } catch (error) {
        console.error('[SSE] Failed to parse event:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('[SSE] Connection error:', error)
      setIsConnected(false)
      eventSource.close()
    }

    // Cleanup on unmount
    return () => {
      console.log('[SSE] Disconnecting from event stream')
      eventSource.close()
      setIsConnected(false)
      onDisconnect?.()
    }
  }, [enabled, role, userId, onEvent, onConnect, onDisconnect])

  return {
    isConnected,
    lastEvent,
    events,
    disconnect: () => {
      eventSourceRef.current?.close()
      setIsConnected(false)
    },
  }
}

/**
 * Hook for listening to specific event types
 */
export function useEventListener(
  eventTypes: string | string[],
  callback: (event: StreamEvent) => void,
  options: UseEventStreamOptions = {}
) {
  const types = Array.isArray(eventTypes) ? eventTypes : [eventTypes]

  const handleEvent = (event: StreamEvent) => {
    if (types.includes(event.type)) {
      callback(event)
    }
  }

  return useEventStream({
    ...options,
    onEvent: handleEvent,
  })
}
