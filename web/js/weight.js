"use strict";
/* weight.js — weigh-in logging + history list + trend chart.
   History list is ported 1:1; the chart is NEW (see charts.js). */
(function () {
  var NT = (window.NT = window.NT || {});

  NT.renderWeight = function () {
    var h = document.getElementById("wHist");
    h.innerHTML = "";
    var ws = NT.S.weights.slice().reverse();
    if (!ws.length) {
      h.innerHTML = '<div class="empty">No weigh-ins yet.</div>';
    } else {
      ws.slice(0, 30).forEach(function (w) {
        var row = document.createElement("div");
        row.innerHTML = "<span>" + w.d + "</span><b>" + w.kg + " kg</b>";
        h.appendChild(row);
      });
    }
    // NEW: redraw the trend chart every render.
    NT.drawWeightChart("wChart");
  };

  function init() {
    document.getElementById("wAdd").onclick = function () {
      var kg = parseFloat(document.getElementById("wInput").value);
      if (!kg) return;
      NT.S.weights = NT.S.weights.filter(function (w) { return w.d !== NT.curDate; });
      NT.S.weights.push({ d: NT.curDate, kg: kg });
      NT.S.weights.sort(function (a, b) { return a.d < b.d ? -1 : 1; });
      document.getElementById("wInput").value = "";
      NT.save();
      NT.renderWeight();
      NT.toast("Weighed in ✓");
    };
  }

  init();
})();
