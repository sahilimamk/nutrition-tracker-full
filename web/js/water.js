"use strict";
/* water.js — water tracker on the diary screen. Ported 1:1 from the original. */
(function () {
  var NT = (window.NT = window.NT || {});

  NT.renderWater = function () {
    var st = NT.S.settings, d = NT.day();
    document.getElementById("waterLbl").textContent = d.water + " / " + st.waterGoal + " ml";
    document.getElementById("waterBar").style.width =
      Math.min(100, (d.water / Math.max(1, st.waterGoal)) * 100) + "%";
  };

  function init() {
    document.querySelectorAll("[data-water]").forEach(function (b) {
      b.onclick = function () {
        NT.day().water += parseInt(b.dataset.water, 10);
        NT.save(); NT.render();
      };
    });
    document.getElementById("waterReset").onclick = function () {
      NT.day().water = 0;
      NT.save(); NT.render();
    };
  }

  init();
})();
