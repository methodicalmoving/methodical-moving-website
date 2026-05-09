/* ============================================================
   TOWN MAP BACKGROUND  — bright aerial-map style
   ============================================================ */
(function () {
  'use strict';

  function mkRand(seed) {
    return function () {
      seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
    };
  }

  /* ---- aerial map colour palette ---- */
  var BG         = '#c0bbb3';   /* ground / empty land        */
  var RD_MAJ     = '#f2ede0';   /* major road — bright cream  */
  var RD_MIN     = '#dedad0';   /* minor road — light grey    */
  var SIDEWALK   = '#ccc8c0';   /* kerb / sidewalk band       */
  var PARK_C     = '#74c264';   /* park grass                 */
  var TREE_C     = '#52a040';   /* tree canopy                */
  var TREE_SH    = '#3a7a2c';   /* tree shadow                */
  var WATER_C    = '#64aec8';   /* water body                 */
  var WATER_SH   = '#80c4da';   /* water shimmer              */
  var LOT_C      = '#b0aca4';   /* parking lot surface        */
  var LOT_LINE   = '#9a9690';   /* parking space lines        */
  var COMMERCIAL = '#d0b898';   /* large commercial block     */
  var BLDG_C     = [
    '#dedad2', '#d4d0c8', '#e0dcd4', '#c8c4bc',
    '#d8d4cc', '#ccc8c0', '#e8e4dc', '#d0ccc4'
  ];

  /* ---- generate street positions ---- */
  function genLines(rand, maxPos, majorSpacing) {
    var lines = [];
    var numMajor = Math.ceil(maxPos / majorSpacing) + 2;
    for (var i = 0; i <= numMajor; i++) {
      var base   = i * majorSpacing;
      var jitter = (i > 0 && i < numMajor) ? (rand() - 0.5) * majorSpacing * 0.12 : 0;
      var p = Math.round(base + jitter);
      lines.push({ p: p, w: 18, major: true });
      if (i < numMajor) {
        var mid = p + Math.round(majorSpacing * (0.44 + rand() * 0.12));
        lines.push({ p: mid, w: 10, major: false });
      }
    }
    return lines.sort(function (a, b) { return a.p - b.p; });
  }

  /* ---- draw a building with shadow + highlight ---- */
  function drawBuilding(ctx, x, y, w, h, color) {
    ctx.fillStyle = 'rgba(70,60,50,0.22)';
    ctx.fillRect(x + 3, y + 3, w, h);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(x, y, w, 2);
    ctx.fillRect(x, y, 2, h);
  }

  /* ---- draw everything ---- */
  function drawTown(canvas, W, H) {
    var dpr = canvas.width / W;
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var rand = mkRand(0xC0FFEE);

    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);

    var hLines = genLines(rand, H, 210);
    var vLines = genLines(rand, W, 250);

    /* ---- fill each city block ---- */
    for (var vi = 0; vi < vLines.length - 1; vi++) {
      var bx = vLines[vi].p + vLines[vi].w;
      var bw = vLines[vi + 1].p - bx;
      if (bw < 10) continue;

      for (var hi = 0; hi < hLines.length - 1; hi++) {
        var by = hLines[hi].p + hLines[hi].w;
        var bh = hLines[hi + 1].p - by;
        if (bh < 10) continue;

        var pick = rand();

        if (pick < 0.08) {
          /* ---- park ---- */
          ctx.fillStyle = PARK_C;
          ctx.fillRect(bx, by, bw, bh);

          /* walking path */
          if (bw > 50 && bh > 40) {
            ctx.strokeStyle = 'rgba(180,155,100,0.55)';
            ctx.lineWidth = 2;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(bx + bw * 0.5, by);
            ctx.lineTo(bx + bw * 0.5, by + bh);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(bx, by + bh * 0.5);
            ctx.lineTo(bx + bw, by + bh * 0.5);
            ctx.stroke();
          }

          /* tree canopies */
          var numTrees = Math.floor(rand() * 6) + 4;
          for (var t = 0; t < numTrees; t++) {
            var tx = bx + 6 + rand() * (bw - 12);
            var ty = by + 6 + rand() * (bh - 12);
            var tr = 4 + rand() * 5;
            ctx.fillStyle = TREE_SH;
            ctx.beginPath();
            ctx.arc(tx + 2, ty + 2, tr, 0, 6.2832);
            ctx.fill();
            ctx.fillStyle = TREE_C;
            ctx.beginPath();
            ctx.arc(tx, ty, tr, 0, 6.2832);
            ctx.fill();
            ctx.fillStyle = 'rgba(160,230,120,0.35)';
            ctx.beginPath();
            ctx.arc(tx - 1, ty - 1, tr * 0.45, 0, 6.2832);
            ctx.fill();
          }

        } else if (pick < 0.025) {
          /* ---- water ---- */
          ctx.fillStyle = WATER_C;
          ctx.fillRect(bx, by, bw, bh);
          ctx.strokeStyle = WATER_SH;
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = 0.45;
          for (var s = 0; s < 3; s++) {
            var sy = by + bh * 0.25 + s * bh * 0.25;
            ctx.beginPath();
            ctx.moveTo(bx + 4, sy);
            ctx.bezierCurveTo(
              bx + bw * 0.3, sy - 3,
              bx + bw * 0.7, sy + 3,
              bx + bw - 4, sy
            );
            ctx.stroke();
          }
          ctx.globalAlpha = 1;

        } else if (pick < 0.045) {
          /* ---- parking lot ---- */
          ctx.fillStyle = LOT_C;
          ctx.fillRect(bx, by, bw, bh);
          ctx.strokeStyle = LOT_LINE;
          ctx.lineWidth = 1;
          ctx.setLineDash([]);
          var slotW = 9;
          for (var lx = bx + slotW; lx < bx + bw - 2; lx += slotW) {
            ctx.beginPath();
            ctx.moveTo(lx, by + 3);
            ctx.lineTo(lx, by + bh - 3);
            ctx.stroke();
          }

        } else if (pick < 0.11 && bw > 65 && bh > 50) {
          /* ---- large commercial / institutional ---- */
          var cm = 4;
          drawBuilding(ctx, bx + cm, by + cm, bw - cm * 2, bh - cm * 2, COMMERCIAL);
          /* windows row */
          ctx.fillStyle = 'rgba(100,140,180,0.3)';
          var winH = 3, winSpacing = 8;
          for (var wx = bx + cm + 6; wx < bx + bw - cm - 6; wx += winSpacing) {
            ctx.fillRect(wx, by + cm + 5, 4, winH);
          }

        } else {
          /* ---- residential / mixed-use buildings ---- */
          var PAD = 3, GAP = 3;
          var ibx = bx + PAD, iby = by + PAD;
          var ibw = bw - PAD * 2, ibh = bh - PAD * 2;
          if (ibw < 8 || ibh < 8) continue;

          var cols = Math.max(1, Math.round(ibw / (18 + rand() * 16)));
          var rows = Math.max(1, Math.round(ibh / (14 + rand() * 12)));
          var cw   = ibw / cols;
          var ch   = ibh / rows;

          for (var row = 0; row < rows; row++) {
            for (var col = 0; col < cols; col++) {
              if (rand() < 0.10) continue;
              var fx = ibx + col * cw + GAP * 0.5;
              var fy = iby + row * ch + GAP * 0.5;
              var fw = cw - GAP - rand() * 2;
              var fh = ch - GAP - rand() * 2;
              if (fw < 5 || fh < 5) continue;
              drawBuilding(ctx, fx, fy, fw, fh,
                BLDG_C[Math.floor(rand() * BLDG_C.length)]);
            }
          }
        }
      }
    }

    /* ---- sidewalk bands then road surface ---- */
    vLines.forEach(function (l) {
      ctx.fillStyle = SIDEWALK;
      ctx.fillRect(l.p - 2, 0, l.w + 4, H);
    });
    hLines.forEach(function (l) {
      ctx.fillStyle = SIDEWALK;
      ctx.fillRect(0, l.p - 2, W, l.w + 4);
    });
    vLines.forEach(function (l) {
      ctx.fillStyle = l.major ? RD_MAJ : RD_MIN;
      ctx.fillRect(l.p, 0, l.w, H);
    });
    hLines.forEach(function (l) {
      ctx.fillStyle = l.major ? RD_MAJ : RD_MIN;
      ctx.fillRect(0, l.p, W, l.w);
    });

    /* ---- centre-line dashes on major roads ---- */
    ctx.strokeStyle = 'rgba(180,168,140,0.7)';
    ctx.lineWidth   = 1;
    ctx.setLineDash([14, 10]);
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
      hero.insertBefore(canvas, hero.firstChild);

      var resizeTimer;
      function resize() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
          var dpr = window.devicePixelRatio || 1;
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
