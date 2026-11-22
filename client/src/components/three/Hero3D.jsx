// Realistic 3D hero scene: shopping bag, gift box and credit card, built procedurally with three.js
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function makeBag() {
  const g = new THREE.Group();
  const paper = new THREE.MeshPhysicalMaterial({ color: '#6d5efc', roughness: 0.42, clearcoat: 0.6, clearcoatRoughness: 0.25, sheen: 0.4 });
  const body = new THREE.Mesh(new RoundedBoxGeometry(1.5, 1.8, 0.62, 6, 0.06), paper);
  g.add(body);

  // printed logo on the front
  const label = canvasTexture(512, 512, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 34;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(130, 360);
    ctx.lineTo(130, 150);
    ctx.lineTo(256, 270);
    ctx.lineTo(382, 150);
    ctx.lineTo(382, 360);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    ctx.font = '800 52px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MINUTO ME', 256, 450);
  });
  const front = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), new THREE.MeshStandardMaterial({ map: label, transparent: true, roughness: 0.5 }));
  front.position.set(0, -0.05, 0.315);
  g.add(front);

  // rope handles (front and back)
  const rope = new THREE.MeshPhysicalMaterial({ color: '#1e1b4b', roughness: 0.55, clearcoat: 0.3 });
  for (const z of [0.2, -0.2]) {
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.04, 16, 60, Math.PI), rope);
    handle.position.set(0, 0.9, z);
    g.add(handle);
  }
  return g;
}

function makeGift() {
  const g = new THREE.Group();
  const wrap = new THREE.MeshPhysicalMaterial({ color: '#f472b6', roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.12 });
  const ribbonMat = new THREE.MeshPhysicalMaterial({ color: '#fbbf24', metalness: 0.85, roughness: 0.22, clearcoat: 1 });

  const box = new THREE.Mesh(new RoundedBoxGeometry(1.1, 0.9, 1.1, 5, 0.05), wrap);
  g.add(box);
  const lid = new THREE.Mesh(new RoundedBoxGeometry(1.22, 0.26, 1.22, 5, 0.05), wrap);
  lid.position.y = 0.56;
  g.add(lid);

  const r1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.28, 1.25), ribbonMat);
  r1.position.y = 0.1;
  const r2 = r1.clone();
  r2.rotation.y = Math.PI / 2;
  g.add(r1, r2);

  for (const side of [-1, 1]) {
    const loop = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.055, 16, 40), ribbonMat);
    loop.position.set(side * 0.2, 0.82, 0);
    loop.rotation.set(0, 0, side * 0.6);
    loop.scale.set(1, 0.75, 0.6);
    g.add(loop);
  }
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.09, 24, 24), ribbonMat);
  knot.position.y = 0.76;
  g.add(knot);
  return g;
}

function makeCard() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new RoundedBoxGeometry(1.7, 1.07, 0.05, 4, 0.02),
    new THREE.MeshPhysicalMaterial({ color: '#0f0c29', metalness: 0.6, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.08 })
  );
  g.add(body);

  const face = canvasTexture(1024, 646, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#1e1b4b');
    grad.addColorStop(0.55, '#4338ca');
    grad.addColorStop(1, '#0891b2');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    // soft light streak
    const glow = ctx.createRadialGradient(w * 0.85, h * 0.1, 10, w * 0.85, h * 0.1, w * 0.6);
    glow.addColorStop(0, 'rgba(255,255,255,.35)');
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
    // chip
    const chip = ctx.createLinearGradient(80, 230, 230, 340);
    chip.addColorStop(0, '#fde68a');
    chip.addColorStop(1, '#d97706');
    ctx.fillStyle = chip;
    ctx.beginPath();
    ctx.roundRect(80, 230, 150, 112, 18);
    ctx.fill();
    ctx.strokeStyle = 'rgba(120,53,15,.5)';
    ctx.lineWidth = 3;
    for (const y of [268, 304]) {
      ctx.beginPath();
      ctx.moveTo(80, y);
      ctx.lineTo(230, y);
      ctx.stroke();
    }
    ctx.fillStyle = '#fff';
    ctx.font = '800 54px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Minuto Me', 80, 130);
    ctx.font = '600 58px monospace';
    ctx.fillText('4242  ••••  ••••  2026', 80, 460);
    ctx.font = '600 32px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,.8)';
    ctx.fillText('STORE OWNER', 80, 560);
    ctx.fillText('12/29', 760, 560);
    // brand circles
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(840, 130, 56, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(905, 130, 56, 0, Math.PI * 2);
    ctx.fill();
  });
  const front = new THREE.Mesh(new THREE.PlaneGeometry(1.66, 1.03), new THREE.MeshPhysicalMaterial({ map: face, roughness: 0.28, metalness: 0.2, clearcoat: 1 }));
  front.position.z = 0.0265;
  g.add(front);
  return g;
}

