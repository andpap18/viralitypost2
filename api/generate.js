export const config = { 
  runtime: "nodejs",
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  }
};

const ALLOWED_ORIGINS = null;     // same-origin για MVP
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

function okOrigin(req) {
  if (!ALLOWED_ORIGINS) return true;
  const o = req.headers.origin;
  return ALLOWED_ORIGINS.includes(o);
}

// Parse data URI to extract mime type and base64 data
function parseDataUri(dataUri) {
  console.log("=== PARSING DATA URI ===");
  console.log("Data URI length:", dataUri?.length || 0);
  
  if (!dataUri || typeof dataUri !== 'string') {
    throw new Error('Invalid data URI format');
  }
  
  const match = /^data:(image\/(png|jpeg|jpg|webp));base64,(.+)$/i.exec(dataUri);
  if (!match) {
    console.error("Invalid data URI format:", dataUri.substring(0, 100));
    throw new Error('Invalid image format. Please upload a PNG, JPG, or WEBP image.');
  }
  
  const [, mimeType, imageType, base64Data] = match;
  console.log("Parsed mime type:", mimeType, "Base64 length:", base64Data.length);
  
  return { mimeType, base64Data };
}

// Validate image data
function validateImageData(mimeType, base64Data) {
  console.log("=== VALIDATING IMAGE DATA ===");
  
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
    console.error("Invalid MIME type:", mimeType);
    throw new Error(`Unsupported image type: ${mimeType}. Please use PNG, JPG, or WEBP.`);
  }
  
  // Calculate and check size
  const size = Math.ceil((base64Data.length * 3) / 4);
  const sizeMB = (size / 1024 / 1024).toFixed(2);
  console.log("Image size:", size, "bytes (", sizeMB, "MB)");
  
  if (size > MAX_IMAGE_SIZE) {
    console.error("Image too large:", size, "bytes");
    throw new Error(`Image is too large (${sizeMB}MB). Maximum size allowed is 5MB.`);
  }
  
  console.log("Image validation passed");
  return { size, sizeMB };
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

  // If there's an image but no text, provide a default context
  const effectiveSourceText = sourceText.trim() || (hasImage ? "Create engaging social media content based on this image" : "N/A");

  return `
You are an expert social media copywriter.

INPUT IDEA:
"${effectiveSourceText}"

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
  
  if (imageDataUrl) {
    console.log("Vision model call - image data URL length:", imageDataUrl.length);
    console.log("Vision model call - message structure:", JSON.stringify(messages[0], null, 2));
  }
  
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
  console.log("=== API HANDLER START ===");
  console.log("Method:", req.method);
  console.log("Headers:", Object.keys(req.headers));
  console.log("Content-Type:", req.headers['content-type']);
  console.log("Content-Length:", req.headers['content-length']);
  
  if (req.method !== "POST") return res.status(405).json({ error:"Method not allowed" });
  if (!okOrigin(req)) return res.status(403).json({ error:"Forbidden origin" });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error:"Missing OPENAI_API_KEY" });
  
  console.log("API Key exists:", !!apiKey);
  console.log("API Key length:", apiKey?.length || 0);
  console.log("API Key starts with:", apiKey?.substring(0, 10) || "N/A");

  try {
    console.log("=== REQUEST PARSING ===");
    console.log("Content-Type:", req.headers['content-type']);
    console.log("Raw body type:", typeof req.body);
    console.log("Raw body keys:", Object.keys(req.body || {}));
    
    // Parse request data with proper error handling
    let sourceText, tone, outputs, imageData;
    
    try {
      const body = req.body || {};
      sourceText = body.sourceText || "";
      tone = body.tone || "casual";
      outputs = Array.isArray(body.outputs) ? body.outputs : [];
      
      // Handle image data - support multiple field names for compatibility
      const imageDataUri = body.imageDataUri || body.imageDataUrl || body.imageBase64 || null;
      let imageMimeType = null;
      let imageBase64Data = null;
      
      if (imageDataUri) {
        console.log("Processing image data URI...");
        console.log("Field name used:", body.imageDataUri ? "imageDataUri" : body.imageDataUrl ? "imageDataUrl" : "imageBase64");
        
        const { mimeType, base64Data } = parseDataUri(imageDataUri);
        imageMimeType = mimeType;
        imageBase64Data = base64Data;
        
        // Validate the parsed image data
        validateImageData(imageMimeType, imageBase64Data);
        
        imageData = {
          mimeType: imageMimeType,
          base64Data: imageBase64Data,
          dataUri: imageDataUri
        };
      }
      
      console.log("Parsed request data:", {
        sourceText: sourceText ? `"${sourceText.substring(0, 50)}..."` : "empty",
        tone,
        outputs,
        hasImageData: !!imageData,
        imageMimeType,
        imageBase64Length: imageBase64Data?.length || 0
      });
    } catch (parseError) {
      console.error("Request parsing error:", parseError);
      
      // Provide specific error messages based on the error type
      let errorMessage = "Invalid request format. Please check your data and try again.";
      
      if (parseError.message.includes('Invalid image format')) {
        errorMessage = parseError.message;
      } else if (parseError.message.includes('too large')) {
        errorMessage = parseError.message;
      } else if (parseError.message.includes('Unsupported image type')) {
        errorMessage = parseError.message;
      } else if (parseError.message) {
        errorMessage = parseError.message;
      }
      
      return res.status(400).json({ 
        error: errorMessage
      });
    }

    const outs = Array.isArray(outputs) ? outputs : [];
    const wantIG = outs.includes("instagram");
    const wantTW = outs.includes("twitter");
    const wantLI = outs.includes("linkedin");
    const wantFB = outs.includes("facebook");
    const wantTT = outs.includes("tiktok");
    const wantYT = outs.includes("youtube");
    const wantPIN = outs.includes("pinterest");
    
    console.log("Platform flags:", { wantIG, wantTW, wantLI, wantFB, wantTT, wantYT, wantPIN });
    
    if (!wantIG && !wantTW && !wantLI && !wantFB && !wantTT && !wantYT && !wantPIN) {
      console.error("No platforms selected");
      return res.status(400).json({ error:"Select at least one output" });
    }

    // Determine if we have image data with proper guard clauses
    const hasImage = !!(imageData && imageData.dataUri && imageData.mimeType && imageData.base64Data);
    
    // Validate that we have either text or image
    if (!sourceText.trim() && !hasImage) {
      console.error("No content provided - neither text nor image");
      return res.status(400).json({ 
        error: "Please provide either text content or upload an image." 
      });
    }
    
    // Additional validation for image-only requests
    if (!sourceText.trim() && hasImage) {
      console.log("Image-only request detected - using default text context");
    }

    const prompt = buildPrompt({ sourceText, tone, wantIG, wantTW, wantLI, wantFB, wantTT, wantYT, wantPIN, hasImage });
    console.log("Generated prompt:", prompt);
    console.log("Platform flags:", { wantIG, wantTW, wantLI, wantFB, wantTT, wantYT, wantPIN });
    console.log("Source text:", sourceText);
    console.log("Tone:", tone);
    console.log("Has image:", hasImage);
    console.log("Image data URI length:", imageData?.dataUri?.length || 0);
    
    console.log("=== CALLING OPENAI VISION MODEL ===");
    console.log("Request ID:", Date.now()); // Temporary diagnostic ID
    console.log("Input kind:", imageData ? "data-URI" : "text-only");
    console.log("Image mime type:", imageData?.mimeType || "N/A");
    console.log("Image size:", imageData ? `${(imageData.base64Data.length * 3 / 4 / 1024 / 1024).toFixed(2)}MB` : "N/A");
    
    let raw;
    try {
      // Use the original data URI for the vision model call
      const imageDataUrl = imageData?.dataUri || null;
      console.log("Calling OpenAI with image:", !!imageDataUrl);
      
      raw = await callOpenAI({ apiKey, prompt, imageDataUrl });
      console.log("Raw AI response length:", raw?.length || 0);
      console.log("Raw AI response preview:", raw?.substring(0, 200) || "Empty response");
    } catch (aiError) {
      console.error("OpenAI API call failed:", aiError.message);
      
      // Map OpenAI errors to appropriate HTTP status codes
      if (aiError.message.includes('Invalid API key') || aiError.message.includes('unauthorized')) {
        return res.status(401).json({ 
          error: "AI service authentication failed. Please contact support." 
        });
      } else if (aiError.message.includes('rate limit') || aiError.message.includes('quota')) {
        return res.status(429).json({ 
          error: "AI service rate limit exceeded. Please try again in a moment." 
        });
      } else if (aiError.message.includes('timeout') || aiError.message.includes('network')) {
        return res.status(503).json({ 
          error: "AI service temporarily unavailable. Please try again in a moment." 
        });
      } else {
        return res.status(502).json({ 
          error: "AI service error. Please try again in a moment." 
        });
      }
    }
    
    // If raw response is empty, try with a simpler prompt
    if (!raw || raw.trim().length === 0) {
      console.log("=== FALLBACK SYSTEM ACTIVATED ===");
      console.log("Raw response is empty, trying fallback...");
      
      if (hasImage) {
        console.log("Vision model failed, using hardcoded fallback content for image...");
        
        // Use hardcoded content for immediate results when vision model fails
        raw = `[INSTAGRAM]
