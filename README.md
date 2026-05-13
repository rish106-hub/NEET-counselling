# NEET Counselling Navigator

NEET Counselling Navigator is a public, no-login web application that helps NEET UG students understand what to do after receiving a score. It turns a student's score, category, domicile state, and budget preference into a practical counselling plan covering AIQ registration, state quota registration, college targeting, round strategy, document readiness, deadline awareness, and risk warnings.

The product is intentionally built as a civic utility: no signup wall, no paid tier, no sponsored college placement, and no claim that previous-year cutoff data can guarantee a future seat.

## What It Does

- Builds a counselling plan from a small student profile.
- Estimates rank bands from bundled score-to-rank data.
- Identifies realistic AIQ and state quota college options.
- Labels college options as safe, moderate, reach, or data unavailable.
- Explains freeze, float, slide, mop-up, and stray vacancy decisions in plain language.
- Creates a personalized document checklist with procurement timing risk.
- Flags high-risk counselling traps such as capitation fees, consultant claims, NRI quota misuse, bond obligations, and private fee exposure.
- Provides a deadline calendar with Supabase-backed records and estimated fallback dates.
- Generates shareable result links without requiring an account.
- Supports light, dark, and system theme modes.

## Current Production Readiness

The application includes:

- Server-side validation for assessment requests using Zod.
- API input bounds for college and deadline filters.
- Optional Redis-backed rate limiting for the assessment endpoint.
- Supabase-backed durable result storage for shared result links.
- Browser-session fallback for newly generated results when external persistence is not configured.
- Static fallback data when Supabase is unavailable.
- Deterministic fallback action steps when LLM providers are unavailable.
- Security headers configured through `next.config.ts`.
- Responsive UI across landing, assessment, deadline, guide, and result pages.
- CSS-based 3D hero animation with reduced-motion support.
- Professional copy without emoji or em-dash characters in the checked source paths.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 App Router |
| UI | React 19, Tailwind CSS 4, Base UI primitives, lucide-react |
| Language | TypeScript |
| Validation | Zod |
| Database | Supabase Postgres |
| Cache and rate limit | Upstash Redis |
| Optional LLM providers | Gemini, OpenAI |
| Deployment | Vercel |

## Architecture

```text
app/
  api/
    assess/             Assessment generation endpoint
    colleges/           College search endpoint
    deadlines/          Deadline calendar endpoint
    output/[uuid]/      Shared result retrieval endpoint
  assess/               Public assessment form
  deadlines/            Public deadline calendar
  how-it-works/         Counselling guide
  results/[uuid]/       Shared result page

components/
  tabs/                 Result dashboard tabs
  ui/                   Shared UI primitives

lib/
  cache/                Redis helpers
  db/                   Supabase clients
  engine/               Rank, eligibility, documents, flags, strategy
  llm/                  Optional generated action plan
  server/               Server-side data access helpers

public/data/            Bundled static data
scripts/seed/           Seed college data
supabase/migrations/    Database schema
```

## Application Flow

1. The student opens the landing page and starts an assessment.
2. The client validates basic form state before submission.
3. `POST /api/assess` validates the request again on the server.
4. The engine estimates rank, finds eligible colleges, builds round strategy, checks documents, and generates red flags.
5. The app attempts an LLM-generated action plan. If the provider is unavailable, deterministic fallback steps are used.
6. The result payload is stored in Redis when configured and in Supabase `output_cache` when configured.
7. The browser stores the result locally before redirecting, so the immediate result page works even in a no-env preview deployment.
8. The user is redirected to `/results/[uuid]`.
9. Shared result links resolve through `lib/server/output.ts`, which checks Redis, transient server memory, and Supabase.

## Environment Variables

Create `.env.local` for local development. Keep all `.env*` files out of git.

### Required for durable production behavior

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key for database reads and output persistence |

### Recommended for production

| Variable | Purpose |
| --- | --- |
| `UPSTASH_REDIS_REST_URL` | Redis REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Redis REST token |
| `GEMINI_API_KEY` | Gemini action-plan generation |
| `OPENAI_API_KEY` | OpenAI fallback action-plan generation |

The app is resilient when optional services are absent:

