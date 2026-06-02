# PWA — Supabase port

This folder contains **only the files that change** when migrating the PWA
from Firebase to Supabase. Everything else (pages, components, contexts
for Theme/Toast, Vite config, Tailwind config, App.tsx, AppShell, icons,
service worker, etc.) is **unchanged** — copy them as-is from the Firebase
version of the PWA.

## File-by-file diff

| File | Action |
|---|---|
| `src/services/firebase.ts` | **Delete** — replaced by `src/services/supabase.ts` |
| `src/services/supabase.ts` | **New** — Supabase client singleton |
| `src/services/api.ts` | **Replace** — calls Edge Function via Supabase JWT |
| `src/contexts/AuthContext.tsx` | **Replace** — uses `supabase.auth.*` |
| `src/hooks/usePendingRequests.ts` | **Replace** — uses Realtime channels |
| `src/hooks/usePushNotifications.ts` | **Replace** — uses standard Web Push API |
| `src/types/index.ts` | **Replace** — snake_case fields + ISO timestamps |
| `src/utils/format.ts` | **Replace** — parses ISO strings (no Firestore Timestamp shape) |
| `.env.example` | **Replace** — Supabase URL + anon key |
| `public/firebase-messaging-sw.js` | **Delete** — replaced by standard Web Push handler (optional) |
| `package.json` | **Edit** — remove `firebase`, add `@supabase/supabase-js` |
| All `src/pages/*.tsx` | **Tiny edits** — change a few field names (see below) |
| `src/components/*.tsx` | **No change** |
| `vite.config.ts` | **No change** |
| `tailwind.config.js` | **No change** |
| `src/contexts/ThemeContext.tsx` | **No change** |
| `src/contexts/ToastContext.tsx` | **No change** |
| `src/App.tsx`, `src/main.tsx` | **No change** |

## Field-name changes inside the pages

Postgres uses snake_case; Firestore the system was using camelCase.
Inside the pages, do a search-and-replace:

```
r.requestId        → r.request_id
r.transactionId    → r.transaction_id
r.requestType      → r.request_type
r.customerName     → r.customer_name
r.requestedBy      → r.requested_by
r.requestedByName  → r.requested_by_name
r.requestedAt      → r.requested_at
r.approvalRemarks  → r.approval_remarks
r.approvedBy       → r.approved_by
r.approvedByName   → r.approved_by_name
r.approvedAt       → r.approved_at
r.rejectedAt       → r.rejected_at
r.isProcessed      → r.is_processed
```

Timestamps are now ISO 8601 strings rather than `{seconds, nanoseconds}`
objects, so the `format.ts` helpers are the only files that touch them.

## Updated `package.json` dependencies

Remove `firebase` and `firebase-admin`, add `@supabase/supabase-js`:

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.45.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.0",
    "zustand": "^4.5.4"
  }
}
```