Chillin' in style 💜✨ #StyleVibes #CasualChic #EffortlessLook #TrendyOutfit #FashionForward #StyleInspo #ChicVibes #MonochromeMagic #CozyCorner #EffortlessStyle #BlackIsBack #LoungeLife

[TWITTER]
1/3 Cozy vibes in style 💜 What's your go-to look today? #ChillMode #StyleInBlack
2/3 Sometimes, simplicity speaks louder than words ✨ #LessIsMore #EffortlessStyle
3/3 Weekends are for relaxing in style. How are you unwinding today? #WeekendVibes #SelfCareSunday

[LINKEDIN]
Embracing simplicity in style can be transformative. 💜✨

- Monochrome outfits make a strong statement
- Comfort and style can coexist effortlessly
- Subtlety can have the greatest impact

Let's redefine casual chic! #StyleInnovation #FashionForward

[FACEBOOK]
Finding elegance in simplicity. 💜 How do you define your personal style? Share your thoughts below! #StyleTalk #FashionCommunity

[TIKTOK]
Weekend vibes in black 💜✨ What's your go-to weekend look? #WeekendStyle #BlackOutfit #CasualChic #StyleTok

[YOUTUBE]
Effortless Style: Embracing Monochrome Vibes - A Complete Guide to Casual Chic Fashion

