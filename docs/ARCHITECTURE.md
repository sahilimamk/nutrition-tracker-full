# Architecture notes — what MyFitnessPal's REA report taught us (and didn't)

Honest summary of the reverse-engineering work done on 2026-10-12 with
[REA](https://github.com/morluto/rea/) (`rea-agents` 6.4.0) against
MyFitnessPal's production web bundles. Full report:
`~/workspace/your_files/mfp-rea-report.html`.

## What the REA actually revealed

- **MFP's website is a Next.js app, not a monolith.** 16 JS bundles parsed,
  807 modules recovered, 15,815 code relations mapped, 2,940 findings —
  static analysis only, zero parse failures.
- **The Next.js `/api/*` routes are just proxies.** Real logic lives in backend
  microservices reached through environment-configured hosts:
  - `MFP_API_HOST/v2` — core API (users, foods, diary)
  - `MAINAPP_HOST_INTERNAL` — main app service
  - `MEAL_APP_HOST_INTERNAL` — meal plans, recipes, grocery lists
  - `IDENTITY_HOST` — identity / accounts
  - `MFP_PUBLIC_API_HOST` — public API
- **Auth is deliberately boring:** NextAuth (`/api/auth/*`) with credentials +
  Facebook OAuth. Nothing custom — any auth library does the same job.
- **Premium billing is standard Stripe** (`/api/services/stripe/*`) plus
  TruMed for HSA/FSA payments. "Premium" is feature flags on gated routes,
  not special technology.
- **Recovered route map** (grouped by proxy prefix the frontend calls):
  - Food diary: `/diary/read_day`, `/food/diary`, `/food/quick-add`,
    `/food/mine`, `/diary/water`, `/diary/nutrient_goals`, `/diary/copy_meal`
  - Saved meals: `/api/services/users/meals/mine` ← the direct ancestor of
    this project's **meal templates** feature
  - Measurements: `/api/user-measurements/measurements` ← our weight log
  - Exercise: `/exercises/search`, `/exercise/diary`, `/exercises/calories_burned/`
  - Meal plans & recipes (separate `MEAL_APP` service): plan share, recipe
    print, grocery list share
- **The report's own advice for a clone:** don't copy the frontend
  chunk-for-chunk — copy the *service boundaries*: thin client → API gateway
  → small services (diary, foods, meal plans, billing). The food database is
  the moat, not the code; Open Food Facts + USDA FoodData Central cover the
  same ground for free for a personal app.

## What we did NOT get

- **No backend source code, no credentials, no session data.** Static bundle
  analysis can only show what the client was shipped: route names, config
  keys, and call patterns. Request/response payloads, database schemas,
  ranking algorithms, and the food database itself were never visible.
- **No live traffic was captured** (browser-based observation was blocked in
  the sandbox). Everything above comes from the shipped JavaScript.

## How this project maps to those ideas

| MFP concept (from REA) | This project |
|---|---|
| Thin client over services | Thin web client; the "services" are local JS modules + Open Food Facts over HTTPS |
| `/food/diary`, `/food/quick-add` | `js/diary.js` + `js/foods.js` (same vocabulary, local-first) |
| `/food/mine` (user's custom foods) | My Foods (`myFoods` in storage) |
| `/api/services/users/meals/mine` (saved meals) | Meal templates (`templates` in storage) |
| `/diary/water` | Water tracker (`js/water.js`) |
| `/api/user-measurements/measurements` | Weight log + trend chart (`js/weight.js`, `js/charts.js`) |
| `/diary/nutrient_goals` | Goals settings + onboarding wizard (`js/goals.js`, `js/onboarding.js`) |
| `/exercises/calories_burned/` | Exercise log wired into the calorie ring (net = eaten − burned) |
| NextAuth identity | Deliberately omitted — no accounts in v1 (see README roadmap) |
| Stripe premium | Deliberately omitted — no paywall in v1 |

**Bottom line:** we borrowed MFP's *shape* (which features exist and how they
relate), not its code. Every line in this repo was written fresh for it.
