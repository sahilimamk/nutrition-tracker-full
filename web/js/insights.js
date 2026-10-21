"use strict";
/* insights.js — NEW enriched features:
   streak counter (consecutive days with any diary entry) and the
   7-day weekly report view. */
(function () {
  var NT = (window.NT = window.NT || {});

  // Consecutive days with food logged. If today is empty, the streak
  // is allowed to be "alive" through yesterday (you haven't broken it yet).
  NT.streakDays = function () {
    var n = 0;
    var d = NT.todayStr();
    if (!NT.dayHasFood(d)) d = NT.addDays(d, -1);
    while (NT.dayHasFood(d)) { n++; d = NT.addDays(d, -1); }
    return n;
  };

  NT.renderStreak = function () {
    var el = document.getElementById("streakLine");
    if (!el) return;
    var n = NT.streakDays();
    if (n > 0) {
      el.className = "streak";
      el.textContent = "🔥 " + n + "-day logging streak" + (n === 1 ? "" : "s") + " — keep it going!";
    } else {
      el.className = "streak zero";
      el.textContent = "Log today's food to start a streak 🔥";
    }
  };

  NT.renderReport = function () {
    var host = document.getElementById("repBody");
    if (!host) return;
    var goal = NT.S.settings.calGoal;
    var days = [];
    for (var i = 6; i >= 0; i--) days.push(NT.addDays(NT.todayStr(), -i));

    var kSum = 0, pSum = 0, logged = 0, best = null, worst = null;
    days.forEach(function (ds) {
      var t = NT.totals(ds);
      var has = NT.dayHasFood(ds);
      if (has) {
        logged++;
        kSum += t.k; pSum += t.p;
        var dev = Math.abs(t.k - goal);
        if (!best || dev < best.dev) best = { d: ds, dev: dev, k: t.k };
        if (!worst || dev > worst.dev) worst = { d: ds, dev: dev, k: t.k };
      }
    });

    var ws = NT.S.weights
      .filter(function (w) { return w.d >= days[0] && w.d <= days[6]; })
      .sort(function (a, b) { return a.d < b.d ? -1 : 1; });
    var wDelta = ws.length >= 2 ? (ws[ws.length - 1].kg - ws[0].kg) : null;

    function dayLbl(ds) {
      var t = NT.todayStr();
      if (ds === t) return "Today";
      if (ds === NT.addDays(t, -1)) return "Yesterday";
      return ds.slice(8) + "/" + ds.slice(5, 7);
    }

    var html = '<div class="mut">Last 7 days · ' + days[0].slice(8) + "/" + days[0].slice(5, 7) +
      " → " + days[6].slice(8) + "/" + days[6].slice(5, 7) + "</div>";
    html += '<div class="stat-grid">';
    html += stat(logged ? Math.round(kSum / logged) + "" : "—", "avg kcal / logged day");
    html += stat(logged ? Math.round(pSum / logged) + "g" : "—", "avg protein / logged day");
    html += stat(wDelta == null ? "—" : (wDelta > 0 ? "+" : "") + wDelta.toFixed(1) + " kg", "weight change (7d)");
    html += stat(logged + "/7", "days logged");
    html += "</div>";
    html += '<div class="card" style="margin:10px 0 0; box-shadow:none; border:1px solid var(--line)">';
    html += "<div><b>🎯 Best day:</b> " + (best ? dayLbl(best.d) + " — " + Math.round(best.k) + " kcal" : "—") + "</div>";
    html += '<div style="margin-top:6px"><b>📉 Furthest off:</b> ' +
      (worst ? dayLbl(worst.d) + " — " + Math.round(worst.k) + " kcal" : "—") + "</div>";
    html += "</div>";
    host.innerHTML = html;

    function stat(v, l) {
      return '<div class="stat"><b>' + v + "</b><span>" + l + "</span></div>";
    }
  };
})();
