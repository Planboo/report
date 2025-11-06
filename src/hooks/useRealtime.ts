import { useEffect, useRef, useCallback } from "react";
import {
  connectRealtime,
  disconnectRealtime,
  subscribeToCollection,
  setupReconnection,
  type subscribeToCollection as SubscribeFn,
  type RealtimeSubscription,
} from "../lib/realtime";

type SubscriptionOptions = Parameters<typeof SubscribeFn>[2];

/**
 * Hook to manage realtime websocket connection
 * Automatically connects on mount and disconnects on unmount
 */
export function useRealtimeConnection(enabled = true) {
  const isConnectedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    let mounted = true;

    (async () => {
      try {
        await connectRealtime();
        if (mounted) {
          isConnectedRef.current = true;
          setupReconnection(() => {
            if (mounted) {
              isConnectedRef.current = true;
            }
          });
        }
      } catch (error) {
        console.error("Failed to connect realtime:", error);
      }
    })();

    return () => {
      mounted = false;
      if (isConnectedRef.current) {
        disconnectRealtime().catch(console.error);
        isConnectedRef.current = false;
      }
    };
  }, [enabled]);

  return {
    isConnected: isConnectedRef.current,
    reconnect: useCallback(async () => {
      await disconnectRealtime();
      await connectRealtime();
      isConnectedRef.current = true;
    }, []),
  };
}

/**
 * Hook to subscribe to a collection for real-time updates
 * @param collection - Collection name
 * @param event - Event type: 'create', 'update', or 'delete'
 * @param onEvent - Callback when event occurs
 * @param options - Subscription options (fields, filter, etc.)
 * @param enabled - Whether subscription is enabled
 */
export function useRealtimeSubscription<T = Record<string, unknown>>(
  collection: string,
  event: "create" | "update" | "delete",
  onEvent: (data: T) => void,
  options?: SubscriptionOptions,
  enabled = true,
) {
  const subscriptionRef = useRef<RealtimeSubscription | null>(null);
  const onEventRef = useRef(onEvent);

  // Keep callback ref up to date
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  // Memoize options to avoid unnecessary re-subscriptions
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    if (!enabled || !collection) return;

    let mounted = true;
    let subscription: RealtimeSubscription | null = null;

    (async () => {
      try {
        subscription = await subscribeToCollection(
          collection,
          event,
          optionsRef.current,
        );
        subscriptionRef.current = subscription;

        if (!mounted) return;

        // Process events from subscription
        (async () => {
          try {
            for await (const item of subscription) {
              if (!mounted) break;
              // Extract the actual data from the subscription output
              // The subscription output has a structure like { event: 'update', data: {...} }
              const data = (item as { data?: T; event?: string })?.data ?? (item as T);
              onEventRef.current(data);
            }
          } catch (error) {
            if (mounted) {
              console.error(`Error processing ${event} event:`, error);
            }
          }
        })();
      } catch (error) {
        console.error(`Failed to subscribe to ${collection}:`, error);
      }
    })();

    return () => {
      mounted = false;
      subscriptionRef.current = null;
    };
  }, [collection, event, enabled]);

  return {
    subscription: subscriptionRef.current,
  };
}

