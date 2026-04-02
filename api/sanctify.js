export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing URL' });

  try {
    const targetUrl = new URL(url);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Referer': targetUrl.origin,
        'Cache-Control': 'no-cache'
      }
    });

    const html = await response.text();

    // This regex is specifically tuned for Madara/Kunmanga lazy-loading
    const imgRegex = /wp-content\/uploads\/[^"']+\.(?:jpg|jpeg|png|webp)/gi;
    const matches = html.match(imgRegex) || [];
    
    // Convert relative matches to absolute URLs
    const images = [...new Set(matches)].map(img => {
      if (img.startsWith('http')) return img;
      return `${targetUrl.origin}/${img.startsWith('/') ? img.slice(1) : img}`;
    });

    // Remove duplicates and common UI garbage