function makeCoin() {
  const coin = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.22, 0.05, 48),
    new THREE.MeshPhysicalMaterial({ color: '#fbbf24', metalness: 1, roughness: 0.18 })
  );
  coin.rotation.x = Math.PI / 2;
  return coin;
}

export default function Hero3D({ className, style, compact = false }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch {
      return undefined; // no WebGL -- the CSS background still looks fine
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    Object.assign(renderer.domElement.style, { width: '100%', height: '100%', display: 'block' });
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
    scene.environment = envTex;

    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0, compact ? 9 : 8.2);

    scene.add(new THREE.AmbientLight('#ffffff', 0.25));
    const key = new THREE.DirectionalLight('#ffffff', 1.6);
    key.position.set(3, 5, 6);
    scene.add(key);
    const rimA = new THREE.PointLight('#a855f7', 30, 20);
    rimA.position.set(-4, 2, -2);
    const rimB = new THREE.PointLight('#22d3ee', 25, 20);
    rimB.position.set(4, -3, 1);
    scene.add(rimA, rimB);

    const root = new THREE.Group();
    scene.add(root);

    const bag = makeBag();
    bag.position.set(-0.2, 0.2, 0);
    bag.rotation.set(0.05, -0.45, 0.04);

    const gift = makeGift();
    gift.position.set(1.85, -1.15, 0.6);
    gift.scale.setScalar(0.8);
    gift.rotation.set(0.25, 0.6, -0.1);

    const card = makeCard();
    card.position.set(-1.9, -1.2, 1);
    card.rotation.set(-0.35, 0.55, 0.28);
    card.scale.setScalar(0.92);

    const coins = [
      [1.7, 1.45, -0.4],
      [-2.2, 1.3, -0.8],
      [0.6, -1.95, 1.2],
    ].map((p) => {
      const c = makeCoin();
      c.position.set(...p);
      root.add(c);
      return c;
    });

    root.add(bag, gift, card);
    const models = [
      { obj: bag, base: bag.position.clone(), rot: bag.rotation.clone(), speed: 0.9, amp: 0.12, spin: 0.25 },
      { obj: gift, base: gift.position.clone(), rot: gift.rotation.clone(), speed: 1.2, amp: 0.15, spin: 0.4 },
      { obj: card, base: card.position.clone(), rot: card.rotation.clone(), speed: 1.05, amp: 0.13, spin: 0.3 },
    ];

    // soft particle dust
    const dustGeo = new THREE.BufferGeometry();
    const N = 160;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 7;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 4 - 1;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: '#c4b5fd', size: 0.03, transparent: true, opacity: 0.7 }));
    scene.add(dust);

    const resize = () => {
      const w = mount.clientWidth || 1;
      const h = mount.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // pull back on narrow screens so all three models stay in frame
      camera.position.z = (compact ? 9 : 8.2) * Math.max(1, 1.15 / camera.aspect);
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    const pointer = { x: 0, y: 0 };
    const onMove = (e) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let visible = true;
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(mount);

    const clock = new THREE.Clock();
    let raf;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!visible) return;
      const t = reduce ? 0 : clock.getElapsedTime();
      for (const m of models) {
        m.obj.position.y = m.base.y + Math.sin(t * m.speed) * m.amp;
        m.obj.rotation.y = m.rot.y + Math.sin(t * m.spin) * 0.35;
        m.obj.rotation.x = m.rot.x + Math.cos(t * m.spin * 0.8) * 0.08;
      }
      coins.forEach((c, i) => {
        c.rotation.z = t * (0.8 + i * 0.3);
        c.position.y += Math.sin(t * 1.4 + i) * 0.002;
      });
      dust.rotation.y = t * 0.02;
      root.rotation.y += ((pointer.x * 0.25) - root.rotation.y) * 0.05;
      root.rotation.x += ((pointer.y * 0.15) - root.rotation.x) * 0.05;
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
        mats.forEach((m) => {
          if (m.map) m.map.dispose();
          m.dispose();
        });
      });
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, [compact]);

  return <div ref={mountRef} className={className} style={{ width: '100%', height: '100%', ...style }} aria-hidden="true" />;
}
