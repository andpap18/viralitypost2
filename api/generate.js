export const config = { runtime: "nodejs" };

const ALLOWED_ORIGINS = null;     // Allow all origins for now
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

function okOrigin(req) {
  if (!ALLOWED_ORIGINS) return true;
  const o = req.headers.origin;
  return ALLOWED_ORIGINS.includes(o);
}

function buildPrompt({ sourceText = "", tone = "casual", wantIG, wantTW, wantLI, hasImage }) {
  const toneInstructions = {
    casual: "Use a friendly, conversational tone with emojis and casual language",
    professional: "Use a formal, business-appropriate tone with professional language",
    witty: "Use humor, wordplay, and clever observations while staying relevant",
    inspirational: "Use motivational language, inspiring quotes, and uplifting messages",
    educational: "Use informative, helpful language with clear explanations and tips"
  };

  return `
You are an expert social media copywriter with deep understanding of viral content creation.

CONTENT BRIEF:
"${sourceText || "N/A"}"

TONE: ${tone} - ${toneInstructions[tone] || toneInstructions.casual}
IMAGE_PROVIDED: ${hasImage ? "Yes - Create content that complements and references the visual elements" : "No - Focus purely on the text content"}

TASK: Generate engaging, platform-optimized content that will drive engagement and shares.

CONTENT REQUIREMENTS:
${wantIG ? `
INSTAGRAM:
- Create a compelling caption (2-4 sentences) that hooks the reader
- Include 8-15 relevant hashtags (mix of popular and niche)
- Use line breaks for readability
- Include a call-to-action
- Make it visually appealing with emojis` : ""}

${wantTW ? `
TWITTER/X:
- Create a thread of 3-5 tweets maximum
- Number each tweet (1/5, 2/5, etc.)
- Keep each tweet under 260 characters
- Start with a hook, build the story, end with a strong conclusion
- Use relevant hashtags (2-3 per tweet max)` : ""}

${wantLI ? `
LINKEDIN:
- Start with a compelling hook (first line should grab attention)
- Include 3-5 bullet points with valuable insights
- Use professional language but keep it engaging
- End with a clear call-to-action
- Include relevant hashtags (3-5 professional hashtags)` : ""}

STRICT OUTPUT FORMAT:
${
  wantIG ? `\n[INSTAGRAM]\n{caption_content}\n\n{hashtags}\n` : ""
}${
  wantTW ? `\n[TWITTER]\n{tweet_1}\n\n{tweet_2}\n\n{tweet_3}\n` : ""
}${
  wantLI ? `\n[LINKEDIN]\n{post_content}\n` : ""
}

IMPORTANT: 
- Make content highly engaging and shareable
- Ensure each platform's content is optimized for that specific audience
- Use the exact format above with no additional text
- If image is provided, reference visual elements naturally in the content
  `.trim();
}

async function callOpenAI({ apiKey, prompt }) {
  console.log("Calling OpenAI API with prompt length:", prompt.length);
  
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json", 
      "Authorization": `Bearer ${apiKey}` 
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.8,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2000
    })
  });
  
  console.log("OpenAI API response status:", resp.status);
  
  if (!resp.ok) {
    const errorData = await resp.json().catch(() => ({}));
    console.error("OpenAI API error:", errorData);
    
    if (resp.status === 401) {
      throw new Error("Invalid OpenAI API key. Please check your API key in Vercel environment variables.");
    } else if (resp.status === 429) {
      throw new Error("OpenAI API rate limit exceeded. Please try again in a moment.");
    } else if (resp.status === 500) {
      throw new Error("OpenAI API server error. Please try again later.");
    }
    
    const errorMessage = errorData.error?.message || `OpenAI API error: ${resp.status}`;
    throw new Error(errorMessage);
  }
  
  const data = await resp.json();
  console.log("OpenAI API response received");
  
  if (!data.choices || data.choices.length === 0) {
    throw new Error("No response from OpenAI");
  }
  
  return data.choices[0].message?.content || "";
}