- Without Redis, rate limiting fails open and the app still uses Supabase where available.
- Without Supabase, college and deadline endpoints use bundled fallback data.
- Without LLM credentials, the assessment endpoint returns deterministic fallback action steps.

## Supabase Schema

Run the migration in `supabase/migrations/001_initial_schema.sql`.

It creates:

- `colleges`
- `cutoffs`
- `deadlines`
- `documents`
- `output_cache`

`output_cache` stores UUID-addressable result payloads with an expiry timestamp. This is what makes shared result links durable beyond browser local storage and transient server memory.

## Local Development

Install dependencies:

```bash
npm ci
```

Start the app:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Run checks:

```bash
npm run lint
npm run build
```

## API Reference

### `POST /api/assess`

Creates an assessment and returns a result UUID.

Request:

```json
{
  "neet_score": 520,
  "category": "General",
  "state": "Karnataka",
  "budget_preference": "government_only"
}
```

Response:

```json
{
  "assessment_id": "uuid",
  "output": {
    "assessment_id": "uuid"
  }
}
```

### `GET /api/output/[uuid]`

Returns a previously generated assessment payload.

Invalid or expired IDs return an error response instead of rendering a broken page.

### `GET /api/colleges`

Optional filters:

- `state`
- `type`
- `max_fee`

Example:

```bash
curl "https://your-domain.vercel.app/api/colleges?state=Karnataka&type=government&max_fee=100000"
```

### `GET /api/deadlines`

Optional filters:

- `state`
- `track` as `AIQ`, `STATE`, or `BOTH`

## Vercel Deployment

### 1. Import the repository

In Vercel, import:

```text
rish106-hub/NEET-counselling
```

Framework preset:

```text
Next.js
```

Install command:

```bash
npm ci
```

Build command:

```bash
npm run build
```

### 2. Configure environment variables

Add these in Vercel Project Settings under Environment Variables:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
GEMINI_API_KEY
OPENAI_API_KEY
```

Set production, preview, and development values as needed.

### 3. Deploy from CLI

Preview deployment:

```bash
vercel
```

Production deployment:

```bash
vercel --prod
```

If the local directory is not linked yet:

```bash
vercel link
```

### 4. Post-deploy verification

Set the deployed URL:

```bash
BASE_URL=https://your-domain.vercel.app
```

Run endpoint checks:

```bash
curl -i "$BASE_URL/api/deadlines"
curl -i "$BASE_URL/api/colleges"
curl -i "$BASE_URL/api/colleges?state=Karnataka&type=government&max_fee=100000"
curl -i "$BASE_URL/api/output/not-a-valid-id"
curl -i "$BASE_URL/api/assess" \
  -H "Content-Type: application/json" \
  -d '{"neet_score":520,"category":"General","state":"Karnataka","budget_preference":"government_only"}'
```

Expected results:

- `/api/deadlines` returns `200`.
- `/api/colleges` returns `200`.
- Invalid output IDs return an error response, not a server crash.
- `/api/assess` returns `200` with an `assessment_id`.
- `/results/<assessment_id>` renders a complete result page.

For durable shared result links in production, configure Supabase or Redis. Without those services, the browser that created the result can still render it from local storage, but another device may not be able to retrieve the same UUID.

## Security Notes

- The app has no authentication surface.
- The Supabase service role key is used only in server-side modules.
- Client inputs are validated on the client and again on the server.
- Query filters are bounded before database access.
- Redis failures do not break the assessment flow.
- Result links are UUID-based and expire through `output_cache.expires_at`.
- Security headers are configured in `next.config.ts`:
  - `X-Content-Type-Options`
  - `X-Frame-Options`
  - `Referrer-Policy`
  - `Permissions-Policy`

## Data Policy

The app uses previous-cycle data as guidance, not prediction. Cutoff ranks and eligibility bands should be treated as planning inputs only. MCC and state DME portals remain the final source of truth.

## Maintenance Checklist

Before shipping a change:

```bash
npm run lint
npm run build
```

Then verify:

- Landing page is responsive.
- Assessment form validates invalid input.
- Assessment endpoint returns an `assessment_id`.
- Result page renders from the generated ID.
- Deadline and college endpoints return fallback data when external services are unavailable.
- Light, dark, and system theme modes work.
- UI copy remains professional and free of emoji or em-dash characters.
