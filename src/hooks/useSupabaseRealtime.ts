import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeOptions {
  event: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
  schema: 'public';
  table: string;
  filter?: string;
}

type RealtimeCallback = (payload: any) => void;

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

    currentChannel
      .on('postgres_changes', {
        event: options.event,
        schema: options.schema,
        table: options.table,
        filter: options.filter,
      }, (payload) => {
        callbackRef.current(payload);
      })
      .subscribe();

    return () => {
      if (currentChannel) {
        supabase.removeChannel(currentChannel);
        channelRef.current = null;
      }
    };
  }, [channelName, options.event, options.schema, options.table, options.filter, enabled]);
}