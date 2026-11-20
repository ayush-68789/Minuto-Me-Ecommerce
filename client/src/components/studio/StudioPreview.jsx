// Live store preview for the studio: desktop, phone, and two real-DOM 3D views
// ("devices": laptop + phone you can orbit, "layers": the page exploded into its sections).
// Everything is the actual storefront markup, so what the owner sees is exactly what shoppers get.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { storeThemeAttrs, storeThemeVars, resolveTheme } from '../../theme/themeConfig';
import { useFonts } from '../../hooks/useStoreTheme';
import Navbar from '../storefront/Navbar';
import Footer from '../storefront/Footer';
import { StoreSections, useStoreSections } from '../storefront/sections';
import { IconCube, IconLayers, IconMonitor, IconPhone, IconRotate, IconExpand, IconX } from '../common/Icons';
import '../storefront/storefront.css';
import './studio.css';

/** The full storefront page in preview mode */
export function StorePage({ store, products }) {
  const t = resolveTheme(store);
  useFonts([t.font]);
  return (
    <div className="sf sf-preview" {...storeThemeAttrs(store)} style={storeThemeVars(store)}>
      <Navbar store={store} preview />
      <main className="sf-body">
        <StoreSections store={store} products={products} preview onAdd={() => {}} />
      </main>
      <Footer store={store} preview />
    </div>
  );
}

