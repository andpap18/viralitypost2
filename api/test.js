export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  
  const apiKey = process.env.OPENAI_API_KEY;
  
  return res.status(200).json({
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey ? apiKey.length : 0,
    apiKeyStartsWithSk: apiKey ? apiKey.startsWith('sk-') : false,
    apiKeyPreview: apiKey ? `${apiKey.substring(0, 10)}...` : 'No key',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
}
