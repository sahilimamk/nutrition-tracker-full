"use strict";
/* foods.js — the "Add food" bottom sheet:
   Search (Open Food Facts) · Barcode (camera + manual) · Quick add ·
   My foods · Templates (NEW) · serving-size confirm step.
   Logic is ported 1:1 from the original app. */
(function () {
  var NT = (window.NT = window.NT || {});
  var sheet = null;
  var pendingFood = null;
  var scanStream = null;
  var scanOn = false;

  NT._sheetMeal = "breakfast";

  function init() {
    sheet = document.getElementById("foodSheet");
    document.querySelectorAll("[data-ftab]").forEach(function (b) {
      b.onclick = function () { NT.showFTab(b.dataset.ftab); };
    });
    sheet.querySelectorAll("[data-close]").forEach(function (b) {
      b.onclick = function () { sheet.classList.remove("on"); NT.stopCam(); };
    });

    document.getElementById("fGo").onclick = doSearch;
    document.getElementById("fq").addEventListener("keydown", function (e) {
      if (e.key === "Enter") document.getElementById("fGo").click();
    });

    document.getElementById("qQty").addEventListener("input", updConfirm);
    document.getElementById("qMinus").onclick = function () {
      var i = document.getElementById("qQty");
      i.value = Math.max(0, (parseFloat(i.value) || 0) - 10);
      updConfirm();
    };
    document.getElementById("qPlus").onclick = function () {
      var i = document.getElementById("qQty");
      i.value = (parseFloat(i.value) || 0) + 10;
      updConfirm();
    };
    document.getElementById("cfBack").onclick = function () {
      document.getElementById("ft-confirm").classList.add("hidden");
      NT.showFTab("search");
    };
    document.getElementById("cfStar").onclick = starFood;
    document.getElementById("cfAdd").onclick = addConfirmed;
    document.getElementById("qAdd").onclick = quickAdd;
    document.getElementById("bcGo").onclick = barcodeLookup;
    document.getElementById("camStart").onclick = startCam;
    document.getElementById("camStop").onclick = NT.stopCam;
  }

  NT.showFTab = function (t) {
    document.querySelectorAll("[data-ftab]").forEach(function (b) {
      b.classList.toggle("on", b.dataset.ftab === t);
    });
    var ids = ["search", "barcode", "quick", "mine", "templates"];
    for (var i = 0; i < ids.length; i++)
      document.getElementById("ft-" + ids[i]).classList.toggle("hidden", ids[i] !== t);
    document.getElementById("ft-confirm").classList.add("hidden");
    if (t !== "barcode") NT.stopCam();
    if (t === "mine") renderMine();
    if (t === "templates") NT.renderTemplates();
  };

  /* ---------- Open Food Facts ---------- */
  function offSearch(q) {
    var url = "https://world.openfoodfacts.org/cgi/search.pl?search_terms=" +
      encodeURIComponent(q) + "&search_simple=1&action=process&json=1&page_size=20";
    return fetch(url).then(function (r) { return r.json(); }).then(function (j) {
      return (j.products || []).filter(function (p) { return p.product_name; });
    });
  }
  function parseServing(s) {
    if (!s) return null;
    var m = String(s).match(/([\d.]+)\s*(g|ml)/i);
    return m ? parseFloat(m[1]) : null;
  }
  function offNutri(p) {
    var n = p.nutriments || {};
    var kcal = n["energy-kcal_100g"];
    if (kcal == null && n.energy_100g != null) kcal = n.energy_100g / 4.184;
    return {
      kcal: +(kcal || 0), p: +(n.proteins_100g || 0),
      c: +(n.carbohydrates_100g || 0), f: +(n.fat_100g || 0),
      serving: parseServing(p.serving_size),
    };
  }
  function offFood(p) {
    var nt = offNutri(p);
    return {
      name: p.product_name,
      brand: (p.brands || "").split(",")[0],
      per100: { kcal: nt.kcal, p: nt.p, c: nt.c, f: nt.f },
      defQty: nt.serving || 100,
      unit: "g",
      barcode: p.code || "",
    };
  }
  function offBarcode(code) {
    return fetch(
      "https://world.openfoodfacts.org/api/v2/product/" + encodeURIComponent(code) +
      "?fields=product_name,brands,nutriments,serving_size,code"
    )
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j.status !== 1 || !j.product || !j.product.product_name) return null;
        return offFood(j.product);
      });
  }

  function doSearch() {
    var q = document.getElementById("fq").value.trim();
    if (!q) return;
    var box = document.getElementById("fRes");
    box.innerHTML = '<div class="empty">Searching…</div>';
    offSearch(q).then(function (ps) {
      if (!ps.length) {
        box.innerHTML = '<div class="empty">No results. Try “Quick add”.</div>';
        return;
      }
      box.innerHTML = "";
      ps.slice(0, 15).forEach(function (p) {
        var f = offFood(p);
        var row = document.createElement("div");
        row.className = "sres";
        row.innerHTML =
          '<div class="nm"><b>' + NT.esc(f.name) + '</b><span>' + NT.esc(f.brand || "") +
          " · " + Math.round(f.per100.kcal) + " kcal/100g</span></div>" +
          '<span class="go">›</span>';
        row.onclick = function () { NT.confirmFood(f); };
        box.appendChild(row);
      });
    }).catch(function () {
      box.innerHTML = '<div class="empty">Search failed — check connection.</div>';
    });
  }

  function barcodeLookup() {
    var code = document.getElementById("bcInput").value.trim();
    if (!code) return;
    var box = document.getElementById("bcRes");
    box.innerHTML = '<div class="empty">Looking up…</div>';
    offBarcode(code).then(function (f) {
      if (!f) {
        box.innerHTML = '<div class="empty">Not found. Try Quick add.</div>';
        return;
      }
      box.innerHTML = "";
      NT.confirmFood(f);
    }).catch(function () {
      box.innerHTML = '<div class="empty">Lookup failed — check connection.</div>';
    });
  }

  /* ---------- serving confirm ---------- */
  NT.confirmFood = function (f) {
    pendingFood = f;
    var ids = ["search", "barcode", "quick", "mine", "templates"];
    for (var i = 0; i < ids.length; i++)
      document.getElementById("ft-" + ids[i]).classList.add("hidden");
    document.getElementById("ft-confirm").classList.remove("hidden");
    document.getElementById("cfName").textContent = f.name;
    document.getElementById("cfBrand").textContent = f.brand || "";
    document.getElementById("qQty").value = f.defQty || 100;
    document.getElementById("qUnit").textContent = f.unit || "g";
    updConfirm();
  };

  function updConfirm() {
    var f = pendingFood;
    if (!f) return;
    var q = parseFloat(document.getElementById("qQty").value) || 0;
    var m = q / 100;
    document.getElementById("cfK").textContent = Math.round(f.per100.kcal * m);
    document.getElementById("cfP").textContent = (f.per100.p * m).toFixed(1);
    document.getElementById("cfC").textContent = (f.per100.c * m).toFixed(1);
    document.getElementById("cfF").textContent = (f.per100.f * m).toFixed(1);
  }

  function starFood() {
    if (!pendingFood) return;
    var dup = NT.S.myFoods.some(function (x) {
      return x.name === pendingFood.name && x.brand === pendingFood.brand;
    });
    if (!dup) {
      NT.S.myFoods.push({
        name: pendingFood.name, brand: pendingFood.brand,
        per100: pendingFood.per100, defQty: pendingFood.defQty, unit: pendingFood.unit,
      });
      NT.save();
      NT.toast("Saved to My foods ⭐");
    } else {
      NT.toast("Already in My foods");
    }
  }

  function addConfirmed() {
    var f = pendingFood;
    if (!f) return;
    var q = parseFloat(document.getElementById("qQty").value) || 0, m = q / 100;
    NT.day().meals[NT._sheetMeal].push({
      id: NT.uid(), name: f.name, brand: f.brand,
      detail: q + " " + (f.unit || "g") + (f.brand ? " · " + f.brand : ""),
      kcal: f.per100.kcal * m, p: f.per100.p * m, c: f.per100.c * m, f: f.per100.f * m,
    });
    NT.save(); NT.render();
    sheet.classList.remove("on");
    NT.stopCam();
    NT.toast("Added ✓");
  }

  function renderMine() {
    var box = document.getElementById("mineList");
    box.innerHTML = "";
    if (!NT.S.myFoods.length) {
      box.innerHTML = '<div class="empty">Save foods with ⭐ when adding them.</div>';
      return;
    }
    NT.S.myFoods.forEach(function (f) {
      var row = document.createElement("div");
      row.className = "sres";
      row.innerHTML =
        '<div class="nm"><b>' + NT.esc(f.name) + '</b><span>' + NT.esc(f.brand || "") +
        " · " + Math.round(f.per100.kcal) + " kcal/100g</span></div>" +
        '<span class="go">›</span>';
      row.onclick = function () { NT.confirmFood(f); };
      box.appendChild(row);
    });
  }

  function quickAdd() {
    var name = document.getElementById("qName").value.trim() || "Quick add";
    var kcal = parseFloat(document.getElementById("qKcal").value) || 0;
    NT.day().meals[NT._sheetMeal].push({
      id: NT.uid(), name: name, detail: "quick entry", kcal: kcal,
      p: parseFloat(document.getElementById("qP").value) || 0,
      c: parseFloat(document.getElementById("qC").value) || 0,
      f: parseFloat(document.getElementById("qF").value) || 0,
    });
    NT.save(); NT.render();
    sheet.classList.remove("on");
    NT.toast("Added ✓");
  }

  /* ---------- NEW: meal templates ---------- */
  NT.saveMealTemplate = function (mealKey) {
    var items = NT.day().meals[mealKey] || [];
    if (!items.length) { NT.toast("Nothing in this meal to save"); return; }
    var label = NT.MEALS.find(function (x) { return x[0] === mealKey; })[1];
    var name = prompt("Name this template:", label + " (" + items.length + " items)");
    if (name == null) return;
    name = name.trim() || ("Template " + (NT.S.templates.length + 1));
    NT.S.templates.push({
      id: NT.uid(),
      name: name,
      items: items.map(function (e) {
        return { name: e.name, detail: e.detail, kcal: e.kcal, p: e.p, c: e.c, f: e.f };
      }),
    });
    NT.save();
    NT.toast("Template saved 📋");
  };

  NT.renderTemplates = function () {
    var box = document.getElementById("tplList");
    if (!box) return;
    box.innerHTML = "";
    if (!NT.S.templates.length) {
      box.innerHTML = '<div class="empty">No templates yet.<br>Tap 📋 on any meal to save it as a template.</div>';
      return;
    }
    NT.S.templates.forEach(function (t) {
      var kcal = t.items.reduce(function (a, e) { return a + e.kcal; }, 0);
      var row = document.createElement("div");
      row.className = "trow";
      row.innerHTML =
        '<div class="nm"><b>' + NT.esc(t.name) + '</b><span>' +
        t.items.length + " items · " + Math.round(kcal) + " kcal</span></div>";
      var addB = document.createElement("button");
      addB.className = "add-btn";
      addB.textContent = "+ Add";
      addB.onclick = function (ev) {
        ev.stopPropagation();
        NT.applyTemplate(t.id);
      };
      var delB = document.createElement("button");
      delB.className = "icon-btn";
      delB.textContent = "✕";
      delB.onclick = function (ev) {
        ev.stopPropagation();
        NT.S.templates = NT.S.templates.filter(function (x) { return x.id !== t.id; });
        NT.save(); NT.renderTemplates();
      };
      var tools = document.createElement("span");
      tools.className = "meal-tools";
      tools.appendChild(addB); tools.appendChild(delB);
      row.appendChild(tools);
      row.onclick = function () { NT.applyTemplate(t.id); };
      box.appendChild(row);
    });
  };

  NT.applyTemplate = function (tid) {
    var t = NT.S.templates.find(function (x) { return x.id === tid; });
    if (!t) return;
    var meal = NT.day().meals[NT._sheetMeal];
    t.items.forEach(function (e) {
      meal.push({ id: NT.uid(), name: e.name, detail: e.detail, kcal: e.kcal, p: e.p, c: e.c, f: e.f });
    });
    NT.save(); NT.render();
    sheet.classList.remove("on");
    NT.toast("Template added ✓");
  };

  /* ---------- camera barcode scan ---------- */
  function startCam() {
    var wrap = document.getElementById("camwrap"), video = document.getElementById("cam");
    if (!("BarcodeDetector" in window)) {
      NT.toast("Camera scan not supported — type the barcode");
      return;
    }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(function (stream) {
      scanStream = stream;
      video.srcObject = scanStream;
      return video.play();
    }).then(function () {
      wrap.classList.add("on");
      document.getElementById("camStart").classList.add("hidden");
      document.getElementById("camStop").classList.remove("hidden");
      var det = new BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"] });
      scanOn = true;
      var loop = function () {
        if (!scanOn) return;
        det.detect(video).then(function (codes) {
          if (codes && codes.length) {
            document.getElementById("bcInput").value = codes[0].rawValue;
            NT.stopCam();
            document.getElementById("bcGo").click();
            return;
          }
          setTimeout(loop, 400);
        }).catch(function () { setTimeout(loop, 400); });
      };
      loop();
    }).catch(function () {
      NT.toast("Camera blocked — allow camera access or type the barcode");
    });
  }

  NT.stopCam = function () {
    scanOn = false;
    if (scanStream) {
      scanStream.getTracks().forEach(function (t) { t.stop(); });
      scanStream = null;
    }
    var wrap = document.getElementById("camwrap");
    if (wrap) wrap.classList.remove("on");
    var s = document.getElementById("camStart"), e = document.getElementById("camStop");
    if (s) s.classList.remove("hidden");
    if (e) e.classList.add("hidden");
  };

  // Wire up once the DOM is ready (script loads at end of body).
  init();
})();
