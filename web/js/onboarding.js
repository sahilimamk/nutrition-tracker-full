"use strict";
/* onboarding.js — NEW: first-launch wizard.
   Collects age/sex/height/weight/activity/goal, computes TDEE via
   Mifflin-St Jeor, and sets calorie + macro targets automatically.
   Skippable, and re-runnable any time from Settings. */
(function () {
  var NT = (window.NT = window.NT || {});

  var ACTIVITIES = [
    { v: 1.2, label: "Sedentary", sub: "desk job, little exercise" },
    { v: 1.375, label: "Lightly active", sub: "light exercise 1–3 days/wk" },
    { v: 1.55, label: "Moderately active", sub: "exercise 3–5 days/wk" },
    { v: 1.725, label: "Very active", sub: "hard exercise 6–7 days/wk" },
  ];
  var GOALS = [
    { adj: -500, label: "Lose ~0.5 kg/wk", sub: "steady fat loss" },
    { adj: -250, label: "Lose ~0.25 kg/wk", sub: "slow & easy" },
    { adj: 0, label: "Maintain weight", sub: "eat at balance" },
    { adj: 250, label: "Gain ~0.25 kg/wk", sub: "lean bulk" },
    { adj: 500, label: "Gain ~0.5 kg/wk", sub: "faster bulk" },
  ];

  var step = 0;
  var draft = { age: "", sex: "male", heightCm: "", weightKg: "", activity: 1.55, goalAdj: -500 };

  function $(id) { return document.getElementById(id); }

  NT.openOnboarding = function () {
    step = 0;
    if (NT.S.profile) {
      var p = NT.S.profile;
      draft = { age: p.age || "", sex: p.sex || "male", heightCm: p.heightCm || "",
                weightKg: p.weightKg || "", activity: p.activity || 1.55, goalAdj: p.goalAdj != null ? p.goalAdj : -500 };
    }
    $("obSheet").classList.add("on");
    renderStep();
  };

  NT.maybeOnboarding = function () {
    if (!NT.S.onboarded) NT.openOnboarding();
  };

  function renderStep() {
    var dots = "";
    for (var i = 0; i < 3; i++) dots += '<i class="' + (i <= step ? "on" : "") + '"></i>';
    $("obSteps").innerHTML = dots;
    var body = $("obBody");
    if (step === 0) {
      body.innerHTML =
        "<h2 style='margin:0 0 4px'>About you</h2>" +
        '<div class="mut">Used only to calculate your calorie target. Stays on this device.</div>' +
        '<label class="fl">Age</label><input id="obAge" type="number" inputmode="numeric" placeholder="e.g. 21" value="' + draft.age + '">' +
        '<label class="fl">Biological sex</label><div class="seg" id="obSex">' +
        segBtn("male", "Male", draft.sex === "male") + segBtn("female", "Female", draft.sex === "female") + "</div>" +
        '<label class="fl">Height (cm)</label><input id="obH" type="number" inputmode="decimal" placeholder="e.g. 183" value="' + draft.heightCm + '">' +
        '<label class="fl">Current weight (kg)</label><input id="obW" type="number" inputmode="decimal" placeholder="e.g. 82.9" value="' + draft.weightKg + '">';
      $("obSex").querySelectorAll("button").forEach(function (b) {
        b.onclick = function () {
          draft.sex = b.dataset.v;
          $("obSex").querySelectorAll("button").forEach(function (x) {
            x.classList.toggle("on", x === b);
          });
        };
      });
    } else if (step === 1) {
      var h = "<h2 style='margin:0 0 4px'>How active are you?</h2><div class='seg' id='obAct' style='flex-direction:column'>";
      ACTIVITIES.forEach(function (a) {
        h += '<button data-v="' + a.v + '" class="' + (draft.activity === a.v ? "on" : "") + '" style="flex:1">' +
          a.label + "<small>" + a.sub + "</small></button>";
      });
      body.innerHTML = h + "</div>";
      $("obAct").querySelectorAll("button").forEach(function (b) {
        b.onclick = function () {
          draft.activity = parseFloat(b.dataset.v);
          $("obAct").querySelectorAll("button").forEach(function (x) {
            x.classList.toggle("on", x === b);
          });
        };
      });
    } else {
      var g = "<h2 style='margin:0 0 4px'>Your goal</h2><div class='seg' id='obGoal' style='flex-direction:column'>";
      GOALS.forEach(function (o) {
        g += '<button data-v="' + o.adj + '" class="' + (draft.goalAdj === o.adj ? "on" : "") + '" style="flex:1">' +
          o.label + "<small>" + o.sub + "</small></button>";
      });
      body.innerHTML = g + "</div>";
      $("obGoal").querySelectorAll("button").forEach(function (b) {
        b.onclick = function () {
          draft.goalAdj = parseInt(b.dataset.v, 10);
          $("obGoal").querySelectorAll("button").forEach(function (x) {
            x.classList.toggle("on", x === b);
          });
        };
      });
    }
    $("obBack").style.visibility = step === 0 ? "hidden" : "visible";
    $("obNext").textContent = step === 2 ? "Calculate my targets ✓" : "Next →";
  }

  function segBtn(v, label, on) {
    return '<button data-v="' + v + '" class="' + (on ? "on" : "") + '">' + label + "</button>";
  }

  function collectStep0() {
    draft.age = parseInt($("obAge").value, 10) || 0;
    draft.heightCm = parseFloat($("obH").value) || 0;
    draft.weightKg = parseFloat($("obW").value) || 0;
    if (!draft.age || !draft.heightCm || !draft.weightKg) {
      NT.toast("Please fill age, height and weight");
      return false;
    }
    return true;
  }

  // Mifflin-St Jeor → TDEE → calorie & macro targets.
  NT.calcTargets = function (p) {
    var bmr = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + (p.sex === "male" ? 5 : -161);
    var tdee = bmr * p.activity;
    var cal = Math.round(tdee + p.goalAdj);
    var protein = Math.round(2.0 * p.weightKg);          // ~2 g/kg (muscle-preserving)
    var fat = Math.round((0.25 * cal) / 9);             // 25% of calories from fat
    var carbs = Math.max(0, Math.round((cal - protein * 4 - fat * 9) / 4));
    return { calGoal: cal, proteinGoal: protein, carbGoal: carbs, fatGoal: fat };
  };

  function finish() {
    var t = NT.calcTargets(draft);
    NT.S.settings.calGoal = t.calGoal;
    NT.S.settings.proteinGoal = t.proteinGoal;
    NT.S.settings.carbGoal = t.carbGoal;
    NT.S.settings.fatGoal = t.fatGoal;
    NT.S.profile = {
      age: draft.age, sex: draft.sex, heightCm: draft.heightCm,
      weightKg: draft.weightKg, activity: draft.activity, goalAdj: draft.goalAdj,
    };
    NT.S.onboarded = true;
    NT.save();
    $("obSheet").classList.remove("on");
    NT.loadSettings();
    NT.render();
    NT.toast("Targets set: " + t.calGoal + " kcal · " + t.proteinGoal + "g protein ✓");
  }

  function init() {
    $("obNext").onclick = function () {
      if (step === 0 && !collectStep0()) return;
      if (step < 2) { step++; renderStep(); }
      else finish();
    };
    $("obBack").onclick = function () {
      if (step > 0) { step--; renderStep(); }
    };
    $("obSkip").onclick = function () {
      NT.S.onboarded = true;
      NT.save();
      $("obSheet").classList.remove("on");
      NT.toast("Skipped — set goals in Settings anytime");
    };
  }

  init();
})();
