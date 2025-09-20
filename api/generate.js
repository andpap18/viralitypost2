export const config = { runtime: "nodejs" };

const ALLOWED_ORIGINS = null;     // same-origin για MVP
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

function okOrigin(req) {
  if (!ALLOWED_ORIGINS) return true;
  const o = req.headers.origin;
  return ALLOWED_ORIGINS.includes(o);
}

function buildPrompt({ sourceText = "", tone = "casual", wantIG, wantTW, wantLI, wantFB, wantTT, wantYT, wantPIN, hasImage }) {
  const requestedPlatforms = [];
  if (wantIG) requestedPlatforms.push("Instagram");
  if (wantTW) requestedPlatforms.push("Twitter/X");
  if (wantLI) requestedPlatforms.push("LinkedIn");
  if (wantFB) requestedPlatforms.push("Facebook");
  if (wantTT) requestedPlatforms.push("TikTok");
  if (wantYT) requestedPlatforms.push("YouTube");
  if (wantPIN) requestedPlatforms.push("Pinterest");

  return `
You are an expert social media copywriter.

INPUT IDEA:
"${sourceText || "N/A"}"

TONE: ${tone}
IMAGE_PROVIDED: ${hasImage ? "Yes - Analyze the provided image and create content that is directly relevant to what you see in the image" : "No - Focus purely on the text content"}

IMPORTANT: Generate content ONLY for the requested platforms: ${requestedPlatforms.join(", ")}. Do NOT generate content for any other platforms.

${hasImage ? `
IMAGE ANALYSIS: Look carefully at the provided image and create social media content that is directly related to what you see. Reference specific visual elements, objects, people, scenes, or concepts visible in the image. Make the content feel authentic and connected to the visual content.

If you cannot see the image clearly, create generic social media content about the image topic.` : ""}

${wantIG ? `
For Instagram: Create 1 concise caption + 6–12 smart hashtags (no banned ones).` : ""}${wantTW ? `
For Twitter/X: Create a short thread of 3–5 tweets (number them 1/5, 2/5, …); keep each under 260 chars.` : ""}${wantLI ? `
For LinkedIn: Create a professional post with a strong hook, 3–5 bullet value points, and a call-to-action.` : ""}${wantFB ? `
For Facebook: Create an engaging post with emotional appeal, community focus, and a call-to-action. Include relevant hashtags.` : ""}${wantTT ? `
For TikTok: Create a short, punchy caption (under 100 chars) with trending hashtags and emojis. Focus on viral potential.` : ""}${wantYT ? `
For YouTube: Create an engaging video title, description (2-3 paragraphs), and tags. Focus on SEO and engagement.` : ""}${wantPIN ? `
For Pinterest: Create a descriptive pin title, detailed description with keywords, and relevant hashtags. Focus on searchability.` : ""}

STRICT FORMAT - Generate ONLY the sections below:
${
  wantIG ? `\n[INSTAGRAM]\n{caption_here}\n{hashtags_here}\n` : ""
}${
  wantTW ? `\n[TWITTER]\n{tweet_1}\n{tweet_2}\n{tweet_3}\n` : ""
}${
  wantLI ? `\n[LINKEDIN]\n{post_here}\n` : ""
}${
  wantFB ? `\n[FACEBOOK]\n{post_here}\n` : ""
}${
  wantTT ? `\n[TIKTOK]\n{caption_here}\n{hashtags_here}\n` : ""
}${
  wantYT ? `\n[YOUTUBE]\n{title_here}\n{description_here}\n{tags_here}\n` : ""
}${
  wantPIN ? `\n[PINTEREST]\n{title_here}\n{description_here}\n{hashtags_here}\n` : ""
}

CRITICAL: Do not add any other text, explanations, or content for platforms not requested.

If you cannot generate content for any reason, respond with "ERROR: Unable to generate content" for each requested platform.
  `.trim();
}

async function callOpenAI({ apiKey, prompt, imageDataUrl = null }) {
  // Prepare messages array
  const messages = [];
  
  if (imageDataUrl) {
    // If image is provided, use vision model and include image in message
    messages.push({
      role: "user",
      content: [
        {
          type: "text",
          text: prompt
        },
        {
          type: "image_url",
          image_url: {
            url: imageDataUrl,
            detail: "high"
          }
        }
      ]
    });
  } else {
    // If no image, use text-only message
    messages.push({
      role: "user",
      content: prompt
    });
  }

  console.log("Calling OpenAI API with model:", imageDataUrl ? "gpt-4o" : "gpt-4o-mini");
  console.log("Messages count:", messages.length);
  console.log("First message content length:", messages[0]?.content?.length || 0);
  
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type":"application/json", "Authorization":`Bearer ${apiKey}` },
    body: JSON.stringify({
      model: imageDataUrl ? "gpt-4o" : "gpt-4o-mini", // Use vision model if image provided
      temperature: 0.8,
      messages: messages
    })
  });
  
  console.log("OpenAI response status:", resp.status);
  
  if (!resp.ok) {
    const errorData = await resp.json().catch(() => ({}));
    console.error("OpenAI API error:", errorData);
    throw new Error(`OpenAI error: ${resp.status} - ${errorData.error?.message || 'Unknown error'}`);
  }
  
  const data = await resp.json();
  console.log("OpenAI response data:", JSON.stringify(data, null, 2));
  return data.choices?.[0]?.message?.content || "";
}

