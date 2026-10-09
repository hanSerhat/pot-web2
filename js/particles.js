/* ==========================================================================
   POT — Takımyıldız parçacıkları
   - Hero: üçgen parçacıklardan oluşan K2 dağı
   - K2 bölümü: "K2" yazısını oluşturan parçacıklar
   - Çözümler: elektrik dağıtım direği ve kanatları dönen rüzgar türbini
   - Ortam: sayfa boyunca süzülen seyrek üçgenler
   ========================================================================== */
(function () {
  'use strict';

  var TAU = Math.PI * 2;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;

  // Renk spektrumu tepeden tabana 9 tondur; tonlar CSS'teki --particles'tan
  // okunur, böylece gece sahnesi ve açık bölüm kendi paletini kullanır.
  var SHADES = 9;

  function readSpectrum(el) {
    return getComputedStyle(el).getPropertyValue('--particles').split(',').map(function (c) {
      return c.trim();
    });
  }

  function rand(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function gauss() {
    var u = 1 - Math.random(), v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v);
  }
  function spectrumIndex(t, spread) {
    return clamp(Math.round(t * (SHADES - 1) + gauss() * spread), 0, SHADES - 1);
  }

  function triangle(ctx, x, y, s, r) {
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(r) * s, y + Math.sin(r) * s);
    ctx.lineTo(x + Math.cos(r + 2.0944) * s, y + Math.sin(r + 2.0944) * s);
    ctx.lineTo(x + Math.cos(r + 4.1888) * s, y + Math.sin(r + 4.1888) * s);
    ctx.closePath();
    ctx.stroke();
  }

  /* ---------- Şekiller: normalize (0–1) noktalar + en/boy oranı ---------- */

  // K2 silueti: sol yamaç, zirve, sağda "omuz"
  var RIDGE = [
    [0, .86], [.06, .79], [.11, .75], [.16, .67], [.2, .64], [.24, .56], [.28, .51],
    [.31, .45], [.35, .38], [.39, .29], [.43, .21], [.47, .12], [.5, .05], [.53, .07],
    [.56, .13], [.59, .19], [.62, .25], [.65, .28], [.69, .29], [.72, .34], [.76, .42],
    [.8, .5], [.84, .55], [.88, .62], [.93, .7], [1, .8]
  ];

  // Zirveden inen iç sırtlar (yüzeylere hacim verir)
  var FACETS = [
    [[.5, .05], [.37, .66]],
    [[.5, .05], [.56, .52]],
    [[.69, .29], [.75, .74]],
    [[.31, .45], [.2, .86]],
    [[.56, .52], [.64, .9]]
  ];

  function ridgeY(x) {
    for (var i = 1; i < RIDGE.length; i++) {
      if (x <= RIDGE[i][0]) {
        var a = RIDGE[i - 1], b = RIDGE[i];
        return a[1] + (b[1] - a[1]) * ((x - a[0]) / (b[0] - a[0]));
      }
    }
    return RIDGE[RIDGE.length - 1][1];
  }

  function point(x, y, alpha, loose) {
    return {
      x: x,
      y: y,
      c: spectrumIndex(clamp((y - 0.04) / 0.9, 0, 1), loose ? 3 : 1.1),
      a: alpha * rand(0.55, 1),
      s: rand(1.6, loose ? 3 : 4.2)
    };
  }

  function mountain(count) {
    var pts = [];
    var nRidge = Math.round(count * 0.3);
    var nFacet = Math.round(count * 0.14);
    var nLoose = Math.round(count * 0.06);
    var nFill = count - nRidge - nFacet - nLoose;
    var i, x, y;

    for (i = 0; i < nRidge; i++) {
      x = Math.random();
      pts.push(point(x, ridgeY(x) + Math.abs(gauss()) * 0.012, 1));
    }

    for (i = 0; i < nFacet; i++) {
      var f = FACETS[i % FACETS.length], t = Math.pow(Math.random(), 1.3);
      x = f[0][0] + (f[1][0] - f[0][0]) * t + gauss() * 0.008;
      y = f[0][1] + (f[1][1] - f[0][1]) * t + gauss() * 0.008;
      pts.push(point(x, Math.max(y, ridgeY(x) + 0.004), 0.85));
    }

    // Gövde: sırttan aşağı indikçe seyrelir, tabanda kaybolur
    while (nFill > 0) {
      x = Math.random();
      y = Math.random();
      var r = ridgeY(x);
      if (y < r) continue;
      var p = Math.exp(-(y - r) * 4.2) * (y > 0.82 ? 1 - (y - 0.82) / 0.18 : 1);
      if (Math.random() < p) { pts.push(point(x, y, 0.7)); nFill--; }
    }

    for (i = 0; i < nLoose; i++) {
      pts.push(point(Math.random(), Math.random() * 0.9, 0.35, true));
    }

    return { aspect: 1.25, points: pts };
  }

  /* ---------- Çizilen şekiller: tuvale beyazla boyanır, dolu piksellerden örneklenir ---------- */

  function samplePaint(w, h, paint) {
    var c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    var ctx = c.getContext('2d');
    ctx.fillStyle = ctx.strokeStyle = '#fff';
    ctx.lineCap = 'round';
    paint(ctx);

    var data = ctx.getImageData(0, 0, w, h).data;
    var cand = [];
    for (var y = 0; y < h; y += 2) {
      for (var x = 0; x < w; x += 2) {
        if (data[(y * w + x) * 4 + 3] > 140) cand.push([x, y]);
      }
    }
    return cand;
  }

  // Katmanlar parçacıkları boyalı alanlarıyla orantılı paylaşır.
  // keep(nx, ny): o noktada parçacık tutma olasılığı (uçları seyreltmek için).
  // spin: katman, pivot noktası etrafında döner.
  function paintedShape(w, h, layers, count, pivot) {
    var sets = layers.map(function (l) { return samplePaint(w, h, l.paint); });
    var total = sets.reduce(function (n, s) { return n + s.length; }, 0) || 1;
    var nLoose = Math.round(count * 0.06);
    var pts = [];

    layers.forEach(function (layer, li) {
      var cand = sets[li];
      var n = Math.round((count - nLoose) * cand.length / total);
      for (var tries = n * 20; n > 0 && cand.length && tries > 0; tries--) {
        var q = cand[(Math.random() * cand.length) | 0];
        var nx = (q[0] + rand(-1, 1)) / w, ny = (q[1] + rand(-1, 1)) / h;
        if (layer.keep && Math.random() > layer.keep(nx, ny)) continue;
        pts.push({
          x: nx,
          y: ny,
          c: spectrumIndex(clamp(ny * 0.55 + nx * 0.45, 0, 1), 1.2),
          a: rand(0.55, 1),
          s: rand(1.4, 3.6),
          spin: !!layer.spin
        });
        n--;
      }
    });

    for (var i = 0; i < nLoose; i++) {
      pts.push(point(rand(-0.1, 1.1), rand(-0.15, 1.15), 0.35, true));
    }

    return { aspect: w / h, points: pts, pivot: pivot ? [pivot[0] / w, pivot[1] / h] : null };
  }

  // Alt kısmı tabana doğru kaybolan katmanlar için (dağın eteği gibi)
  function fadeBelow(from) {
    return function (nx, ny) { return ny > from ? 1 - (ny - from) / (1 - from) : 1; };
  }

  function box(c, x, y, w, h, r) {
    c.beginPath();
    if (c.roundRect) c.roundRect(x, y, w, h, r);
    else c.rect(x, y, w, h);
    c.fill();
  }

  function textShape(text, count) {
    var family = getComputedStyle(document.body).fontFamily;
    var size = 320;
    var font = '600 ' + size + 'px ' + family;
    var ctx = document.createElement('canvas').getContext('2d');
    ctx.font = font;
    var m = ctx.measureText(text);
    var left = m.actualBoundingBoxLeft || 0;
    var ascent = m.actualBoundingBoxAscent || size * 0.73;
    var descent = m.actualBoundingBoxDescent || 0;
    var w = Math.ceil(left + (m.actualBoundingBoxRight || m.width)) + 4;
    var h = Math.ceil(ascent + descent) + 4;

    return paintedShape(w, h, [{
      paint: function (c) {
        c.font = font;
        c.fillText(text, left + 2, ascent + 2);
      }
    }], count);
  }

  // Elektrik dağıtım direği: konik direk, iki travers, izolatörler, trafo
  // ve iki yana kısa sarkıp boşlukta kaybolan hatlar. Dik oranlı: grafiğin yanına sığar.
  function pole(count) {
    var W = 560, H = 640, cx = 280;
    var TOP = 150, LOW = 236;

    function insulator(c, x, base, height) {
      c.fillRect(x - 3, base - height, 6, height);
      for (var k = 0; k < 3; k++) c.fillRect(x - 8, base - 8 - k * 7, 16, 4);
    }
    // a'dan b'ye, ortası "sag" kadar sarkan hat
    function wire(c, a, b, sag) {
      var mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 + sag;
      c.beginPath();
      c.moveTo(a[0], a[1]);
      c.quadraticCurveTo(mx, 2 * my - (a[1] + b[1]) / 2, b[0], b[1]);
      c.stroke();
    }

    return paintedShape(W, H, [
      {
        paint: function (c) {
          c.beginPath();
          c.moveTo(cx - 7, 110);
          c.lineTo(cx + 7, 110);
          c.lineTo(cx + 18, H);
          c.lineTo(cx - 18, H);
          c.closePath();
          c.fill();

          c.fillRect(cx - 164, TOP, 328, 10);
          c.fillRect(cx - 114, LOW, 228, 9);

          c.lineWidth = 5;
          c.beginPath();
          c.moveTo(cx - 70, TOP + 10); c.lineTo(cx, TOP + 62);
          c.moveTo(cx + 70, TOP + 10); c.lineTo(cx, TOP + 62);
          c.stroke();

          insulator(c, cx, 110, 26);
          insulator(c, cx - 146, TOP, 26);
          insulator(c, cx + 146, TOP, 26);
          insulator(c, cx - 98, LOW, 22);
          insulator(c, cx + 98, LOW, 22);

          // Trafo: direğe kelepçeli gövde ve üstünde iki buşing
          c.fillRect(cx + 12, 338, 20, 6);
          c.fillRect(cx + 12, 400, 20, 6);
          box(c, cx + 30, 320, 72, 104, 10);
          c.fillRect(cx + 44, 302, 8, 20);
          c.fillRect(cx + 80, 302, 8, 20);
        },
        keep: fadeBelow(0.82)
      },
      {
        paint: function (c) {
          c.lineWidth = 3.5;
          wire(c, [cx, 84], [0, 64], 22);
          wire(c, [cx, 84], [W, 64], 22);
          wire(c, [cx - 146, 124], [0, 156], 20);
          wire(c, [cx + 146, 124], [W, 156], 20);
          wire(c, [cx - 98, 214], [0, 244], 22);
          wire(c, [cx + 98, 214], [W, 244], 22);
        },
        // Hatlar traversin ucundan sonra seyrelip boşluğa karışır
        keep: function (nx) {
          var d = Math.abs(nx - 0.5) * 2;
          return d < 0.6 ? 1 : 1 - (d - 0.6) / 0.4;
        }
      }
    ], count);
  }

  // Rüzgar türbini: konik kule ve göbek etrafında dönen üç kanat
  function turbine(count) {
    var W = 600, H = 640, hx = 300, hy = 250, L = 236;

    return paintedShape(W, H, [
      {
        paint: function (c) {
          c.beginPath();
          c.moveTo(hx - 7, hy + 10);
          c.lineTo(hx + 7, hy + 10);
          c.lineTo(hx + 20, H);
          c.lineTo(hx - 20, H);
          c.closePath();
          c.fill();
          box(c, hx - 20, hy - 13, 40, 26, 10);
        },
        keep: fadeBelow(0.84)
      },
      {
        spin: true,
        paint: function (c) {
          for (var i = 0; i < 3; i++) {
            c.save();
            c.translate(hx, hy);
            c.rotate(-Math.PI / 2 + i * TAU / 3);
            c.beginPath();
            c.moveTo(14, -7);
            c.quadraticCurveTo(56, -22, L, -3);
            c.lineTo(L, 2);
            c.quadraticCurveTo(64, 14, 14, 7);
            c.closePath();
            c.fill();
            c.restore();
          }
          c.beginPath();
          c.arc(hx, hy, 15, 0, TAU);
          c.fill();
        }
      }
    ], count, [hx, hy]);
  }

  /* ---------- Takımyıldız motoru ---------- */

  function Constellation(canvas, shapeFn, opts) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.spectrum = readSpectrum(canvas);
    this.opts = opts;
    this.mouse = { x: -1e4, y: -1e4 };
    this.running = false;
    this.t0 = null;
    this.last = 0;
    this.frame = this.frame.bind(this);

    var w = canvas.clientWidth || 600;
    var count = Math.round(clamp(w * (opts.density || 1.6), opts.min || 400, opts.max || 1600));
    this.shape = shapeFn(count);
    this.particles = this.shape.points.map(function (p) {
      return {
        nx: p.x, ny: p.y, c: p.c, a: p.a, s: p.s, spin: !!p.spin,
        x: 0, y: 0, hx: 0, hy: 0, rx: 0, ry: 0,
        rot: Math.random() * TAU,
        vr: rand(-0.5, 0.5),
        ph: Math.random() * TAU,
        sp: rand(0.25, 0.8),
        amp: rand(0.6, 3),
        tw: rand(0.6, 2.2)
      };
    });
    // Aynı renkleri art arda çizmek strokeStyle değişimini azaltır
    this.particles.sort(function (a, b) { return a.c - b.c; });

    this.resize(true);
    this.bind();
  }

  Constellation.prototype.resize = function (initial) {
    var w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    if (!w || !h) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = w;
    this.h = h;
    this.dpr = dpr;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);

    // Şekli dolgu payları içinde en/boy oranını koruyarak yerleştir
    var pad = this.opts.pad || [0.08, 0.08, 0.08, 0.08];
    var pt = pad[0] * h, pr = pad[1] * w, pb = pad[2] * h, pl = pad[3] * w;
    var aw = w - pl - pr, ah = h - pt - pb;
    var bw = aw, bh = bw / this.shape.aspect;
    if (bh > ah) { bh = ah; bw = bh * this.shape.aspect; }
    // zoom > 1: alana sığan şekil büyütülür, taşan kenarlar kırpılır
    var zoom = this.opts.zoom || 1;
    bw *= zoom;
    bh *= zoom;
    var ox = pl + (aw - bw) * (this.opts.alignX == null ? 0.5 : this.opts.alignX);
    var oy = pt + (ah - bh) * (this.opts.alignY == null ? 0.5 : this.opts.alignY);
    var sizeScale = clamp(bw / 700, 0.7, 1.15);
    var pv = this.shape.pivot;
    if (pv) {
      this.px = ox + pv[0] * bw;
      this.py = oy + pv[1] * bh;
    }

    for (var i = 0; i < this.particles.length; i++) {
      var p = this.particles[i];
      p.hx = ox + p.nx * bw;
      p.hy = oy + p.ny * bh;
      p.size = p.s * sizeScale;
      // Dönen parçacıklar pivottan uzaklıklarıyla tutulur, her karede döndürülür
      if (p.spin) {
        p.rx = p.hx - this.px;
        p.ry = p.hy - this.py;
      }
      if (reduceMotion) { p.x = p.hx; p.y = p.hy; }
      else if (initial) { p.x = rand(0, w); p.y = rand(0, h); }
    }

    if (reduceMotion) this.draw(0, 1, 0);
  };

  Constellation.prototype.bind = function () {
    var self = this;

    if ('ResizeObserver' in window) {
      var pending = false;
      new ResizeObserver(function () {
        if (pending) return;
        pending = true;
        requestAnimationFrame(function () { pending = false; self.resize(false); });
      }).observe(this.canvas);
    }

    if (reduceMotion) return;

    if (finePointer) {
      window.addEventListener('pointermove', function (e) {
        if (!self.running) return;
        var r = self.canvas.getBoundingClientRect();
        self.mouse.x = e.clientX - r.left;
        self.mouse.y = e.clientY - r.top;
      }, { passive: true });
      document.documentElement.addEventListener('mouseleave', function () { self.mouse.x = self.mouse.y = -1e4; });
    }

    // Yalnızca ekranda görünürken çalış
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries[0].isIntersecting ? self.start() : self.stop();
      }, { threshold: 0.05 }).observe(this.canvas);
    } else {
      this.start();
    }
  };

  Constellation.prototype.start = function () {
    if (this.running) return;
    this.running = true;
    if (this.t0 === null) this.t0 = performance.now();
    this.last = performance.now();
    requestAnimationFrame(this.frame);
  };

  Constellation.prototype.stop = function () { this.running = false; };

  Constellation.prototype.frame = function (now) {
    if (!this.running) return;
    var dt = Math.min((now - this.last) / 16.667, 3);
    this.last = now;
    var t = (now - this.t0) / 1000;
    // Açılışta yaylar gevşek başlar ve sıkılaşır: parçacıklar dağılmış hâlden dağı oluşturur
    var k = Math.min(0.06, 0.01 + t * 0.022);
    this.draw(t, 1 - Math.pow(1 - k, dt), dt);
    requestAnimationFrame(this.frame);
  };

  Constellation.prototype.draw = function (t, k, dt) {
    var ctx = this.ctx, ps = this.particles, m = this.mouse;
    var R = this.opts.repel || 90, R2 = R * R;
    var last = -1;
    var angle = reduceMotion ? 0 : t * (this.opts.spin || 0);
    var cs = Math.cos(angle), sn = Math.sin(angle);
    // Dönen parçacıklar hedefe daha sıkı bağlı: kanat dönerken iz bırakıp bükülmesin
    var kSpin = Math.min(1, k * 4);

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.w, this.h);
    ctx.lineWidth = 1;

    for (var i = 0; i < ps.length; i++) {
      var p = ps[i];
      var tx = p.hx, ty = p.hy, alpha = p.a, kp = k;
      if (p.spin) {
        tx = this.px + p.rx * cs - p.ry * sn;
        ty = this.py + p.rx * sn + p.ry * cs;
        kp = kSpin;
      }

      if (!reduceMotion) {
        tx += Math.cos(t * p.sp + p.ph) * p.amp;
        ty += Math.sin(t * p.sp * 1.3 + p.ph) * p.amp;

        var dx = p.x - m.x, dy = p.y - m.y, d2 = dx * dx + dy * dy;
        if (d2 < R2) {
          var d = Math.sqrt(d2) || 1, f = (1 - d / R) * 32;
          tx += (dx / d) * f;
          ty += (dy / d) * f;
        }

        p.x += (tx - p.x) * kp;
        p.y += (ty - p.y) * kp;
        p.rot += p.vr * 0.016 * dt;
        alpha *= 0.65 + 0.35 * Math.sin(t * p.tw + p.ph);
      }

      if (p.c !== last) { ctx.strokeStyle = this.spectrum[p.c]; last = p.c; }
      ctx.globalAlpha = alpha;
      triangle(ctx, p.x, p.y, p.size, p.rot);
    }
    ctx.globalAlpha = 1;
  };

  /* ---------- Ortam alanı: seyrek, yavaş, paralaks ---------- */

  function Ambient(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.spectrum = readSpectrum(canvas);
    this.frame = this.frame.bind(this);
    this.resize();

    var self = this;
    window.addEventListener('resize', function () { self.resize(); if (reduceMotion) self.draw(0); });

    if (reduceMotion) { this.draw(0); return; }
    this.last = performance.now();
    requestAnimationFrame(this.frame);
  }

  Ambient.prototype.resize = function () {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.dpr = dpr;
    this.canvas.width = Math.round(this.w * dpr);
    this.canvas.height = Math.round(this.h * dpr);

    var n = Math.round(clamp((this.w * this.h) / 26000, 24, 72));
    if (!this.particles || this.particles.length !== n) {
      this.particles = [];
      for (var i = 0; i < n; i++) {
        var z = rand(0.2, 1);
        this.particles.push({
          x: rand(0, this.w), y: rand(0, this.h), z: z,
          vx: rand(-0.08, 0.08), vy: rand(-0.12, -0.02),
          s: 1.4 + z * 2.4, rot: Math.random() * TAU, vr: rand(-0.3, 0.3),
          c: (Math.random() * SHADES) | 0,
          a: 0.1 + z * 0.22
        });
      }
    }
  };

  Ambient.prototype.frame = function (now) {
    var dt = Math.min((now - this.last) / 16.667, 3);
    this.last = now;
    var ps = this.particles;
    for (var i = 0; i < ps.length; i++) {
      var p = ps[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * 0.016 * dt;
      if (p.x < -10) p.x += this.w + 20;
      if (p.x > this.w + 10) p.x -= this.w + 20;
    }
    this.draw();
    requestAnimationFrame(this.frame);
  };

  Ambient.prototype.draw = function () {
    var ctx = this.ctx, H = this.h + 40, sy = window.scrollY || 0;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.w, this.h);
    ctx.lineWidth = 1;
    for (var i = 0; i < this.particles.length; i++) {
      var p = this.particles[i];
      // Derinliğe göre kaydırma paralaksı; ekrandan çıkan parçacık diğer uçtan döner
      var y = ((p.y - sy * p.z * 0.3) % H + H) % H - 20;
      ctx.strokeStyle = this.spectrum[p.c];
      ctx.globalAlpha = p.a;
      triangle(ctx, p.x, y, p.s, p.rot);
    }
    ctx.globalAlpha = 1;
  };

  /* ---------- Başlat ---------- */

  function init() {
    var ambient = document.querySelector('canvas.ambient');
    if (ambient) new Ambient(ambient);

    var hero = document.querySelector('canvas[data-constellation="mountain"]');
    if (hero) {
      var mobile = window.innerWidth <= 900;
      new Constellation(hero, mountain, {
        // Mobilde dağ metnin arkasında: büyütülüp ortalanır, yanlardan kırpılır
        pad: mobile ? [0.04, 0.02, 0.04, 0.02] : [0.16, 0.05, 0.07, 0.1],
        alignX: mobile ? 0.5 : 1,
        alignY: mobile ? 0.6 : 1,
        zoom: mobile ? 1.35 : 1,
        density: 1.7,
        min: mobile ? 1100 : 400,
        max: 1700
      });
    }

    var k2 = document.querySelector('canvas[data-constellation="k2"]');
    if (k2) {
      // Yazı şekli sistem yazı tipinden örneklenir; indirme beklemeye gerek yok
      new Constellation(k2, function (n) { return textShape('K2', n); }, {
        pad: [0.12, 0.08, 0.12, 0.08],
        density: 1.5,
        max: 1200,
        repel: 70
      });
    }

    var poleCanvas = document.querySelector('canvas[data-constellation="pole"]');
    if (poleCanvas) {
      new Constellation(poleCanvas, pole, {
        pad: [0.06, 0.02, 0.02, 0.02],
        alignY: 1,
        density: 2.2,
        min: 1000,
        max: 1600,
        repel: 70
      });
    }

    var turbineCanvas = document.querySelector('canvas[data-constellation="turbine"]');
    if (turbineCanvas) {
      new Constellation(turbineCanvas, turbine, {
        pad: [0.04, 0.06, 0.02, 0.06],
        alignY: 1,
        density: 2.2,
        min: 1000,
        max: 1600,
        repel: 70,
        spin: 0.45
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
