"use strict";
/* diary.js — diary screen: calorie ring, macro bars, meal cards, date navigation.
   Behavior matches the original app; the ring now uses NET calories
   (eaten − exercise) so logged workouts visibly open up budget. */
(function () {
  var NT = (window.NT = window.NT || {});
  var RING_C = 251.3;

  NT.renderDiary = function () {
    var st = NT.S.settings, t = NT.totals(), d = NT.day();

    document.getElementById("calGoalV").textContent = st.calGoal;
    document.getElementById("calEaten").textContent = Math.round(t.k);
    document.getElementById("calBurned").textContent = Math.round(t.burn);

    var left = Math.round(st.calGoal - t.net);
    document.getElementById("calLeft").textContent = left;

    // Ring shows net calories against the goal (exercise earns budget back).
    var frac = Math.max(0, Math.min(1, t.net / Math.max(1, st.calGoal)));
    var ring = document.getElementById("ringFg");
    ring.style.strokeDashoffset = RING_C * (1 - frac);
    ring.style.stroke = left < 0 ? "#e05252" : "#43a047";

    var bars = [["p", t.p, st.proteinGoal], ["c", t.c, st.carbGoal], ["f", t.f, st.fatGoal]];
    for (var i = 0; i < bars.length; i++) {
      var b = bars[i];
      document.getElementById(b[0] + "Lbl").textContent = Math.round(b[1]) + " / " + b[2] + "g";
      document.getElementById(b[0] + "Bar").style.width = Math.min(100, (b[1] / Math.max(1, b[2])) * 100) + "%";
    }

    // Meals
    var mh = document.getElementById("meals");
    mh.innerHTML = "";
    for (var m = 0; m < NT.MEALS.length; m++) {
      (function (key, label) {
        var items = d.meals[key] || [];
        var kc = items.reduce(function (a, e) { return a + e.kcal; }, 0);
        var card = document.createElement("div");
        card.className = "card";
        card.innerHTML =
          '<div class="meal-head"><h3>' + label + '</h3>' +
          '<span class="meal-tools"><span class="kcal">' + Math.round(kc) + ' kcal</span> ' +
          '<button class="icon-btn" data-tpl="' + key + '" title="Save as template">📋</button>' +
          '<button class="add-btn" data-meal="' + key + '">+ Add</button></span></div>' +
          '<div class="elist"></div>';
        var el = card.querySelector(".elist");
        if (!items.length) el.innerHTML = '<div class="empty">Nothing logged.</div>';
        for (var j = 0; j < items.length; j++) {
          (function (e) {
            var row = document.createElement("div");
            row.className = "entry";
            row.innerHTML =
              '<div class="en"><b>' + NT.esc(e.name) + '</b><span>' + NT.esc(e.detail || "") + '</span></div>' +
              '<span class="ek">' + Math.round(e.kcal) + ' kcal</span>';
            var del = document.createElement("button");
            del.className = "icon-btn";
            del.textContent = "✕";
            del.onclick = function () {
              d.meals[key] = d.meals[key].filter(function (x) { return x.id !== e.id; });
              NT.save(); NT.render();
            };
            row.appendChild(del);
            el.appendChild(row);
          })(items[j]);
        }
        mh.appendChild(card);
      })(NT.MEALS[m][0], NT.MEALS[m][1]);
    }
    mh.querySelectorAll("[data-meal]").forEach(function (b) {
      b.onclick = function () { NT.openFoodSheet(b.dataset.meal); };
    });
    mh.querySelectorAll("[data-tpl]").forEach(function (b) {
      b.onclick = function () { NT.saveMealTemplate(b.dataset.tpl); };
    });

    NT.renderDateLabel();
  };

  NT.renderDateLabel = function () {
    var t = NT.todayStr();
    var y = new Date(); y.setDate(y.getDate() - 1);
    var ys = NT.todayStr(y);
    document.getElementById("dLabel").textContent =
      NT.curDate === t ? "Today"
      : NT.curDate === ys ? "Yesterday"
      : NT.curDate.slice(8) + "/" + NT.curDate.slice(5, 7);
  };

  // Add-food sheet entry point (the sheet itself lives in foods.js).
  NT.openFoodSheet = function (meal) {
    NT.showFTab("search");
    document.getElementById("foodSheet").classList.add("on");
    document.getElementById("fsMeal").textContent =
      "· " + NT.MEALS.find(function (x) { return x[0] === meal; })[1];
    // foods.js owns the current-meal state:
    NT._sheetMeal = meal;
    NT.renderTemplates();
  };
})();
