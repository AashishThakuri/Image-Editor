// Gemini 2.5 Flash Image (aka Nano Banana) client via REST
// Docs: https://ai.google.dev/gemini-api/docs/image-generation

export async function generateGeminiImage({ prompt, nepaliText = '', mimeType = 'image/png', imageFile = null, imageFiles = [], candidateCount = 4 }) {
  const hasPrompt = !!(prompt && prompt.trim());
  const hasNepali = !!(nepaliText && nepaliText.trim());
  if (!hasPrompt && !hasNepali) throw new Error('Enter a prompt or Nepali text.');

  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_VEO_API_KEY;
  const ENDPOINT = import.meta.env.VITE_GEMINI_API_ENDPOINT || import.meta.env.VITE_VEO_API_ENDPOINT || 'https://generativelanguage.googleapis.com';
  const IMAGE_PATH = import.meta.env.VITE_GEMINI_IMAGE_PATH || '/v1beta/models/gemini-2.5-flash-image-preview:generateContent';
  const FALLBACK_IMAGE_PATH = '/v1beta/models/gemini-2.0-flash-exp:generateContent';

  if (!API_KEY) throw new Error('Gemini API key not configured. Set VITE_GEMINI_API_KEY or VITE_VEO_API_KEY');

  function makeUrl(path) {
    const p = path.startsWith('/') ? path : '/' + path;
    // Call Google directly to avoid local proxy TLS resets on some networks
    const base = `${ENDPOINT}${p}`;
    const joiner = base.includes('?') ? '&' : '?';
    return `${base}${joiner}key=${encodeURIComponent(API_KEY)}`;
  }
  const url = makeUrl(IMAGE_PATH);
  const urlFallback = makeUrl(FALLBACK_IMAGE_PATH);

  // Build parts: optional inline images (up to 4) + prompt text
  async function buildParts(targetMax = 1280) {
    const parts = [];
    const files = Array.isArray(imageFiles) && imageFiles.length > 0
      ? imageFiles.slice(0, 4)
      : (imageFile instanceof File ? [imageFile] : []);
    for (const f of files) {
      const { base64, outMime } = await downscaleToBase64(f, targetMax, 0.95);
      parts.push({ inlineData: { data: base64, mimeType: outMime || f.type || mimeType } });
    }
    // If no reference images were provided, include a small blank seed so the
    // image endpoint accepts the request in all environments. The prompt will
    // instruct the model to ignore the blank seed and create a brand-new image.
    const usedBlankSeed = files.length === 0;
    if (usedBlankSeed) {
      try {
        const seed = await makeBlankSeedBase64(1024, 1024, '#ffffff');
        parts.push({ inlineData: { data: seed.base64, mimeType: seed.outMime } });
      } catch { /* ignore */ }
    }
    // Build an augmented prompt that guides the model to MERGE inputs consistently
    const qualityBoost = 'Ultra-detailed, coherent lighting, very sharp focus, clean edges, natural materials, accurate proportions, no distortions, high dynamic range, professional photography. Target a high-resolution output (around 1920px on the long edge).';
    // Only enable Nepali typesetting when explicit nepaliText is provided.
    const hasDevanagari = /[\u0900-\u097F]/.test(nepaliText || '');
    const nepaliHint = hasDevanagari
      ? 'Render all text in Nepali (Devanagari script) exactly as specified. Preserve matra placement, conjuncts (ligatures), and spacing. Do not translate, romanize, or alter spellings. If any quoted phrases are present, typeset them verbatim. Use clean, legible Devanagari typography similar to Noto Sans Devanagari.'
      : '';
    const nepaliBlock = (nepaliText && nepaliText.trim().length)
      ? `Nepali text to typeset (use verbatim, preserve line breaks, place in the same positions as the guide image):\n<<<\n${nepaliText.trim()}\n>>>`
      : '';
    const baseInstruction = (!hasPrompt && hasNepali)
      ? 'Use the guide image(s) and the Nepali text block below. Typeset the Nepali text verbatim (no translation/romanization) and preserve line breaks and layout. Enhance realism, lighting, and composition while keeping the placed text readable.'
      : '';
    const mergeHint = files.length > 1
      ? `Merge the ${files.length} reference images into a single cohesive composition. Preserve key elements from each input and make them consistent (colors, materials, typography, logos, faces/people). Harmonize perspective and lighting. Avoid duplicates or mismatched styles.`
      : '';
    const noRefHint = usedBlankSeed
      ? 'No reference images were provided: treat the white seed image as a placeholder only. Generate a brand-new image purely from the prompt. Ignore the seed content.'
      : '';
    const composed = [mergeHint, noRefHint, qualityBoost, nepaliHint, nepaliBlock, baseInstruction, prompt].filter(Boolean).join('\n');
    parts.push({ text: composed });
    return parts;
  }

  async function postOnce(parts, targetUrl = url) {
    const body = { contents: [{ role: 'user', parts }] };
    try {
      const res = await fetch(targetUrl, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': API_KEY,
        },
        body: JSON.stringify(body),
        cache: 'no-store',
      });
      return res;
    } catch (e) {
      // Surface a clearer message for network resets
      throw new Error('Network error while calling Gemini image API. If you are behind a VPN/firewall, try disabling it or switching networks.');
    }
  }

  async function runOnce(targetMax = 1280) {
    // First try with larger target for more detail
    let parts = await buildParts(targetMax);
    let res = await postOnce(parts, url);
    if (!res.ok && res.status === 500 && (imageFile instanceof File || (Array.isArray(imageFiles) && imageFiles.length > 0))) {
      try {
        // fallback chain: 1920 -> 1600 -> 1280 -> 1024
        parts = await buildParts(1280);
        res = await postOnce(parts, url);
        if (!res.ok) {
          parts = await buildParts(1152);
          res = await postOnce(parts, url);
        }
        if (!res.ok) {
          parts = await buildParts(1024);
          res = await postOnce(parts, url);
        }
        // final keep at 1024
      } catch (_) {}
    }
    // If still not ok, try model fallback once
    if (!res.ok) {
      try {
        const parts2 = await buildParts(targetMax);
        const res2 = await postOnce(parts2, urlFallback);
        if (res2.ok) res = res2;
      } catch (_) {}
    }
    if (!res.ok) {
      let message = '';
      try {
        const j = await res.json();
        message = j?.error?.message || JSON.stringify(j);
      } catch {
        message = await res.text().catch(() => '') || res.statusText;
      }
      throw new Error(`Gemini image API error ${res.status}: ${message}`);
    }
    const data = await res.json();
    const cand = data?.candidates?.[0];
    const resParts = cand?.content?.parts || [];
    for (const p of resParts) {
      const id = p.inlineData || p.inline_data;
      if (id && id.data) {
        const base64 = id.data;
        const mime = id.mimeType || id.mime_type || mimeType;
        const binary = atob(base64);
        const len = binary.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes], { type: mime });
        return URL.createObjectURL(blob);
      }
    }
    throw new Error('Image generation response did not include image data.');
  }

  const count = Math.max(1, Number.isFinite(candidateCount) ? candidateCount : 4);

  async function upscaleToLongEdge(url, longEdge = 1920) {
    try {
      const img = await new Promise((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = url;
      });
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      const currentLong = Math.max(w, h);
      if (currentLong >= longEdge) return url; // no need to upscale
      const scale = longEdge / currentLong;
      const outW = Math.round(w * scale);
      const outH = Math.round(h * scale);
      const c = document.createElement('canvas');
      c.width = outW; c.height = outH;
      const cctx = c.getContext('2d');
      cctx.imageSmoothingEnabled = true;
      cctx.imageSmoothingQuality = 'high';
      cctx.drawImage(img, 0, 0, outW, outH);
      const blob = await new Promise((resolve) => c.toBlob(resolve, 'image/png', 0.95));
      if (!blob) return url;
      return URL.createObjectURL(blob);
    } catch {
      return url;
    }
  }
  async function runPool(n) {
    const results = new Array(n);
    const concurrency = Math.min(2, n);
    let next = 0;
    async function worker() {
      while (true) {
        const index = next++;
        if (index >= n) break;
        try {
          results[index] = await runOnce(1600);
        } catch (e) {
          // Best-effort: try a smaller size once more at this slot
          try {
            results[index] = await runOnce(1280);
          } catch (e2) {
            throw e2;
          }
        }
        // tiny spacing to spread load a bit
        await new Promise(r => setTimeout(r, 80));
      }
    }
    const workers = Array.from({ length: concurrency }, () => worker());
    await Promise.all(workers);
    // Ensure minimum resolution (~1080p) for quality
    // For masked edits (when imageFiles length > 0), skip expensive post-upscale to return faster
    if (Array.isArray(imageFiles) && imageFiles.length > 0) {
      return results;
    }
    const upscaled = await Promise.all(results.map(u => upscaleToLongEdge(u, 1920)));
    return upscaled;
  }
  return await runPool(count);
}

async function fileToBase64(file) {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function downscaleToBase64(file, targetMax = 1280, quality = 0.92) {
  try {
    const url = URL.createObjectURL(file);
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    URL.revokeObjectURL(url);

    const { width, height } = img;
    const scale = Math.min(1, targetMax / Math.max(width, height));
    const outW = Math.max(1, Math.round(width * scale));
    const outH = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, outW, outH);

    const outMime = 'image/jpeg';
    const q = Math.max(0.5, Math.min(0.98, quality || 0.92));
    const dataUrl = canvas.toDataURL(outMime, q);
    const base64 = dataUrl.split(',')[1];
    return { base64, outMime };
  } catch (e) {
    // Fallback to raw base64 if canvas path fails
    const base64 = await fileToBase64(file);
    return { base64, outMime: file.type };
  }
}
