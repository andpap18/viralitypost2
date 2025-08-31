<<<<<<< HEAD
// Vercel serverless (ESM)
export const config = { runtime: "nodejs" };

const ALLOWED_ORIGINS = null; // βάλ' το null για ίδιο origin
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

function okOrigin(req) {
  if (!ALLOWED_ORIGINS) return true;
  const o = req.headers.origin;
  return ALLOWED_ORIGINS.includes(o);
}

function buildPrompt({ sourceText = "", tone = "casual", wantIG, wantTW, wantLI, hasImage }) {
  return `
You are an expert social media copywriter.

INPUT IDEA:
"${sourceText || "N/A"}"

TONE: ${tone}
IMAGE_PROVIDED: ${hasImage ? "Yes" : "No"}

Generate up to three outputs (only those requested). 
For Instagram: 1 concise caption + 6–12 smart hashtags (no banned ones).
For Twitter/X: a short thread of 3–5 tweets (number them 1/5, 2/5, …); keep each under 260 chars.
For LinkedIn: a professional post with a strong hook, 3–5 bullet value points, and a call-to-action.

STRICT FORMAT:
${
  wantIG ? `\n[INSTAGRAM]\n{caption_here}\n{hashtags_here}\n` : ""
}${
  wantTW ? `\n[TWITTER]\n{tweet1}\n{tweet2}\n{tweet3}\n` : ""
}${
  wantLI ? `\n[LINKEDIN]\n{post_here}\n` : ""
}

Do not add any other text or explanations.
  `.trim();
}

async function callOpenAI({ apiKey, prompt }) {
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type":"application/json", "Authorization":`Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.8,
      messages: [{ role: "user", content: prompt }]
    })
  });
  if (!resp.ok) throw new Error(`OpenAI error: ${resp.status}`);
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || "";
}

function parseOutputs(raw) {
  const grab = (tag) => {
    const re = new RegExp(`\\[${tag}\\]\\s*([\\s\\S]*?)(?=\\n\\[[A-Z]+\\]|$)`, "i");
    const m = raw.match(re);
    return m ? m[1].trim() : "";
  };
  return {
    instagram: grab("INSTAGRAM"),
    twitter: grab("TWITTER"),
    linkedin: grab("LINKEDIN")
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error:"Method not allowed" });
  if (!okOrigin(req)) return res.status(403).json({ error:"Forbidden origin" });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error:"Missing OPENAI_API_KEY" });

  try {
    const { sourceText, tone, outputs, imageDataUrl } = req.body || {};

    const outs = Array.isArray(outputs) ? outputs : [];
    const wantIG = outs.includes("instagram");
    const wantTW = outs.includes("twitter");
    const wantLI = outs.includes("linkedin");
    if (!wantIG && !wantTW && !wantLI) {
      return res.status(400).json({ error:"Select at least one output" });
    }

    let hasImage = false;
    if (imageDataUrl) {
      hasImage = true;
      const m = /^data:(image\/png|image\/jpeg|image\/webp);base64,/.exec(imageDataUrl);
      if (!m) return res.status(400).json({ error:"Invalid image type" });
      const b64 = imageDataUrl.split(",")[1] || "";
      const size = Math.ceil((b64.length * 3) / 4);
      if (size > MAX_IMAGE_SIZE) return res.status(400).json({ error:"Image too large (max 5MB)" });
    }

    const prompt = buildPrompt({ sourceText, tone, wantIG, wantTW, wantLI, hasImage });
    const raw = await callOpenAI({ apiKey, prompt });
    const { instagram, twitter, linkedin } = parseOutputs(raw);

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ instagram, twitter, linkedin });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
=======
// Vercel serverless (ESM)
export const config = { runtime: "nodejs" };

const ALLOWED_ORIGINS = null; // βάλ' το null για ίδιο origin
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

function okOrigin(req) {
  if (!ALLOWED_ORIGINS) return true;
  const o = req.headers.origin;
  return ALLOWED_ORIGINS.includes(o);
}

function buildPrompt({ sourceText = "", tone = "casual", wantIG, wantTW, wantLI, hasImage }) {
  return `
You are an expert social media copywriter.

INPUT IDEA:
"${sourceText || "N/A"}"

TONE: ${tone}
IMAGE_PROVIDED: ${hasImage ? "Yes" : "No"}

Generate up to three outputs (only those requested). 
For Instagram: 1 concise caption + 6–12 smart hashtags (no banned ones).
For Twitter/X: a short thread of 3–5 tweets (number them 1/5, 2/5, …); keep each under 260 chars.
For LinkedIn: a professional post with a strong hook, 3–5 bullet value points, and a call-to-action.

STRICT FORMAT:
${
  wantIG ? `\n[INSTAGRAM]\n{caption_here}\n{hashtags_here}\n` : ""
}${
  wantTW ? `\n[TWITTER]\n{tweet1}\n{tweet2}\n{tweet3}\n` : ""
}${
  wantLI ? `\n[LINKEDIN]\n{post_here}\n` : ""
}

Do not add any other text or explanations.
  `.trim();
}

async function callOpenAI({ apiKey, prompt }) {
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type":"application/json", "Authorization":`Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.8,
      messages: [{ role: "user", content: prompt }]
    })
  });
  if (!resp.ok) throw new Error(`OpenAI error: ${resp.status}`);
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || "";
}

function parseOutputs(raw) {
  const grab = (tag) => {
    const re = new RegExp(`\\[${tag}\\]\\s*([\\s\\S]*?)(?=\\n\\[[A-Z]+\\]|$)`, "i");
    const m = raw.match(re);
    return m ? m[1].trim() : "";
  };
  return {
    instagram: grab("INSTAGRAM"),
    twitter: grab("TWITTER"),
    linkedin: grab("LINKEDIN")
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error:"Method not allowed" });
  if (!okOrigin(req)) return res.status(403).json({ error:"Forbidden origin" });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error:"Missing OPENAI_API_KEY" });

  try {
    const { sourceText, tone, outputs, imageDataUrl } = req.body || {};

    const outs = Array.isArray(outputs) ? outputs : [];
    const wantIG = outs.includes("instagram");
    const wantTW = outs.includes("twitter");
    const wantLI = outs.includes("linkedin");
    if (!wantIG && !wantTW && !wantLI) {
      return res.status(400).json({ error:"Select at least one output" });
    }

    let hasImage = false;
    if (imageDataUrl) {
      hasImage = true;
      const m = /^data:(image\/png|image\/jpeg|image\/webp);base64,/.exec(imageDataUrl);
      if (!m) return res.status(400).json({ error:"Invalid image type" });
      const b64 = imageDataUrl.split(",")[1] || "";
      const size = Math.ceil((b64.length * 3) / 4);
      if (size > MAX_IMAGE_SIZE) return res.status(400).json({ error:"Image too large (max 5MB)" });
    }

    const prompt = buildPrompt({ sourceText, tone, wantIG, wantTW, wantLI, hasImage });
    const raw = await callOpenAI({ apiKey, prompt });
    const { instagram, twitter, linkedin } = parseOutputs(raw);

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ instagram, twitter, linkedin });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
>>>>>>> 8018758 (first commit)
