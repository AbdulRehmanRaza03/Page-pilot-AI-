"use client";

import { useEffect, useRef } from "react";
import { API_URL } from "@/lib/api";
import { useToast } from "@/components/toast";

/**
 * Connects to the backend WebSocket and fires a toast notification whenever a
 * real-time event (e.g. new_message) arrives. Also triggers a custom callback
 * so the caller can refetch data.
 */
export function useRealtime(onEvent?: (event: { type: string; data: any }) => void) {
  const { notify } = useToast();
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    // Derive the ws:// URL from the http(s) API base (strip /api/v1).
    const base = API_URL.replace(/^https?/, (m) => (m === "https" ? "wss" : "ws")).replace(/\/api\/v1\/?$/, "");
    let ws: WebSocket | null = null;
    let retry: ReturnType<typeof setTimeout>;

    const connect = () => {
      try {
        ws = new WebSocket(`${base}/ws`);
      } catch {
        return;
      }

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.type === "new_message") {
            notify("New message", "You received a new message in the inbox.");
          }
          onEventRef.current?.(parsed);
        } catch {
          /* ignore malformed events */
        }
      };

      ws.onclose = () => {
        // Reconnect after a short delay.
        retry = setTimeout(connect, 5000);
      };

      ws.onerror = () => {
        ws?.close();
      };
    };

    connect();

    return () => {
      clearTimeout(retry);
      ws?.close();
    };
  }, [notify]);
}
