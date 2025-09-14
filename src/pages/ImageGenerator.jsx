import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader, Download, ImagePlus, X, Star, CheckCircle2, Sparkles, Brush, Eraser, Minus, Plus, Pencil, Save, BoxSelect, Wand2, Trash2, Type, Pipette, Stamp, Crosshair } from 'lucide-react';
import PuzzleLoader from '../components/PuzzleLoader';
import toast from 'react-hot-toast';
import { generateGeminiImage } from '../lib/geminiImage';

const imagePromptSuggestions = [
  'Dreamlike portrait bathed in moonlit haze, floating petals, soft rim light; surreal bokeh and cinematic shadows',
  'Futuristic alley drenched in neon rain; reflective puddles, long-exposure light trails, chrome textures, mist',
  'A minimal still life of glass orbs and silk fabric; caustic light play, pastel palette, airy composition',
  'Ancient temple courtyard at dawn; incense smoke, god rays cutting through; delicate birds in flight',
  'Macro shot of dew on moss; crystalline droplets like tiny lenses; painterly depth of field',
  'Desert dreamscape with towering sandstone arches; peach skies, drifting dust, lone figure in flowing cloth',
  'Cyberpunk market — holographic signs, translucent umbrellas, reflective vinyl; poetic, color‑rich atmosphere',
  'Ocean cave with bioluminescent tide pools; glowing blues and violets; ethereal light shafts',
  'Snowy forest at blue hour; lanterns glowing amber, soft drifting snow, magical hush',
  'Brutalist architecture at golden hour; long shadows, warm concrete, graphic composition, tilt‑shift',
  'Vintage film poster style; bold typography, grain, subtle halation, crisp subject silhouette',
  'Surreal floating islands with waterfalls cascading into clouds; painterly brushlight and soft sunbeams',
  'Night roses lit by prism light; spectral color fringes, velvety blacks, ultra‑shallow depth of field',
  'Dreamy café scene — steam from cups catching morning light; dust motes, gentle reflections, cozy colors',
  'Foggy mountains above a mirror lake; pastel sunrise, tranquil composition, whisper‑quiet mood',
  'Art deco portrait with geometric shadows, pearlescent tones, sculptural hair light — elegant and timeless'
];

