"use strict";
/* exercise.js — exercise log on the diary screen. Ported 1:1 from the original.
   Burned calories feed the calorie ring via NT.totals().net. */
(function () {
  var NT = (window.NT = window.NT || {});

  NT.renderExercise = function () {
    var d = NT.day();
    var exl = document.getElementById("exList");
    exl.innerHTML = "";
    if (!d.exercise.length) {
      exl.innerHTML = '<div class="empty">No exercise logged today.</div>';
      return;
    }
    d.exercise.forEach(function (x) {
      var row = document.createElement("div");
      row.className = "entry";
      row.innerHTML =
        '<div class="en"><b>' + NT.esc(x.name) + "</b><span>" + x.min + " min</span></div>" +
        '<span class="ek">−' + Math.round(x.kcal) + " kcal</span>";
      var del = document.createElement("button");
      del.className = "icon-btn";
      del.textContent = "✕";
      del.onclick = function () {
        d.exercise = d.exercise.filter(function (y) { return y.id !== x.id; });
        NT.save(); NT.render();
      };
      row.appendChild(del);
      exl.appendChild(row);
    });
  };

  function init() {
    document.getElementById("exAdd").onclick = function () {
      document.getElementById("exSheet").classList.add("on");
    };
    document.getElementById("exSheet").querySelectorAll("[data-close]").forEach(function (b) {
      b.onclick = function () { document.getElementById("exSheet").classList.remove("on"); };
    });
    document.getElementById("exSave").onclick = function () {
      var name = document.getElementById("exName").value.trim() || "Exercise";
      NT.day().exercise.push({
        id: NT.uid(),
        name: name,
        min: parseFloat(document.getElementById("exMin").value) || 0,
        kcal: parseFloat(document.getElementById("exKcal").value) || 0,
      });
      NT.save(); NT.render();
      document.getElementById("exSheet").classList.remove("on");
      NT.toast("Logged ✓");
    };
  }

  init();
})();
