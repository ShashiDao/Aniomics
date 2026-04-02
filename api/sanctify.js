export default async function handler(req, res) {
  const { url, proxy } = req.query;

  // --- SUB-HANDLER: IMAGE PROXY ---
  // This part mimics a real browser to fetch the actual image data
  if (proxy) {
    try {
      const imgRes = await fetch(decodeURIComponent(proxy), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Referer': 'https://mangadex.org/',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
        }
      });
      
      const buffer = await imgRes.arrayBuffer();
      res.setHeader('Content-Type', imgRes.headers.get('Content-Type') || 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(Buffer.from(buffer));
    } catch (e) {
      return res.status(500).send('Proxy Error');
    }
  }

  if (!url) return res.status(400).json({ error: 'No URL provided' });

  try {
    const targetUrl = new URL(url);

    // --- MANGADEX LOGIC ---
    if (targetUrl.hostname.includes('mangadex.org')) {
      const chapterId = url.split('/').filter(Boolean).pop();
      const serverRes = await fetch(`https://api.mangadex.org/at-home/server/${chapterId}`);
      const serverData = await serverRes.json();
      
      if (serverData.chapter) {
        const { baseUrl, hash, data } = serverData.chapter;
        // WRAP EACH IMAGE IN OUR PROXY
        const images = data.map(img => {
          const original = `${baseUrl}/data/${hash}/${img}`;
          return `/api/sanctify?proxy=${encodeURIComponent(original)}`;
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
      
      // PROXY THE FALLBACK IMAGES TOO
      images.push(`/api/sanctify?proxy=${encodeURIComponent(src)}`);
    }

    const finalImages = [...new Set(images)].filter(img => !/logo|avatar|icon|banner|ads/i.test(img));
    if (finalImages.length < 3) return res.status(200).json({ success: false });

    res.status(200).json({ success: true, images: finalImages });

  } catch (error) {
    res.status(500).json({ success: false });
  }
}
