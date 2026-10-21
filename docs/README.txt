MyFitnessPal REA resource pack
==============================
Produced 2026-10-12. Static analysis of MFP's production web JS bundles
via REA (rea-agents) v6.4.0. No backend code, no user data.

Contents:
- MFP-REA-BRIEF.md      Start here. Everything recovered, written for AI builders.
- mfp-rea-report.html   Full visual report (open in a browser).
- ARCHITECTURE.md       How the findings mapped onto a real app build.
- README.txt            This file.

How to use: hand MFP-REA-BRIEF.md (and the HTML report) to any AI and ask it
to design/build a nutrition tracker. The brief tells it what MFP does, the API
shapes, and what to use instead of MFP's private food database
(Open Food Facts + USDA FoodData Central, both free).

Note: the raw 23 MB evidence JSON and the 16 source bundles were in ephemeral
/tmp and did not survive. The distilled intelligence above is intact and is the
usable part. To regenerate raw evidence: fetch bundles from
web-assets.myfitnesspal.com and run:
  npx rea-agents analyze-javascript-application <bundles-dir> --format json
