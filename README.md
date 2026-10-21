# Nutrition Tracker — Full Project

A MyFitnessPal-style food diary as a **local-first** app: vanilla HTML/CSS/JS,
no frameworks, no build step, no account, no server. All data lives in the
browser's `localStorage` on the device.

Built from the proven single-file app (`nutrition-tracker.html`), split into
clean modules and enriched with the features below. See
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for how MyFitnessPal's
reverse-engineered architecture informed the design (shape, not code).

## Reverse-engineering-informed architecture

This project follows the same high-level product shape recovered from the
MyFitnessPal analysis in the bundled REA brief:

- Thin client first: mobile-friendly web UI with local storage and no backend
  dependency for v1.
- Core product flow: diary → food search → custom foods → goals → water →
  weight → exercise → weekly insights.
- Food data source: Open Food Facts and USDA FoodData Central style lookup,
  instead of MFP's proprietary database.
- Saved meals / templates map to the same idea as MFP's user meal templates.
- Premium features such as meal plans and advanced analytics are treated as a
  later service layer, not a core requirement for v1.

Reference docs are included in [`docs/`](docs):
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`docs/MFP-REA-BRIEF.md`](docs/MFP-REA-BRIEF.md)
- [`docs/mfp-rea-report.html`](docs/mfp-rea-report.html)

## Features

**Core (ported 1:1 from the original app)**
- 4-meal food diary (breakfast / lunch / dinner / snacks) with date navigation
- Food search via **Open Food Facts** (free, open database)
- Barcode lookup: camera scan (`BarcodeDetector`) + manual entry fallback
- Quick-add (manual calories/macros), saved **My Foods** (⭐), serving-size adjust
- Calorie ring + protein/carbs/fat bars with daily goals
- Water tracker, exercise log, weight log, goals settings, JSON export

**New in this version**
- 🧭 **Onboarding wizard** (first launch): age, sex, height, weight, activity
  level, goal → TDEE via **Mifflin-St Jeor** → sets calorie + macro targets
  automatically. Skippable, re-runnable from Settings.
- 📈 **Weight trend chart**: canvas line chart of weigh-ins with 7-day moving
  average (judge the average, not single days).
- 🔥 **Streak counter**: consecutive days with any diary entry, shown on the diary.
- 📋 **Meal templates**: save any meal as a named template, one-tap re-add later.
- 📊 **Weekly report**: 7-day averages (kcal, protein, weight change) + best /
  furthest-off day.
- 🏃 **Exercise wired into the ring**: net calories = eaten − burned.

## Run the web app

No build, no dependencies. Any of these:

```bash
cd web && python3 -m http.server 8000   # then open http://localhost:8000
```

…or just double-click `web/index.html` (everything works from `file://`
except the service worker, which needs http).

## Project layout

```
nutrition-tracker-full/
├── web/                        # the app — plain files, no build step
│   ├── index.html
│   ├── manifest.json / sw.js   # PWA install + offline cache
│   ├── icon-192.png / icon-512.png
│   ├── css/styles.css
│   └── js/
│       ├── storage.js          # state, localStorage, utils (load FIRST)
│       ├── nutrition.js        # totals(), net-calorie math
│       ├── charts.js           # canvas weight-trend chart
│       ├── diary.js            # diary screen, calorie ring, meals
│       ├── foods.js            # add-food sheet: search/barcode/quick/my-foods/templates
│       ├── water.js            # water tracker
│       ├── exercise.js         # exercise log
│       ├── weight.js           # weigh-ins + history
│       ├── insights.js         # streak counter + weekly report
│       ├── onboarding.js       # wizard + Mifflin-St Jeor targets
│       ├── goals.js            # settings screen
│       └── app.js              # boot, nav, master render() (load LAST)
├── android/                    # Android Studio project → build the APK yourself
│   ├── README-ANDROID.md       # ← start here for the APK build
│   └── app/src/main/…          # manifest, MainActivity (WebView), res, assets/www (= web/)
├── docs/
│   ├── ARCHITECTURE.md         # the product architecture notes
│   ├── MFP-REA-BRIEF.md        # MFP reverse-engineering summary for AI builders
│   ├── mfp-rea-report.html    # visual report
│   └── README.txt              # pack provenance / usage notes
├── README.md                   # this file
└── LICENSE (if present)        # project license
```

Script tags are plain (not ES modules) so the app also runs from `file://`
— this is what the Android WebView loads.

## Data model (localStorage key: `nt_local_v1`)

```jsonc
{
  "settings": { "calGoal": 2000, "proteinGoal": 160, "carbGoal": 195, "fatGoal": 65, "waterGoal": 3000 },
  "days": {
    "2026-10-12": {
      "meals": { "breakfast": [ {"id","name","detail","kcal","p","c","f"} ], "lunch": [], "dinner": [], "snacks": [] },
      "water": 750,
      "exercise": [ {"id","name","min","kcal"} ]
    }
  },
  "weights": [ {"d": "2026-10-12", "kg": 82.9} ],
  "myFoods": [ {"name","brand","per100":{"kcal","p","c","f"},"defQty","unit"} ],
  "templates": [ {"id","name","items": [ {"name","detail","kcal","p","c","f"} ]} ],
  "onboarded": true,
  "profile": { "age":21, "sex":"male", "heightCm":183, "weightKg":82.9, "activity":1.55, "goalAdj":-500 }
}
```

Same key as the original single-file app — existing user data carries over,
new fields merge in with defaults.

## Roadmap (needs a backend — not in this repo)

- **Accounts + cloud sync** (Supabase/Firebase free tier): same diary on
  phone + laptop, survives reinstalls.
- **Barcode coverage**: Open Food Facts misses some Indian packaged foods —
  a small crowd-sourced DB or USDA FoodData Central fallback would help.
- **Photo food logging**: snap a meal → estimate calories (needs an ML API).
- **Social / sharing**: MFP-style friend feeds and shared meal plans.
- **Play Store release**: $25 one-time developer fee when sideloading isn't enough.

## Honest notes

- The MyFitnessPal REA work gave **architecture intelligence** (service
  boundaries, route names, auth/billing patterns) — not their source code.
  Everything here was written fresh; see `docs/ARCHITECTURE.md`.
- Calorie math: Mifflin-St Jeor is an estimate. If weight doesn't move as
  expected after 2–3 weeks, adjust the target by 200–300 kcal — the formula
  doesn't know your metabolism.
