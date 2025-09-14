import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Brush, Eraser, Type, Upload, Send, Loader, Download, Trash2, X, Star, Minus, Plus, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import PuzzleLoader from '../components/PuzzleLoader';
import { generateGeminiImage } from '../lib/geminiImage';

// Utility to download any blob URL
function downloadUrl(url, filename) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

const ImageEditor = () => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [ctx, setCtx] = useState(null);

  const [baseImg, setBaseImg] = useState(null); // HTMLImageElement
  const [tool, setTool] = useState('brush'); // brush | eraser | text
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(14);
  const [textValue, setTextValue] = useState('');
  const [textSize, setTextSize] = useState(22); // Default to a smaller annotation size
  const [textAlign, setTextAlign] = useState('left'); // left | center | right
  const [textBox, setTextBox] = useState(null); // { x, y, w }
  const textElRef = useRef(null); // textarea overlay
  const [dragState, setDragState] = useState(null); // { offsetX, offsetY }
  const [resizeState, setResizeState] = useState(null); // { startX, origW }

  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultUrls, setResultUrls] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [viewerUrl, setViewerUrl] = useState(null);
  const [autoGenOnUpload, setAutoGenOnUpload] = useState(false);
  const [isSwappingBase, setIsSwappingBase] = useState(false);
  const [canvasMaxW, setCanvasMaxW] = useState(640); // small by default
  const [textBg, setTextBg] = useState(false); // BG off by default
  const [placedTexts, setPlacedTexts] = useState([]); // Array of placed text objects
  const [showBoxes, setShowBoxes] = useState(false); // preview region boxes overlay
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  // Parallax effect for background shapes
  useEffect(() => {
    const onMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 60; // Final increase to motion range
      const y = (e.clientY / window.innerHeight - 0.5) * 60;
      setParallax({ x, y });
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  // Init 2D context
  useEffect(() => {
    const c = canvasRef.current;
    if (c && !ctx) setCtx(c.getContext('2d'));
  }, [ctx]);

  // Fit canvas to container and draw image
  const setupCanvasWithImage = (img) => {
    const container = containerRef.current;
    // Keep the initial image smaller for easier editing; adjustable via presets
    const maxWidth = Math.min(container ? container.clientWidth : 960, canvasMaxW);
    const scale = Math.min(1, maxWidth / img.naturalWidth);
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);
    const c = canvasRef.current;
    c.width = w;
    c.height = h;
    const context = c.getContext('2d');
    context.clearRect(0, 0, w, h);
    context.drawImage(img, 0, 0, w, h);
  };

  // Compute export dimensions with a 1080p (1920 long edge) target and 2048 cap
  const getExportDims = () => {
    const c = canvasRef.current;
    const bw = baseImg?.naturalWidth || c.width;
    const bh = baseImg?.naturalHeight || c.height;
    const long = Math.max(bw, bh);
    const targetLong = 1920;
    const maxLong = 2048;
    let scale = 1;
    if (long < targetLong) scale = targetLong / long; else if (long > maxLong) scale = maxLong / long;
    return { outW: Math.round(bw * scale), outH: Math.round(bh * scale) };
  };

  // Replace the current base image with a generated result and clear annotations
  const handleEditFromResult = (url) => {
    try {
      setIsSwappingBase(true);
      const img = new Image();
      img.onload = () => {
        setBaseImg(img);
        setupCanvasWithImage(img);
        setPlacedTexts([]);
        setTextBox(null);
        setTextValue('');
        setSelectedIndex(null);
        setIsSwappingBase(false);
        // Scroll canvas into view for convenience
        containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      };
      img.onerror = () => {
        setIsSwappingBase(false);
        toast.error('Could not load generated image for editing.');
      };
      img.src = url;
    } catch (e) {
      setIsSwappingBase(false);
      toast.error('Edit failed.');
    }
  };

  // Estimate a region box (in CSS pixels) for a placed text object without drawing text
  const measureRegionBox = (t, rect = null) => {
    try {
      const c = canvasRef.current;
      if (!c) return null;
      const r = rect || c.getBoundingClientRect();
      // Use the exact textbox bounds for precise region masks
      const maxW = Math.max(40, t.w);
      const fs = Math.max(10, t.size);
      let rh;
      if (t.h && Number.isFinite(t.h)) {
        rh = Math.max(24, t.h); // use captured textarea height when applied
      } else {
        const lineHeight = Math.round(fs * 1.3);
        const off = document.createElement('canvas').getContext('2d');
        off.font = `bold ${fs}px "Noto Sans Devanagari", "Noto Serif Devanagari", "Inter", sans-serif`;
        const words = (t.content || '').split(/\s+/).filter(Boolean);
        let line = '';
        let lines = 0;
        for (let i=0;i<words.length;i++) {
          const test = line ? line + ' ' + words[i] : words[i];
          if (off.measureText(test).width > maxW && line) {
            lines++;
            line = words[i];
          } else {
            line = test;
          }
        }
        if (line) lines++;
        rh = Math.max(lineHeight, lines * lineHeight) + 8; // small padding
      }
      const rx = t.x;
      const ry = t.y;
      const rw = maxW;
      return { rx, ry, rw, rh };
    } catch (e) {
      return { rx: t.x, ry: t.y, rw: Math.max(40, t.w), rh: Math.max(32, t.size * 1.5) };
    }
  };

  // Re-setup canvas when the size preset changes
  useEffect(() => {
    if (baseImg) setupCanvasWithImage(baseImg);
  }, [canvasMaxW, baseImg]);

  const onUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file.');
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setBaseImg(img);
      setupCanvasWithImage(img);
      // Clear previous annotations and active textbox when a new image is loaded
      setPlacedTexts([]);
      setTextBox(null);
      setTextValue('');
      URL.revokeObjectURL(url);
      if (autoGenOnUpload) {
        // Give React a tick to render canvas first
        setTimeout(() => handleGenerate(), 50);
      }
    };
    img.onerror = () => {
      toast.error('Could not load image.');
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  // Drawing handlers
  const getXY = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX ?? e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY ?? e.touches?.[0]?.clientY) - rect.top;
    return { x, y };
  };

  const handlePointerDown = (e) => {
    if (!ctx || !baseImg) return;
    const { x, y } = getXY(e);

    if (tool === 'text') {
      // Check if clicking on existing placed text
      const clickedText = placedTexts.find(text => {
        return x >= text.x && x <= text.x + text.w && y >= text.y && y <= text.y + 60;
      });
      
      if (clickedText) {
        // Edit existing text
        setTextValue(clickedText.content);
        setTextSize(clickedText.size);
        setTextAlign(clickedText.align);
        setTextBg(clickedText.bg);
        setTextBox({ x: clickedText.x, y: clickedText.y, w: clickedText.w });
        // Remove from placed texts since we're editing it
        setPlacedTexts(prev => prev.filter(t => t.id !== clickedText.id));
        setTimeout(() => {
          textElRef.current?.focus();
        }, 0);
        return;
      }
      
      // Create new text box - even smaller size
      setTextValue('');
      setTextBox({ x: Math.max(8, x - 10), y: Math.max(8, y - 10), w: 150 });
      setTimeout(() => {
        textElRef.current?.focus();
      }, 0);
      return;
    }

    setIsDrawing(true);
    ctx.save();
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x * (canvasRef.current.width / canvasRef.current.getBoundingClientRect().width), y * (canvasRef.current.height / canvasRef.current.getBoundingClientRect().height));
  };

  const handlePointerMove = (e) => {
    if (!isDrawing || !ctx) return;
    const { x, y } = getXY(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (ctx) ctx.restore();
  };

  const clearCanvas = () => {
    if (!ctx || !baseImg) return;
    setupCanvasWithImage(baseImg);
  };

  const placeTextBoxToCanvas = () => {
    if (!textBox) return;
    const content = (textElRef.current?.value || textValue || '').toString();
    if (!content.trim()) {
      toast.error('Type something in the text box first.');
      return;
    }
    
    // Create a placed text object instead of drawing directly
    const placedText = {
      id: Date.now(),
      content: content,
      x: textBox.x,
      y: textBox.y,
      w: textBox.w,
      size: textSize,
      align: textAlign,
      bg: textBg,
      // capture the current textarea height in CSS pixels for precise region box
      h: (() => {
        const r = textElRef.current?.getBoundingClientRect();
        return r ? Math.max(24, Math.round(r.height)) : Math.max(24, Math.round(textSize * 1.6));
      })()
    };
    
    setPlacedTexts(prev => [...prev, placedText]);
    setTextValue(content);
    setTextBox(null);
    // Hide boxes after placing so no yellow outline remains
    setShowBoxes(false);
  };

  const startDrag = (e) => {
    if (!textBox) return;
    e.preventDefault();
    e.stopPropagation();
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;
    setDragState({ startX: clientX, startY: clientY, origX: textBox.x, origY: textBox.y });
    window.addEventListener('mousemove', onDragMove, { passive: false });
    window.addEventListener('mouseup', endDrag);
    window.addEventListener('touchmove', onDragMove, { passive: false });
    window.addEventListener('touchend', endDrag);
  };
  const onDragMove = (e) => {
    if (!dragState) return;
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;
    setTextBox((tb) => {
      if (!tb) return tb;
      const dx = clientX - dragState.startX;
      const dy = clientY - dragState.startY;
      return { ...tb, x: Math.max(0, dragState.origX + dx), y: Math.max(0, dragState.origY + dy) };
    });
  };

  // Build precise region instructions from placed texts (normalized coordinates)
  const buildRegionInstructions = () => {
    if (!placedTexts.length) return '';
    const c = canvasRef.current;
    if (!c) return '';
    const rect = c.getBoundingClientRect();
    const canvasW = c.width;
    const canvasH = c.height;
    // Combine committed regions with an active textbox (if any)
    const combined = textBox
      ? [...placedTexts, { ...textBox, size: textSize, content: (textElRef.current?.value || textValue || ''), align: textAlign }]
      : placedTexts;
    const lines = combined.map((t, i) => {
      const box = measureRegionBox(t, rect) || { rx: t.x, ry: t.y, rw: t.w, rh: t.size * 1.5 };
      const x1 = Math.max(0, Math.min(1, box.rx / rect.width));
      const y1 = Math.max(0, Math.min(1, box.ry / rect.height));
      const x2 = Math.max(0, Math.min(1, (box.rx + box.rw) / rect.width));
      const y2 = Math.max(0, Math.min(1, (box.ry + box.rh) / rect.height));
      const px1 = Math.round(x1 * canvasW);
      const py1 = Math.round(y1 * canvasH);
      const px2 = Math.round(x2 * canvasW);
      const py2 = Math.round(y2 * canvasH);
      const cx = ((x1 + x2) / 2).toFixed(3);
      const cy = ((y1 + y2) / 2).toFixed(3);
      const nw = (x2 - x1).toFixed(3);
      const nh = (y2 - y1).toFixed(3);
      const anchor = (t.align === 'left' ? 'anchor-left' : t.align === 'right' ? 'anchor-right' : 'anchor-center');
      return `- R${i + 1}: ${anchor}; box_norm=[${x1.toFixed(3)}, ${y1.toFixed(3)}, ${x2.toFixed(3)}, ${y2.toFixed(3)}], box_px=[${px1}, ${py1}, ${px2}, ${py2}], center=(${cx}, ${cy}), size=(${nw}w, ${nh}h) • Instruction: ${t.content}`;
    });
    return [
      'Edit the guide image using these regions (coordinates normalized to 0..1):',
      ...lines,
      'HARD CONSTRAINTS (follow exactly):',
      '- Use Image 2 (binary mask) as a HARD mask. WHITE = editable, BLACK = preserve exactly. Make ZERO changes outside black areas.',
      '- Place the requested object INSIDE the white box only. Keep the object fully bounded by the box unless a tiny 1–2px feather is necessary for realism.',
      '- Position: obey the provided anchor (anchor-left/anchor-center/anchor-right). If the instruction implies anchoring to ground, align the object base to the bottom edge of the box.',
      '- Geometry: match scale to fit the box; do not overflow. Respect perspective of the scene.',
      '- Appearance: match lighting, color, materials, and cast shadows correctly.',
      '- Do NOT render instruction text or captions anywhere in the image.',
      'Quality Goals:',
      '- Clean edges, no halos on the mask boundary; seamless blending with the background.',
      '- No duplicate objects; keep the rest of the image pixel-accurate to the guide.'
    ].join('\n');
  };
  const endDrag = () => {
    window.removeEventListener('mousemove', onDragMove);
    window.removeEventListener('mouseup', endDrag);
    window.removeEventListener('touchmove', onDragMove);
    window.removeEventListener('touchend', endDrag);
    setDragState(null);
  };

  // Resize handler (horizontal only)
  const startResize = (e) => {
    if (!textBox) return;
    e.stopPropagation();
    setResizeState({ startX: e.clientX, origW: textBox.w });
    window.addEventListener('mousemove', onResizeMove);
    window.addEventListener('mouseup', endResize);
  };
  const onResizeMove = (e) => {
    setTextBox((tb) => {
      if (!tb || !resizeState) return tb;
      const dx = e.clientX - resizeState.startX;
      const w = Math.max(180, Math.min(900, resizeState.origW + dx));
      return { ...tb, w };
    });
  };
  const endResize = () => {
    window.removeEventListener('mousemove', onResizeMove);
    window.removeEventListener('mouseup', endResize);
    setResizeState(null);
  };

  const exportCompositeFile = () => {
    return new Promise((resolve, reject) => {
      const c = canvasRef.current;
      const { outW, outH } = getExportDims();
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = outW;
      tempCanvas.height = outH;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return reject(new Error('Could not create temp canvas context'));

      // Draw existing canvas content
      tempCtx.imageSmoothingEnabled = true;
      tempCtx.imageSmoothingQuality = 'high';
      tempCtx.drawImage(c, 0, 0, outW, outH);

      // Do NOT draw any markers or shapes on the guide image.
      // We rely on a strict binary mask (exportMaskFile) and region instructions for placement.

      tempCanvas.toBlob((blob) => {
        if (!blob) return reject(new Error('Export failed'));
        const file = new File([blob], `edited_${Date.now()}.png`, { type: 'image/png' });
        resolve(file);
      }, 'image/png', 0.95);
    });
  };

  // Export a strict binary mask (white boxes on black background) for exact placement
  const exportMaskFile = () => {
    return new Promise((resolve, reject) => {
      const c = canvasRef.current;
      const { outW, outH } = getExportDims();
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = outW;
      maskCanvas.height = outH;
      const mctx = maskCanvas.getContext('2d');
      if (!mctx) return reject(new Error('Could not create mask canvas context'));

      // Black background
      mctx.fillStyle = '#000000';
      mctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

      const rect = c.getBoundingClientRect();
      const scaleExpX = outW / rect.width;
      const scaleExpY = outH / rect.height;
      // Use both placed regions and the active textbox if present
      const regions = textBox
        ? [...placedTexts, { ...textBox, size: textSize, content: (textElRef.current?.value || textValue || ''), align: textAlign }]
        : placedTexts;
      // Ensure crisp binary rectangles (no anti-aliasing)
      mctx.imageSmoothingEnabled = false;
      regions.forEach(t => {
        const box = measureRegionBox(t, rect);
        if (!box) return;
        const rx = Math.round(box.rx * scaleExpX);
        const ry = Math.round(box.ry * scaleExpY);
        const rw = Math.max(1, Math.round(box.rw * scaleExpX));
        const rh = Math.max(1, Math.round(box.rh * scaleExpY));
        mctx.fillStyle = '#ffffff';
        mctx.fillRect(rx, ry, rw, rh);
      });

      maskCanvas.toBlob((blob) => {
        if (!blob) return reject(new Error('Mask export failed'));
        const file = new File([blob], `mask_${Date.now()}.png`, { type: 'image/png' });
        resolve(file);
      }, 'image/png', 1.0);
    });
  };

  const handleGenerate = async () => {
    if (!baseImg) {
      toast.error('Upload or draw on an image first.');
      return;
    }
    const regionBlock = buildRegionInstructions();
    const userPrompt = (prompt || '').trim();
    const maskHint = placedTexts.length
      ? 'Image 2 is a strict binary mask (WHITE = editable, BLACK = preserve exactly). Make zero changes outside black areas. For each white region, generate only the requested object inside the box and keep it fully bounded.'
      : '';
    const finalPrompt = [
      userPrompt,
      'Image 1: Guide image (unaltered).',
      maskHint,
      regionBlock || 'Use the uploaded guide image and make realistic edits.'
    ].filter(Boolean).join('\n');
    try {
      setIsGenerating(true);
      setResultUrls([]);
      setSelectedIndex(null);
      const guideFile = await exportCompositeFile();
      const files = [guideFile];
      if (placedTexts.length) {
        const maskFile = await exportMaskFile();
        files.push(maskFile);
      }
      const urls = await generateGeminiImage({ prompt: finalPrompt, nepaliText: '', imageFiles: files, candidateCount: 4 });
      setResultUrls(urls);
    } catch (e) {
      console.error(e);
      toast.error(e?.message || 'Generation failed');
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
            {/* Animated retro background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
          className="absolute -top-20 -left-20 w-72 h-72 rounded-full"
          style={{ background: '#F8D5C7', border: '4px solid #1A1A1A', opacity: 0.2 }}
          animate={{ scale: [1, 1.05, 1], rotate: [0, 5, 0] }}
          transition={{ duration: 30, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full"
          style={{ background: '#F3E2D3', border: '4px solid #1A1A1A', opacity: 0.15 }}
          animate={{ scale: [1, 1.03, 1], rotate: [0, -5, 0] }}
          transition={{ duration: 40, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/4 -right-12 w-48 h-32 rounded-[2rem]"
          style={{ background: '#F7C9B9', border: '4px solid #1A1A1A', opacity: 0.18 }}
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 20, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
        />
      </div>
      {/* Heavily Artistic Background Elements v3 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Large floating shapes with increased parallax */}
        <motion.div
          className="absolute top-[5%] left-[8%] w-64 h-64 rounded-full"
          style={{ background: '#F8D5C7', border: '4px solid #1A1A1A', opacity: 0.25, boxShadow: '12px 12px 0 #1A1A1A' }}
          animate={{ x: parallax.x * 0.8, y: parallax.y * 1.2, rotate: -12 }}
          transition={{ type: 'spring', stiffness: 25, damping: 20 }}
        />
        <motion.div
          className="absolute bottom-[8%] right-[10%] w-80 h-80"
          style={{ background: '#F3E2D3', border: '4px solid #1A1A1A', opacity: 0.2, clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }}
          animate={{ x: parallax.x * -1.1, y: parallax.y * 0.7, rotate: 18 }}
          transition={{ type: 'spring', stiffness: 25, damping: 20 }}
        />

        {/* Small, edit-related decorative elements */}
        <motion.svg className="absolute top-[15%] right-[18%] w-10 h-10 text-black/20" animate={{ x: parallax.x * 0.4, y: parallax.y * 0.6, rotate: 45 }} transition={{ type: 'spring', stiffness: 70, damping: 20 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><path d="M11 13a1 1 0 100-2 1 1 0 000 2z"/></motion.svg>
        <motion.div className="absolute bottom-[20%] left-[12%] w-12 h-12 border-2 border-black/25 rounded-full flex items-center justify-center" animate={{ x: parallax.x * 1.4, y: parallax.y * -1.1 }} transition={{ type: 'spring', stiffness: 70, damping: 20 }}><div className="w-4 h-4 bg-black/25 rounded-full"/></motion.div>
        <motion.div className="absolute top-[85%] right-[45%] w-5 h-5 bg-black/25 rounded-full" animate={{ x: parallax.x * -1.5, y: parallax.y * 0.4 }} transition={{ type: 'spring', stiffness: 70, damping: 20 }} />
        <motion.div className="absolute top-[30%] left-[25%] w-4 h-4 bg-black/20 rounded-full" animate={{ x: parallax.x * 0.6, y: parallax.y * -0.6 }} transition={{ type: 'spring', stiffness: 70, damping: 20 }} />
        <motion.div className="absolute top-[60%] right-[30%] w-6 h-6 border-2 border-black/20" animate={{ x: parallax.x * -0.8, y: parallax.y * 1.4, rotate: -35 }} transition={{ type: 'spring', stiffness: 70, damping: 20 }} />
        <motion.svg className="absolute bottom-[35%] right-[25%] w-12 h-12 text-black/20" animate={{ x: parallax.x * -0.5, y: parallax.y * 0.9 }} transition={{ type: 'spring', stiffness: 70, damping: 20 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></motion.svg>

        {/* Squiggle lines and grids */}
        <motion.svg
          className="absolute top-[50%] left-[15%] w-56 h-56 opacity-20"
          animate={{ x: parallax.x * 0.6, y: parallax.y * -0.9 }}
          transition={{ type: 'spring', stiffness: 40, damping: 20 }}
          viewBox="0 0 100 100" fill="none"
        >
          <path d="M0 50 H 100 M50 0 V 100" stroke="#1A1A1A" strokeWidth="2" />
          <circle cx="50" cy="50" r="35" stroke="#1A1A1A" strokeWidth="2" />
        </motion.svg>
        <motion.svg className="absolute bottom-[10%] left-[40%] w-24 h-24 text-black/20" animate={{ x: parallax.x * -0.6, y: parallax.y * 1.1, rotate: -20 }} transition={{ type: 'spring', stiffness: 50, damping: 20 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6.13 1L6 16a2 2 0 0 0 2 2h15"/><path d="M1 6.13L16 6a2 2 0 0 1 2 2v15"/></motion.svg>
        
        {/* Central dashed circle (subtle) */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] border-2 border-dashed border-black/10 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 180, repeat: Infinity, ease: 'linear' }}
        />
      </div>
      <main className="min-h-screen flex flex-col items-center justify-start px-4 pt-24 pb-12 z-10 relative">
        <div className="w-full max-w-5xl mx-auto text-center mb-8">
          <h2 className="text-4xl md:text-5xl font-black mb-2 font-heading">Edit Images with Precision</h2>
          <p className="text-base md:text-lg font-body opacity-90">Upload a guide, place boxes, and generate — we’ll keep everything else untouched.</p>
        </div>
        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Canvas column */}
          <div className="lg:col-span-8">
            <div className="rounded-2xl p-4" style={{ background: '#FDF5EC', border: '3px solid #1A1A1A', boxShadow: '8px 8px 0 #1A1A1A' }}>
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer" style={{ background: '#F8D5C7', border: '2px solid #1A1A1A', boxShadow: '4px 4px 0 #1A1A1A', color: '#1A1A1A' }}>
                  <Upload className="w-4 h-4" />
                  <span>Upload</span>
                  <input type="file" accept="image/*" className="hidden" onChange={onUpload} />
                </label>
                <button
                  type="button"
                  disabled={!baseImg}
                  onClick={handleGenerate}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg disabled:opacity-50"
                  style={{ background: '#F8D5C7', border: '2px solid #1A1A1A', boxShadow: '4px 4px 0 #1A1A1A', color: '#1A1A1A' }}
                >
                  <Send className="w-4 h-4" /> Generate now
                </button>
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg shadow cursor-pointer" style={{ background: '#FDF5EC', border: '2px solid #1A1A1A' }}>
                  <input type="checkbox" checked={autoGenOnUpload} onChange={(e)=>setAutoGenOnUpload(e.target.checked)} />
                  <span className="text-sm">Auto-generate after upload</span>
                </label>

                {/* Canvas size presets */}
                <div className="inline-flex items-center gap-1 px-2 py-2 rounded-lg bg-white/80 text-slate-800 shadow">
                  <span className="text-sm mr-1">Size</span>
                  <button type="button" className={`px-2 py-1 rounded ${canvasMaxW===560?'bg-slate-800 text-white':'bg-white/80'}`} onClick={()=>setCanvasMaxW(560)}>S</button>
                  <button type="button" className={`px-2 py-1 rounded ${canvasMaxW===640?'bg-slate-800 text-white':'bg-white/80'}`} onClick={()=>setCanvasMaxW(640)}>M</button>
                  <button type="button" className={`px-2 py-1 rounded ${canvasMaxW===820?'bg-slate-800 text-white':'bg-white/80'}`} onClick={()=>setCanvasMaxW(820)}>L</button>
                </div>

                <div className="h-9 w-px bg-white/50" />

                <button type="button" onClick={() => setTool('brush')} className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg shadow`} style={{ background: tool==='brush' ? '#F8D5C7' : '#FDF5EC', border: '2px solid #1A1A1A', boxShadow: '4px 4px 0 #1A1A1A', color: '#1A1A1A' }}>
                  <Brush className="w-4 h-4" /> Brush
                </button>
                <button type="button" onClick={() => setTool('eraser')} className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg shadow`} style={{ background: tool==='eraser' ? '#F8D5C7' : '#FDF5EC', border: '2px solid #1A1A1A', boxShadow: '4px 4px 0 #1A1A1A', color: '#1A1A1A' }}>
                  <Eraser className="w-4 h-4" /> Eraser
                </button>
                <button type="button" onClick={() => setTool('text')} className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg shadow`} style={{ background: tool==='text' ? '#F8D5C7' : '#FDF5EC', border: '2px solid #1A1A1A', boxShadow: '4px 4px 0 #1A1A1A', color: '#1A1A1A' }}>
                  <Type className="w-4 h-4" /> Text
                </button>

                <div className="h-9 w-px bg-white/50" />

                {/* Brush color/size */}
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg shadow" style={{ background: '#FDF5EC', border: '2px solid #1A1A1A' }}>
                  <span className="text-sm">Color</span>
                  <input type="color" value={brushColor} onChange={(e)=>setBrushColor(e.target.value)} className="h-8 w-8 rounded cursor-pointer" />
                </label>
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg shadow" style={{ background: '#FDF5EC', border: '2px solid #1A1A1A' }}>
                  <button type="button" onClick={()=>setBrushSize(Math.max(2, brushSize-2))} className="p-1 rounded bg-white/80"><Minus className="w-4 h-4"/></button>
                  <span className="text-sm w-10 text-center">{brushSize}</span>
                  <button type="button" onClick={()=>setBrushSize(Math.min(80, brushSize+2))} className="p-1 rounded bg-white/80"><Plus className="w-4 h-4"/></button>
                </div>

                {/* Text controls */}
                <input
                  type="text"
                  placeholder="Type Nepali text…"
                  value={textValue}
                  onChange={(e)=>setTextValue(e.target.value)}
                  className="flex-1 min-w-[160px] px-3 py-2 rounded-lg font-devanagari"
                  style={{ background: '#FDF5EC', border: '2px solid #1A1A1A' }}
                  lang="ne"
                />
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg shadow" style={{ background: '#FDF5EC', border: '2px solid #1A1A1A' }}>
                  <span className="text-sm">Text size</span>
                  <button type="button" onClick={()=>setTextSize(Math.max(18, textSize-4))} className="p-1 rounded bg-white/80"><Minus className="w-4 h-4"/></button>
                  <span className="text-sm w-10 text-center">{textSize}</span>
                  <button type="button" onClick={()=>setTextSize(Math.min(160, textSize+4))} className="p-1 rounded bg-white/80"><Plus className="w-4 h-4"/></button>
                </div>
                <div className="inline-flex items-center gap-1 px-2 py-2 rounded-lg shadow" style={{ background: '#FDF5EC', border: '2px solid #1A1A1A' }}>
                  <button type="button" className={`px-2 py-1 rounded ${textAlign==='left'?'bg-slate-800 text-white':'bg-white/80'}`} onClick={()=>setTextAlign('left')}>L</button>
                  <button type="button" className={`px-2 py-1 rounded ${textAlign==='center'?'bg-slate-800 text-white':'bg-white/80'}`} onClick={()=>setTextAlign('center')}>C</button>
                  <button type="button" className={`px-2 py-1 rounded ${textAlign==='right'?'bg-slate-800 text-white':'bg-white/80'}`} onClick={()=>setTextAlign('right')}>R</button>
                </div>
                <button type="button" className={`px-3 py-2 rounded-lg shadow`} style={{ background: textBg ? '#F8D5C7' : '#FDF5EC', border: '2px solid #1A1A1A' }} onClick={()=>setTextBg(v=>!v)}>BG</button>
                <button type="button" className={`px-3 py-2 rounded-lg shadow`} style={{ background: showBoxes ? '#F8D5C7' : '#FDF5EC', border: '2px solid #1A1A1A' }} onClick={()=>setShowBoxes(v=>!v)}>Boxes</button>

                <button type="button" onClick={clearCanvas} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg shadow" style={{ background: '#FDF5EC', border: '2px solid #1A1A1A' }}>
                  <Trash2 className="w-4 h-4"/> Clear
                </button>
              </div>

              <div ref={containerRef} className="w-full relative">
                <motion.canvas
                  ref={canvasRef}
                  className="w-full rounded-lg border border-white/40 bg-black/5"
                  onMouseDown={handlePointerDown}
                  onMouseMove={handlePointerMove}
                  onMouseUp={handlePointerUp}
                  onMouseLeave={handlePointerUp}
                  onTouchStart={(e)=>{e.preventDefault(); handlePointerDown(e);}}
                  onTouchMove={(e)=>{e.preventDefault(); handlePointerMove(e);}}
                  onTouchEnd={(e)=>{e.preventDefault(); handlePointerUp();}}
                  initial={{ opacity: 0.85, scale: 0.985 }}
                  animate={{ opacity: isSwappingBase ? 0.5 : 1, scale: isSwappingBase ? 0.98 : 1 }}
                  transition={{ duration: 0.25 }}
                />
                {isSwappingBase && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/30 backdrop-blur-[1px] rounded-lg">
                    <Loader className="w-6 h-6 animate-spin text-slate-800" />
                    <span className="ml-2 text-slate-800 font-medium">Loading for edit…</span>
                  </div>
                )}
                {/* Render placed text objects as overlays */}
                {placedTexts.map(textObj => (
                  <div
                    key={textObj.id}
                    className="absolute pointer-events-none"
                    style={{
                      left: textObj.x + 6,
                      top: textObj.y + 6,
                      width: textObj.w - 12,
                      fontSize: `${Math.max(12, textObj.size * 0.7)}px`,
                      color: '#ffffff',
                      textShadow: '0 1px 3px rgba(0,0,0,0.8), 0 0 6px rgba(0,0,0,0.5)',
                      fontWeight: 'bold',
                      lineHeight: 1.3,
                      textAlign: textObj.align,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontFamily: '"Noto Sans Devanagari", "Noto Serif Devanagari", "Inter", sans-serif'
                    }}
                  >
                    {textObj.content}
                  </div>
                ))}
                {/* Box previews for each placed region */}
                {showBoxes && placedTexts.map(textObj => {
                  const box = measureRegionBox(textObj) || { rx: textObj.x, ry: textObj.y, rw: textObj.w, rh: textObj.size * 1.5 };
                  return (
                    <div
                      key={`box_${textObj.id}`}
                      className="absolute pointer-events-none border-2 border-amber-400/90 bg-transparent"
                      style={{ left: box.rx, top: box.ry, width: box.rw, height: box.rh, boxShadow: 'inset 0 0 0 2px rgba(26,26,26,0.12)' }}
                    />
                  );
                })}
                {textBox && (
                  <div
                    className="absolute rounded shadow-lg border border-amber-300/80 bg-white/95 flex flex-col"
                    style={{ left: textBox.x, top: textBox.y, width: textBox.w }}
                  >
                    <div 
                      className="h-4 bg-amber-200/90 cursor-move rounded-t flex-shrink-0"
                      onMouseDown={startDrag}
                      onTouchStart={startDrag}
                    />
                    <textarea
                      ref={textElRef}
                      className="w-full p-1 bg-transparent outline-none font-devanagari resize-none text-slate-900 text-xs"
                      lang="ne"
                      dir="ltr"
                      spellCheck={false}
                      value={textValue}
                      onChange={(e)=> setTextValue(e.target.value)}
                      onKeyDown={(e)=>{ if(e.key==='Escape'){ setTextBox(null); } }}
                      style={{ lineHeight: 1.3, textAlign: textAlign, minHeight: '40px' }}
                      placeholder="Type here…"
                    />
                    <div className="flex justify-end gap-1 p-1 border-t border-amber-200/90 flex-shrink-0">
                      <button type="button" className="px-1 py-0.5 rounded text-xs bg-slate-200 text-slate-800" onClick={()=>setTextBox(null)}>×</button>
                      <button type="button" className="px-1 py-0.5 rounded text-xs bg-amber-500 text-amber-900" onClick={placeTextBoxToCanvas}>✓</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right column: Prompt + Results */}
          <div className="lg:col-span-4">
            <div className="rounded-2xl p-4 sticky top-24" style={{ background: '#FDF5EC', border: '3px solid #1A1A1A', boxShadow: '8px 8px 0 #1A1A1A' }}>
              <h3 className="text-lg font-semibold mb-2">Generate from your edits</h3>
              <textarea
                className="w-full p-3 rounded-lg outline-none font-devanagari"
                style={{ background: '#FDF5EC', border: '2px solid #1A1A1A' }}
                rows={4}
                placeholder="Describe what to generate. Include the exact Nepali text in quotes to typeset verbatim."
                value={prompt}
                onChange={(e)=>setPrompt(e.target.value)}
                lang="ne"
              />
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim() || !baseImg}
                className="mt-3 inline-flex items-center justify-center gap-2 w-full h-11 rounded-lg disabled:opacity-50"
                style={{ background: '#F8D5C7', border: '2px solid #1A1A1A', boxShadow: '4px 4px 0 #1A1A1A' }}
                title="Generate"
              >
                {isGenerating ? <Loader className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5"/>}
                <span>{isGenerating ? 'Generating…' : 'Generate (4)'}</span>
              </button>
            </div>

            <div className="mt-6">
              <AnimatePresence mode="wait">
                {isGenerating && (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full flex flex-col items-center justify-center text-center my-8">
                    <motion.svg
                      width="80"
                      height="80"
                      viewBox="0 0 80 80"
                      initial="start"
                      animate="end"
                      className="text-black/50"
                    >
                      <motion.circle
                        cx="40"
                        cy="40"
                        r="35"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray="10 15"
                        variants={{
                          start: { rotate: 0 },
                          end: { rotate: 360 },
                        }}
                        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                      />
                      <motion.path
                        d="M40 20 L50 35 L60 40 L50 45 L40 60 L30 45 L20 40 L30 35 Z"
                        fill="currentColor"
                        variants={{
                          start: { scale: 0.8, opacity: 0.7 },
                          end: { scale: 1.1, opacity: 1 },
                        }}
                        transition={{ duration: 1.5, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
                      />
                    </motion.svg>
                    <p className="mt-6 text-lg font-semibold tracking-wider">Eikona is creating...</p>
                    <p className="text-sm opacity-70">This can take up to 30 seconds.</p>
                  </motion.div>)}
                {resultUrls.length > 0 && (
                  <motion.div key="images" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="w-full">
                    <h4 className="text-lg font-semibold mb-3">Your Images</h4>
                    <div className="grid grid-cols-1 gap-3">
                      {resultUrls.map((url, i) => (
                        <div key={i} className={`relative group rounded-lg overflow-hidden bg-black/5`} style={{ border: '2px solid #1A1A1A', boxShadow: selectedIndex===i ? '0 0 0 4px #F8D5C7, 4px 4px 0 #1A1A1A' : '4px 4px 0 #1A1A1A' }}>
                          {/* Select best */}
                          <button
                            onClick={() => setSelectedIndex(i)}
                            className={`absolute top-2 left-2 z-10 inline-flex items-center justify-center w-8 h-8 rounded-full`}
                            style={{ background: selectedIndex===i ? '#F8D5C7' : '#FDF5EC', border: '2px solid #1A1A1A', boxShadow: '3px 3px 0 #1A1A1A', color: '#1A1A1A' }}
                            title={selectedIndex===i? 'Selected' : 'Mark as best'}
                            type="button"
                          >
                            <Star className="w-4 h-4" />
                          </button>
                          {/* Download */}
                          <button
                            onClick={() => downloadUrl(url, `katha_image_${Date.now()}.png`)}
                            className="absolute top-2 right-2 z-10 inline-flex items-center justify-center w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition"
                            style={{ background: '#F8D5C7', border: '2px solid #1A1A1A', color: '#1A1A1A', boxShadow: '3px 3px 0 #1A1A1A' }}
                            title="Download"
                            type="button"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          {/* Edit in canvas */}
                          <button
                            onClick={() => handleEditFromResult(url)}
                            className="absolute bottom-2 right-2 z-10 inline-flex items-center justify-center px-2.5 py-1.5 rounded-md bg-amber-500 text-amber-900 shadow opacity-0 group-hover:opacity-100 transition"
                            title="Edit this image"
                            type="button"
                          >
                            <Pencil className="w-4 h-4 mr-1" />
                            <span className="text-sm font-semibold">Edit</span>
                          </button>
                          <img
                            src={url}
                            alt={`Generated ${i+1}`}
                            className="w-full object-cover cursor-zoom-in"
                            onClick={() => setViewerUrl(url)}
                          />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Fullscreen viewer */}
        {viewerUrl && createPortal(
          <div className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-sm flex items-center justify-center" onClick={() => setViewerUrl(null)}>
            <img src={viewerUrl} alt="Preview" className="max-w-[92vw] max-h-[90vh] rounded-xl shadow-2xl" onClick={(e)=>e.stopPropagation()} />
            <button type="button" onClick={() => setViewerUrl(null)} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 text-slate-900 shadow flex items-center justify-center" title="Close">
              <X className="w-5 h-5" />
            </button>
          </div>,
          document.body
        )}
      </main>
    </div>
  );
};

export default ImageEditor;
