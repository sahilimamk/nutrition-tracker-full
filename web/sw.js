/* Nutrition Tracker service worker — offline cache for the split-file build. */
const CACHE = "nt-v2";
const ASSETS = [
  "./index.html",
  "./manifest.json",
  "./css/styles.css",
  "./js/storage.js",
  "./js/nutrition.js",
  "./js/charts.js",
  "./js/diary.js",
  "./js/foods.js",
  "./js/water.js",
  "./js/exercise.js",
  "./js/weight.js",
  "./js/insights.js",
  "./js/onboarding.js",
  "./js/goals.js",
  "./js/app.js",
];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
});
self.addEventListener("fetch", (e) => {
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
});
