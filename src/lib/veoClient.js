// Gemini API client for Veo video generation

const defaultThumb = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function extractApiErrorMessage(text) {
  try {
    const json = JSON.parse(text);
    return json?.error?.message || text || 'Error';
  } catch {
    return text || 'Error';
  }
}


async function pollForResult(endpoint, apiKey, operationName, meta) {
  const pollInterval = Number(import.meta.env.VITE_VEO_POLL_INTERVAL_MS || 10000);
  const timeoutMs = Number(import.meta.env.VITE_VEO_TIMEOUT_MS || 180000);
  const start = Date.now();

  // Call Google endpoint directly to avoid local proxy resets
  const base = endpoint;
  const normalizeOperationPath = (name) => {
    if (!name) return '';
    let n = String(name).replace(/^\/+/, '');
    // If API already returned a v1beta-prefixed path, drop the prefix to avoid duplication
    n = n.startsWith('v1beta/') ? n.slice('v1beta/'.length) : n;
    return n;
  };
  const pollUrl = `${base}/v1beta/${normalizeOperationPath(operationName)}`;
  console.info('Veo POLL', pollUrl);

  while (true) {
    if (Date.now() - start > timeoutMs) {
      throw new Error('Timed out waiting for video generation.');
    }

    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort('timeout'), pollInterval * 1.5);

    try {
      const res = await fetch(pollUrl, {
        method: 'GET',
        mode: 'cors',
        headers: { 'x-goog-api-key': apiKey },
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(tid);

      if (!res.ok) {
        // Handle rate limits during polling by backing off instead of throwing
        if (res.status === 429 || res.status === 503) {
          const retryAfter = Number(res.headers.get('retry-after') || 0);
          const delay = retryAfter > 0 ? retryAfter * 1000 : pollInterval * 1.5;
          await wait(delay);
          continue;
        }
        const text = await res.text().catch(() => '');
        throw new Error(extractApiErrorMessage(text || res.statusText));
      }

      const data = await res.json();

      if (data.done) {
        if (data.error) {
          throw new Error(`Video generation failed: ${data.error.message || 'Unknown error'}`);
        }

        const videoUri = data.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;
        if (!videoUri) {
          throw new Error('API completed but did not return a video URI.');
        }

        // The video URI needs to be fetched as a blob to be playable in the browser
        const blobUrl = await fetchVideoAsBlobUrl(videoUri, apiKey);

        return {
          id: operationName,
          ...meta,
          url: blobUrl,
          thumbnail: data.response?.generateVideoResponse?.generatedSamples?.[0]?.thumbnail?.uri || defaultThumb,
          createdAt: new Date().toISOString(),
        };
      }
    } catch (error) {
      clearTimeout(tid);
      console.error(error);
      // Don't throw on a single failed poll, just wait and retry
    }

    await wait(pollInterval);
  }
}

export async function generateVideo({ prompt, duration = '8', style = 'realistic' }) {
  const USE_MOCK = String(import.meta.env.VITE_VEO_USE_MOCK ?? 'false').toLowerCase() === 'true';
  const ENDPOINT = import.meta.env.VITE_VEO_API_ENDPOINT;
  const API_KEY = import.meta.env.VITE_VEO_API_KEY;
  const CREATE_PATH = import.meta.env.VITE_VEO_CREATE_PATH;

  if (USE_MOCK) {
    await wait(2000);
    return {
      id: Date.now(),
      prompt,
      url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      thumbnail: defaultThumb,
      createdAt: new Date().toISOString(),
    };
  }

  if (!ENDPOINT || !API_KEY || !CREATE_PATH) {
    throw new Error('API not configured. Set VITE_VEO_API_ENDPOINT, VITE_VEO_API_KEY, and VITE_VEO_CREATE_PATH in .env');
  }

  const createUrl = `${ENDPOINT}${CREATE_PATH.startsWith('/') ? CREATE_PATH : '/' + CREATE_PATH}`;
  console.info('Veo POST', createUrl);

  const requestBody = {
    instances: [{ prompt }],
    parameters: {
      // aspectRatio: '16:9',
      // negativePrompt: 'cartoon, low quality',
      // You can add more Veo parameters here
    },
  };

  const maxAttempts = 3;
  let attempt = 0;

  // Build a list of candidate create paths to try if the configured one 404s
  const modelFromEnv = (import.meta.env.VITE_VEO_MODEL || '').trim();
  const modelGuesses = [
    modelFromEnv,
    'veo-3.0',
    'veo-002',
    'veo',
  ].filter(Boolean);

  const methodGuesses = [
    'generateVideo',
    'predictLongRunning',
  ];

  const candidatePaths = [CREATE_PATH]
    .concat(
      modelGuesses.flatMap((m) => [
        `/v1beta/models/${m}:generateVideo`,
        `/v1beta/models/${m}-generate-preview:predictLongRunning`,
        `/v1beta/models/${m}:predictLongRunning`,
      ])
    )
    // De-duplicate
    .filter((p, i, arr) => !!p && arr.indexOf(p) === i);

  let pathIndex = 0;
  while (true) {
    try {
      // Choose the current path to try
      const currentPath = candidatePaths[pathIndex] || CREATE_PATH;
      const createUrl = `${ENDPOINT}${currentPath.startsWith('/') ? currentPath : '/' + currentPath}`;
      console.info('Veo POST', createUrl);

      let res;
      try {
        res = await fetch(createUrl, {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': API_KEY,
          },
          body: JSON.stringify(requestBody),
          cache: 'no-store',
        });
      } catch (e) {
        throw new Error('Network error while calling Veo API. If you are behind a VPN/firewall, try disabling it or switching networks.');
      }

      if (!res.ok) {
        // If the path is not found, try the next known path before giving up
        if (res.status === 404 && pathIndex < candidatePaths.length - 1) {
          console.warn(`Create path 404: ${currentPath}. Trying next candidate...`);
          pathIndex++;
          // Reset attempts for new path
          attempt = 0;
          continue;
        }
        if ((res.status === 429 || res.status === 503) && attempt < maxAttempts) {
          const retryAfter = Number(res.headers.get('retry-after') || 0);
          const backoff = retryAfter > 0 ? retryAfter * 1000 : Math.min(1000 * Math.pow(2, attempt), 8000) + Math.random() * 250;
          console.warn(`Rate limited (${res.status}). Retrying in ${Math.round(backoff)}ms...`);
          await wait(backoff);
          attempt++;
          continue;
        }
        const text = await res.text().catch(() => '');
        throw new Error(extractApiErrorMessage(text || res.statusText));
      }

      const data = await res.json();
      const operationName = data?.name;

      if (!operationName) {
        throw new Error('API did not return an operation name.');
      }

      // Pass the base endpoint (not proxied one) for polling construction
      return pollForResult(ENDPOINT, API_KEY, operationName, { prompt });

    } catch (error) {
      // Network or thrown errors above
      console.error(error);
      if (attempt < maxAttempts && /429|RESOURCE_EXHAUSTED|rate limit|quota/i.test(error.message)) {
        const backoff = Math.min(1000 * Math.pow(2, attempt), 8000) + Math.random() * 250;
        await wait(backoff);
        attempt++;
        continue;
      }
      // Re-throw raw error message without our prefix
      throw new Error(error.message || 'Error');
    }
  }
}

// Helper to fetch the protected video URL and return a local blob URL
async function fetchVideoAsBlobUrl(videoUri, apiKey) {
  try {
    const res = await fetch(videoUri, {
      headers: { 'x-goog-api-key': apiKey },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch video file: ${res.status} ${res.statusText}`);
    }
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error fetching video blob:', error);
    return null; // Return null or a placeholder URL on failure
  }
}
