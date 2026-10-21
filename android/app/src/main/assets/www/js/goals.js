"use strict";
/* goals.js — Settings screen: manual goal editing, data export/wipe,
   and re-running the onboarding wizard. Ported 1:1 from the original. */
(function () {
  var NT = (window.NT = window.NT || {});

  NT.loadSettings = function () {
    var s = NT.S.settings;
    document.getElementById("sCal").value = s.calGoal;
    document.getElementById("sP").value = s.proteinGoal;
    document.getElementById("sC").value = s.carbGoal;
    document.getElementById("sF").value = s.fatGoal;
    document.getElementById("sW").value = s.waterGoal;
  };

  function init() {
    document.getElementById("sSave").onclick = function () {
      var g = function (id) { return parseFloat(document.getElementById(id).value) || 0; };
      NT.S.settings = {
        calGoal: g("sCal") || 2000,
        proteinGoal: g("sP"), carbGoal: g("sC"), fatGoal: g("sF"),
        waterGoal: g("sW") || 3000,
      };
      NT.save(); NT.render();
      NT.toast("Goals saved ✓");
    };
    // NEW: re-run the wizard any time.
    document.getElementById("obRerun").onclick = function () { NT.openOnboarding(); };
    document.getElementById("exportBtn").onclick = function () {
      var blob = new Blob([JSON.stringify(NT.S, null, 1)], { type: "application/json" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "nutrition-tracker-backup.json";
      a.click();
    };
    document.getElementById("wipeBtn").onclick = function () {
      if (confirm("Delete ALL diary, weight and food data on this device?")) {
        NT.wipeAll();
        NT.loadSettings();
        NT.render();
        NT.toast("Wiped clean");
      }
    };
  }

  init();
})();