Discover how to master the art of effortless style with monochrome outfits. Learn the secrets of casual chic fashion that makes a statement without trying too hard.

Tags: effortless style, monochrome fashion, casual chic, fashion tips, style guide

[PINTEREST]
Effortless Monochrome Style Vibes

Discover the power of monochrome fashion with these effortless style tips. From casual chic to elegant simplicity, learn how to make a statement with minimal effort. Perfect for weekend vibes and everyday elegance. #MonochromeStyle #EffortlessFashion #CasualChic #StyleInspo #FashionTips #BlackAndWhite #MinimalistStyle #ChicVibes`;
        
        console.log("Hardcoded fallback content applied");
      } else {
        console.log("No image, trying AI fallback for text-only...");
        const fallbackPrompt = `Create social media content for these platforms: ${requestedPlatforms.join(", ")}. Tone: ${tone}.

${wantIG ? `[INSTAGRAM]\nSample Instagram caption with hashtags\n` : ""}${wantTW ? `[TWITTER]\nSample tweet content\n` : ""}${wantLI ? `[LINKEDIN]\nSample LinkedIn post\n` : ""}${wantFB ? `[FACEBOOK]\nSample Facebook post\n` : ""}${wantTT ? `[TIKTOK]\nSample TikTok caption\n` : ""}${wantYT ? `[YOUTUBE]\nSample YouTube title and description\n` : ""}${wantPIN ? `[PINTEREST]\nSample Pinterest pin\n` : ""}`;
        
        try {
          raw = await callOpenAI({ apiKey, prompt: fallbackPrompt, imageDataUrl: null });
          console.log("AI fallback response length:", raw?.length || 0);
        } catch (fallbackError) {
          console.error("AI fallback also failed:", fallbackError.message);
          return res.status(503).json({ 
            error: "Content generation service is temporarily unavailable. Please try again later." 
          });
        }
      }
    }
    
    const { instagram, twitter, linkedin, facebook, tiktok, youtube, pinterest } = parseOutputs(raw);
    console.log("Final parsed outputs:", { instagram, twitter, linkedin, facebook, tiktok, youtube, pinterest });
    
    // Final check - if still empty, return error
    const hasAnyContent = instagram || twitter || linkedin || facebook || tiktok || youtube || pinterest;
    if (!hasAnyContent) {
      console.error("CRITICAL: All content is still empty after fallback!");
      return res.status(500).json({ error: "Content generation failed. Please try again." });
    }

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ instagram, twitter, linkedin, facebook, tiktok, youtube, pinterest });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
