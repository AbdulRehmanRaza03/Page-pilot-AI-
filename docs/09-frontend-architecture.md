# 09 — Frontend Architecture

This document defines the frontend architecture for PagePilot. It is intended to be **concrete and buildable** — a new engineer should be able to open `frontend/` and immediately understand where things live and how they connect.

Companion documents: `08-tech-stack.md` (technology choices), `12-api-architecture.md` (API contract), `21-knowledge-base.md` (KB surfaced by the AI).

---

## 1. Pages / Routes (Next.js App Router)

Routing is multi-tenant: every workspace-scoped route lives under `/w/[workspaceId]`. Route conventions follow the App Router's file-based structure.

| Route | Purpose | Layout |
| ----- | ------- | ------ |
| `/login` | Login (email/password + OAuth) | Auth layout |
| `/signup` | Account creation | Auth layout |
| `/onboarding` | Connect Page / choose plan | App layout (no workspace yet) |
| `/w/[workspaceId]` | Dashboard overview | App shell |
| `/w/[workspaceId]/inbox` | Conversation inbox (unified) | App shell |
| `/w/[workspaceId]/inbox/[conversationId]` | Single conversation thread | App shell |
| `/w/[workspaceId]/contacts` | Contacts / leads | App shell |
| `/w/[workspaceId]/campaigns` | Campaign list | App shell |
| `/w/[workspaceId]/campaigns/[campaignId]` | Campaign builder/detail | App shell |
| `/w/[workspaceId]/automations` | Automation rules | App shell |
| `/w/[workspaceId]/labels` | Label management | App shell |
| `/w/[workspaceId]/analytics` | Analytics dashboards | App shell |
| `/w/[workspaceId]/knowledge-base` | Knowledge base management (see `21-knowledge-base.md`) | App shell |
| `/w/[workspaceId]/settings` | Workspace settings | App shell |
| `/w/[workspaceId]/settings/members` | Members & roles | App shell |
| `/w/[workspaceId]/settings/facebook` | Connected pages & permissions | App shell |
| `/account` | Personal account settings | App shell |

**Route groups:** `(auth)` for auth pages, `(app)` for the shelled application. This keeps layout segregation explicit.

---

## 2. Layouts

### App shell (`app/(app)/layout.tsx`)

The persistent application chrome:

- Topbar: workspace switcher, global search, notifications, user menu.
- Sidebar: primary navigation, permission-filtered (see §8).
- Content region: renders the active page with a `Suspense` boundary and error boundary.
- Loads workspace context (`WorkspaceProvider`) and user permissions.

### Auth layout (`app/(auth)/layout.tsx`)

Centered card, branding, no chrome. Redirects already-authenticated users to `/w/[workspaceId]`.

---

## 3. Component Taxonomy

Component placement communicates responsibility and reuse scope:

| Bucket | Location | Rule |
| ------ | -------- | ---- |
| **UI primitives** | `components/ui/` | Unstyled/atomic building blocks (Button, Input, Dialog, Select, Tooltip) built on Radix/Headless UI. No business logic, no data fetching. |
| **Design-system components** | `components/design-system/` | Composed, branded components (DataTable, EmptyState, PageHeader, Badge, Toast) that use tokens. Still reusable, still logic-free. |
| **Feature components** | `components/[feature]/` | Feature-specific (e.g. `components/inbox/ConversationList.tsx`). May fetch data and own feature state. |
| **Page components** | `app/**/page.tsx` — or `components/pages/` | Thin; fetch server data, delegate to feature components. |

---

## 4. UI System

### Design tokens

Single source of truth in `frontend/tokens/` (or a Tailwind preset) exposing: color scales (brand, neutrals, semantic success/warning/danger), spacing scale, typography scale, radii, shadows, and motion.

- Tokens are consumed via Tailwind utility classes mapped to `--token` CSS custom properties.
- **No hardcoded values** in feature components. This enables theming and future rebranding without a rewrite.

### Primitives

Built on Radix UI / Headless UI and styled with Tailwind, assembled into `components/ui/`. Accessibility and keyboard/focus behavior come from the primitive library; we supply styling and composition.

---

## 5. API Layer

### Typed client

- Generated from the backend OpenAPI spec (`/openapi.json`) into `frontend/src/api/generated/`.
- A thin wrapper `frontend/src/api/client.ts` adds:
  - Base URL + `/api/v1` prefix.
  - Attach `Authorization: Bearer <token>`.
  - Workspace context header (`X-Workspace-Id` or workspace in path).
  - Centralized error normalization (see below).

### TanStack Query hooks

- One hook module per resource under `frontend/src/api/hooks/` (e.g. `useConversations.ts`, `useContacts.ts`).
- **Query-key convention:** `['workspace', workspaceId, resource, ...params]` so invalidations are precise and tenant-scoped.
- Hooks return typed `data`, `isLoading`, `error`, and mutation helpers.

