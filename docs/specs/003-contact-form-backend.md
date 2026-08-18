# Spec: Contact form backend

## What

A working contact form on `apps/portfolio`'s Contact page: name/email/message fields, submitted via a Next.js Server Action, sent as an email through Resend. The legacy version never had a functioning backend — this is genuinely new, not a migration.

## Why

Closes the one piece of real functionality the legacy site never shipped. Also the first backend/external-service integration in the new stack — sets the pattern for later backend work (e.g. the future auth pet project).

## Scope

**In scope:**
- Server Action (`'use server'`) handling form submission — no separate `/api/` route
- Fields: name, email, message
- Server-side validation (required fields, valid email format) — client-side validation as a UX nicety, not the source of truth
- Resend integration: API key read from environment variable, email sent to your address on successful submission
- Success/error UI state on the Contact page (submitting, success confirmation, error message) using existing `packages/ui` components (`Input`, `TextArea`, `Button`) — no new primitives unless something's genuinely missing
- `.env.example` documenting the required `RESEND_API_KEY` variable (actual key never committed)
- Basic server-side error handling (Resend API failure, network issues) — surfaced to the user as a generic "something went wrong, try again" rather than raw errors

**Out of scope (explicitly):**
- Bot/spam protection (honeypot, rate limiting) — deferred, can be added later without touching this spec's core logic
- Domain-verified sending in Resend (fine to send from Resend's default domain for now; revisit if/when a custom domain is verified)
- Any database/storage of submissions — this is fire-and-forget email, nothing persisted
- Cloudflare env var configuration for production — that's Stage 6

## Approach

1. Set up Resend account + API key (manual, outside this spec — done before or alongside implementation).
2. Add `resend` package as a dependency of `apps/portfolio` (app-local — no other app needs it, per the dependency-boundary rule).
3. Build the Server Action: validate input server-side, call Resend, return a typed result (success/error) the client component can react to.
4. Wire the Contact page form to the action, using `useFormStatus`/`useActionState` (or equivalent current Next.js 16 pattern) for pending/success/error UI states.
5. Add `.env.example` with `RESEND_API_KEY=` documented, confirm `.env.local` is gitignored (it already is).
6. Manually verify: real submission actually arrives as an email.

## Acceptance criteria

- [ ] Contact form renders with name/email/message fields using `packages/ui` components
- [ ] Submitting valid data sends a real email via Resend and shows a success state
- [ ] Submitting invalid data (missing field, malformed email) shows a validation error without hitting Resend
- [ ] A simulated Resend failure shows a generic error state, not a raw stack trace
- [ ] `RESEND_API_KEY` is read from env, never hardcoded; `.env.example` documents it
- [ ] Lint, typecheck, build pass

## Open questions

- None blocking. If Next.js 16's current recommended pattern for form-action pending/error state differs from `useFormStatus`/`useActionState`, use whatever's current — don't force an outdated pattern for consistency with this spec's wording.
