/* ==========================================================================
   POT — Ürün grafikleri
   Gerçekleşen değer (düz beyaz) ve POT tahmini (kesikli lavanta) çizgileri.
   Renkler CSS'ten gelir (.chart__* sınıfları).
   Veriler temsilîdir; deterministik olarak üretilir. Grafik ekrana girince
   soldan sağa çizilir, günlük zirveler violet üçgenlerle işaretlenir.
   ========================================================================== */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var W = 1000, H = 400, PAD = 24;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var uid = 0;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function bump(x, mu, sigma) { return Math.exp(-((x - mu) * (x - mu)) / (2 * sigma * sigma)); }

  // Küçük, tohumlu rastgele sayı üreteci (her açılışta aynı grafik)
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------- Seriler ---------- */

  // Bir haftalık saatlik tüketim: sabah, öğle ve akşam zirveleri, hafta sonu düşüşü
  function loadSeries() {
    var r = mulberry32(7), actual = [], forecast = [], err = 0;
    for (var h = 0; h < 168; h++) {
      var day = Math.floor(h / 24), hr = h % 24;
      var weekend = day >= 5 ? 0.86 : 1;
      var base = 0.5
        + 0.12 * bump(hr, 8.5, 1.8)
        + 0.17 * bump(hr, 12, 3.2)
        + 0.28 * bump(hr, 19.5, 2.4)
        - 0.08 * bump(hr, 4, 2.5);
      base *= weekend * (1 + 0.025 * Math.sin(day * 1.7));
      actual.push(base + (r() - 0.5) * 0.04);
      err = err * 0.8 + (r() - 0.5) * 0.028;
      forecast.push(base + err);
    }
    return {
      actual: actual,
      forecast: forecast,
      period: 24,
      axis: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'],
      axisMode: 'segments'
    };
  }

  // Dört günlük saatlik rüzgâr (RES) üretimi: değişken, dalgalı
  function windSeries() {
    var r = mulberry32(21), actual = [], forecast = [], err = 0;
    for (var h = 0; h < 96; h++) {
      var s = 0.48
        + 0.22 * Math.sin(h / 9.5)
        + 0.14 * Math.sin(h / 4.3 + 1.2)
        + 0.06 * Math.sin(h / 1.9 + 0.4);
      actual.push(clamp(s + (r() - 0.5) * 0.07, 0.04, 0.96));
      err = err * 0.85 + (r() - 0.5) * 0.04;
      forecast.push(clamp(s + err, 0.04, 0.96));
    }
    return {
      actual: actual,
      forecast: forecast,
      period: 24,
      axis: ['00:00', '12:00', '00:00', '12:00', '00:00', '12:00', '00:00', '12:00', '00:00'],
      axisMode: 'edges'
    };
  }

  /* ---------- Çizim ---------- */

  function el(name, attrs) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  function render(container, data) {
    var id = 'chart-clip-' + (++uid);
    var all = data.actual.concat(data.forecast);
    var min = Math.min.apply(null, all), max = Math.max.apply(null, all);
    var span = max - min || 1;
    var n = data.actual.length;

    function X(i) { return (i / (n - 1)) * W; }
    function Y(v) { return PAD + (1 - (v - min) / span) * (H - PAD * 2); }
    function path(series) {
      var d = '';
      for (var i = 0; i < series.length; i++) d += (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(series[i]).toFixed(1);
      return d;
    }

    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': container.getAttribute('data-label') || '' });
    var clipRect = el('rect', { x: 0, y: -20, width: reduceMotion ? W : 0, height: H + 40 });
    var clip = el('clipPath', { id: id });
    clip.appendChild(clipRect);
    var defs = el('defs', {});
    defs.appendChild(clip);
    svg.appendChild(defs);

    // Çok silik yatay kılavuzlar
    for (var g = 1; g <= 3; g++) {
      svg.appendChild(el('line', {
        class: 'chart__grid',
        x1: 0, x2: W, y1: (H / 4) * g, y2: (H / 4) * g,
        'stroke-dasharray': '2 6',
        'vector-effect': 'non-scaling-stroke'
      }));
    }

    var group = el('g', { 'clip-path': 'url(#' + id + ')' });

    group.appendChild(el('path', {
      class: 'chart__actual', d: path(data.actual), fill: 'none',
      'stroke-width': 1.5, 'stroke-linejoin': 'round', 'vector-effect': 'non-scaling-stroke'
    }));
    group.appendChild(el('path', {
      class: 'chart__forecast', d: path(data.forecast), fill: 'none',
      'stroke-width': 1.5, 'stroke-dasharray': '5 5', 'vector-effect': 'non-scaling-stroke'
    }));

    // Her periyodun tahmin zirvesine violet üçgen: "Prediction On Top"
    for (var start = 0; start < n; start += data.period) {
      var best = start;
      for (var j = start; j < Math.min(start + data.period, n); j++) {
        if (data.forecast[j] > data.forecast[best]) best = j;
      }
      var px = X(best), py = Y(data.forecast[best]) - 14, s = 6;
      group.appendChild(el('path', {
        d: 'M' + px + ' ' + (py - s) + 'L' + (px + s) + ' ' + (py + s * 0.8) + 'L' + (px - s) + ' ' + (py + s * 0.8) + 'Z',
        class: 'chart__peak', fill: 'none', 'stroke-width': 1.5, 'vector-effect': 'non-scaling-stroke'
      }));
    }
    svg.appendChild(group);

    // Çizim sırasında ilerleyen tarama çizgisi
    var scan = el('line', {
      class: 'chart__scan', x1: 0, x2: 0, y1: 0, y2: H, 'stroke-width': 1,
      'vector-effect': 'non-scaling-stroke', opacity: 0
    });
    svg.appendChild(scan);

    container.appendChild(svg);

    var axis = document.createElement('div');
    axis.className = 'chart__axis' + (data.axisMode === 'edges' ? ' chart__axis--edges' : '');
    axis.setAttribute('aria-hidden', 'true');
    if (data.axisMode === 'segments') axis.style.gridTemplateColumns = 'repeat(' + data.axis.length + ', 1fr)';
    data.axis.forEach(function (label) {
      var span = document.createElement('span');
      span.textContent = label;
      axis.appendChild(span);
    });
    container.appendChild(axis);

    return { clipRect: clipRect, scan: scan };
  }

  function reveal(parts) {
    var duration = 2200, t0 = null;
    parts.scan.setAttribute('opacity', 0.8);
    function step(now) {
      if (t0 === null) t0 = now;
      var p = Math.min((now - t0) / duration, 1);
      var e = 1 - Math.pow(1 - p, 3);
      var x = e * W;
      parts.clipRect.setAttribute('width', x);
      parts.scan.setAttribute('x1', x);
      parts.scan.setAttribute('x2', x);
      if (p > 0.85) parts.scan.setAttribute('opacity', 0.8 * (1 - (p - 0.85) / 0.15));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function init() {
    var makers = { load: loadSeries, wind: windSeries };
    document.querySelectorAll('[data-chart]').forEach(function (container) {
      var make = makers[container.getAttribute('data-chart')];
      if (!make) return;
      var parts = render(container, make());
      if (reduceMotion) return;

      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
          if (entries[0].isIntersecting) { io.disconnect(); reveal(parts); }
        }, { threshold: 0.4 });
        io.observe(container);
      } else {
        parts.clipRect.setAttribute('width', W);
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
