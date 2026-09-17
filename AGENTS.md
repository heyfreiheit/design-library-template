<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Community template

Read README.md before deployment. This is a standalone Next.js application for Vercel with Postgres and private Vercel Blob storage. Keep secrets server-side. Preserve login, authorization, encryption and upstream license notices. Each participant provisions their own database and storage. Do not connect a fork to somebody else's production data.

Use docs/EINRICHTUNGSPROMPT.md for onboarding. Run npm test, npm run lint and npm run build after implementation changes; use npm run test:e2e for login, setup, authorization and persistence changes. The latter starts isolated local test services and contains only fake test keys. External provider calls require the owner's own credentials and budget.
