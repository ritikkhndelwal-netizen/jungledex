import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import multer from 'multer';
import rateLimit from 'express-rate-limit';

const app = express();
const port = Number(process.env.PORT || 8787);

// Trust first proxy hop (Render, Fly, AWS ALB, Cloudflare) for accurate client IP rate limiting
app.set('trust proxy', 1);

// General rate limiter for all /api endpoints: 100 requests per 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again in a few minutes.' },
});

// Strict rate limiter for AI inference / photo identification: 10 requests per minute
const identifyLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many scan requests. Please wait a minute before analyzing another photo.' },
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Only image uploads are supported.'));
    cb(null, true);
  },
});

const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
  : ['http://localhost:5173'];

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: allowedOrigins.includes('*') ? '*' : allowedOrigins,
    methods: ['GET', 'POST'],
  })
);
app.use(express.json({ limit: '10mb' }));
app.use('/api', apiLimiter);

// In-memory shared cards cache (capped to 1,000 recent cards to prevent memory leaks)
interface SharedCardRecord {
  id: string;
  card: Record<string, unknown>;
  createdAt: number;
}
const sharedCardsMap = new Map<string, SharedCardRecord>();

app.get('/api/health', (_req, res) => res.json({
  ok: true,
  app: 'JungleDex API',
  aiConfigured: Boolean(process.env.GOOGLE_API_KEY),
  model: process.env.GOOGLE_MODEL || 'gemini-3.5-flash',
}));

// Publish / share a card so anyone with the link can view it
app.post('/api/cards/share', (req, res) => {
  const { card } = req.body as { card?: Record<string, unknown> };
  if (!card || typeof card !== 'object' || !card.id) {
    return res.status(400).json({ error: 'Valid specimen card payload is required.' });
  }

  // LRU eviction if cache exceeds 1,000 cards
  if (sharedCardsMap.size >= 1000) {
    const oldestKey = sharedCardsMap.keys().next().value;
    if (oldestKey) sharedCardsMap.delete(oldestKey);
  }

  const id = String(card.id);
  sharedCardsMap.set(id, {
    id,
    card,
    createdAt: Date.now(),
  });

  return res.json({ ok: true, id });
});

// Fetch a shared card by ID for public view
app.get('/api/cards/:id', (req, res) => {
  const item = sharedCardsMap.get(req.params.id);
  if (!item) {
    return res.status(404).json({ error: 'Specimen card not found or has expired.' });
  }
  return res.json({ ok: true, card: item.card });
});

function extractJson(text: string): Record<string, unknown> {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('The AI returned an unexpected response. Please try again.');
  return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
}

async function callGoogleAI(apiKey: string, model: string, prompt: string, mimeType: string, base64: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        role: 'user',
        parts: [
          { text: prompt },
          { inline_data: { mime_type: mimeType, data: base64 } }
        ]
      }],
      generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
    }),
    signal: AbortSignal.timeout(60000),
  });
  const data = await response.json() as {
    error?: { message?: string; code?: number };
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  return { ok: response.ok, status: response.status, data };
}

app.post('/api/identify', identifyLimiter, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Upload an image first.' });
    const apiKey = process.env.GOOGLE_API_KEY;
    let model = process.env.GOOGLE_MODEL || 'gemini-3.5-flash';
    if (!apiKey) {
      return res.status(503).json({
        error: 'AI is not configured yet. Add GOOGLE_API_KEY to server/.env. The rest of the app is ready to preview.',
      });
    }

    const base64 = req.file.buffer.toString('base64');
    const prompt = `You are JungleDex, an expert real-world nature and outdoor exploration assistant. Analyze this image carefully and return ONLY valid JSON with these keys:
- name: short likely identification (e.g. "Monarch Butterfly", "Sunset Horizon", "Mountain Waterfall", "English Garden", "Chanterelle Mushroom")
- scientificName: binomial species name if organism, or scientific/physical phenomenon if landscape/view (e.g. "Danaus plexippus", "Rayleigh Sunset Dispersion", "Hydrological Cascade"), otherwise "Species / Phenomenon not confirmed"
- category: EXACTLY one of: "Landscape/Vista", "Waterscape", "Garden/Sanctuary", "Flora", "Avian", "Insect", "Fungi", "Fauna", or "Nature"
- rarity: one of "Common", "Uncommon", "Rare", "Epic", "Legendary", or "Discovery" (grand sunsets, pristine waterfalls, or rare wildlife are Epic or Legendary)
- confidence: "Low", "Medium", or "High" with a brief qualification
- description: 2 concise sentences describing the specimen or scenic view
- facts: array of exactly 3 short observation or education tips
- isAiGenerated: boolean (true if the image appears to be computer-generated, 3D render, Midjourney/DALL-E/synthetic art; false if it is an authentic real-world camera photograph)
- aiGenerationReason: string (if isAiGenerated is true, describe visual cues indicating AI generation, otherwise "")

Never recommend touching wild creatures, plants, or fungi. Encourage respectful exploration.`;

    let result = await callGoogleAI(apiKey, model, prompt, req.file.mimetype, base64);

    // Automatic fallback if configured model is 404 or deprecated
    if (!result.ok && (result.status === 404 || result.data.error?.message?.includes('not found') || result.data.error?.message?.includes('no longer available'))) {
      const fallbackModel = 'gemini-3.5-flash';
      if (model !== fallbackModel) {
        console.warn(`[JungleDex] Model "${model}" failed (${result.status}). Falling back to "${fallbackModel}"...`);
        model = fallbackModel;
        result = await callGoogleAI(apiKey, model, prompt, req.file.mimetype, base64);
      }
    }

    if (!result.ok) {
      console.error('[Google AI Error]:', result.status, result.data.error?.message || result.data);
      return res.status(502).json({
        error: 'The AI identification service encountered an upstream issue. Please retry in a moment.',
      });
    }

    const output = result.data.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('\n');
    if (!output) {
      return res.status(502).json({ error: 'The AI did not return an identification. Please try a clearer image.' });
    }

    const parsed = extractJson(output);
    const stringField = (key: string, fallback: string) =>
      typeof parsed[key] === 'string' ? String(parsed[key]).slice(0, 1200) : fallback;
    const facts = Array.isArray(parsed.facts)
      ? parsed.facts.filter((fact): fact is string => typeof fact === 'string').slice(0, 3).map(f => f.slice(0, 240))
      : [];
    const isAiGenerated = Boolean(parsed.isAiGenerated);
    const aiGenerationReason = typeof parsed.aiGenerationReason === 'string' ? parsed.aiGenerationReason.slice(0, 300) : '';

    return res.json({
      name: stringField('name', 'Nature Discovery'),
      scientificName: stringField('scientificName', 'Species / Phenomenon not confirmed'),
      category: stringField('category', 'Nature'),
      rarity: stringField('rarity', 'Discovery'),
      confidence: stringField('confidence', 'Unverified AI suggestion'),
      description: stringField('description', 'A new observation from your outdoor adventure.'),
      facts,
      isAiGenerated,
      aiGenerationReason,
      modelUsed: model,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error.';
    console.error('[JungleDex API Error]:', message);
    return res.status(500).json({
      error: message.includes('fetch failed')
        ? 'Could not reach the AI service. Check network connectivity.'
        : 'An unexpected internal error occurred while processing the image.',
    });
  }
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = error instanceof Error ? error.message : 'Request failed.';
  console.error('[Unhandled Request Error]:', message);
  res.status(400).json({ error: message.startsWith('Only image') ? message : 'Invalid request data.' });
});
app.listen(port, () => console.log(`JungleDex API listening on port ${port}`));
