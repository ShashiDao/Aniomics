export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'No URL provided' });

  try {
    const targetUrl = new URL(url);
    
    // --- MANGADEX HANDLER ---
    if (targetUrl.hostname.includes('mangadex.org')) {
      const chapterId = url.split('/').filter(Boolean).pop();
      const serverRes = await fetch(`https://api.mangadex.org/at-home/server/${chapterId}`);
      const serverData = await serverRes.json();
      
      if (serverData.chapter) {
        const { baseUrl, hash, data } = serverData.chapter;
        // Use weserv.nl to proxy the images. It handles CORS and Referer automatically.
        const images = data.map(img => {
          const original = `${baseUrl}/data/${hash}/${img}`;
          return `https://images.weserv.nl/?url=${encodeURIComponent(original)}&default=${encodeURIComponent(original)}`;
        });
        return res.status(200).json({ success: true, images });
      }
    }

    // --- UNIVERSAL FALLBACK ---
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
      
      // Use weserv.nl for the fallback images too
      images.push(`https://images.weserv.nl/?url=${encodeURIComponent(src)}&default=${encodeURIComponent(src)}`);
    }

    const finalImages = [...new Set(images)].filter(img => !/logo|avatar|icon|banner|ads/i.test(img));
    return res.status(200).json({ success: true, images: finalImages });

  } catch (error) {
    return res.status(500).json({ success: false });
  }
}
