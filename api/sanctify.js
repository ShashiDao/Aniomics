export default async function handler(req, res) {
  const { url, proxy } = req.query;

  // --- 1. THE IMAGE PROXY (BINARY HANDLER) ---
  if (proxy) {
    try {
      const decodedUrl = decodeURIComponent(proxy);
      const imgRes = await fetch(decodedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Referer': 'https://mangadex.org/',
          'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8'
        }
      });

      if (!imgRes.ok) throw new Error('Image fetch blocked');

      const contentType = imgRes.headers.get('Content-Type') || 'image/jpeg';
      const arrayBuffer = await imgRes.arrayBuffer();
      
      // Essential Headers for binary delivery
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', arrayBuffer.byteLength);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('Access-Control-Allow-Origin', '*');

      // Convert to Buffer and end the stream explicitly
      return res.status(200).end(Buffer.from(arrayBuffer));
    } catch (e) {
      return res.status(500).end();
    }
  }

  // --- 2. THE URL SANCTIFIER (HTML PARSER) ---
  if (!url) return res.status(400).json({ error: 'Missing URL' });

  try {
    const targetUrl = new URL(url);

    // MANGADEX CASE
    if (targetUrl.hostname.includes('mangadex.org')) {
      const chapterId = url.split('/').filter(Boolean).pop();
      const serverRes = await fetch(`https://api.mangadex.org/at-home/server/${chapterId}`);
      const serverData = await serverRes.json();
      
      if (serverData.chapter) {
        const { baseUrl, hash, data } = serverData.chapter;
        const images = data.map(img => {
          const original = `${baseUrl}/data/${hash}/${img}`;
          return `/api/sanctify?proxy=${encodeURIComponent(original)}`;
        });
        return res.status(200).json({ success: true, images });
      }
    }

    // UNIVERSAL FALLBACK
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0 Safari/537.36' }
    });
    const html = await response.text();
    const imgRegex = /(?:src|data-src|data-lazy|data-original)=["']([^"']+\.(?:jpg|jpeg|png|webp))["']/gi;
    let images = [];
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
      let src = match[1].trim();
      if (src.startsWith('//')) src = 'https:' + src;
      else if (src.startsWith('/')) src = targetUrl.origin + src;
      images.push(`/api/sanctify?proxy=${encodeURIComponent(src)}`);
    }

    const finalImages = [...new Set(images)].filter(img => !/logo|avatar|icon|banner|ads/i.test(img));
    return res.status(200).json({ success: true, images: finalImages });

  } catch (error) {
    return res.status(500).json({ success: false });
  }
}
