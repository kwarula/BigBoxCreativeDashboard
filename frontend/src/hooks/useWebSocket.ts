'use client'

import { useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

interface UseWebSocketOptions {
    onEvent?: (event: unknown) => void
    onConnect?: () => void
    onDisconnect?: () => void
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
    const socketRef = useRef<Socket | null>(null)

    useEffect(() => {
        socketRef.current = io(SOCKET_URL, {
            transports: ['websocket'],
            autoConnect: true,
        })

        const socket = socketRef.current

        socket.on('connect', () => {
            console.log('WebSocket connected')
            options.onConnect?.()
        })

        socket.on('disconnect', () => {
            console.log('WebSocket disconnected')
            options.onDisconnect?.()
        })

        socket.on('event', (event: unknown) => {
            options.onEvent?.(event)
        })

        return () => {
            socket.disconnect()
        }
    }, [])

    const subscribe = useCallback((eventTypes: string[]) => {
        socketRef.current?.emit('subscribe', eventTypes)
    }, [])

    const unsubscribe = useCallback((eventTypes: string[]) => {
        socketRef.current?.emit('unsubscribe', eventTypes)
    }, [])

    return { subscribe, unsubscribe }
}
