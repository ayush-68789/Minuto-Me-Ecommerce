// 3D product carousel for the storefront hero: the store's real product photos as glossy cards
// orbiting a glowing pedestal, lit in the store's brand colors. Drag / swipe to spin.
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

function roundedRectShape(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

// ShapeGeometry UVs are in shape space -> remap to 0..1 so the photo fills the card
function normalizeUVs(geo, w, h) {
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / w + 0.5, uv.getY(i) / h + 0.5);
  uv.needsUpdate = true;
  return geo;
}

export default function Showcase3D({ images = [], primary = '#6366f1', accent = '#f97316', dark = false, interactive = true, className, style }) {
  const mountRef = useRef(null);
  const key = images.slice(0, 8).join('|');

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch {
      return undefined; // no WebGL: the hero still has its text and gradient
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    Object.assign(renderer.domElement.style, { width: '100%', height: '100%', display: 'block', touchAction: interactive ? 'pan-y' : 'auto' });
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
    scene.environment = env;

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 1.4, 9);
    camera.lookAt(0, 0.2, 0);

    scene.add(new THREE.AmbientLight('#ffffff', dark ? 0.35 : 0.6));
    const keyL = new THREE.DirectionalLight('#ffffff', 1.4);
    keyL.position.set(3, 6, 6);
    scene.add(keyL);
    const rimA = new THREE.PointLight(primary, 40, 18);
    rimA.position.set(-4, 2, -1);
    const rimB = new THREE.PointLight(accent, 30, 18);
    rimB.position.set(4, -1, 2);
    scene.add(rimA, rimB);

    // pedestal + glow ring
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(2.6, 2.8, 0.28, 72),
      new THREE.MeshPhysicalMaterial({ color: dark ? '#1a1a26' : '#ffffff', roughness: 0.35, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.15 })
    );
    pedestal.position.y = -1.55;
    scene.add(pedestal);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.72, 0.035, 16, 120), new THREE.MeshBasicMaterial({ color: primary }));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -1.4;
    scene.add(ring);
    const halo = new THREE.Mesh(
      new THREE.RingGeometry(2.8, 4.2, 72),
      new THREE.MeshBasicMaterial({ color: primary, transparent: true, opacity: dark ? 0.18 : 0.1, side: THREE.DoubleSide })
    );
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = -1.68;
    scene.add(halo);

    const carousel = new THREE.Group();
    scene.add(carousel);
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');

    const pics = images.length ? images.slice(0, 8) : [null, null, null, null, null];
    const count = Math.max(pics.length, 4);
    const radius = count > 5 ? 2.7 : 2.3;
    const W = 1.5;
    const H = 1.9;
    const cards = [];
    for (let i = 0; i < count; i++) {
      const src = pics[i % pics.length];
      const g = new THREE.Group();
      const frame = new THREE.Mesh(
        new RoundedBoxGeometry(W + 0.12, H + 0.12, 0.06, 4, 0.08),
        new THREE.MeshPhysicalMaterial({ color: i % 2 ? accent : primary, roughness: 0.25, metalness: 0.3, clearcoat: 1 })
      );
      g.add(frame);
      const photoMat = new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.4 });
      const photo = new THREE.Mesh(normalizeUVs(new THREE.ShapeGeometry(roundedRectShape(W, H, 0.08), 8), W, H), photoMat);
      photo.position.z = 0.032;
      g.add(photo);
      if (src) {
        loader.load(
          src,
          (tex) => {
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.anisotropy = 8;
            // cover-fit the photo into the card
            const img = tex.image;
            const ar = img.width / img.height;
            const cardAr = W / H;
            if (ar > cardAr) { tex.repeat.set(cardAr / ar, 1); tex.offset.set((1 - cardAr / ar) / 2, 0); }
            else { tex.repeat.set(1, ar / cardAr); tex.offset.set(0, (1 - ar / cardAr) / 2); }
            photoMat.map = tex;
            photoMat.color.set('#ffffff');
            photoMat.needsUpdate = true;
          },
          undefined,
          () => {}
        );
      }
      const a = (i / count) * Math.PI * 2;
      g.position.set(Math.sin(a) * radius, 0, Math.cos(a) * radius);
      g.rotation.y = a;
      g.userData = { a, phase: i * 0.9 };
      carousel.add(g);
      cards.push(g);
    }

    // sparkles
    const N = 120;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 11;
      pos[i * 3 + 1] = Math.random() * 5 - 1.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 7;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: accent, size: 0.04, transparent: true, opacity: 0.8 }));
    scene.add(dust);

    const resize = () => {
      const w = mount.clientWidth || 1;
      const h = mount.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.position.z = 9 * Math.max(1, 1.1 / camera.aspect);
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    // drag to spin with inertia
    let vel = 0.004;
    let dragging = false;
    let lastX = 0;
    const down = (e) => { dragging = true; lastX = e.clientX; };
    const move = (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      vel = dx * 0.0035;
      carousel.rotation.y += vel;
    };
    const up = () => { dragging = false; };
    if (interactive) {
      renderer.domElement.addEventListener('pointerdown', down);
      window.addEventListener('pointermove', move, { passive: true });
      window.addEventListener('pointerup', up);
    }

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let visible = true;
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; });
    io.observe(mount);
    const clock = new THREE.Clock();
    let raf;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!visible) return;
      const t = clock.getElapsedTime();
      if (!dragging && !reduce) {
        vel += (0.004 - vel) * 0.02;
        carousel.rotation.y += vel;
      }
      cards.forEach((c) => {
        c.position.y = reduce ? 0 : Math.sin(t * 1.2 + c.userData.phase) * 0.12;
      });
      halo.material.opacity = (dark ? 0.16 : 0.08) + Math.sin(t * 1.5) * 0.04;
      dust.rotation.y = t * 0.03;
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      renderer.domElement.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
        mats.forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); });
      });
      env.dispose();
      pmrem.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, [key, primary, accent, dark, interactive]);

  return <div ref={mountRef} className={className} style={{ width: '100%', height: '100%', cursor: interactive ? 'grab' : 'default', ...style }} aria-hidden="true" />;
}
