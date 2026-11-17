/* =====================================================================
   VR FAST FOOD — burger 3D de l'accueil
   ---------------------------------------------------------------------
   Scène Three.js construite en code (aucun fichier 3D ni photo) :
   pain, salade, oignons, tomates, fromage, steak, pain — légèrement
   séparés, qui flottent et tournent lentement.

   - La bibliothèque est chargée à la demande, après l'affichage de la page.
   - Sans WebGL, en mode « économie de données » ou si le chargement échoue,
     l'illustration SVG de index.html reste affichée.
   - Petit écran : résolution plafonnée, pas d'ombres portées, moins d'objets.
   - « Réduire les animations » : une seule image fixe, aucune boucle.
   - Le rendu s'arrête quand le burger sort de l'écran ou que l'onglet est masqué.
   ===================================================================== */
(function () {
  'use strict';

  // Pour héberger Three.js soi-même : copier three.module.min.js dans js/vendor/
  // et remplacer cette adresse par './vendor/three.module.min.js' (le site doit alors être servi en HTTP).
  var THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js';

  var stage = document.getElementById('burgerStage');
  if (!stage) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var small = window.matchMedia('(max-width: 720px)').matches || window.matchMedia('(pointer: coarse)').matches;
  var saveData = !!(navigator.connection && navigator.connection.saveData);

  function hasWebGL() {
    try {
      var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
    } catch (e) {
      return false;
    }
  }

  if (saveData || !hasWebGL()) return;

  function load() {
    import(THREE_URL).then(build).catch(function () { /* l'illustration de secours reste en place */ });
  }
  if ('requestIdleCallback' in window) window.requestIdleCallback(load, { timeout: 1500 });
  else window.setTimeout(load, 200);

  function build(THREE) {
    var canvas = document.createElement('canvas');
    canvas.className = 'stage__canvas';
    canvas.setAttribute('aria-hidden', 'true');

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (e) {
      return;
    }

    var dpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2);
    var shadows = !small;
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.NeutralToneMapping || THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.shadowMap.enabled = shadows;

    var scene = new THREE.Scene();
    var FOV = 28;
    var ELEV = 15 * Math.PI / 180;
    var camera = new THREE.PerspectiveCamera(FOV, 1, 2, 50);

    /* ---------- Lumière : claire, chaude, ombres douces ---------- */
    scene.add(new THREE.HemisphereLight(0xfff7e8, 0xffc890, 1.35));

    var key = new THREE.DirectionalLight(0xfffaf0, 2.4);
    key.position.set(-4, 7, 7);
    if (shadows) {
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      var sc = key.shadow.camera;
      sc.left = -4.2; sc.right = 4.2; sc.top = 4.2; sc.bottom = -4.2; sc.near = 1; sc.far = 26;
      key.shadow.bias = -0.0006;
      key.shadow.normalBias = 0.03;
      key.shadow.radius = 5;
      if ('intensity' in key.shadow) key.shadow.intensity = 0.5;
    }
    scene.add(key);

    var fill = new THREE.DirectionalLight(0xffe1bd, 0.7);
    fill.position.set(6, 1.5, 4);
    scene.add(fill);

    var rim = new THREE.DirectionalLight(0xfff1c2, 0.9);
    rim.position.set(1, 4, -7);
    scene.add(rim);

    /* ---------- Outils ---------- */
    var SEG = small ? 48 : 72;
    function std(color, roughness, extra) {
      return new THREE.MeshStandardMaterial(Object.assign({ color: color, roughness: roughness, metalness: 0 }, extra || {}));
    }
    function cast(mesh) { mesh.castShadow = shadows; mesh.receiveShadow = shadows; return mesh; }
    function V2(x, y) { return new THREE.Vector2(x, y); }
    function smooth(x) { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); }

    // Profil d'un disque aux bords arrondis (tourné ensuite autour de l'axe vertical).
    function discProfile(R, H, bevB, bevT, steps) {
      var pts = [V2(0, 0)], i, a;
      for (i = 0; i <= steps; i++) {
        a = -Math.PI / 2 + (i / steps) * Math.PI / 2;
        pts.push(V2(R - bevB + Math.cos(a) * bevB, bevB + Math.sin(a) * bevB));
      }
      for (i = 0; i <= steps; i++) {
        a = (i / steps) * Math.PI / 2;
        pts.push(V2(R - bevT + Math.cos(a) * bevT, H - bevT + Math.sin(a) * bevT));
      }
      pts.push(V2(0, H));
      return pts;
    }

    // Couleur par sommet (dégradés doux sans texture).
    function tint(geo, fn) {
      var p = geo.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color();
      for (var i = 0; i < p.count; i++) {
        fn(c, p.getX(i), p.getY(i), p.getZ(i));
        col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      }
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    }

    var bunLight = new THREE.Color(0xF6B855);
    var bunDark = new THREE.Color(0xD98230);
    var crumb = new THREE.Color(0xF8DFAE);
    var bunMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.46, metalness: 0 });

    /* ---------- Pain du dessus + graines de sésame ---------- */
    var domeCurve = new THREE.SplineCurve([
      V2(1.40, 0), V2(1.50, 0.05), V2(1.56, 0.20), V2(1.53, 0.44), V2(1.38, 0.70),
      V2(1.12, 0.92), V2(0.78, 1.06), V2(0.40, 1.14), V2(0, 1.16)
    ]);
    var domeGeo = new THREE.LatheGeometry(domeCurve.getPoints(44), SEG);
    tint(domeGeo, function (c, x, y) { c.copy(bunLight).lerp(bunDark, smooth(y / 1.16)); });

    var bunTop = new THREE.Group();
    bunTop.add(cast(new THREE.Mesh(domeGeo, bunMat)));
    var bunTopCap = new THREE.Mesh(new THREE.CircleGeometry(1.40, 48), std(0xF8DFAE, 0.85));
    bunTopCap.rotation.x = Math.PI / 2;
    bunTop.add(bunTopCap);

    (function addSeeds() {
      var n = small ? 26 : 44;
      var prof = domeCurve.getPoints(200);
      var seeds = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), std(0xFFF2D2, 0.55), n);
      var m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), q2 = new THREE.Quaternion();
      var up = new THREE.Vector3(0, 1, 0), nrm = new THREE.Vector3(), pos = new THREE.Vector3(), scl = new THREE.Vector3();
      for (var i = 0; i < n; i++) {
        var rTarget = 0.12 + 1.22 * Math.sqrt((i + 0.5) / n);
        var j = prof.length - 2;
        while (j > 1 && prof[j].x < rTarget) j--;
        var p = prof[j], dx = prof[j + 1].x - prof[j - 1].x, dy = prof[j + 1].y - prof[j - 1].y;
        var th = i * 2.39996 + Math.sin(i * 12.9898) * 0.25;
        nrm.set(dy * Math.cos(th), -dx, dy * Math.sin(th)).normalize();
        pos.set(p.x * Math.cos(th), p.y, p.x * Math.sin(th)).addScaledVector(nrm, 0.012);
        q.setFromUnitVectors(up, nrm);
        q2.setFromAxisAngle(up, i * 1.7);
        q.multiply(q2);
        var s = 0.9 + 0.25 * Math.sin(i * 3.1);
        scl.set(0.05 * s, 0.022, 0.088 * s);
        m4.compose(pos, q, scl);
        seeds.setMatrixAt(i, m4);
      }
      seeds.instanceMatrix.needsUpdate = true;
      bunTop.add(seeds);
    })();

    /* ---------- Pain du dessous ---------- */
    var bottomPts = [V2(0, 0)];
    for (var bi = 0; bi <= 8; bi++) {
      var ba = -Math.PI / 2 + (bi / 8) * Math.PI / 2;
      bottomPts.push(V2(1.5 - 0.27 + Math.cos(ba) * 0.27, 0.27 + Math.sin(ba) * 0.27));
    }
    bottomPts.push(V2(1.5, 0.37), V2(1.485, 0.43), V2(1.44, 0.47), V2(1.38, 0.48), V2(0, 0.48));
    var bottomGeo = new THREE.LatheGeometry(bottomPts, SEG);
    tint(bottomGeo, function (c, x, y, z) {
      if (y > 0.475 && Math.hypot(x, z) < 1.39) c.copy(crumb);
      else c.copy(bunDark).lerp(bunLight, smooth(y / 0.45));
    });
    var bunBottom = new THREE.Group();
    bunBottom.add(cast(new THREE.Mesh(bottomGeo, bunMat)));

    /* ---------- Steak ---------- */
    var patty = new THREE.Group();
    patty.add(cast(new THREE.Mesh(new THREE.LatheGeometry(discProfile(1.5, 0.42, 0.17, 0.17, 6), SEG), std(0x71391F, 0.82))));

    /* ---------- Fromage (tranche carrée aux coins qui retombent) ---------- */
    var cheeseGeo = new THREE.BoxGeometry(2.96, 0.07, 2.96, 26, 1, 26);
    (function droop() {
      var p = cheeseGeo.attributes.position;
      for (var i = 0; i < p.count; i++) {
        var x = p.getX(i), z = p.getZ(i);
        var over = Math.max(0, Math.hypot(x, z) - 1.47);
        if (over > 0) {
          var k = 1 - over * 0.16;
          p.setXYZ(i, x * k, p.getY(i) - Math.pow(over, 1.5) * 0.95, z * k);
        }
      }
      cheeseGeo.computeVertexNormals();
    })();
    var cheese = new THREE.Group();
    var cheeseMesh = cast(new THREE.Mesh(cheeseGeo, std(0xFFC21A, 0.4, { emissive: 0xFF9D00, emissiveIntensity: 0.22 })));
    cheeseMesh.position.y = 0.04;
    cheeseMesh.rotation.y = Math.PI / 4;
    cheese.add(cheeseMesh);

    /* ---------- Tomates ---------- */
    var tomatoGeo = new THREE.LatheGeometry(discProfile(0.72, 0.15, 0.06, 0.06, 4), 40);
    var tomatoTopGeo = new THREE.CircleGeometry(0.57, 32);
    var tomatoMat = std(0xE23A2B, 0.36);
    var tomatoInMat = std(0xF36A52, 0.5);
    function tomatoSlice() {
      var g = new THREE.Group();
      g.add(cast(new THREE.Mesh(tomatoGeo, tomatoMat)));
      var top = new THREE.Mesh(tomatoTopGeo, tomatoInMat);
      top.rotation.x = -Math.PI / 2;
      top.position.y = 0.152;
      top.receiveShadow = shadows;
      g.add(top);
      return g;
    }
    var tomato = new THREE.Group();
    for (var ti = 0; ti < 3; ti++) {
      var ta = 0.5 + ti * (Math.PI * 2 / 3);
      var slice = tomatoSlice();
      slice.position.set(Math.cos(ta) * 0.74, ti * 0.03, Math.sin(ta) * 0.74);
      slice.rotation.set((ti - 1) * 0.05, 0, (1 - ti) * 0.06);
      tomato.add(slice);
    }

    /* ---------- Rondelles d'oignon ---------- */
    var onionMat = std(0xF1D6EE, 0.5);
    function onionRing(r) {
      var ring = cast(new THREE.Mesh(new THREE.TorusGeometry(r, 0.055, 10, 44), onionMat));
      ring.rotation.x = Math.PI / 2;
      return ring;
    }
    var onion = new THREE.Group();
    [[-0.55, 0.3, 0.5], [0.52, 0.42, 0.42], [0, -0.58, 0.5]].forEach(function (o, i) {
      var ring = onionRing(o[2]);
      ring.position.set(o[0], 0.06 + i * 0.02, o[1]);
      onion.add(ring);
    });

    /* ---------- Salade (feuilles ondulées) ---------- */
    function lettuceGeo(R, seed) {
      var g = new THREE.RingGeometry(0.2, R, small ? 72 : 120, 7);
      var p = g.attributes.position, col = [];
      var cIn = new THREE.Color(0x58B336), cOut = new THREE.Color(0xA6E255), c = new THREE.Color();
      for (var i = 0; i < p.count; i++) {
        var x = p.getX(i), y = p.getY(i);
        var r = Math.hypot(x, y), th = Math.atan2(y, x), k = r / R;
        var rr = r * (1 + 0.05 * Math.sin(th * 5 + seed) * k);
        var h = (Math.sin(th * 9 + seed * 2) * 0.11 + Math.sin(th * 17 + seed) * 0.035) * Math.pow(k, 2.4) - 0.06 * k * k;
        p.setXYZ(i, rr * Math.cos(th), h, -rr * Math.sin(th));
        c.copy(cIn).lerp(cOut, smooth(k * 1.1 - 0.15));
        col.push(c.r, c.g, c.b);
      }
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      g.computeVertexNormals();
      return g;
    }
    var lettuceMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62, metalness: 0, side: THREE.DoubleSide });
    var lettuce = new THREE.Group();
    var leafA = cast(new THREE.Mesh(lettuceGeo(1.74, 0.4), lettuceMat));
    leafA.position.y = 0.08;
    var leafB = cast(new THREE.Mesh(lettuceGeo(1.6, 2.1), lettuceMat));
    leafB.position.y = 0.15;
    leafB.rotation.y = 0.7;
    lettuce.add(leafA, leafB);

    /* ---------- Empilement ---------- */
    var root = new THREE.Group();
    var burger = new THREE.Group();
    root.add(burger);
    scene.add(root);

    // h = épaisseur de l'ingrédient ; gap = écart avec celui du dessous quand le burger est « ouvert »
    var GAP = 0.34;
    var layers = [];
    function addLayer(group, h, gap) { burger.add(group); layers.push({ g: group, h: h, gap: gap * GAP, y: 0, off: 0 }); }
    addLayer(bunBottom, 0.48, 0);
    addLayer(patty, 0.42, 1);
    addLayer(cheese, 0.08, 0.5);      // le fromage reste près du steak : ses coins retombent dessus
    addLayer(tomato, 0.2, 1.05);
    addLayer(onion, 0.13, 0.75);
    addLayer(lettuce, 0.2, 0.95);
    addLayer(bunTop, 1.16, 1.25);

    var STACK = 0, SPREAD = 0;
    layers.forEach(function (l) { l.y = STACK; STACK += l.h; SPREAD += l.gap; l.off = SPREAD; });
    var N = layers.length;
    var FULL = STACK + SPREAD;

    /* ---------- Ingrédients qui flottent autour ---------- */
    var orbit = new THREE.Group();
    root.add(orbit);
    var floaters = [];
    function addFloater(mesh, x, y, z, amp, speed) {
      mesh.position.set(x, y, z);
      orbit.add(mesh);
      floaters.push({ m: mesh, x: x, y: y, z: z, amp: amp, speed: speed, ph: floaters.length * 1.7, rx: mesh.rotation.x, rz: mesh.rotation.z });
    }

    var fryGeo = new THREE.CapsuleGeometry(0.075, 0.82, 4, 10);
    var fryMat = std(0xFFC93C, 0.6);
    function fry(rz, rx) {
      var m = new THREE.Mesh(fryGeo, fryMat);
      m.rotation.set(rx, 0, rz);
      return m;
    }
    addFloater(fry(0.6, 0.2), -2.55, 1.15, 0.5, 0.16, 0.5);
    addFloater(fry(-0.8, -0.3), 2.65, -0.45, 0.7, 0.14, 0.42);
    if (!small) addFloater(fry(1.2, 0.4), -2.25, -1.6, -0.6, 0.12, 0.55);

    var looseTomato = tomatoSlice();
    looseTomato.rotation.set(1.0, 0, 0.5);
    looseTomato.scale.setScalar(0.62);
    looseTomato.traverse(function (o) { o.castShadow = false; o.receiveShadow = false; });
    addFloater(looseTomato, 2.4, 1.55, -0.4, 0.15, 0.38);

    var pickleGeo = new THREE.LatheGeometry(discProfile(0.3, 0.08, 0.03, 0.03, 3), 28);
    var pickleMat = std(0x8DBB3A, 0.5);
    var pickleInMat = std(0xC3DF6C, 0.55);
    function pickle(rx, rz) {
      var g = new THREE.Group();
      g.add(new THREE.Mesh(pickleGeo, pickleMat));
      var top = new THREE.Mesh(new THREE.CircleGeometry(0.22, 24), pickleInMat);
      top.rotation.x = -Math.PI / 2;
      top.position.y = 0.082;
      g.add(top);
      g.rotation.set(rx, 0, rz);
      return g;
    }
    addFloater(pickle(1.1, -0.4), -2.75, -0.25, 0.9, 0.13, 0.46);
    if (!small) addFloater(pickle(0.8, 0.7), 2.2, -1.75, 0.3, 0.12, 0.52);

    var looseOnion = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.05, 10, 36), onionMat);
    looseOnion.rotation.set(0.9, 0, 0.3);
    addFloater(looseOnion, -1.95, 2.2, -0.5, 0.14, 0.4);

    var seedGeo = new THREE.SphereGeometry(1, 10, 8);
    var seedMat = std(0xFFF2D2, 0.55);
    (small ? [[1.9, 2.3, 0.5], [-1.7, -2.15, 0.8]] : [[1.9, 2.3, 0.5], [-1.7, -2.15, 0.8], [2.95, 0.6, -0.2], [-3.0, 0.55, -0.4]])
      .forEach(function (s, i) {
        var m = new THREE.Mesh(seedGeo, seedMat);
        m.scale.set(0.075, 0.035, 0.125);
        m.rotation.set(0.5 + i, 0, 0.8 * i);
        addFloater(m, s[0], s[1], s[2], 0.18, 0.6 + i * 0.07);
      });

    /* ---------- Ombre douce au sol ---------- */
    var blob = (function () {
      var c = document.createElement('canvas');
      c.width = c.height = 128;
      var g = c.getContext('2d');
      var grd = g.createRadialGradient(64, 64, 4, 64, 64, 64);
      grd.addColorStop(0, 'rgba(122, 62, 20, 0.5)');
      grd.addColorStop(0.55, 'rgba(122, 62, 20, 0.16)');
      grd.addColorStop(1, 'rgba(122, 62, 20, 0)');
      g.fillStyle = grd;
      g.fillRect(0, 0, 128, 128);
      var tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      var mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(5.4, 5.4),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false })
      );
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = -FULL / 2 - 0.42;
      return mesh;
    })();
    root.add(blob);

    /* ---------- Cadrage ---------- */
    function frame() {
      var w = stage.clientWidth, h = stage.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      var t2 = 2 * Math.tan(FOV * Math.PI / 360);
      var d = Math.max(6.3 / t2, 6.9 / (t2 * camera.aspect));
      camera.position.set(0, -0.12 + Math.sin(ELEV) * d, Math.cos(ELEV) * d);
      camera.lookAt(0, -0.12, 0);
      camera.updateProjectionMatrix();
    }

    /* ---------- Animation ---------- */
    var t = reduce ? 2.2 : 0;
    var open = reduce ? 1 : 0;     // 0 = burger refermé, 1 = ingrédients séparés
    var openV = 0;
    var intro = reduce ? 1 : 0;
    var squeezeUntil = -1;
    var px = 0, py = 0, tx = 0, ty = 0;

    function easeOutBack(x) { var c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }

    function update(dt) {
      if (!reduce) {
        t += dt;
        intro = Math.min(1, intro + dt / 1.1);
        var target = (t < 0.35 || t < squeezeUntil) ? 0.04 : 1;
        openV += ((target - open) * 70 - openV * 9.5) * dt;   // petit ressort : léger rebond à l'ouverture
        open += openV * dt;
        px += (tx - px) * Math.min(1, dt * 3);
        py += (ty - py) * Math.min(1, dt * 3);
      }
      var e = Math.max(0, open);
      root.scale.setScalar(0.78 + 0.22 * easeOutBack(intro));
      burger.position.y = -(STACK + SPREAD * e) / 2;

      for (var i = 0; i < N; i++) {
        var l = layers[i];
        l.g.position.y = l.y + l.off * e + Math.sin(t * 0.9 + i * 0.85) * 0.045 * e;
        l.g.rotation.y = Math.sin(t * 0.3 + i * 1.1) * 0.14;
        l.g.rotation.z = Math.sin(t * 0.55 + i * 1.7) * 0.022 * e;
        l.g.rotation.x = Math.cos(t * 0.5 + i * 1.3) * 0.022 * e;
      }
      burger.rotation.y = t * 0.22 + px * 0.45;
      burger.rotation.x = py * 0.1;
      burger.rotation.z = Math.sin(t * 0.4) * 0.03;

      for (var f = 0; f < floaters.length; f++) {
        var fl = floaters[f];
        fl.m.position.set(
          fl.x + Math.sin(t * fl.speed * 0.7 + fl.ph) * fl.amp * 0.6,
          fl.y + Math.sin(t * fl.speed + fl.ph * 1.3) * fl.amp,
          fl.z
        );
        fl.m.rotation.x = fl.rx + Math.sin(t * fl.speed * 0.8 + fl.ph) * 0.35;
        fl.m.rotation.z = fl.rz + Math.cos(t * fl.speed * 0.6 + fl.ph) * 0.3;
        fl.m.rotation.y = t * 0.18 * (f % 2 ? -1 : 1);
      }
      orbit.rotation.y = Math.sin(t * 0.12) * 0.18 + px * 0.12;

      var bs = 0.92 + 0.08 * e + Math.sin(t * 0.9) * 0.015;
      blob.scale.set(bs, bs, 1);
    }

    function render() { renderer.render(scene, camera); }

    var running = false, raf = 0, last = 0, visible = true, shown = false;
    var frames = 0, slow = 0, degraded = false;

    function degrade() {
      degraded = true;
      renderer.setPixelRatio(1);
      if (shadows) {
        shadows = false;
        key.castShadow = false;
        renderer.shadowMap.enabled = false;
        scene.traverse(function (o) { if (o.material) o.material.needsUpdate = true; });
      }
      frame();
    }

    function tick(now) {
      raf = window.requestAnimationFrame(tick);
      var raw = (now - last) / 1000;
      last = now;
      update(Math.min(0.05, Math.max(0, raw)));
      render();
      if (!shown) { shown = true; stage.classList.add('is-3d'); }
      // Si l'appareil peine sur les premières secondes, on allège le rendu.
      // (Les très longs écarts viennent d'une page mise en veille, pas d'un rendu lent : on les ignore.)
      if (!degraded && frames < 150 && raw < 0.25) {
        frames++;
        if (frames > 30 && raw > 0.045) slow++;
        if (frames === 150 && slow > 50) degrade();
      }
    }
    function start() {
      if (running || reduce || !visible || document.hidden) return;
      running = true;
      last = window.performance.now();
      raf = window.requestAnimationFrame(tick);
    }
    function stop() {
      running = false;
      window.cancelAnimationFrame(raf);
    }
    function still() {
      update(0);
      render();
      if (!shown) { shown = true; stage.classList.add('is-3d'); }
    }

    stage.insertBefore(canvas, stage.querySelector('.px'));
    frame();

    if ('ResizeObserver' in window) {
      new ResizeObserver(function () { frame(); if (!running) still(); }).observe(stage);
    } else {
      window.addEventListener('resize', function () { frame(); if (!running) still(); });
    }

    if (reduce) {
      still();
    } else {
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          visible = entries[0].isIntersecting;
          if (visible) start(); else stop();
        }, { rootMargin: '80px' }).observe(stage);
      }
      document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });

      window.addEventListener('pointermove', function (ev) {
        if (ev.pointerType === 'touch') return;
        tx = ev.clientX / window.innerWidth * 2 - 1;
        ty = ev.clientY / window.innerHeight * 2 - 1;
      }, { passive: true });

      // Un clic referme le burger un instant, puis il se rouvre.
      stage.addEventListener('click', function () { squeezeUntil = t + 0.55; });

      start();
    }

    canvas.addEventListener('webglcontextlost', function (ev) {
      ev.preventDefault();
      stop();
      stage.classList.remove('is-3d');
    });
  }
})();
