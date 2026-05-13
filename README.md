# NEET Counselling Navigator

Production-oriented Next.js app for generating free NEET UG counselling guidance without login or signup. Students enter score, category, domicile state, and budget preference, then receive an action plan covering AIQ counselling, state quota counselling, eligible colleges, document readiness, risk flags, and deadlines.

Repository: `https://github.com/rish106-hub/NEET-counselling.git`

## Product Scope

- Public landing page with no authentication requirement.
- Score assessment form with client and server validation.
- Results page with eligibility summary, college lists, action plan, warnings, and document checklist.
- Deadline calendar with Supabase-backed records and static fallback data.
- Shareable result links with 90-day retention.
- Light, dark, and system theme modes.
- Professional, responsive UI with CSS-based 3D hero motion and reduced-motion support.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Base UI primitives
- Supabase for college, deadline, and output-cache persistence
- Upstash Redis for optional rate limiting and fast output cache
- Gemini or OpenAI for optional generated action-plan text

## Important Next.js Note

This repository uses a newer Next.js version with local documentation available in:

```bash
node_modules/next/dist/docs/
```

Before changing routing, server components, caching, or route handlers, read the relevant local docs in that folder. The project intentionally follows App Router conventions.

## Local Setup

```bash
npm ci
npm run dev
```

Open:

```text
http://localhost:3000
```

## Environment Variables

Create `.env.local` for local development. Do not commit it.

Required for Supabase-backed production behavior:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Optional but recommended:

```bash
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
GEMINI_API_KEY=
OPENAI_API_KEY=
```

Notes:

- If Redis is missing, rate limiting fails open and result storage falls back to Supabase when configured.
- If Supabase is missing, college and deadline routes fall back to bundled seed data where possible.
- If LLM credentials are missing or fail, the assessment endpoint returns deterministic fallback action steps.
- `NEXT_PUBLIC_BASE_URL` is not required by the app pages; server pages fetch directly from server utilities to avoid deployment URL drift.

## Supabase Setup

Run the migration:

```bash
supabase/migrations/001_initial_schema.sql
```

Tables created:

- `colleges`
- `cutoffs`
- `deadlines`
- `documents`
- `output_cache`

The `output_cache` table stores UUID-addressable result payloads for 90 days. This makes shared result links durable even when Redis is unavailable.

## Vercel Deployment

1. Push this repository to GitHub.
2. In Vercel, choose **Add New Project** and import `rish106-hub/NEET-counselling`.
3. Keep the framework preset as **Next.js**.
4. Set the install command:

```bash
npm ci
```

5. Set the build command:

```bash
npm run build
```

6. Add environment variables in Vercel Project Settings:

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
GEMINI_API_KEY
OPENAI_API_KEY
```

7. Deploy.
8. After deployment, run the smoke checks below against the Vercel URL.

## Smoke Checks

Replace `BASE_URL` with local or production URL.

```bash
BASE_URL=http://localhost:3000
curl -i "$BASE_URL/api/deadlines"
curl -i "$BASE_URL/api/colleges"
curl -i "$BASE_URL/api/colleges?state=Karnataka&type=government&max_fee=100000"
curl -i "$BASE_URL/api/output/not-a-valid-id"
```

Assessment POST:

```bash
curl -i "$BASE_URL/api/assess" \
  -H "Content-Type: application/json" \
  -d '{"neet_score":520,"category":"General","state":"Karnataka","budget_preference":"government_only"}'
```

Expected:

- `/api/deadlines` returns `200`.
- `/api/colleges` returns `200` with `source` as `db` or `seed`.
- Invalid output IDs return an error response instead of crashing.
- `/api/assess` returns `200` with an `assessment_id`.
- Visiting `/results/<assessment_id>` renders the result if Redis or Supabase persistence is configured.

## Verification Commands

```bash
npm run lint
npm run build
```

## Security Notes

- No login or signup is implemented.
- Server-side Supabase access uses `SUPABASE_SERVICE_ROLE_KEY` only in server modules.
- Assessment input is validated with Zod.
- API filters are bounded and validated before being used in queries.
- Redis failures do not crash user-facing assessment flow.
- Security headers are configured in `next.config.ts`:
  - `X-Content-Type-Options`
  - `X-Frame-Options`
  - `Referrer-Policy`
  - `Permissions-Policy`

## Data Notes

- Cutoff data is advisory and based on previous counselling cycles.
- The UI explicitly avoids presenting previous-year cutoff data as a guarantee.
- Official MCC and state DME portals remain the final source of truth.

## Project Structure

```text
app/
  api/
    assess/
    colleges/
    deadlines/
    output/[uuid]/
  assess/
  deadlines/
  how-it-works/
  results/[uuid]/
components/
  tabs/
  ui/
lib/
  cache/
  db/
  engine/
  llm/
  server/
public/data/
scripts/seed/
supabase/migrations/
```

## Operating Checklist

- Keep copy professional and plain. Avoid emoji and em-dash characters in rendered UI copy.
- Verify light, dark, and system modes after UI changes.
- Run `npm run build` before deployment.
- Check API route behavior with and without Supabase credentials.
- Keep `.env*` files out of git.
- Update this README whenever deployment or required environment variables change.
