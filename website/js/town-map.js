/* ============================================================
   TOWN MAP BACKGROUND
   Draws a bird's-eye-view neighbourhood on a canvas element
   injected behind each .hero / .page-hero section.
   ============================================================ */
(function () {
  'use strict';

  /* ---- seeded PRNG (mulberry32) for a deterministic layout ---- */
  function mkRand(seed) {
    return function () {
      seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
    };
  }

  /* ---- colour palette ---- */
  var BG      = '#0c0c0c';
  var RD_MAJ  = '#1d1d1d';   /* major road surface      */
  var RD_MIN  = '#191919';   /* minor road surface      */
  var RD_MARK = 'rgba(255,240,120,0.05)'; /* centre-line dashes     */
  var PARK_C  = '#0e1a0c';   /* park / green space      */
  var WATER_C = '#090d18';   /* pond / water feature    */
  var BIG_C   = '#1e1313';   /* large commercial block  */
  var BLDG_C  = [
    '#161616', '#181515', '#161818', '#171615',
    '#1a1515', '#151a16', '#191919', '#1c1616'
  ];

  /* ---- generate street positions along one axis ---- */
  function genLines(rand, maxPos, majorSpacing) {
    var lines = [];
    var numMajor = Math.ceil(maxPos / majorSpacing) + 2;
    for (var i = 0; i <= numMajor; i++) {
      var base   = i * majorSpacing;
      var jitter = (i > 0 && i < numMajor) ? (rand() - 0.5) * majorSpacing * 0.14 : 0;
      var p = Math.round(base + jitter);
      lines.push({ p: p, w: 13, major: true });
      /* one secondary street between this major and the next */
      if (i < numMajor) {
        var mid = p + Math.round(majorSpacing * (0.42 + rand() * 0.16));
        lines.push({ p: mid, w: 8, major: false });
      }
    }
    return lines.sort(function (a, b) { return a.p - b.p; });
  }

  /* ---- draw the entire town map onto the canvas ---- */
  function drawTown(canvas, W, H) {
    var dpr = canvas.width / W;
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var rand = mkRand(0xC0FFEE);

    /* background */
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);

    /* build street grids */
    var hLines = genLines(rand, H, 200); /* horizontal */
    var vLines = genLines(rand, W, 240); /* vertical   */

    /* ---- fill each block between streets ---- */
    for (var vi = 0; vi < vLines.length - 1; vi++) {
      var bx = vLines[vi].p + vLines[vi].w;
      var bw = vLines[vi + 1].p - bx;
      if (bw < 8) continue;

      for (var hi = 0; hi < hLines.length - 1; hi++) {
        var by = hLines[hi].p + hLines[hi].w;
        var bh = hLines[hi + 1].p - by;
        if (bh < 8) continue;

        var pick = rand();

        if (pick < 0.07) {
          /* ---- park / green space ---- */
          ctx.fillStyle = PARK_C;
          ctx.fillRect(bx, by, bw, bh);
          /* scattered tree canopies */
          ctx.fillStyle = '#0b1409';
          var trees = Math.floor(rand() * 5) + 2;
          for (var t = 0; t < trees; t++) {
            ctx.beginPath();
            ctx.arc(
              bx + rand() * bw,
              by + rand() * bh,
              2 + rand() * 2.5, 0, 6.2832
            );
            ctx.fill();
          }

        } else if (pick < 0.015) {
          /* ---- water feature ---- */
          ctx.fillStyle = WATER_C;
          ctx.fillRect(bx, by, bw, bh);

        } else if (pick < 0.09 && bw > 60 && bh > 45) {
          /* ---- large commercial / industrial block ---- */
          ctx.fillStyle = BIG_C;
          ctx.fillRect(bx + 3, by + 3, bw - 6, bh - 6);
          /* loading-dock marks */
          ctx.fillStyle = '#161010';
          var dockW = 6, dockH = 3;
          for (var d = 0; d < 3; d++) {
            ctx.fillRect(bx + 6 + d * 10, by + bh - 6, dockW, dockH);
          }

        } else {
          /* ---- residential / mixed-use: subdivide into footprints ---- */
          var PAD = 2, GAP = 2;
          var ibx = bx + PAD, iby = by + PAD;
          var ibw = bw - PAD * 2, ibh = bh - PAD * 2;
          if (ibw < 6 || ibh < 6) continue;

          var cols = Math.max(1, Math.round(ibw / (15 + rand() * 16)));
          var rows = Math.max(1, Math.round(ibh / (11 + rand() * 12)));
          var cw   = ibw / cols;
          var ch   = ibh / rows;

          for (var row = 0; row < rows; row++) {
            for (var col = 0; col < cols; col++) {
              if (rand() < 0.11) continue; /* vacant lot / driveway */
              var fx = ibx + col * cw + GAP * 0.5;
              var fy = iby + row * ch + GAP * 0.5;
              var fw = cw - GAP - rand() * 1.5;
              var fh = ch - GAP - rand() * 1.5;
              if (fw < 4 || fh < 4) continue;
              ctx.fillStyle = BLDG_C[Math.floor(rand() * BLDG_C.length)];
              ctx.fillRect(fx, fy, fw, fh);
            }
          }
        }
      }
    }

    /* ---- paint streets on top of blocks ---- */
    vLines.forEach(function (l) {
      ctx.fillStyle = l.major ? RD_MAJ : RD_MIN;
      ctx.fillRect(l.p, 0, l.w, H);
    });
    hLines.forEach(function (l) {
      ctx.fillStyle = l.major ? RD_MAJ : RD_MIN;
      ctx.fillRect(0, l.p, W, l.w);
    });

    /* ---- centre-line dashes on major roads ---- */
    ctx.strokeStyle = RD_MARK;
    ctx.lineWidth   = 1;
    ctx.setLineDash([16, 12]);
    vLines.forEach(function (l) {
      if (!l.major) return;
      var cx = l.p + l.w / 2;
      ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke();
    });
    hLines.forEach(function (l) {
      if (!l.major) return;
      var cy = l.p + l.w / 2;
      ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();
    });
    ctx.setLineDash([]);
  }

  /* ---- attach canvas to every hero section ---- */
  function init() {
    document.querySelectorAll('.hero, .page-hero').forEach(function (hero) {
      var canvas = document.createElement('canvas');
      canvas.className = 'town-canvas';
      /* insert as the very first child so it sits behind everything */
      hero.insertBefore(canvas, hero.firstChild);

      var resizeTimer;
      function resize() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
          var dpr = window.devicePixelRatio || 1;
          /* draw 28% wider than the hero so the drift animation
             never reveals an unpainted edge                      */
          var W = Math.ceil(hero.offsetWidth  * 1.28);
          var H = Math.ceil(hero.offsetHeight || window.innerHeight);
          canvas.style.width  = W + 'px';
          canvas.style.height = H + 'px';
          canvas.width  = W * dpr;
          canvas.height = H * dpr;
          drawTown(canvas, W, H);
        }, 40);
      }

      resize();
      window.addEventListener('resize', resize);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