function parseOutputs(raw) {
  console.log("Parsing raw output:", raw);
  const grab = (tag) => {
    const re = new RegExp(`\\[${tag}\\]\\s*([\\s\\S]*?)(?=\\n\\[[A-Z]+\\]|$)`, "i");
    const m = raw.match(re);
    const result = m ? m[1].trim() : "";
    console.log(`Parsed ${tag}:`, result);
    return result;
  };
  return {
    instagram: grab("INSTAGRAM"),
    twitter: grab("TWITTER"),
    linkedin: grab("LINKEDIN"),
    facebook: grab("FACEBOOK"),
    tiktok: grab("TIKTOK"),
    youtube: grab("YOUTUBE"),
    pinterest: grab("PINTEREST")
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error:"Method not allowed" });
  if (!okOrigin(req)) return res.status(403).json({ error:"Forbidden origin" });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error:"Missing OPENAI_API_KEY" });
  
  console.log("API Key exists:", !!apiKey);
  console.log("API Key length:", apiKey?.length || 0);
  console.log("API Key starts with:", apiKey?.substring(0, 10) || "N/A");
  
  // Test API key with a simple call
  try {
    const testResp = await fetch("https://api.openai.com/v1/models", {
      headers: { "Authorization": `Bearer ${apiKey}` }
    });
    console.log("API Key test status:", testResp.status);
    if (!testResp.ok) {
      const errorData = await testResp.json().catch(() => ({}));
      console.error("API Key test failed:", errorData);
    }
  } catch (err) {
    console.error("API Key test error:", err.message);
  }

  try {
    const { sourceText, tone, outputs, imageDataUrl } = req.body || {};

    const outs = Array.isArray(outputs) ? outputs : [];
    const wantIG = outs.includes("instagram");
    const wantTW = outs.includes("twitter");
    const wantLI = outs.includes("linkedin");
    const wantFB = outs.includes("facebook");
    const wantTT = outs.includes("tiktok");
    const wantYT = outs.includes("youtube");
    const wantPIN = outs.includes("pinterest");
    if (!wantIG && !wantTW && !wantLI && !wantFB && !wantTT && !wantYT && !wantPIN) {
      return res.status(400).json({ error:"Select at least one output" });
    }

    // optional image checks (MVP: δεν τη στέλνουμε στο OpenAI)
    let hasImage = false;
    if (imageDataUrl) {
      hasImage = true;
      const m = /^data:(image\/png|image\/jpeg|image\/webp);base64,/.exec(imageDataUrl);
      if (!m) return res.status(400).json({ error:"Invalid image type" });
      const b64 = imageDataUrl.split(",")[1] || "";
      const size = Math.ceil((b64.length * 3) / 4);
      if (size > MAX_IMAGE_SIZE) return res.status(400).json({ error:"Image too large (max 5MB)" });
    }

    const prompt = buildPrompt({ sourceText, tone, wantIG, wantTW, wantLI, wantFB, wantTT, wantYT, wantPIN, hasImage });
    console.log("Generated prompt:", prompt);
    console.log("Platform flags:", { wantIG, wantTW, wantLI, wantFB, wantTT, wantYT, wantPIN });
    console.log("Source text:", sourceText);
    console.log("Tone:", tone);
    console.log("Has image:", hasImage);
    console.log("Image data URL length:", imageDataUrl?.length || 0);
    
    let raw = await callOpenAI({ apiKey, prompt, imageDataUrl });
    console.log("Raw AI response:", raw);
    console.log("Raw AI response length:", raw?.length || 0);
    
    // If raw response is empty, try with a simpler prompt
    if (!raw || raw.trim().length === 0) {
      console.log("Raw response is empty, trying fallback...");
      const fallbackPrompt = `Create social media content for these platforms: ${requestedPlatforms.join(", ")}. Tone: ${tone}. ${hasImage ? "There is an image provided." : "No image provided."}

${wantIG ? `[INSTAGRAM]\nSample Instagram caption with hashtags\n` : ""}${wantTW ? `[TWITTER]\nSample tweet content\n` : ""}${wantLI ? `[LINKEDIN]\nSample LinkedIn post\n` : ""}${wantFB ? `[FACEBOOK]\nSample Facebook post\n` : ""}${wantTT ? `[TIKTOK]\nSample TikTok caption\n` : ""}${wantYT ? `[YOUTUBE]\nSample YouTube title and description\n` : ""}${wantPIN ? `[PINTEREST]\nSample Pinterest pin\n` : ""}`;
      
      raw = await callOpenAI({ apiKey, prompt: fallbackPrompt, imageDataUrl: null });
      console.log("Fallback response:", raw);
    }
    
    const { instagram, twitter, linkedin, facebook, tiktok, youtube, pinterest } = parseOutputs(raw);
    console.log("Final parsed outputs:", { instagram, twitter, linkedin, facebook, tiktok, youtube, pinterest });

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ instagram, twitter, linkedin, facebook, tiktok, youtube, pinterest });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
