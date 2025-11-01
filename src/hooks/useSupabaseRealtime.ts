import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel, RealtimePostgresChangesPayload, RealtimePostgresChangesFilter } from '@supabase/supabase-js';

interface RealtimeOptions {
  event: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
  schema: 'public';
  table: string;
  filter?: string;
}

type RealtimeCallback = (payload: RealtimePostgresChangesPayload<any>) => void;

export function useSupabaseRealtime(
  channelName: string,
  options: RealtimeOptions,
  callback: RealtimeCallback,
  enabled: boolean = true
) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const callbackRef = useRef(callback);

  // Update the callback ref if the callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    if (!channelRef.current) {
      channelRef.current = supabase.channel(channelName);
    }

    const currentChannel = channelRef.current;

    const filter: RealtimePostgresChangesFilter<any> = {
      event: options.event,
      schema: options.schema,
      table: options.table,
    };
    if (options.filter) {
      filter.filter = options.filter;
    }

    currentChannel
      .on('postgres_changes', filter, (payload) => {
        callbackRef.current(payload);
      })
      .subscribe((_status) => { // Changed status to _status
        // console.log(`[Realtime Hook] Channel ${channelName} subscription status: ${_status}`); // Removed log
      });

    return () => {
      if (currentChannel) {
        supabase.removeChannel(currentChannel);
        channelRef.current = null;
      }
    };
  }, [channelName, options.event, options.schema, options.table, options.filter, enabled]);
}