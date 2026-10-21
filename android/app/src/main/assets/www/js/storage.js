"use strict";
/* storage.js — localStorage state, defaults, and tiny utilities.
   Single source of truth for the whole app. Same LS_KEY as the original
   single-file app, so existing user data carries over untouched. */
(function () {
  var NT = (window.NT = window.NT || {});

  NT.LS_KEY = "nt_local_v1";

  NT.MEALS = [
    ["breakfast", "🍳 Breakfast"],
    ["lunch", "🍱 Lunch"],
    ["dinner", "🍽️ Dinner"],
    ["snacks", "🍿 Snacks"],
  ];

  NT.DEF = {
    settings: { calGoal: 2000, proteinGoal: 160, carbGoal: 195, fatGoal: 65, waterGoal: 3000 },
    days: {},
    weights: [],
    myFoods: [],
    templates: [],      // NEW: saved meal templates [{id,name,items:[...]}]
    onboarded: false,   // NEW: onboarding wizard completed/skipped
    profile: null,       // NEW: {age,sex,heightCm,weightKg,activity,goalAdj} from onboarding
  };

  var S;
  try {
    S = JSON.parse(localStorage.getItem(NT.LS_KEY)) || structuredClone(NT.DEF);
  } catch (e) {
    S = structuredClone(NT.DEF);
  }
  // Merge defaults so old saved data gains new fields without a migration.
  S.settings = Object.assign({}, NT.DEF.settings, S.settings || {});
  if (!Array.isArray(S.weights)) S.weights = [];
  if (!Array.isArray(S.myFoods)) S.myFoods = [];
  if (!Array.isArray(S.templates)) S.templates = [];
  if (!S.days || typeof S.days !== "object") S.days = {};
  NT.S = S;

  NT.save = function () {
    try {
      localStorage.setItem(NT.LS_KEY, JSON.stringify(NT.S));
    } catch (e) {
      NT.toast("Storage full — oldest data kept");
    }
  };

  NT.wipeAll = function () {
    localStorage.removeItem(NT.LS_KEY);
    NT.S = structuredClone(NT.DEF);
    NT.save();
  };

  NT.todayStr = function (d) {
    d = d || new Date();
    return (
      d.getFullYear() +
      "-" +
      String(d.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(d.getDate()).padStart(2, "0")
    );
  };

  NT.addDays = function (dateStr, n) {
    var d = new Date(dateStr + "T12:00");
    d.setDate(d.getDate() + n);
    return NT.todayStr(d);
  };

  // Currently viewed date (defaults to today). Mutable: NT.curDate = "...".
  NT.curDate = NT.todayStr();

  NT.day = function (dateStr) {
    var key = dateStr || NT.curDate;
    if (!NT.S.days[key])
      NT.S.days[key] = { meals: { breakfast: [], lunch: [], dinner: [], snacks: [] }, water: 0, exercise: [] };
    return NT.S.days[key];
  };

  NT.uid = function () {
    return "e" + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
  };

  NT.toast = function (m) {
    var t = document.getElementById("toast");
    t.textContent = m;
    t.classList.add("on");
    clearTimeout(t._h);
    t._h = setTimeout(function () { t.classList.remove("on"); }, 2200);
  };

  NT.esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
})();