const ImageGenerator = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultUrls, setResultUrls] = useState([]); // array of Blob URLs
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [attachments, setAttachments] = useState([]); // [{ id, url, file, name }]
  const [viewerUrl, setViewerUrl] = useState(null);
  const [preciseMode, setPreciseMode] = useState(true);
  const promptRef = useRef(null);

  // Inline Editor (slide-in) state — edits are non-destructive via layers
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorIndex, setEditorIndex] = useState(null);
  const [editorBaseUrl, setEditorBaseUrl] = useState(null);
  const editorCanvasRef = useRef(null);
  const editorContainerRef = useRef(null);
  const editorImgRef = useRef(null);
  const [eDims, setEDims] = useState({ w: 0, h: 0, scale: 1, imgW: 0, imgH: 0 });
  const [eTool, setETool] = useState('text'); // 'brush' | 'eraser' | 'text' | 'eyedropper' | 'clone'
  const [eMode, setEMode] = useState('select'); // 'select'
  const [eColor, setEColor] = useState('#ff2d55');
  const [eSize, setESize] = useState(16);
  const [eIsDrawing, setEIsDrawing] = useState(false);
  const [layers, setLayers] = useState([]); // [{ id, canvas, ctx, visible, name }]
  const [activeLayer, setActiveLayer] = useState(0);
  const [selections, setSelections] = useState([]); // [{id,x,y,w,h}] in image px
  const [selecting, setSelecting] = useState(false);
  const [selStart, setSelStart] = useState(null);
  const [selDraft, setSelDraft] = useState(null);
  // Text layers (manual editing without AI)
  const [textLayers, setTextLayers] = useState([]); // [{id,x,y,text,color,size,font}]
  const [activeTextId, setActiveTextId] = useState(null);
  const [isDraggingText, setIsDraggingText] = useState(false);
  const textDragOffsetRef = useRef({ dx: 0, dy: 0 });
  const measureCtxRef = useRef(null);
  // Clone-stamp
  const [cloneSrc, setCloneSrc] = useState(null); // {x,y}
  const [cloneSetMode, setCloneSetMode] = useState(false);
  const cloneStartRef = useRef(null); // {x,y}
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [zoomMode, setZoomMode] = useState('fit'); // 'fit' | 'manual'
  const overlayFocusRef = useRef(null);
  const round2 = (n) => Math.round(n * 100) / 100;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const applyZoom = (next) => {
    if (!editorImgRef.current) return;
    const clamped = Math.max(0.1, Math.min(1, round2(next)));
    const iw = editorImgRef.current.naturalWidth;
    const ih = editorImgRef.current.naturalHeight;
    const w = Math.round(iw * clamped);
    const h = Math.round(ih * clamped);
    setZoom(clamped);
    setEDims({ w, h, scale: clamped, imgW: iw, imgH: ih });
    const dc = editorCanvasRef.current; if (dc) { dc.width = w; dc.height = h; }
    setTimeout(composeDisplay, 0);
  };
  const fitToContainer = () => {
    if (!editorContainerRef.current || !editorImgRef.current) return;
    const iw = editorImgRef.current.naturalWidth;
    const ih = editorImgRef.current.naturalHeight;
    const availW = Math.max(100, editorContainerRef.current.clientWidth - 16);
    const availH = Math.max(100, editorContainerRef.current.clientHeight - 16);
    const s = Math.min(1, Math.min(availW / iw, availH / ih));
    applyZoom(s);
  };
  // no gallery – we apply AI result directly

  // Note: We revoke object URLs only when removing individual attachments to avoid
  // breaking thumbnails. Browser will reclaim them on navigation/unmount.

  const onAttachmentChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const maxMb = 15;
    const next = [];
    for (const f of files) {
      if (!f.type.startsWith('image/')) {
        toast.error('Only image files are supported.');
        continue;
      }
      if (f.size > maxMb * 1024 * 1024) {
        toast.error(`Image too large. Max ${maxMb} MB.`);
        continue;
      }
      next.push({ id: `${Date.now()}_${f.name}_${Math.random().toString(36).slice(2,7)}`, url: URL.createObjectURL(f), file: f, name: f.name });
    }
    if (!next.length) return;
    setAttachments(prev => {
      const combined = [...prev, ...next].slice(0, 4);
      return combined;
    });
    // Reset input so selecting the same file again re-triggers change
    e.target.value = '';
  };

  // Auto-resize the prompt textarea to remove inner scrollbars
  useEffect(() => {
    const el = promptRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(320, Math.max(72, el.scrollHeight)) + 'px';
  }, [prompt]);

  // Export helpers for AI edits
  const exportGuideFileFromEditor = () => {
    return new Promise((resolve, reject) => {
      try {
        const out = document.createElement('canvas');
        out.width = eDims.imgW || 1; out.height = eDims.imgH || 1;
        const octx = out.getContext('2d');
        if (editorImgRef.current) octx.drawImage(editorImgRef.current, 0, 0);
        layers.forEach(l => { if (l.visible) octx.drawImage(l.canvas, 0, 0); });
        // draw text layers on top
        try {
          octx.textBaseline = 'top';
          textLayers.forEach(tl => {
            const fontFamily = tl.font || '"Noto Sans Devanagari", "Noto Sans", system-ui, sans-serif';
            octx.fillStyle = tl.color || '#000000';
            octx.font = `${Math.max(6, tl.size || 20)}px ${fontFamily}`;
            octx.fillText(tl.text || '', Math.round(tl.x || 0), Math.round(tl.y || 0));
          });
        } catch {}
        out.toBlob((blob) => {
          if (!blob) return reject(new Error('Guide export failed'));
          const file = new File([blob], `guide_${Date.now()}.png`, { type: 'image/png' });
          resolve(file);
        }, 'image/png', 0.95);
      } catch (e) { reject(e); }
    });
  };
  const exportMaskFileFromSelections = () => {
    return new Promise((resolve, reject) => {
      try {
        const m = document.createElement('canvas');
        const w = eDims.imgW || 1; const h = eDims.imgH || 1;
        m.width = w; m.height = h;
        const mctx = m.getContext('2d');
        mctx.fillStyle = '#000000';
        mctx.fillRect(0, 0, w, h);
        mctx.imageSmoothingEnabled = false;
        selections.forEach(r => {
          const rx = Math.max(0, Math.round(r.x));
          const ry = Math.max(0, Math.round(r.y));
          const rw = Math.max(1, Math.round(r.w));
          const rh = Math.max(1, Math.round(r.h));
          mctx.fillStyle = '#ffffff';
          mctx.fillRect(rx, ry, rw, rh);
        });
        m.toBlob((blob) => {
          if (!blob) return reject(new Error('Mask export failed'));
          const file = new File([blob], `mask_${Date.now()}.png`, { type: 'image/png' });
          resolve(file);
        }, 'image/png', 1.0);
      } catch (e) { reject(e); }
    });
  };

  const runAiEdit = async () => {
    if (!editorImgRef.current) { toast.error('Open an image to edit.'); return; }
    if (!selections.length) { toast.error('Draw one or more selection boxes.'); return; }
    const p = (aiPrompt || '').trim();
    if (!p) { toast.error('Describe the change to make.'); return; }
    try {
      setAiGenerating(true);
      const guide = await exportGuideFileFromEditor();
      const mask = await exportMaskFileFromSelections();
      const finalPrompt = [
        p,
        'Image 1: Guide image (unaltered).',
        'Image 2: STRICT binary mask. WHITE = editable, BLACK = keep pixel-perfect. Make ZERO changes outside black areas. Edit only within white boxes.',
        'Render clean, realistic results; match lighting and perspective; avoid artifacts at mask edges. If request cannot be satisfied fully within white areas, leave the rest unchanged.'
      ].join('\n');
      const urls = await generateGeminiImage({ prompt: finalPrompt, imageFiles: [guide, mask], candidateCount: 1 });
      if (urls && urls[0]) {
        await applyAiResult(urls[0]);
      } else {
        toast.error('No AI result returned.');
      }
    } catch (e) {
      console.error(e);
      toast.error(e?.message || 'AI edit failed');
    } finally {
      setAiGenerating(false);
    }
  };

  const applyAiResult = async (url) => {
    try {
      const img = new Image();
      await new Promise((resolve) => { img.onload = resolve; img.src = url; });
      // Composite: base + (AI result masked by selections)
      const baseImg = editorImgRef.current;
      const w0 = eDims.imgW || (baseImg?.naturalWidth) || img.naturalWidth;
      const h0 = eDims.imgH || (baseImg?.naturalHeight) || img.naturalHeight;
      // Prepare canvases
      const merged = document.createElement('canvas');
      merged.width = w0; merged.height = h0;
      const mctx = merged.getContext('2d');
      if (baseImg) mctx.drawImage(baseImg, 0, 0, w0, h0);
      const resC = document.createElement('canvas'); resC.width = w0; resC.height = h0;
      const rctx = resC.getContext('2d');
      // Draw result scaled to base size
      rctx.drawImage(img, 0, 0, w0, h0);
      // Build mask from selections
      const mask = document.createElement('canvas'); mask.width = w0; mask.height = h0;
      const mk = mask.getContext('2d');
      mk.fillStyle = '#000'; mk.fillRect(0,0,w0,h0);
      mk.fillStyle = '#fff';
      selections.forEach(r => {
        const rx = Math.max(0, Math.round(r.x));
        const ry = Math.max(0, Math.round(r.y));
        const rw = Math.max(1, Math.round(r.w));
        const rh = Math.max(1, Math.round(r.h));
        mk.fillRect(rx, ry, rw, rh);
      });
      // Apply mask to result
      rctx.globalCompositeOperation = 'destination-in';
      rctx.drawImage(mask, 0, 0);
      // Merge masked result over base
      mctx.drawImage(resC, 0, 0);
      // Update base image with merged result
      const blob = await new Promise(resolve => merged.toBlob(resolve, 'image/png', 0.95));
      if (blob) {
        const obj = URL.createObjectURL(blob);
        const updated = new Image();
        await new Promise(res => { updated.onload = res; updated.src = obj; });
        editorImgRef.current = updated;
        const container = editorContainerRef.current;
        const maxW = Math.min(container ? container.clientWidth : 1000, 980);
        const scale = Math.min(1, maxW / updated.naturalWidth);
        const w = Math.round(updated.naturalWidth * scale);
        const h = Math.round(updated.naturalHeight * scale);
        setEDims({ w, h, scale, imgW: updated.naturalWidth, imgH: updated.naturalHeight });
        const dc = editorCanvasRef.current; if (dc) { dc.width = w; dc.height = h; }
        setSelections([]); setSelDraft(null); setAiPrompt('');
        composeDisplay();
      }
    } catch {}
  };

  // Open/close editor for a generated image
  const openEditor = (url, index) => {
    setEditorIndex(index);
    setEditorBaseUrl(url);
    setEditorOpen(true);
  };
  const closeEditor = () => {
    setEditorOpen(false);
    setTimeout(() => {
      setLayers([]);
      setActiveLayer(0);
      setEIsDrawing(false);
      setSelections([]);
      setSelStart(null);
      setSelDraft(null);
      setAiPrompt('');
      setEDims({ w: 0, h: 0, scale: 1, imgW: 0, imgH: 0 });
      editorImgRef.current = null;
    }, 220);
  };

  // Load image and set up editor canvas/layers when opening
  useEffect(() => {
    if (!editorOpen || !editorBaseUrl) return;
    const img = new Image();
    img.onload = () => {
      editorImgRef.current = img;
      const c = editorContainerRef.current;
      if (c) {
        const availW = Math.max(100, c.clientWidth - 16);
        const availH = Math.max(100, c.clientHeight - 16);
        const needsFit = img.naturalWidth > availW || img.naturalHeight > availH;
        if (needsFit) {
          setZoomMode('fit');
          const s = Math.min(1, Math.min(availW / img.naturalWidth, availH / img.naturalHeight));
          applyZoom(s);
        } else {
          setZoomMode('manual');
          applyZoom(1);
        }
      } else {
        setZoomMode('manual');
        applyZoom(1);
      }
      // Start with a single clear layer
      const layerCanvas = document.createElement('canvas');
      layerCanvas.width = img.naturalWidth; layerCanvas.height = img.naturalHeight;
      const lctx = layerCanvas.getContext('2d');
      setLayers([{ id: `${Date.now()}`, canvas: layerCanvas, ctx: lctx, visible: true, name: 'Layer 1' }]);
      setActiveLayer(0);
    };
    img.src = editorBaseUrl;
  }, [editorOpen, editorBaseUrl]);

  // Focus overlay for keyboard shortcuts when opened
  useEffect(() => {
    if (editorOpen) {
      setTimeout(() => {
        try { overlayFocusRef.current && overlayFocusRef.current.focus(); } catch {}
      }, 0);
    }
  }, [editorOpen]);

  // Hit-test helpers for text layers
  const hitTestText = (x, y) => {
    const ctxM = (measureCtxRef.current ||= document.createElement('canvas').getContext('2d'));
    for (let i = textLayers.length - 1; i >= 0; i--) {
      const tl = textLayers[i];
      const fontSpec = `${Math.max(6, tl.size || 20)}px ${tl.font || '"Noto Sans Devanagari", "Noto Sans", system-ui, sans-serif'}`;
      ctxM.font = fontSpec;
      const w = ctxM.measureText(tl.text || '').width;
      const h = Math.max(14, (tl.size || 20) * 1.25);
      if (x >= tl.x && x <= tl.x + w && y >= tl.y && y <= tl.y + h) return tl;
    }
    return null;
  };

  // Delete active text layer or text layers in selections using Delete/Backspace
  useEffect(() => {
    if (!editorOpen) return;
    const onKey = (ev) => {
      const tag = (ev.target && ev.target.tagName || '').toLowerCase();
      const editingInput = tag === 'input' || tag === 'textarea';
      if (editingInput) return; // don't intercept typing in side panel inputs
      if (ev.key !== 'Delete' && ev.key !== 'Backspace') return;
      let changed = false;
      if (activeTextId) {
        setTextLayers(prev => prev.filter(t => t.id !== activeTextId));
        setActiveTextId(null);
        changed = true;
      } else if (selections.length) {
        // remove any text layers intersecting any selection
        const ctxM = (measureCtxRef.current ||= document.createElement('canvas').getContext('2d'));
        setTextLayers(prev => prev.filter(t => {
          const w = (() => { ctxM.font = `${Math.max(6, t.size || 20)}px ${t.font || '"Noto Sans Devanagari", "Noto Sans", system-ui, sans-serif'}`; return ctxM.measureText(t.text || '').width; })();
          const h = Math.max(14, (t.size || 20) * 1.25);
          const bx = t.x, by = t.y, bw = w, bh = h;
          const overlaps = selections.some(s => !(bx + bw < s.x || s.x + s.w < bx || by + bh < s.y || s.y + s.h < by));
          if (overlaps) { changed = true; return false; }
          return true;
        }));
        // If no text layer was deleted, perform a smart clone fill to cover raster text
        setTimeout(() => {
          if (!editorImgRef.current) return;
          const layer = layers[activeLayer]; if (!layer) return;
          const ctx = layer.ctx; if (!ctx) return;
          const img = editorImgRef.current;
          selections.forEach(r => {
            const w = Math.max(1, Math.round(r.w));
            const h = Math.max(1, Math.round(r.h));
            const srcX = clamp(Math.round((r.x || 0) - 8), 0, (img.naturalWidth || img.width) - w);
            const srcY = clamp(Math.round((r.y || 0) - 8), 0, (img.naturalHeight || img.height) - h);
            try {
              ctx.drawImage(img, srcX, srcY, w, h, Math.round(r.x), Math.round(r.y), w, h);
            } catch {}
          });
          composeDisplay();
        }, 0);
        changed = true;
      }
      if (changed) {
        ev.preventDefault();
        setTimeout(composeDisplay, 0);
        toast.success('Deleted');
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [editorOpen, activeTextId, selections]);

  // (removed duplicate keydown handler; unified handler is above)

  // Recompute fit on resize when zoomMode is 'fit' (fixes DevTools open/close glitch)
  useEffect(() => {
    const onResize = () => {
      if (!editorOpen) return;
      if (zoomMode === 'fit') {
        fitToContainer();
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [editorOpen, zoomMode]);

  // Compose display canvas from base image + visible layers
  const composeDisplay = () => {
    const c = editorCanvasRef.current; if (!c) return;
    const img = editorImgRef.current; if (!img) return;
    const ctx = c.getContext('2d');
    const { w, h, imgW, imgH } = eDims;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    layers.forEach(l => { if (l.visible) ctx.drawImage(l.canvas, 0, 0, imgW, imgH, 0, 0, w, h); });
    // draw text layers scaled to display
    try {
      ctx.save();
      const sx = (w || 1) / (imgW || 1);
      const sy = (h || 1) / (imgH || 1);
      ctx.scale(sx, sy);
      ctx.textBaseline = 'top';
      textLayers.forEach(tl => {
        const fontFamily = tl.font || '"Noto Sans Devanagari", "Noto Sans", system-ui, sans-serif';
        ctx.fillStyle = tl.color || '#000000';
        ctx.font = `${Math.max(6, tl.size || 20)}px ${fontFamily}`;
        ctx.fillText(tl.text || '', Math.round(tl.x || 0), Math.round(tl.y || 0));
      });
      ctx.restore();
    } catch {}
  };
  useEffect(() => { if (editorOpen) composeDisplay(); }, [editorOpen, layers, textLayers, eDims]);

  // Prevent background scroll when editor is open
  useEffect(() => {
    if (editorOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [editorOpen]);

  // Drawing helpers
  const toImageCoords = (e) => {
    const c = editorCanvasRef.current; if (!c) return { x: 0, y: 0 };
    const rect = c.getBoundingClientRect();
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;
    const x = (clientX - rect.left) / (eDims.scale || 1);
    const y = (clientY - rect.top) / (eDims.scale || 1);
    return { x, y };
  };
  const onEditorDown = (e) => {
    if (!editorOpen) return;
    const { x, y } = toImageCoords(e);
    // Text tool should work even when mode is 'select'
    if (eTool === 'text') {
      const hit = hitTestText(x, y);
      if (hit) {
        setActiveTextId(hit.id);
        setIsDraggingText(true);
        textDragOffsetRef.current = { dx: x - hit.x, dy: y - hit.y };
        return;
      }
      const nid = `${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
      const newText = { id: nid, x: Math.round(x), y: Math.round(y), text: 'Text', color: eColor, size: Math.max(12, eSize*3), font: '"Noto Sans Devanagari", "Noto Sans", system-ui, sans-serif' };
      setTextLayers(prev => [...prev, newText]);
      setActiveTextId(nid);
      composeDisplay();
      return;
    }
    if (eMode === 'select') {
      // if clicking on text, select it instead of starting a box
      const hit = hitTestText(x, y);
      if (hit) {
        setActiveTextId(hit.id);
        return;
      }
      setSelecting(true);
      setSelStart({ x, y });
      setSelDraft({ x, y, w: 1, h: 1 });
      return;
    }
    if (eTool === 'eyedropper') {
      try {
        const c = editorCanvasRef.current; if (!c) return;
        const ctx = c.getContext('2d');
        const d = ctx.getImageData(Math.max(0, Math.floor(x)), Math.max(0, Math.floor(y)), 1, 1).data;
        const hex = '#' + [d[0], d[1], d[2]].map(v => v.toString(16).padStart(2, '0')).join('');
        setEColor(hex);
        toast.success(`Picked ${hex}`);
      } catch {}
      return;
    }
    if (eTool === 'text') {
      // Select the topmost text under cursor; otherwise create new
      const hit = hitTestText(x, y);
      if (hit) {
        setActiveTextId(hit.id);
        setIsDraggingText(true);
        textDragOffsetRef.current = { dx: x - hit.x, dy: y - hit.y };
        return;
      }
      const nid = `${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
      const newText = { id: nid, x: Math.round(x), y: Math.round(y), text: 'Text', color: eColor, size: Math.max(12, eSize*3), font: '"Noto Sans Devanagari", "Noto Sans", system-ui, sans-serif' };
      setTextLayers(prev => [...prev, newText]);
      setActiveTextId(nid);
      composeDisplay();
      return;
    }
    if (eTool === 'clone') {
      if (e.altKey || cloneSetMode) {
        setCloneSrc({ x: Math.round(x), y: Math.round(y) });
        setCloneSetMode(false);
        toast.success('Clone source set');
        return;
      }
      if (!cloneSrc) { toast.error('Set clone source first (press Set src or hold Alt)'); return; }
      setEIsDrawing(true);
      cloneStartRef.current = { x, y };
      return;
    }
    const layer = layers[activeLayer]; if (!layer) return;
    const ctx = layer.ctx; if (!ctx) return;
    setEIsDrawing(true);
    ctx.save();
    ctx.globalCompositeOperation = eTool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = eColor;
    ctx.lineWidth = eSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  const onEditorMove = (e) => {
    if (eMode === 'select') {
      if (!selecting || !selStart) return;
      const { x, y } = toImageCoords(e);
      const sx = selStart.x; const sy = selStart.y;
      setSelDraft({ x: Math.min(sx, x), y: Math.min(sy, y), w: Math.abs(x - sx), h: Math.abs(y - sy) });
      return;
    }
    if (eTool === 'text' && isDraggingText) {
      const { x, y } = toImageCoords(e);
      setTextLayers(prev => prev.map(t => t.id === activeTextId ? { ...t, x: Math.round(x - textDragOffsetRef.current.dx), y: Math.round(y - textDragOffsetRef.current.dy) } : t));
      composeDisplay();
      return;
    }
    if (eTool === 'clone' && eIsDrawing) {
      const { x, y } = toImageCoords(e);
      const layer = layers[activeLayer]; if (!layer) return;
      const ctx = layer.ctx; if (!ctx) return;
      const start = cloneStartRef.current || { x, y };
      const srcX = Math.round((cloneSrc?.x || 0) + (x - start.x));
      const srcY = Math.round((cloneSrc?.y || 0) + (y - start.y));
      const size = Math.max(4, Math.round(eSize * 2));
      try {
        ctx.drawImage(editorImgRef.current, srcX - size/2, srcY - size/2, size, size, Math.round(x - size/2), Math.round(y - size/2), size, size);
      } catch {}
      composeDisplay();
      return;
    }
    if (!eIsDrawing) return;
    const layer = layers[activeLayer]; if (!layer) return;
    const ctx = layer.ctx; if (!ctx) return;
    const { x, y } = toImageCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    composeDisplay();
  };
  const onEditorUp = () => {
    if (eMode === 'select') {
      if (selecting && selDraft && selDraft.w >= 4 && selDraft.h >= 4) {
        const final = { ...selDraft, id: `${Date.now()}_${Math.random().toString(36).slice(2,7)}` };
        setSelections(prev => [...prev, final]);
      }
      setSelecting(false);
      setSelStart(null);
      setSelDraft(null);
      return;
    }
    if (isDraggingText) { setIsDraggingText(false); return; }
    if (eTool === 'clone' && eIsDrawing) { setEIsDrawing(false); return; }
    if (!eIsDrawing) return;
    const layer = layers[activeLayer]; if (!layer) return;
    setEIsDrawing(false);
    layer.ctx && layer.ctx.restore && layer.ctx.restore();
    composeDisplay();
  };

  // Layer ops
  const addLayer = () => {
    const canvas = document.createElement('canvas');
    canvas.width = eDims.imgW || 1; canvas.height = eDims.imgH || 1;
    const ctx = canvas.getContext('2d');
    const newLayer = { id: `${Date.now()}_${Math.random().toString(36).slice(2,7)}`, canvas, ctx, visible: true, name: `Layer ${layers.length + 1}` };
    setLayers(prev => [...prev, newLayer]);
    setActiveLayer(layers.length);
  };
  const clearLayer = () => {
    const layer = layers[activeLayer]; if (!layer) return;
    layer.ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
    composeDisplay();
    setLayers([...layers]);
  };
  const deleteLayer = () => {
    if (layers.length <= 1) { clearLayer(); return; }
    const arr = layers.filter((_, i) => i !== activeLayer);
    setLayers(arr);
    setActiveLayer(Math.max(0, activeLayer - 1));
    setTimeout(composeDisplay, 0);
  };
  const toggleLayer = (i) => {
    setLayers(prev => prev.map((l, idx) => idx === i ? { ...l, visible: !l.visible } : l));
  };

  const saveEdited = (asNew = true) => {
    try {
      const out = document.createElement('canvas');
      out.width = eDims.imgW || 1; out.height = eDims.imgH || 1;
      const octx = out.getContext('2d');
      if (editorImgRef.current) octx.drawImage(editorImgRef.current, 0, 0);
      layers.forEach(l => { if (l.visible) octx.drawImage(l.canvas, 0, 0); });
      // render text layers
      try {
        octx.textBaseline = 'top';
        textLayers.forEach(tl => {
          const fontFamily = tl.font || '"Noto Sans Devanagari", "Noto Sans", system-ui, sans-serif';
          octx.fillStyle = tl.color || '#000000';
          octx.font = `${Math.max(6, tl.size || 20)}px ${fontFamily}`;
          octx.fillText(tl.text || '', Math.round(tl.x || 0), Math.round(tl.y || 0));
        });
      } catch {}
      out.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        if (asNew) {
          setResultUrls(prev => [url, ...prev]);
          setSelectedIndex(0);
        } else if (editorIndex != null) {
          setResultUrls(prev => {
            const arr = [...prev];
            try { URL.revokeObjectURL(arr[editorIndex]); } catch {}
            arr[editorIndex] = url; return arr;
          });
        }
        closeEditor();
      }, 'image/png', 0.95);
    } catch {}
  };

  const handleSurprise = () => {
    const next = imagePromptSuggestions[Math.floor(Math.random() * imagePromptSuggestions.length)] || '';
    setPrompt(next);
  };

  const removeAttachment = (id) => {
    setAttachments(prev => {
      const found = prev.find(a => a.id === id);
      if (found?.url) URL.revokeObjectURL(found.url);
      return prev.filter(a => a.id !== id);
    });
  };

  const handleDownload = (url) => {
    try {
      const target = url ?? (selectedIndex != null ? resultUrls[selectedIndex] : (resultUrls.length === 1 ? resultUrls[0] : null));
      if (!target) {
        toast.error('Select an image to download.');
        return;
      }
      const a = document.createElement('a');
      a.href = target;
      a.download = `katha_image_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      console.error('Download failed', e);
      toast.error('Download failed.');
    }
  };

  const handleSubmit = async (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    const p = (prompt || '').trim();
    if (!p || isGenerating) return;
    const strict = preciseMode
      ? 'Follow the instructions strictly. Do not add any extra elements or text that are not specified. Keep the composition, count, positions and colors exactly as described. Avoid watermarks, signatures and text unless explicitly requested.'
      : '';
    const composed = [p, strict].filter(Boolean).join('\n');
    setIsGenerating(true);
    setResultUrls([]);
    setSelectedIndex(null);
    try {
      const urls = await generateGeminiImage({ prompt: composed, nepaliText: '', imageFiles: attachments.map(a => a.file), candidateCount: 4 });
      setResultUrls(urls);
    } catch (err) {
      console.error('Image generation failed', err);
      toast.error(err?.message || 'Failed to generate image.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      className="relative min-h-screen font-sans text-[#1A1A1A] overflow-hidden"
      style={{
        background: `
          radial-gradient(900px 600px at -10% -10%, #F9D7C9 0%, rgba(249,215,201,0) 60%),
          radial-gradient(800px 560px at 110% 15%, #F4E2CE 0%, rgba(244,226,206,0) 55%),
          linear-gradient(180deg, #F7ECE3 0%, #F3DECF 100%)
        `
      }}
    >

      {/* Header removed; global DashboardHeader shows brand and credits */}

      <main className="min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-12 z-10 relative">
        <div className="w-full max-w-3xl mx-auto flex flex-col items-center">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-10">
            <h2 className="text-5xl md:text-6xl font-black mb-3 font-heading">Create Images from a Single Prompt</h2>
            <p className="text-lg md:text-xl font-body opacity-90">Write in Nepali or English — attach reference images to guide the look.</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.15 }} className="w-full">
            {/* Surprise button */}
            <div className="mb-3 flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={preciseMode} onChange={(e)=>setPreciseMode(e.target.checked)} className="accent-black" />
                Precise mode
              </label>
              <button
                type="button"
                onClick={handleSurprise}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold"
                style={{ background: '#F8D5C7', border: '2px solid #1A1A1A', boxShadow: '4px 4px 0 #1A1A1A' }}
              >
                <motion.span
                  className="inline-flex"
                  animate={{ rotate: [0, 12, 0, -8, 0], y: [0, -1, 0, 1, 0], scale: [1, 1.05, 1, 1.08, 1] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                  aria-hidden="true"
                >
                  <Sparkles className="w-4 h-4" />
                </motion.span>
                <span>Surprise me</span>
              </button>
            </div>
            <div className="relative rounded-[18px] overflow-visible" style={{ background: '#FDF5EC', border: '3px solid #1A1A1A', boxShadow: '8px 8px 0 #1A1A1A' }}>
              <form onSubmit={handleSubmit} className={`relative ${attachments.length ? 'pt-2' : ''}`}>
                {/* Attachment thumbnails (up to 4) above the chatbox */}
                {attachments.length > 0 && (
                  <div className="hidden sm:flex absolute -top-20 left-10 z-[60] flex pointer-events-auto">
                    {attachments.slice(0,4).map((att, idx) => (
                      <div key={att.id} className={`relative ${idx>0 ? '-ml-3' : ''} z-[65]`}>
                        {/* Decorative layer */}
                        <div className="pointer-events-none absolute -z-10 -rotate-12 -top-2 -left-2 w-16 h-16 rounded-lg ring-2 ring-white/60 shadow-md bg-white/40" />
                        <button
                          type="button"
                          onClick={() => setViewerUrl(att.url)}
                          className={`relative z-[70] block rounded-lg overflow-hidden ring-2 ring-white/80 shadow-xl cursor-zoom-in focus:outline-none ${['-rotate-6','rotate-2','-rotate-3','rotate-1'][idx%4]}`}
                          title="View attached image"
                        >
                          <img src={att.url} alt="attachment" className="w-16 h-16 object-cover" />
                        </button>
                        {/* Connector diamond touching the chat box */}
                        <div className="pointer-events-none absolute -bottom-2 left-3 w-3.5 h-3.5 bg-white/90 rotate-45 ring-1 ring-white/70 shadow-sm" />
                        <button
                          type="button"
                          onClick={() => removeAttachment(att.id)}
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white/95 text-slate-800 shadow flex items-center justify-center"
                          title="Remove"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Mobile attachments row (visible only on small screens) */}
                {attachments.length > 0 && (
                  <div className="sm:hidden mt-3 px-5">
                    <div className="flex gap-3 overflow-x-auto pb-1">
                      {attachments.slice(0,4).map((att) => (
                        <div key={att.id} className="relative shrink-0">
                          <button
                            type="button"
                            onClick={() => setViewerUrl(att.url)}
                            className="block rounded-md overflow-hidden ring-1 ring-white/70 shadow cursor-zoom-in"
                            title="View attached image"
                          >
                            <img src={att.url} alt="attachment" className="w-16 h-16 object-cover" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeAttachment(att.id)}
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white/95 text-slate-800 shadow flex items-center justify-center"
                            title="Remove"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="relative pr-14">
                  <textarea
                    ref={promptRef}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="A moody portrait with soft rim light and Nepali headline in bold type…"
                    className="w-full p-5 pr-32 text-base bg-transparent text-[#1A1A1A] rounded-xl focus:outline-none resize-none transition-colors caret-[#1A1A1A] selection:bg-amber-200 selection:text-[#1A1A1A] placeholder:text-[#1A1A1A]/70 font-devanagari"
                    lang="ne"
                    rows={3}
                    style={{ overflow: 'hidden' }}
                    disabled={isGenerating}
                  />
                  {/* Upload button */}
                  <label
                    htmlFor="image-attachments"
                    className="absolute right-16 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full text-[#1A1A1A] flex items-center justify-center cursor-pointer z-10"
                    style={{ background: '#F8D5C7', border: '2px solid #1A1A1A', boxShadow: '4px 4px 0 #1A1A1A', marginTop: '-2px' }}
                    title="Attach image to guide/edit"
                  >
                    <ImagePlus className="w-5 h-5" />
                  </label>
                  <input
                    id="image-attachments"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={onAttachmentChange}
                    disabled={isGenerating}
                  />
                  <motion.button
                    type="button"
                    aria-label="Generate image"
                    disabled={!prompt.trim() || isGenerating}
                    className="group absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-12 h-12 rounded-full text-[#1A1A1A] disabled:opacity-60 z-20"
                    style={{ background: '#F8D5C7', border: '2px solid #1A1A1A', boxShadow: '4px 4px 0 #1A1A1A', marginTop: '-2px' }}
                    onClick={handleSubmit}
                    onClickCapture={handleSubmit}
                    onMouseDown={(e)=>{ if (!isGenerating && prompt.trim()) { e.preventDefault(); e.stopPropagation(); handleSubmit(); } }}
                    onPointerDown={(e)=>{ if (!isGenerating && prompt.trim()) { e.preventDefault(); e.stopPropagation(); handleSubmit(); } }}
                    onTouchStart={(e)=>{ if (!isGenerating && prompt.trim()) { e.preventDefault(); e.stopPropagation(); handleSubmit(); } }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isGenerating ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </motion.button>
                </div>
                {/* (No filename row; preview handled above in chatbox header) */}
              </form>
            </div>
          </motion.div>
        </div>

        <div className="w-full max-w-4xl mx-auto mt-16 flex-1 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {isGenerating && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                <PuzzleLoader />
              </motion.div>
            )}
            {resultUrls.length > 0 && (
              <motion.div key="images" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="w-full">
                <h2 className="text-2xl font-bold text-center mb-6">Your Images</h2>
                <div className="rounded-2xl p-4" style={{ background: '#FDF5EC', border: '3px solid #1A1A1A', boxShadow: '8px 8px 0 #1A1A1A' }}>
                  {selectedIndex != null && (
                    <div className="flex justify-end mb-3">
                      <button
                        type="button"
                        onClick={() => handleDownload(resultUrls[selectedIndex])}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg"
                        style={{ background: '#F8D5C7', border: '2px solid #1A1A1A', boxShadow: '4px 4px 0 #1A1A1A' }}
                        title="Download selected image"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Selected</span>
                      </button>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {resultUrls.map((url, i) => (
                      <div key={i} className={`relative group rounded-lg overflow-hidden bg-black/5`} style={{ border: '2px solid #1A1A1A', boxShadow: selectedIndex===i ? '0 0 0 4px #F8D5C7, 4px 4px 0 #1A1A1A' : '4px 4px 0 #1A1A1A' }}>
                        {/* Download button */}
                        <button
                          onClick={() => handleDownload(url)}
                          className="absolute top-2 right-2 z-10 inline-flex items-center justify-center w-9 h-9 rounded-full text-[#1A1A1A] opacity-0 group-hover:opacity-100 transition"
                          style={{ background: '#F8D5C7', border: '2px solid #1A1A1A', boxShadow: '3px 3px 0 #1A1A1A' }}
                          title="Download"
                          type="button"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {/* Edit button */}
                        <button
                          onClick={() => openEditor(url, i)}
                          className="absolute bottom-2 right-2 z-10 inline-flex items-center justify-center w-9 h-9 rounded-full text-[#1A1A1A] opacity-95 hover:opacity-100 transition"
                          style={{ background: '#F8D5C7', border: '2px solid #1A1A1A', boxShadow: '3px 3px 0 #1A1A1A' }}
                          title="Edit"
                          type="button"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {/* Select best */}
                        <button
                          onClick={() => setSelectedIndex(i)}
                          className={`absolute top-2 left-2 z-10 inline-flex items-center justify-center w-9 h-9 rounded-full`}
                          style={{ background: selectedIndex===i ? '#F8D5C7' : '#FDF5EC', border: '2px solid #1A1A1A', boxShadow: '3px 3px 0 #1A1A1A', color: '#1A1A1A' }}
                          title={selectedIndex===i? 'Selected' : 'Mark as best'}
                          type="button"
                        >
                          {selectedIndex===i ? <Star className="w-4 h-4 fill-current" /> : <Star className="w-4 h-4" />}
                        </button>
                        <img
                          src={url}
                          alt={`Generated ${i+1}`}
                          className="w-full h-auto object-contain cursor-zoom-in bg-white"
                          onClick={() => setViewerUrl(url)}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 grid gap-2">
                    {prompt && (
                      <p className="p-3 rounded-lg font-medium" style={{ background: '#F8E8DB', border: '2px solid #1A1A1A' }} lang="ne">{prompt}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {/* Fullscreen viewer via portal (always above header/profile) */}
        {viewerUrl && createPortal(
          <div className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-sm flex items-center justify-center" onClick={() => setViewerUrl(null)}>
            <img
              src={viewerUrl}
              alt="Preview"
              className="max-w-[92vw] max-h-[90vh] w-auto h-auto object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              type="button"
              onClick={() => setViewerUrl(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 text-slate-900 shadow flex items-center justify-center"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>,
          document.body
        )}

        {/* Slide-in Editor Overlay via Portal for reliable stacking */}
        {createPortal(
          <AnimatePresence>
            {editorOpen && (
              <motion.div
                key="inline-editor"
                className="fixed inset-0 z-[2147483647] flex"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                ref={overlayFocusRef}
                tabIndex={-1}
                style={{ outline: 'none' }}
              >
                <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={closeEditor} />
                <div className="relative h-full w-full bg-[#F7ECE3]" style={{ borderLeft: '4px solid #1A1A1A', boxShadow: '-10px 0 0 #1A1A1A' }}>
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '3px solid #1A1A1A', background: '#F2D8C8' }}>
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={closeEditor} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#FDF5EC', border: '2px solid #1A1A1A' }}>
                        <X className="w-5 h-5" />
                      </button>
                      <h3 className="text-lg font-bold">Edit Image</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="inline-flex items-center gap-2 px-2 py-1 rounded-lg" style={{ background: '#FDF5EC', border: '2px solid #1A1A1A' }}>
                        <button type="button" onClick={()=>{ setZoomMode('fit'); fitToContainer(); }} className="px-2 py-1 rounded text-sm" style={{ background: '#ffffff' }}>Fit</button>
                        <button type="button" onClick={()=>{ setZoomMode('manual'); applyZoom(1); }} className="px-2 py-1 rounded text-sm" style={{ background: '#ffffff' }}>100%</button>
                        <button type="button" onClick={()=>{ setZoomMode('manual'); applyZoom(zoom - 0.1); }} className="px-2 py-1 rounded" style={{ background: '#ffffff' }}>-</button>
                        <span className="text-sm w-12 text-center">{Math.round(zoom*100)}%</span>
                        <button type="button" onClick={()=>{ setZoomMode('manual'); applyZoom(zoom + 0.1); }} className="px-2 py-1 rounded" style={{ background: '#ffffff' }}>+</button>
                      </div>
                      <button type="button" onClick={() => saveEdited(true)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: '#FDF5EC', border: '2px solid #1A1A1A', boxShadow: '4px 4px 0 #1A1A1A' }}>
                        <Save className="w-4 h-4" /> Save as new
                      </button>
                      <button type="button" onClick={() => saveEdited(false)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: '#F8D5C7', border: '2px solid #1A1A1A', boxShadow: '4px 4px 0 #1A1A1A' }}>
                        <CheckCircle2 className="w-4 h-4" /> Replace
                      </button>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4 p-4 h-[calc(100vh-120px)]">
                    {/* Tools column */}
                    <div className="space-y-3 overflow-y-auto pr-1">
                      <div className="rounded-xl p-3" style={{ background: '#FDF5EC', border: '3px solid #1A1A1A', boxShadow: '6px 6px 0 #1A1A1A' }}>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="inline-flex items-center gap-2 px-2 py-1 rounded-lg" style={{ background: '#FDF5EC', border: '2px solid #1A1A1A' }}>
                            <button type="button" onClick={()=>setEMode('select')} className={`px-2 py-1 rounded ${eMode==='select'?'bg-slate-800 text-white':'bg-white'}`}>Select</button>
                          </div>
                          <button type="button" onClick={()=>setETool('brush')} className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${eTool==='brush'?'':'opacity-70'}`} style={{ background: '#F8D5C7', border: '2px solid #1A1A1A' }}><Brush className="w-4 h-4"/> Brush</button>
                          <button type="button" onClick={()=>setETool('eraser')} className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${eTool==='eraser'?'':'opacity-70'}`} style={{ background: '#F8D5C7', border: '2px solid #1A1A1A' }}><Eraser className="w-4 h-4"/> Eraser</button>
                          <button type="button" onClick={()=>setETool('text')} className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${eTool==='text'?'':'opacity-70'}`} style={{ background: '#F8D5C7', border: '2px solid #1A1A1A' }}><Type className="w-4 h-4"/> Text</button>
                          <button type="button" onClick={()=>setETool('eyedropper')} className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${eTool==='eyedropper'?'':'opacity-70'}`} style={{ background: '#F8D5C7', border: '2px solid #1A1A1A' }}><Pipette className="w-4 h-4"/> Pick</button>
                          <button type="button" onClick={()=>setETool('clone')} className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${eTool==='clone'?'':'opacity-70'}`} style={{ background: '#F8D5C7', border: '2px solid #1A1A1A' }}><Stamp className="w-4 h-4"/> Clone</button>
                          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: '#FDF5EC', border: '2px solid #1A1A1A' }}>
                            <span className="text-sm">Color</span>
                            <input type="color" value={eColor} onChange={e=>setEColor(e.target.value)} className="h-8 w-8 rounded"/>
                          </label>
                          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: '#FDF5EC', border: '2px solid #1A1A1A' }}>
                            <button type="button" onClick={()=>setESize(Math.max(1, eSize-2))} className="p-1 rounded bg-white/80"><Minus className="w-4 h-4"/></button>
                            <span className="text-sm w-10 text-center">{eSize}</span>
                            <button type="button" onClick={()=>setESize(Math.min(120, eSize+2))} className="p-1 rounded bg-white/80"><Plus className="w-4 h-4"/></button>
                          </div>
                          {eMode==='select' && (
                            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: '#FDF5EC', border: '2px solid #1A1A1A' }}>
                              <BoxSelect className="w-4 h-4" />
                              <button type="button" onClick={()=>setSelections([])} className="px-2 py-1 rounded text-sm" style={{ background: '#FDF5EC', border: '2px solid #1A1A1A' }}><Trash2 className="w-4 h-4"/></button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Layers */}
                      <div className="rounded-xl p-3" style={{ background: '#FDF5EC', border: '3px solid #1A1A1A', boxShadow: '6px 6px 0 #1A1A1A' }}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">Layers</h4>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={addLayer} className="px-2 py-1 rounded" style={{ background: '#F8D5C7', border: '2px solid #1A1A1A' }}>+ Layer</button>
                            <button type="button" onClick={deleteLayer} className="px-2 py-1 rounded" style={{ background: '#FDF5EC', border: '2px solid #1A1A1A' }}>Delete</button>
                            <button type="button" onClick={clearLayer} className="px-2 py-1 rounded" style={{ background: '#FDF5EC', border: '2px solid #1A1A1A' }}>Clear</button>
                          </div>
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {layers.map((l, i) => (
                            <div key={l.id} className={`flex items-center justify-between px-2 py-1 rounded ${i===activeLayer?'bg-amber-200/70':'bg-white'}`} style={{ border: '2px solid #1A1A1A' }}>
                              <div className="flex items-center gap-2">
                                <button type="button" onClick={()=>setActiveLayer(i)} className="px-2 py-1 rounded" style={{ background: '#FDF5EC', border: '2px solid #1A1A1A' }}>{i+1}</button>
                                <span className="text-sm">{l.name}</span>
                              </div>
                              <button type="button" onClick={()=>toggleLayer(i)} className="px-2 py-1 rounded text-sm" style={{ background: l.visible?'#F8D5C7':'#FDF5EC', border: '2px solid #1A1A1A' }}>{l.visible?'Hide':'Show'}</button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Text Layers */}
                      <div className="rounded-xl p-3" style={{ background: '#FDF5EC', border: '3px solid #1A1A1A', boxShadow: '6px 6px 0 #1A1A1A' }}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">Text Layers</h4>
                          <button type="button" onClick={() => {
                            const nid = `${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
                            const cx = Math.round((eDims.imgW || 1000) / 2 - 40);
                            const cy = Math.round((eDims.imgH || 1000) / 2 - 20);
                            const nt = { id: nid, x: cx, y: cy, text: 'Text', color: eColor, size: Math.max(12, eSize*3), font: '"Noto Sans Devanagari", "Noto Sans", system-ui, sans-serif' };
                            setTextLayers(prev => [...prev, nt]);
                            setActiveTextId(nid);
                            setTimeout(composeDisplay, 0);
                          }} className="px-2 py-1 rounded" style={{ background: '#F8D5C7', border: '2px solid #1A1A1A' }}>+ Text</button>
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {textLayers.map((t) => (
                            <div key={t.id} className={`space-y-1 p-2 rounded ${t.id===activeTextId?'bg-amber-200/60':'bg-white'}`} style={{ border: '2px solid #1A1A1A' }}>
                              <div className="flex items-center justify-between">
                                <label className="inline-flex items-center gap-2 text-sm"><input type="radio" checked={t.id===activeTextId} onChange={()=>setActiveTextId(t.id)} /> Active</label>
                                <button type="button" onClick={()=>{ setTextLayers(prev=>prev.filter(x=>x.id!==t.id)); if (activeTextId===t.id) setActiveTextId(null); setTimeout(composeDisplay, 0); }} className="px-2 py-1 rounded text-sm" style={{ background: '#FDF5EC', border: '2px solid #1A1A1A' }}>Delete</button>
                              </div>
                              <input type="text" value={t.text} onChange={(e)=>{ const v=e.target.value; setTextLayers(prev=>prev.map(x=>x.id===t.id?{...x,text:v}:x)); setTimeout(composeDisplay, 0); }} className="w-full px-2 py-1 rounded text-sm" style={{ background: '#ffffff', border: '2px solid #1A1A1A' }} placeholder="Your text" />
                              <div className="flex items-center gap-2">
                                <label className="text-sm">Size</label>
                                <input type="number" min="8" max="300" value={t.size} onChange={(e)=>{ const v=Math.max(8,Math.min(300,parseInt(e.target.value||'0'))); setTextLayers(prev=>prev.map(x=>x.id===t.id?{...x,size:v}:x)); setTimeout(composeDisplay, 0); }} className="w-20 px-2 py-1 rounded text-sm" style={{ background: '#ffffff', border: '2px solid #1A1A1A' }} />
                                <label className="text-sm">Color</label>
                                <input type="color" value={t.color} onChange={(e)=>{ const v=e.target.value; setTextLayers(prev=>prev.map(x=>x.id===t.id?{...x,color:v}:x)); setTimeout(composeDisplay, 0); }} className="h-8 w-8 rounded" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-xl p-3" style={{ background: '#FDF5EC', border: '3px solid #1A1A1A', boxShadow: '6px 6px 0 #1A1A1A' }}>
                        <h4 className="font-semibold mb-2 flex items-center gap-2"><Wand2 className="w-4 h-4"/> Ask AI to edit selections</h4>
                        <textarea
                          rows={3}
                          value={aiPrompt}
                          onChange={(e)=>setAiPrompt(e.target.value)}
                          className="w-full p-2 rounded font-devanagari"
                          style={{ background: '#FDF5EC', border: '2px solid #1A1A1A' }}
                          placeholder="Describe what to add/change inside the boxes…"
                        />
                        <button
                          type="button"
                          onClick={runAiEdit}
                          disabled={aiGenerating || !selections.length || !aiPrompt.trim()}
                          className="mt-2 inline-flex items-center gap-2 px-3 py-2 rounded-lg disabled:opacity-50"
                          style={{ background: '#F8D5C7', border: '2px solid #1A1A1A', boxShadow: '4px 4px 0 #1A1A1A' }}
                        >
                          {aiGenerating ? <Loader className="w-4 h-4 animate-spin"/> : <Wand2 className="w-4 h-4"/>}
                          <span>{aiGenerating ? 'Editing…' : 'Generate AI Edit'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Canvas column */}
                    <div className="min-w-0">
                      <div ref={editorContainerRef} className="rounded-2xl p-2 overflow-auto h-[calc(100vh-160px)]" style={{ background: '#FDF5EC', border: '3px solid #1A1A1A', boxShadow: '8px 8px 0 #1A1A1A' }}>
                        <div className="relative">
                          <canvas
                            ref={editorCanvasRef}
                            className="rounded"
                            style={{ background: '#ffffff' }}
                            onMouseDown={onEditorDown}
                            onMouseMove={onEditorMove}
                            onMouseUp={onEditorUp}
                            onMouseLeave={onEditorUp}
                            onDoubleClick={(e)=>{
                              const { x, y } = toImageCoords(e);
                              const ctxM = (measureCtxRef.current ||= document.createElement('canvas').getContext('2d'));
                              let target = hitTestText(x, y);
                              if (target) {
                                const txt = window.prompt('Edit text', target.text || '');
                                if (typeof txt === 'string') {
                                  setTextLayers(prev => prev.map(t => t.id === target.id ? { ...t, text: txt } : t));
                                  setActiveTextId(target.id);
                                  setTimeout(composeDisplay, 0);
                                }
                              }
                            }}
                            onTouchStart={(e)=>{ e.preventDefault(); onEditorDown(e); }}
                            onTouchMove={(e)=>{ e.preventDefault(); onEditorMove(e); }}
                            onTouchEnd={(e)=>{ e.preventDefault(); onEditorUp(); }}
                          />
                          {aiGenerating && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm rounded">
                              <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: '#F8D5C7', border: '2px solid #1A1A1A', boxShadow: '4px 4px 0 #1A1A1A' }}>
                                <Loader className="w-4 h-4 animate-spin"/>
                                <span className="font-medium">Applying AI edit…</span>
                              </div>
                            </div>
                          )}
                          {(selections.length > 0 || selDraft) && (
                            <div className="pointer-events-none absolute inset-0">
                              {[...selections, ...(selDraft? [selDraft] : [])].map((r, idx) => (
                                <div key={r.id || `draft_${idx}`}
                                  className="absolute border-2"
                                  style={{
                                    left: Math.round((r.x) * (eDims.scale||1)),
                                    top: Math.round((r.y) * (eDims.scale||1)),
                                    width: Math.max(1, Math.round(r.w * (eDims.scale||1))),
                                    height: Math.max(1, Math.round(r.h * (eDims.scale||1))),
                                    borderColor: idx===selections.length? '#F59E0B' : '#1A1A1A',
                                    boxShadow: 'inset 0 0 0 2px rgba(26,26,26,0.06)',
                                    background: 'rgba(248,213,199,0.08)'
                                  }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="mt-2 text-sm opacity-80">Brush/Erase edits are applied only to the active layer. Other areas remain untouched — fully independent edits.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
      </main>
    </div>
  );
};

export default ImageGenerator;