/** Renders children at a fixed CSS width and scales them to fit the box (scrollable when `scroll`). */
function Scaled({ width, fit = 'width', boxHeight, scroll = true, autoScroll = false, children, className = '' }) {
  const boxRef = useRef(null);
  const innerRef = useRef(null);
  const [scale, setScale] = useState(0.5);
  const [h, setH] = useState(0);

  useLayoutEffect(() => {
    const box = boxRef.current;
    const inner = innerRef.current;
    if (!box || !inner) return undefined;
    const measure = () => {
      setScale(Math.max(0.05, box.clientWidth / width));
      setH(inner.offsetHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    ro.observe(inner);
    return () => ro.disconnect();
  }, [width, fit]);

  // gentle auto-scroll used inside the 3D devices so the page feels alive
  useEffect(() => {
    if (!autoScroll) return undefined;
    const box = boxRef.current;
    let raf;
    let dir = 1;
    let pause = 120;
    const step = () => {
      raf = requestAnimationFrame(step);
      if (!box || box.matches(':hover')) return;
      if (pause > 0) { pause -= 1; return; }
      const max = box.scrollHeight - box.clientHeight;
      box.scrollTop += dir * 0.9;
      if (box.scrollTop >= max - 1) { dir = -1; pause = 120; }
      if (box.scrollTop <= 0) { dir = 1; pause = 120; }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [autoScroll]);

  return (
    <div ref={boxRef} className={`st-scaled ${className}`} style={{ height: boxHeight, overflowY: scroll ? 'auto' : 'hidden' }}>
      <div style={{ height: h * scale, position: 'relative' }}>
        <div ref={innerRef} style={{ width, transform: `scale(${scale})`, transformOrigin: '0 0', position: 'absolute', top: 0, left: 0 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ---------------- drag-to-orbit helper ----------------
   Rotation lives in a ref and is written straight to the DOM, so orbiting/idle sway
   never re-renders the (heavy) store pages inside the scene. */
function useOrbit(initial, toTransform, deps = []) {
  const worldRef = useRef(null);
  const rot = useRef({ ...initial });
  const drag = useRef(null);
  const touchedRef = useRef(false);
  const [touched, setTouched] = useState(false);
  const fmt = useRef(toTransform);
  fmt.current = toTransform;

  const apply = () => { if (worldRef.current) worldRef.current.style.transform = fmt.current(rot.current); };

  useEffect(() => {
    apply();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    let raf;
    const t0 = performance.now();
    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      if (touchedRef.current || drag.current) return;
      const t = (now - t0) / 1000;
      rot.current = { x: initial.x + Math.sin(t * 0.25) * 2.5, y: initial.y + Math.sin(t * 0.35) * 9 };
      apply();
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(apply); // re-apply after renders (e.g. zoom change)

  const handlers = {
    onPointerDown: (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      if (e.target.closest('button, input, a')) return;
      drag.current = { x: e.clientX, y: e.clientY, r: { ...rot.current } };
      touchedRef.current = true;
      setTouched(true);
      e.currentTarget.setPointerCapture?.(e.pointerId);
    },
    onPointerMove: (e) => {
      const d = drag.current;
      if (!d) return;
      rot.current = { y: d.r.y + (e.clientX - d.x) * 0.35, x: Math.max(-10, Math.min(80, d.r.x - (e.clientY - d.y) * 0.25)) };
      apply();
    },
    onPointerUp: () => { drag.current = null; },
    onPointerCancel: () => { drag.current = null; },
  };
  const reset = () => { touchedRef.current = false; setTouched(false); rot.current = { ...initial }; apply(); };
  return { worldRef, handlers, reset, touched };
}

/** scale factor that fits a (w x h) design into the scene box */
function useFit(w, h) {
  const ref = useRef(null);
  const [fit, setFit] = useState(1);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const m = () => setFit(Math.min(1.25, el.clientWidth / w, el.clientHeight / h));
    m();
    const ro = new ResizeObserver(m);
    ro.observe(el);
    return () => ro.disconnect();
  }, [w, h]);
  return [ref, fit];
}

function DevicesScene({ store, products, zoom }) {
  const [sceneRef, fit] = useFit(980, 720);
  const { worldRef, handlers, reset, touched } = useOrbit({ x: 8, y: -18 }, (r) => `scale(${zoom * fit}) rotateX(${r.x}deg) rotateY(${r.y}deg)`);
  return (
    <div className="p3d-scene" ref={sceneRef} {...handlers}>
      <div className="p3d-world" ref={worldRef}>
        <div className="p3d-floor" />
        <div className="p3d-laptop">
          <div className="p3d-lid">
            <div className="p3d-screen">
              <span className="p3d-cam" />
              <Scaled width={1280} autoScroll className="p3d-screen-in"><StorePage store={store} products={products} /></Scaled>
            </div>
            <div className="p3d-lid-back" />
          </div>
          <div className="p3d-base"><span className="p3d-pad" /></div>
        </div>
        <div className="p3d-phone">
          <div className="p3d-phone-body">
            <span className="p3d-notch" />
            <Scaled width={390} autoScroll className="p3d-phone-in"><StorePage store={store} products={products} /></Scaled>
          </div>
          <div className="p3d-phone-back" />
        </div>
      </div>
      {touched && <button type="button" className="p3d-reset" onClick={reset}><IconRotate size={14} /> Reset view</button>}
    </div>
  );
}

function LayerView({ store, products, zoom, spread, onPick, active }) {
  const t = resolveTheme(store);
  useFonts([t.font]);
  const sections = useStoreSections({ store, products, preview: true, onAdd: () => {} });
  const vars = storeThemeVars(store);
  const attrs = storeThemeAttrs(store);
  const layers = [
    { key: 'nav', label: 'Navigation', node: <Navbar store={store} preview /> },
    ...sections,
    { key: 'footer', label: 'Footer', node: <Footer store={store} preview /> },
  ];
  const [sceneRef, fit] = useFit(900, 900);
  const { worldRef, handlers, reset, touched } = useOrbit({ x: 52, y: -28 }, (r) => `scale(${zoom * fit}) rotateX(${r.x}deg) rotateZ(${r.y}deg)`);
  return (
    <div className="p3d-scene layers" ref={sceneRef} {...handlers}>
      <div className="p3d-world" ref={worldRef}>
        <div className="p3d-stack">
          {layers.map((l, i) => (
            <div
              key={l.key}
              className={`p3d-layer${active === l.key ? ' on' : ''}`}
              style={{ transform: `translateZ(${i * spread}px)`, '--hue': (i * 37) % 360 }}
              onClick={(e) => { e.stopPropagation(); onPick?.(l.key); }}
            >
              <span className="p3d-tag">{String(i + 1).padStart(2, '0')} · {l.label}</span>
              <Scaled width={1280} scroll={false}>
                <div className="sf sf-preview sf-layer" {...attrs} style={vars}>
                  <div className={`sf-sec sf-sec-${l.key}${['hero', 'marquee', 'perks', 'nav', 'footer'].includes(l.key) ? ' flush' : ''}`} style={{ paddingBottom: ['nav', 'footer', 'hero', 'marquee', 'perks'].includes(l.key) ? 0 : 36 }}>
                    {l.node}
                  </div>
                </div>
              </Scaled>
            </div>
          ))}
        </div>
      </div>
      {touched && <button type="button" className="p3d-reset" onClick={reset}><IconRotate size={14} /> Reset view</button>}
    </div>
  );
}

const MODES = [
  ['desktop', 'Desktop', IconMonitor],
  ['mobile', 'Mobile', IconPhone],
  ['3d', '3D devices', IconCube],
  ['layers', '3D layers', IconLayers],
];

export default function StudioPreview({ store, products, defaultMode = 'desktop', height, onSectionPick, activeSection, url, allowFullscreen = true, onClose }) {
  const [mode, setMode] = useState(defaultMode);
  const [zoom, setZoom] = useState(1);
  const [spread, setSpread] = useState(70);
  const [full, setFull] = useState(false);
  const host = useMemo(() => url || `minuto.me/store/${store.slug || 'your-store'}`, [url, store.slug]);

  useEffect(() => { setZoom(1); }, [mode]);
  useEffect(() => {
    if (!full) return undefined;
    const onKey = (e) => e.key === 'Escape' && setFull(false);
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [full]);

  const body = (
    <div className={`st-preview${full ? ' full' : ''}`} style={{ height: full ? undefined : height }}>
      <div className="st-preview-bar">
        <div className="st-modes" role="tablist">
          {MODES.map(([id, label, Icon]) => (
            <button key={id} type="button" role="tab" aria-selected={mode === id} className={mode === id ? 'on' : ''} onClick={() => setMode(id)} title={label}>
              <Icon size={16} /><span>{label}</span>
            </button>
          ))}
        </div>
        <div className="st-preview-tools">
          {(mode === '3d' || mode === 'layers') && (
            <>
              <button type="button" className="st-tool" onClick={() => setZoom((z) => Math.max(0.4, +(z - 0.15).toFixed(2)))} aria-label="Zoom out">−</button>
              <span className="st-zoom">{Math.round(zoom * 100)}%</span>
              <button type="button" className="st-tool" onClick={() => setZoom((z) => Math.min(1.8, +(z + 0.15).toFixed(2)))} aria-label="Zoom in">+</button>
            </>
          )}
          {mode === 'layers' && (
            <label className="st-spread" title="Layer spread">
              <IconLayers size={14} />
              <input type="range" min="0" max="160" value={spread} onChange={(e) => setSpread(+e.target.value)} aria-label="Layer spread" />
            </label>
          )}
          {allowFullscreen && !onClose && (
            <button type="button" className="st-tool" onClick={() => setFull(!full)} aria-label={full ? 'Exit full screen' : 'Full screen'}>{full ? <IconX size={16} /> : <IconExpand size={15} />}</button>
          )}
          {onClose && <button type="button" className="st-tool" onClick={onClose} aria-label="Close preview"><IconX size={16} /></button>}
        </div>
      </div>

      <div className={`st-stage st-stage-${mode}`}>
        {mode === 'desktop' && (
          <div className="st-browser">
            <div className="st-browser-bar"><i /><i /><i /><span>🔒 {host}</span></div>
            <Scaled width={1280} className="st-browser-body"><StorePage store={store} products={products} /></Scaled>
          </div>
        )}
        {mode === 'mobile' && (
          <div className="st-phone">
            <span className="st-phone-notch" />
            <div className="st-phone-status"><b>9:41</b><span>●●● 5G ▮</span></div>
            <Scaled width={390} className="st-phone-screen"><StorePage store={store} products={products} /></Scaled>
            <span className="st-phone-bar" />
          </div>
        )}
        {mode === '3d' && <DevicesScene store={store} products={products} zoom={zoom} />}
        {mode === 'layers' && <LayerView store={store} products={products} zoom={zoom} spread={spread} onPick={onSectionPick} active={activeSection} />}
        {(mode === '3d' || mode === 'layers') && (
          <p className="st-stage-hint">{mode === 'layers' ? 'Drag to orbit · every layer is a live section of your store' : 'Drag to orbit · screens scroll your real store'}</p>
        )}
      </div>
    </div>
  );

  return full ? <div className="st-full-backdrop">{body}</div> : body;
}
