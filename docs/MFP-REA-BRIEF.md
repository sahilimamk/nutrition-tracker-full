# MyFitnessPal — Reverse Engineering Brief (for AI builders)

> Pass this file + `mfp-rea-report.html` to any AI to give it everything
> recovered from reverse-engineering MyFitnessPal's production web app.
> Produced 2026-10-12 via REA (Reverse Engineer Anything) v6.4.0 —
> **static analysis of the shipped frontend JavaScript bundles only.**

## How this was obtained
- 16 production JS bundles fetched from `web-assets.myfitnesspal.com`.
- Parsed with `npx rea-agents analyze-javascript-application` → 23 MB evidence graph:
  807 modules recovered, 15,815 code relations, 2,940 findings with evidence,
  605,331 AST nodes, 0 parse failures.
- No credentials, sessions, or user data were touched. No live traffic was
  captured (browser observation was blocked in that sandbox).

## What this is NOT (read before building)
- This is **frontend static analysis**. We have MFP's client architecture and
  the API routes it calls — we do **not** have their backend source code,
  database schemas, request/response payloads, or their food database.
- The food database (millions of entries) is MFP's moat and is **not** in the
  client. For a clone, use **Open Food Facts** (free, has barcode lookup) and/or
  **USDA FoodData Central** (free API) as the food data source.

## Architecture (as recovered from the bundles)
MyFitnessPal's web app is a **Next.js** app (thin client). It is not a monolith:

```
Browser (React/Next.js SPA, 16 webpack chunks, ~1.8 MB largest chunk)
  │  HTTPS, same-origin /api/* calls
  ▼
Next.js API-route PROXY layer (no real logic here, just forwarding):
  /api/mainapp/*        → main app service
  /api/mealapp/v2/*     → meal-plan service
  /api/services/*       → core services
  /api/auth/*           → auth (NextAuth)
  │  internal hosts from env config
  ▼
Backend microservices:
  MFP_API_HOST/v2            core API (users, foods, diary)
  MAINAPP_HOST_INTERNAL      main app service
  MEAL_APP_HOST_INTERNAL     meal plans, recipes, grocery lists
  IDENTITY_HOST              identity / accounts
  MFP_PUBLIC_API_HOST        public API
```

**Clone takeaway:** don't copy the frontend chunk-for-chunk — copy the
*service boundaries*: thin client → API gateway → small services
(diary, foods, meal plans, billing). Meal plans are a separate service, so a
clone can ship diary + food search first and add planning later.

## Auth (boring on purpose — use any auth library)
- NextAuth: credentials + Facebook OAuth (`/api/auth/signin`, `/signout`,
  `/session`, `/api/auth/signin/facebook`, `/api/auth/refresh-token-data`).
- Identity checks: `/api/idm/user-exists`, `/api/idm/user-with-consents`.
- Password reset: `/api/account/password_reset`.

## API route map (every route recovered from the bundles)

### Food diary
| Route | Purpose |
|---|---|
| `/diary/read_day`, `/diary/read_diary` | Load a day's diary |
| `/food/diary`, `/food/quick-add`, `/food/submit` | Log food entries |
| `/food/mine`, `/foods/mine`, `/api/services/users/foods/mine` | User's custom foods |
| `/diary/water`, `/diary/read_water` | Water tracking |
| `/diary/nutrient_goals`, `/diary/copy_meal` | Goals + copy a meal to another day |
| `/api/services/top_foods` | Popular foods |
| `/api/services/users/meals/mine` | Saved meals (meal templates) |
| `/api/user-measurements/measurements` | Weight / body measurements |

### Exercise
| Route | Purpose |
|---|---|
| `/exercises/search`, `/exercises/lookup` | Exercise database search |
| `/exercise/diary`, `/exercises/calories_burned/` | Log exercise + calorie math |

### Meal plans & recipes (premium tier)
| Route | Purpose |
|---|---|
| `/api/mealapp/v2/mealapp/plan/share/` | Share a meal plan |
| `/api/mealapp/v2/mealapp/recipe/print` | Recipe print view |
| `/api/mealapp/v2/mealapp/grocery/shareList/` | Grocery list sharing |

### Premium billing (standard Stripe, features are just gated routes)
| Route | Purpose |
|---|---|
| `/api/services/stripe/subscriptions` | Premium subscriptions |
| `/api/services/stripe/portal-session`, `/prices`, `/customers` | Billing portal + pricing |
| `/api/services/stripe/truemed/payment-token` | TruMed HSA/FSA payments |

## Feature inventory for a clone (free vs premium split, inferred)
**Free core:** food diary (breakfast/lunch/dinner/snacks), food search + barcode,
custom foods, quick-add calories, water tracking, weight log, exercise log,
nutrient goals, saved meals, meal copy across days.
**Premium:** meal plans, recipes, grocery lists, advanced nutrient analytics,
ad-free. All premium gating is server-side feature flags + Stripe — no special
client technology.

## Suggested build order for a clone
1. Diary + food search (Open Food Facts) + custom foods + goals. Local-first
   (localStorage/SQLite) is fine for v1 — MFP's sync is a later concern.
2. Water, weight trend, exercise (wired into net calories).
3. Saved meals / meal templates, streaks, weekly reports.
4. Accounts + cloud sync (any auth library; the REA shows auth is commodity).
5. Meal plans / recipes as a separate module (mirrors MFP's separate service).
6. Stripe subscriptions only if/when monetizing.

## Files in this pack
- `mfp-rea-report.html` — the full visual report (stats, architecture diagram,
  route tables, method).
- `ARCHITECTURE.md` — how these findings mapped onto a real build
  (from the nutrition-tracker-full project).
- `MFP-REA-BRIEF.md` — this file.
- `README.txt` — pack contents and provenance.

## Provenance / limits
- Analysis date: 2026-10-12. MFP's bundles change over time; re-fetch and
  re-run `rea-agents analyze-javascript-application` for fresh results.
- The raw 23 MB evidence JSON and the 16 source bundles lived in ephemeral
  `/tmp` and did not survive — what remains is the distilled intelligence
  above, which is the part another AI can actually use.
