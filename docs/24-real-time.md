# 24 — Real-Time Architecture

## 1. Requirement

The inbox must update when a new message arrives or state changes **without a page refresh**. Latency target: < 2s from Meta event to UI.

## 2. Options Compared

| Option | Pros | Cons | Verdict |
| --- | --- | --- | --- |
| **WebSockets** | True push, low latency, bidirectional | Connection/session management, auth on upgrade, reconnect, scale (sticky/backplane) | ✅ Recommended |
| Server-Sent Events (SSE) | Simple unidirectional push over HTTP, auto-reconnect | Unidirectional only, proxy/connection limits, harder auth-middleware | Viable fallback |
| Polling | Simplest, works everywhere | Higher latency + load; wasteful | ❌ not primary |

## 3. Recommendation

**WebSockets**, with a thin event abstraction so the client is transport-agnostic and can fall back to short polling. We use **Redis Pub/Sub** as the fan-out backplane: the backend publishes domain events to a Redis channel (namespaced per workspace), and the WebSocket gateway (part of the FastAPI app, or a tiny sidecar) subscribes and pushes to connected clients.

Rationale: low-latency push with a mature backplane that our workers (Celery) also produce into; keeps the API server stateless/scalable without sticky sessions.

## 4. Design

```
Meta webhook → worker → DB write → Redis PUBLISH (workspace:{id} channel)
                                          │
                    WebSocket gateway subscribes → filters by workspace + user RBAC
                                          │
                    Browser (authenticated WS) receives typed event
```

### Event envelope

```json
{
  "event": "conversation.message.created",
  "workspace_id": "...",
  "payload": { "conversation_id": "...", "message": { ... } },
  "seq": 12345,
  "ts": 1699999999
}
```

### Event types
- `conversation.created`, `conversation.message.created`, `conversation.updated` (status/assignee)
- `message.status` (delivered/read/failed)
- `contact.updated`, `lead.status_changed`
- `campaign.progress`, `campaign.finished`
- `automation.execution.completed`

## 5. Auth & Isolation

- WebSocket handshake carries the same access token (query param or `Sec-WebSocket-Protocol`); validated server-side.
- Gateway resolves the user's **workspace(s)** and subscribes only to those channels.
- **Tenant isolation invariant:** a connected client receives only events for workspaces the user belongs to. A received event for another workspace is dropped and logged as a critical anomaly.

## 6. Reliability

- **Reconnect** with exponential backoff on the client; on reconnect, the client re-fetches the current list via REST to close any gap (eventual-consistency safety net).
- **Sequence numbers** (`seq`) allow the client to detect gaps and request a catch-up snapshot.
- **Heartbeat/ping** to detect stale connections; server closes idle sockets.

## 7. Fallback

If WebSocket is unavailable (proxy/firewall), the client uses **short polling** (e.g., 5–10s) of the REST list endpoint. Both paths share the same client cache (TanStack Query), so UI behavior is identical.

## 8. Scaling note (future)

For MVP, a single WS gateway attached to FastAPI + Redis suffices. If horizontal scale is needed later, the Redis pub/sub backplane already decouples producers from the gateway, so multiple gateway replicas can subscribe independently without sticky sessions.
