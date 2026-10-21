"use strict";
/* app.js — boot, bottom-nav, date navigation, and the master render()
   that refreshes every screen section. */
(function () {
  var NT = (window.NT = window.NT || {});

  NT.render = function () {
    NT.renderDiary();
    NT.renderWater();
    NT.renderExercise();
    NT.renderWeight();
    NT.renderStreak();
    NT.renderReport();
  };

  function init() {
    // Bottom navigation
    document.querySelectorAll("nav.bottom button").forEach(function (b) {
      b.onclick = function () {
        document.querySelectorAll("nav.bottom button").forEach(function (x) {
          x.classList.remove("on");
        });
        b.classList.add("on");
        document.querySelectorAll(".screen").forEach(function (s) {
          s.classList.remove("on");
        });
        document.getElementById(b.dataset.scr).classList.add("on");
        window.scrollTo(0, 0);
        // Redraw the chart when the weight tab becomes visible (canvas needs layout).
        if (b.dataset.scr === "scr-weight") NT.drawWeightChart("wChart");
      };
    });

    // Date navigation (cannot go past today)
    document.getElementById("dPrev").onclick = function () {
      NT.curDate = NT.addDays(NT.curDate, -1);
      NT.render();
    };
    document.getElementById("dNext").onclick = function () {
      var next = NT.addDays(NT.curDate, 1);
      if (next <= NT.todayStr()) { NT.curDate = next; NT.render(); }
    };

    NT.loadSettings();
    NT.render();
    NT.maybeOnboarding();

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    }
  }

  init();
})();
