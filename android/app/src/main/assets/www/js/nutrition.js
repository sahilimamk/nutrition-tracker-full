"use strict";
/* nutrition.js — calorie/macro math shared by diary, ring, and weekly report. */
(function () {
  var NT = (window.NT = window.NT || {});

  // Totals for one day: eaten macros + burned exercise calories.
  NT.totals = function (dateStr) {
    var d = NT.day(dateStr);
    var k = 0, p = 0, c = 0, f = 0;
    var keys = Object.keys(d.meals);
    for (var i = 0; i < keys.length; i++) {
      var items = d.meals[keys[i]];
      for (var j = 0; j < items.length; j++) {
        var e = items[j];
        k += e.kcal; p += e.p; c += e.c; f += e.f;
      }
    }
    var burn = 0;
    for (var x = 0; x < d.exercise.length; x++) burn += d.exercise[x].kcal || 0;
    return { k: k, p: p, c: c, f: f, burn: burn, net: k - burn };
  };

  // Does a day have any food logged at all? (used by streak counter)
  NT.dayHasFood = function (dateStr) {
    var d = NT.day(dateStr);
    var keys = Object.keys(d.meals);
    for (var i = 0; i < keys.length; i++) {
      if (d.meals[keys[i]].length) return true;
    }
    return false;
  };
})();
