/**
 * Supabase Client Configuration
 *
 * Provides centralized Supabase client for:
 * - Event Store persistence
 * - Real-time event subscriptions
 * - SOP management
 * - Metrics tracking
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

/**
 * Supabase configuration from environment
 */
interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

/**
 * Singleton Supabase client instance
 */
let supabaseClient: SupabaseClient<Database> | null = null;
let supabaseAdminClient: SupabaseClient<Database> | null = null;

/**
 * Get Supabase configuration from environment variables
 */
function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase configuration. Set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.'
    );
  }

  return { url, anonKey, serviceRoleKey };
}

/**
 * Initialize Supabase client (public API with RLS)
 *
 * Use this for:
 * - Client-facing queries with Row Level Security
 * - Real-time subscriptions
 * - Standard CRUD operations
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  if (!supabaseClient) {
    const config = getSupabaseConfig();
    supabaseClient = createClient<Database>(config.url, config.anonKey, {
      auth: {
        persistSession: false, // Server-side, no session persistence needed
      },
      realtime: {
        params: {
          eventsPerSecond: 100, // High throughput for event stream
        },
      },
    });
  }

  return supabaseClient;
}

/**
 * Initialize Supabase admin client (bypasses RLS)
 *
 * Use this for:
 * - System-level operations
 * - Agent operations that bypass RLS
 * - Background jobs
 *
 * IMPORTANT: This bypasses Row Level Security. Use with caution.
 */
export function getSupabaseAdminClient(): SupabaseClient<Database> {
  if (!supabaseAdminClient) {
    const config = getSupabaseConfig();

    if (!config.serviceRoleKey) {
      throw new Error(
        'SUPABASE_SERVICE_ROLE_KEY is required for admin operations. ' +
        'This key bypasses RLS and should be kept secure.'
      );
    }

    supabaseAdminClient = createClient<Database>(config.url, config.serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return supabaseAdminClient;
}

/**
 * Close Supabase connections
 *
 * Call this on graceful shutdown
 */
export async function closeSupabaseConnections(): Promise<void> {
  if (supabaseClient) {
    await supabaseClient.removeAllChannels();
    supabaseClient = null;
  }

  if (supabaseAdminClient) {
    await supabaseAdminClient.removeAllChannels();
    supabaseAdminClient = null;
  }
}

/**
 * Health check for Supabase connection
 */
export async function checkSupabaseHealth(): Promise<{
  connected: boolean;
  latency_ms?: number;
  error?: string;
}> {
  try {
    const start = Date.now();
    const client = getSupabaseClient();

    // Simple query to test connection
    const { error } = await client.from('events').select('event_id').limit(1);

    if (error) {
      return { connected: false, error: error.message };
    }

    const latency = Date.now() - start;
    return { connected: true, latency_ms: latency };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
