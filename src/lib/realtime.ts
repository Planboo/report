import { directus } from "./directus";

/**
 * Connects to Directus realtime websocket
 */
export async function connectRealtime(): Promise<void> {
  await directus.connect();
}

/**
 * Disconnects from Directus realtime websocket
 */
export async function disconnectRealtime(): Promise<void> {
  await directus.disconnect();
}

/**
 * Subscribe to a collection for real-time updates
 * @param collection - Collection name
 * @param event - Event type: 'create', 'update', or 'delete'
 * @param query - Optional query parameters (fields, filters, etc.)
 * @returns Subscription object
 */
export async function subscribeToCollection(
  collection: string,
  event: "create" | "update" | "delete" = "update",
  query?: { fields?: string[]; filter?: Record<string, unknown> },
) {
  const { subscription } = await directus.subscribe(collection, {
    event,
    query,
  });

  return subscription;
}

export type RealtimeSubscription = Awaited<ReturnType<typeof subscribeToCollection>>;

/**
 * Subscribe to all events (create, update, delete) for a collection
 */
export async function subscribeToAllEvents(
  collection: string,
  query?: { fields?: string[]; filter?: Record<string, unknown> },
) {
  const [createSub, updateSub, deleteSub] = await Promise.all([
    subscribeToCollection(collection, "create", query),
    subscribeToCollection(collection, "update", query),
    subscribeToCollection(collection, "delete", query),
  ]);

  return {
    create: createSub,
    update: updateSub,
    delete: deleteSub,
  };
}

/**
 * Set up reconnection logic for websocket
 */
export function setupReconnection(
  onReconnect?: () => void,
  delay = 2000,
): void {
  directus.onWebSocket("close", () => {
    setTimeout(async () => {
      try {
        await connectRealtime();
        onReconnect?.();
      } catch (error) {
        console.error("Reconnection failed:", error);
      }
    }, delay);
  });

  directus.onWebSocket("error", (error) => {
    console.error("WebSocket error:", error);
  });
}

