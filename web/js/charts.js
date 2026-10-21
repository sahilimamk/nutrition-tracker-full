"use strict";
/* charts.js — vanilla-canvas charts. No libraries.
   drawWeightChart: last 30 weigh-ins (dots) + 7-day moving average (green line). */
(function () {
  var NT = (window.NT = window.NT || {});

  function movingAvg(pts, win) {
    return pts.map(function (_, i) {
      var s = Math.max(0, i - win + 1), sum = 0, n = 0;
      for (var j = s; j <= i; j++) { sum += pts[j].kg; n++; }
      return sum / n;
    });
  }

  NT.drawWeightChart = function (canvasId) {
    var cv = document.getElementById(canvasId);
    if (!cv) return;
    var ctx = cv.getContext("2d");
    var dpr = window.devicePixelRatio || 1;
    var W = cv.clientWidth, H = cv.clientHeight;
    if (!W || !H) return;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    var pts = NT.S.weights.slice().sort(function (a, b) { return a.d < b.d ? -1 : 1; }).slice(-30);
    if (pts.length < 2) {
      ctx.fillStyle = "#7a8494";
      ctx.font = "13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Log at least 2 weigh-ins to see your trend", W / 2, H / 2);
      return;
    }

    var padL = 40, padR = 10, padT = 12, padB = 22;
    var min = Infinity, max = -Infinity;
    pts.forEach(function (p) { if (p.kg < min) min = p.kg; if (p.kg > max) max = p.kg; });
    var span = Math.max(1, max - min);
    min -= span * 0.15; max += span * 0.15;

    function X(i) { return padL + (i / (pts.length - 1)) * (W - padL - padR); }
    function Y(v) { return padT + (1 - (v - min) / (max - min)) * (H - padT - padB); }

    // Gridlines + y labels
    ctx.strokeStyle = "#eef1f4"; ctx.fillStyle = "#7a8494";
    ctx.font = "10px sans-serif"; ctx.textAlign = "right";
    for (var g = 0; g <= 3; g++) {
      var v = min + ((max - min) * g) / 3, yy = Y(v);
      ctx.beginPath(); ctx.moveTo(padL, yy); ctx.lineTo(W - padR, yy); ctx.stroke();
      ctx.fillText(v.toFixed(1), padL - 6, yy + 3);
    }

    // 7-day moving average
    var ma = movingAvg(pts, 7);
    ctx.strokeStyle = "#43a047"; ctx.lineWidth = 2.5; ctx.beginPath();
    ma.forEach(function (v, i) { i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v)); });
    ctx.stroke();

    // Raw weigh-ins
    ctx.fillStyle = "#4a90d9";
    pts.forEach(function (p, i) {
      ctx.beginPath(); ctx.arc(X(i), Y(p.kg), 3, 0, Math.PI * 2); ctx.fill();
    });

    // x labels: first / middle / last date
    ctx.textAlign = "center";
    ctx.fillText(pts[0].d.slice(5), X(0), H - 6);
    ctx.fillText(pts[pts.length - 1].d.slice(5), X(pts.length - 1), H - 6);
  };
})();