### Error handling

- API errors use the backend error envelope (`code`, `message`, `details` — see `12-api-architecture.md`).
- The client maps HTTP status + `code` to a typed `ApiError`.
- A global error boundary + toast system surfaces unexpected errors; forms show field-level errors from `details`.

---

## 6. Custom Hooks

Examples (lives in `frontend/src/hooks/`):

| Hook | Purpose |
| ---- | ------- |
| `useWorkspace` | Current workspace context + membership |
| `usePermissions` | Resolved permission map for the user (see §8) |
| `useDebouncedValue` | Debounce search inputs |
| `useInfiniteQuery` helpers | Cursor pagination wrappers for inbox/contacts |
| `useMediaQuery` | Responsive UI logic |

Rule: business logic that spans components becomes a hook; one-off logic stays inline.

---

## 7. State Management

### Server state → TanStack Query

Everything fetched from the API lives in TanStack Query. This is the **primary** state layer.

### Client state → React state + Zustand

- Component-local ephemeral state (input focus, open menus, form drafts) → React state.
- App-level flags that persist beyond one component (active workspace, sidebar collapsed, theme) → a small Zustand store, persisted where appropriate.

**Do not** mirror server data into Zustand/Redux; that creates a second source of truth.

---

## 8. Permission Gating (client mirrors RBAC)

The backend is the authority (`12-api-architecture.md` defines RBAC keys). The frontend mirrors permissions for UX only — it must never be the security boundary.

- `usePermissions()` resolves the current user's permission set (returned by the `auth/me` or session endpoint), building a key set like `conversations.read`, `messaging.send`, `campaigns.send`.
- `Can` component / `useCan(key)` hook conditionally render UI.
- Navigation items are filtered by permission.

**Always** rely on backend 403s as the real guard; client gating is for hiding affordances.

---

## 9. Loading / Error Patterns

- **Loading:** `Suspense` boundaries at the page and section level; skeleton components (`components/ui/Skeleton.tsx`) for known layouts; `isLoading` from Query for data-detail views.
- **Error:** per-boundary `error.tsx` (App Router) for route-level failures; toast for transient mutations; inline empty/error states for lists.
- **Streaming:** server components stream the shell immediately and stream data in — the user never sees a blank screen.

---

## 10. Shared TypeScript Types

- Generated API types (`frontend/src/api/generated/`) are the canonical wire types.
- Domain types and enums that span features (e.g. `Label`, `ContactStatus`, `Role`, `PermissionKey`) live in `frontend/src/types/`.
- Types are **exported from a single index** to avoid deep import paths and accidental duplication.

---

## 11. Recommended Folder Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── (app)/
│   │   │   ├── layout.tsx            # app shell
│   │   │   ├── page.tsx              # redirect → /w/[workspaceId]
│   │   │   ├── onboarding/page.tsx
│   │   │   └── w/[workspaceId]/
│   │   │       ├── layout.tsx        # workspace context + permission load
│   │   │       ├── page.tsx
│   │   │       ├── inbox/...
│   │   │       ├── contacts/...
│   │   │       ├── campaigns/...
│   │   │       ├── automations/...
│   │   │       ├── labels/...
│   │   │       ├── analytics/...
│   │   │       ├── knowledge-base/...
│   │   │       └── settings/{page.tsx,members/...,facebook/...}
│   │   ├── layout.tsx                # root layout
│   │   ├── error.tsx
│   │   └── loading.tsx
│   ├── components/
│   │   ├── ui/                       # primitives (Radix + Tailwind)
│   │   ├── design-system/            # branded, composed components
│   │   ├── layout/                   # sidebar, topbar, app shell pieces
│   │   └── [feature]/
│   │       ├── inbox/
│   │       ├── contacts/
│   │       ├── campaigns/
│   │       └── knowledge-base/
│   ├── api/
│   │   ├── client.ts
│   │   ├── generated/                # OpenAPI-generated types + calls
│   │   └── hooks/                    # TanStack Query hooks per resource
│   ├── hooks/                        # useWorkspace, usePermissions, etc.
│   ├── stores/                       # Zustand stores
│   ├── types/                        # shared domain types + enums
│   ├── lib/                          # utilities (auth token, errors, date)
│   └── permissions/                  # RBAC mirror: Can, useCan, nav filter
├── tokens/                           # design tokens / Tailwind preset
├── public/
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 12. Key Building Rules (summary)

1. Server components fetch and stream data where possible; client components handle interactivity and Query mutations.
2. Nothing fetches data with raw `fetch` outside `api/` — go through the typed client.
3. Server state lives **only** in TanStack Query.
4. No hardcoded colors/spacing — use tokens.
5. Permission checks client-side are **cosmetic**; the backend enforces.
6. Loading is handled with skeletons/Suspense, never blank screens.