function parseOutputs(raw) {
  const grab = (tag) => {
    const re = new RegExp(`\\[${tag}\\]\\s*([\\s\\S]*?)(?=\\n\\[[A-Z]+\\]|$)`, "i");
    const m = raw.match(re);
    if (!m) return "";
    
    let content = m[1].trim();
    
    // Clean up the content
    content = content
      .replace(/^\s*\{[^}]*\}\s*$/gm, '') // Remove placeholder text like {caption_here}
      .replace(/^\s*$[\r\n]*/gm, '') // Remove empty lines
      .trim();
    
    return content;
  };
  
  return {
    instagram: grab("INSTAGRAM"),
    twitter: grab("TWITTER"),
    linkedin: grab("LINKEDIN")
  };
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  
  if (req.method !== "POST") return res.status(405).json({ error:"Method not allowed" });
  if (!okOrigin(req)) return res.status(403).json({ error:"Forbidden origin" });

  const apiKey = process.env.OPENAI_API_KEY;
  console.log("API Key exists:", !!apiKey);
  console.log("API Key length:", apiKey ? apiKey.length : 0);
  console.log("API Key starts with sk-:", apiKey ? apiKey.startsWith('sk-') : false);
  
  if (!apiKey) {
    console.error("Missing OPENAI_API_KEY environment variable");
    return res.status(500).json({ error: "OpenAI API key not configured. Please add OPENAI_API_KEY to environment variables." });
  }
  
  if (!apiKey.startsWith('sk-')) {
    console.error("Invalid API key format");
    return res.status(500).json({ error: "Invalid OpenAI API key format. Key should start with 'sk-'" });
  }

  try {
    const { sourceText, tone, outputs, imageDataUrl } = req.body || {};

    // Validation
    if (!sourceText || typeof sourceText !== 'string' || sourceText.trim().length === 0) {
      return res.status(400).json({ error: "Source text is required" });
    }

    if (sourceText.trim().length > 2000) {
      return res.status(400).json({ error: "Source text too long (max 2000 characters)" });
    }

    const validTones = ['casual', 'professional', 'witty'];
    if (!validTones.includes(tone)) {
      return res.status(400).json({ error: "Invalid tone selected" });
    }

    const outs = Array.isArray(outputs) ? outputs : [];
    const wantIG = outs.includes("instagram");
    const wantTW = outs.includes("twitter");
    const wantLI = outs.includes("linkedin");
    if (!wantIG && !wantTW && !wantLI) {
      return res.status(400).json({ error: "Select at least one output" });
    }

    // Image processing and validation
    let hasImage = false;
    let imageDescription = "";
    
    if (imageDataUrl) {
      hasImage = true;
      const m = /^data:(image\/png|image\/jpeg|image\/webp);base64,/.exec(imageDataUrl);
      if (!m) return res.status(400).json({ error:"Invalid image type. Only PNG, JPG, and WEBP are supported." });
      
      const b64 = imageDataUrl.split(",")[1] || "";
      const size = Math.ceil((b64.length * 3) / 4);
      if (size > MAX_IMAGE_SIZE) return res.status(400).json({ error:"Image too large (max 5MB)" });
      
      // For now, we'll use a placeholder description since we're not sending the image to OpenAI
      // In a full implementation, you would use vision API or image analysis
      imageDescription = "User has provided an image that should be referenced in the content generation.";
    }

    const prompt = buildPrompt({ sourceText, tone, wantIG, wantTW, wantLI, hasImage });
    const raw = await callOpenAI({ apiKey, prompt });
    const { instagram, twitter, linkedin } = parseOutputs(raw);

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ instagram, twitter, linkedin });
  } catch (err) {
    console.error("API Error:", err);
    
    // Handle specific error types
    if (err.message.includes("OpenAI")) {
      return res.status(503).json({ error: "AI service temporarily unavailable. Please try again in a moment." });
    }
    
    if (err.message.includes("timeout")) {
      return res.status(504).json({ error: "Request timeout. Please try again." });
    }
    
    return res.status(500).json({ error: err.message || "An unexpected error occurred. Please try again." });
  }
}
