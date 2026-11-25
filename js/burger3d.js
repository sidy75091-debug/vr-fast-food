/* Procedural product scene. Three.js MIT; no downloaded model or product photograph. */
(function () {
  'use strict';

  // Pour héberger Three.js soi-même : copier three.module.min.js dans js/vendor/
  // et remplacer cette adresse par './vendor/three.module.min.js' (le site doit alors être servi en HTTP).
  var THREE_URL = './vendor/three.module.min.js';

  var stage = document.getElementById('burgerStage');
  if (!stage) return;

  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
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
  var loaded = false;
  function schedule() { if (loaded) return; loaded = true; if ('requestIdleCallback' in window) requestIdleCallback(load, {timeout:1500}); else setTimeout(load,200); }
  if ('IntersectionObserver' in window) { var lazy = new IntersectionObserver(function(entries) { if(entries[0].isIntersecting) {lazy.disconnect();schedule();} }, {rootMargin:'120px'}); lazy.observe(stage); } else schedule();

  function build(THREE) {
    var canvas = document.createElement('canvas');
    canvas.className = 'stage__canvas';
    canvas.setAttribute('aria-hidden', 'true');

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'default' });
    } catch (e) {
      return;
    }

    var dpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2);
    var shadows = !small;
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.NeutralToneMapping || THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.96;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.enabled = shadows;

    var scene = new THREE.Scene();
    var FOV = 28;
    var ELEV = 15 * Math.PI / 180;
    var camera = new THREE.PerspectiveCamera(FOV, 1, 2, 50);

    /* ---------- Lumière : claire, chaude, ombres douces ---------- */
    scene.add(new THREE.HemisphereLight(0xfff7e8, 0x70513b, 1.65));

    var key = new THREE.DirectionalLight(0xfffaf0, 3.1);
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

    var fill = new THREE.DirectionalLight(0xffe1bd, 0.55);
    fill.position.set(6, 1.5, 4);
    scene.add(fill);

    var rim = new THREE.DirectionalLight(0xfff1e0, 1.4);
    rim.position.set(1, 4, -7);
    scene.add(rim);

    /* ---------- Outils ---------- */
    var SEG = small ? 80 : 120;
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

    // Deterministic, continuous displacement: no random seams on lathed surfaces.
    function noise(x,y,z) { return Math.sin(x*17+y*23+z*13)*Math.cos(z*19-x*11+y*7); }
    function organic(geo, amount, coarse) {
      var p = geo.attributes.position;
      for(var i=0;i<p.count;i++) {
        var x=p.getX(i), y=p.getY(i), z=p.getZ(i), a=Math.atan2(z,x);
        var f=1+coarse*(Math.sin(a*3+.4)+.45*Math.cos(a*7+y*2));
        var n=noise(x,y,z)*amount;
        p.setXYZ(i,x*f+n*x*.3,y+n,z*f+n*z*.3);
      }
      geo.computeVertexNormals(); return geo;
    }
    function texture(kind) {
      var c=document.createElement('canvas');c.width=c.height=512;
      var ctx=c.getContext('2d'), pixels=ctx.createImageData(512,512), seed=54;
      function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
      for(var i=0;i<512*512;i++) {
        var x=i%512, y=Math.floor(i/512), n=rand(), mottled=Math.sin(x*.13)*Math.sin(y*.17)*.5+.5;
        var v=kind==='meat'? 55+n*80+mottled*38 : 170+n*55+mottled*25;
        pixels.data[i*4]=v;pixels.data[i*4+1]=v;pixels.data[i*4+2]=v;pixels.data[i*4+3]=255;
      }
      ctx.putImageData(pixels,0,0);
      var t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping;
      t.repeat.set(kind==='meat'?3:2,kind==='meat'?1:1);return t;
    }
    function foodColour(kind) {
      var c=document.createElement('canvas');c.width=c.height=512;var g=c.getContext('2d');
      g.fillStyle=kind==='meat'?'#745039':'#e4c5a0';g.fillRect(0,0,512,512);
      var seed=91;function rnd(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
      for(var i=0;i<14000;i++){var x=rnd()*512,y=rnd()*512,r=rnd()*(kind==='meat'?3.2:1.3)+.3;g.fillStyle=kind==='meat'?(rnd()>.35?'rgba(35,20,12,.3)':'rgba(168,117,72,.28)'):'rgba(108,56,20,.14)';g.beginPath();g.ellipse(x,y,r,r*.65,rnd()*3,0,Math.PI*2);g.fill();}
      var tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(2,1);return tex;
    }
    var bunTexture=texture('bun'), meatTexture=texture('meat');
    var bunLight = new THREE.Color(0xc7904b), bunDark = new THREE.Color(0x8d461f), crumb = new THREE.Color(0xf0cd8e);
    var bunMat = new THREE.MeshStandardMaterial({map:foodColour('bun'),vertexColors:true,roughness:0.67,metalness:0,bumpMap:bunTexture,bumpScale:0.055});

    /* ---------- Pain du dessus + graines de sésame ---------- */
    var domeCurve = new THREE.SplineCurve([
      V2(1.40, 0), V2(1.50, 0.05), V2(1.56, 0.20), V2(1.53, 0.44), V2(1.38, 0.70),
      V2(1.12, 0.92), V2(0.78, 1.06), V2(0.40, 1.14), V2(0, 1.16)
    ]);
    var domeGeo = organic(new THREE.LatheGeometry(domeCurve.getPoints(60), SEG),0.009,0.012);
    tint(domeGeo, function (c, x, y, z) { c.copy(bunLight).lerp(bunDark, smooth(y / 1.16)*.6 + Math.max(0,noise(x*.35,y*.35,z*.35))*.16); if(y<.1)c.lerp(crumb,.42); });

    var bunTop = new THREE.Group();
    bunTop.add(cast(new THREE.Mesh(domeGeo, bunMat)));
    var bunTopCap = new THREE.Mesh(new THREE.CircleGeometry(1.40, 48), std(0xF8DFAE, 0.85));
    bunTopCap.rotation.x = Math.PI / 2;
    bunTop.add(bunTopCap);

    (function addSeeds() {
      var n = small ? 65 : 95;
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
        var f=1+.012*(Math.sin(th*3+.4)+.45*Math.cos(th*7+p.y*2));
        pos.set(p.x * Math.cos(th)*f, p.y+.008, p.x * Math.sin(th)*f).addScaledVector(nrm, 0.012);
        q.setFromUnitVectors(up, nrm);
        q2.setFromAxisAngle(up, i * 1.7);
        q.multiply(q2);
        var s = 0.9 + 0.25 * Math.sin(i * 3.1);
        scl.set(0.023 * s, 0.013, 0.052 * s);
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
    var bottomGeo = organic(new THREE.LatheGeometry(bottomPts, SEG),.008,.012);
    tint(bottomGeo, function (c, x, y, z) {
      if (y > 0.475 && Math.hypot(x, z) < 1.39) c.copy(crumb);
      else c.copy(bunDark).lerp(bunLight, smooth(y / 0.45));
    });
    var bunBottom = new THREE.Group();
    bunBottom.add(cast(new THREE.Mesh(bottomGeo, bunMat)));

    /* ---------- Steak ---------- */
    var patty = new THREE.Group();
    var pattyGeo=organic(new THREE.LatheGeometry(discProfile(1.52,.37,.12,.12,12),SEG),.018,.02);
    tint(pattyGeo,function(c,x,y,z){c.set(0x482415).lerp(new THREE.Color(0x7e4b29),.25+.25*noise(x*3,y*3,z*3));});
    patty.add(cast(new THREE.Mesh(pattyGeo,std(0xffffff,.86,{map:foodColour('meat'),vertexColors:true,bumpMap:meatTexture,bumpScale:.15}))));
    // Tiny irregular browned morsels add silhouette detail, batched into one draw call.
    var bits=new THREE.InstancedMesh(new THREE.SphereGeometry(1,6,5),std(0x58321d,.8),small?110:200);
    var bit=new THREE.Object3D();
    for(var b=0;b<bits.count;b++){var a=b*2.39996,r=1.48+.025*Math.sin(b*8);bit.position.set(Math.cos(a)*r,.10+(b%9)*.021,Math.sin(a)*r);bit.scale.set(.025+.014*(b%3),.018+.01*(b%4),.027);bit.rotation.set(b,b*.7,b*.4);bit.updateMatrix();bits.setMatrixAt(b,bit.matrix);}patty.add(bits);

    /* ---------- Fromage (tranche carrée aux coins qui retombent) ---------- */
    var cheeseGeo = new THREE.BoxGeometry(2.75, 0.045, 2.75, 38, 1, 38);
    (function droop() {
      var p = cheeseGeo.attributes.position;
      for (var i = 0; i < p.count; i++) {
        var x = p.getX(i), z = p.getZ(i);
        var over = Math.max(0, Math.hypot(x, z) - 1.23);
        if (over > 0) {
          var k = 1 - over * 0.16;
          p.setXYZ(i, x * k, p.getY(i) - Math.pow(over, 1.5) * .55, z * k);
        }
      }
      cheeseGeo.computeVertexNormals();
    })();
    var cheese = new THREE.Group();
    var cheeseMesh = cast(new THREE.Mesh(cheeseGeo, std(0xe8a12a, 0.43, {bumpMap:bunTexture,bumpScale:.006})));
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
      var g = new THREE.RingGeometry(0.2, R, small ? 120 : 180, 24);
      var p = g.attributes.position, col = [];
      var cIn = new THREE.Color(0x355522), cOut = new THREE.Color(0x698a35), c = new THREE.Color();
      for (var i = 0; i < p.count; i++) {
        var x = p.getX(i), y = p.getY(i);
        var r = Math.hypot(x, y), th = Math.atan2(y, x), k = r / R;
        var rr = r * (1 + 0.05 * Math.sin(th * 5 + seed) * k);
        var h = (Math.sin(th * 9 + seed * 2 + k*4) * 0.065 + Math.sin(th * 23 + seed + k*8) * 0.025) * Math.pow(k, 2.4) - 0.06 * k * k;
        p.setXYZ(i, rr * Math.cos(th), h, -rr * Math.sin(th));
        c.copy(cIn).lerp(cOut, smooth(k * 1.1 - 0.15));
        col.push(c.r, c.g, c.b);
      }
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      g.computeVertexNormals();
      return g;
    }
    var lettuceMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.58, bumpMap:bunTexture,bumpScale:.016, metalness: 0, side: THREE.DoubleSide });
    var lettuce = new THREE.Group();
    var leafA = cast(new THREE.Mesh(lettuceGeo(1.62, 0.4), lettuceMat));
    leafA.position.y = 0.08;
    var leafB = cast(new THREE.Mesh(lettuceGeo(1.57, 2.1), lettuceMat));
    leafB.position.y = 0.15;
    leafB.rotation.y = 0.7;
    lettuce.add(leafA, leafB);

    /* ---------- Empilement ---------- */
    var root = new THREE.Group();
    var burger = new THREE.Group();
    root.add(burger);
    scene.add(root);

    // h = épaisseur de l'ingrédient ; gap = écart avec celui du dessous quand le burger est « ouvert »
    var GAP = 0.14;
    var layers = [];
    function addLayer(group, h, gap) { burger.add(group); layers.push({ g: group, h: h, gap: gap * GAP, y: 0, off: 0 }); }
    addLayer(bunBottom, 0.48, 0);
    addLayer(patty, 0.35, 1);
    addLayer(cheese, 0.04, 0.1);      // le fromage reste près du steak : ses coins retombent dessus
    addLayer(tomato, 0.2, 1.05);
    addLayer(onion, 0.06, 0.65);
    addLayer(lettuce, 0.15, 0.95);
    addLayer(bunTop, 1.16, 1.25);

    var STACK = 0, SPREAD = 0;
    layers.forEach(function (l) { l.y = STACK; STACK += l.h; SPREAD += l.gap; l.off = SPREAD; });
    var N = layers.length;
    var FULL = STACK + SPREAD;

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
        new THREE.PlaneGeometry(4.5, 4.5),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false })
      );
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = -STACK / 2 - 0.04;
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
      var d = Math.max(4.4 / t2, 4.4 / (t2 * camera.aspect));
      camera.position.set(0, -0.12 + Math.sin(ELEV) * d, Math.cos(ELEV) * d);
      camera.lookAt(0, -0.12, 0);
      camera.updateProjectionMatrix();
    }

    /* Le défilement pilote le plan. Le bouton permet de le revoir à l'arrêt. */
    var px=0, py=0, tx=0, ty=0, visible=false, running=false, raf=0, last=0;
    var contextLost=false, frames=0, slow=0, degraded=false;
    var replay=document.getElementById('replayBurger');
    var replayTime = null;
    var progress = 0;

    function measureProgress() {
      var rect = stage.getBoundingClientRect();
      var stageTop = rect.top + window.scrollY;
      var begin = Math.max(0, stageTop - window.innerHeight * 0.55);
      var end = stageTop + rect.height * 0.42;
      progress = Math.min(1, Math.max(0, (window.scrollY - begin) / Math.max(1, end - begin)));
    }
    function pose(dt) {
      var position = reduce ? 0 : progress;
      if (replayTime !== null && !reduce) {
        replayTime += dt;
        var elapsed = Math.min(1, replayTime / 2.4);
        position = (progress + elapsed) % 1;
        if (elapsed === 1) { replayTime = null; position = progress; }
      }
      var spread = position < 0.52 ? smooth(position / 0.52) : smooth((1 - position) / 0.48);
      px += (tx - px) * Math.min(1, dt * 4);
      py += (ty - py) * Math.min(1, dt * 4);
      burger.position.y = -(STACK + SPREAD * spread) / 2;
      layers.forEach(function(layer) { layer.g.position.y = layer.y + layer.off * spread; });
      burger.rotation.set(py * .055, -.22 + spread * .55 + px * .12, -.035);
    }
    function render(){renderer.render(scene,camera);stage.classList.add('is-3d');}
    function stop(){running=false;cancelAnimationFrame(raf);}
    function tick(now){
      if(!running)return;
      var raw=(now-last)/1000;last=now;pose(Math.min(raw,.045));render();
      if(!degraded && raw<.25 && ++frames<150){if(raw>.04)slow++;if(frames===149&&slow>45){degraded=true;renderer.setPixelRatio(1);renderer.shadowMap.enabled=false;frame();}}
      if(replayTime===null&&Math.abs(tx-px)+Math.abs(ty-py)<.0005){stop();return;}
      raf=requestAnimationFrame(tick);
    }
    function start(){if(running||reduce||!visible||document.hidden||contextLost)return;running=true;last=performance.now();raf=requestAnimationFrame(tick);}
    function refresh(){if(!visible||document.hidden||contextLost)return;measureProgress();frame();pose(0);render();start();}
    stage.append(canvas);frame();pose(0);
    var io=new IntersectionObserver(function(entries){visible=entries[0].isIntersecting;if(visible)refresh();else stop();},{threshold:.01});io.observe(stage);
    new ResizeObserver(function(){if(visible&&!document.hidden){refresh();}}).observe(stage);
    document.addEventListener('visibilitychange',function(){if(document.hidden)stop();else refresh();});
    window.addEventListener('scroll', function () {
      if (!visible || reduce) return;
      replayTime = null;
      measureProgress();
      start();
    }, { passive: true });
    if(!small){stage.addEventListener('pointermove',function(e){if(reduce||e.pointerType==='touch')return;var r=stage.getBoundingClientRect();tx=((e.clientX-r.left)/r.width-.5)*2;ty=((e.clientY-r.top)/r.height-.5)*2;start();},{passive:true});stage.addEventListener('pointerleave',function(){tx=ty=0;start();});}
    function motionChanged(){reduce=motion.matches;stop();tx=ty=px=py=0;replayTime=null;replay.hidden=reduce||contextLost;refresh();}
    motion.addEventListener('change',motionChanged);
    replay.hidden=reduce;
    replay.addEventListener('click',function(){if(reduce)return;replayTime=0;start();});
    canvas.addEventListener('webglcontextlost',function(e){e.preventDefault();contextLost=true;stop();stage.classList.remove('is-3d');replay.hidden=true;});
    canvas.addEventListener('webglcontextrestored',function(){contextLost=false;replay.hidden=reduce;refresh();});
  }
})();
