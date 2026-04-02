export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'No URL provided' });

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
      }
    });

    if (!response.ok) throw new Error('Site blocked access');

    const html = await response.text();
    const targetOrigin = new URL(url).origin;

    // A more aggressive regex to catch all images inside Kunmanga's reader
    const imgRegex = /<img[^>]+(?:src|data-src|data-lazy-src)=["']([^"']+\.(?:jpg|jpeg|png|webp))["']/gi;
    
    let images = [];
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
      let src = match[1];
      if (src.startsWith('//')) src = 'https:' + src;
      else if (src.startsWith('/')) src = targetOrigin + src;
      images.push(src);
    }

    // Filter out UI elements
    const cleanImages = [...new Set(images)].filter(img => !/logo|avatar|icon|banner|ads/i.test(img));

    res.status(200).json({ success: true, images: cleanImages });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
