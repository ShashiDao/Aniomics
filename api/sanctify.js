export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'No URL provided' });

  try {
    const targetUrl = new URL(url);

    // --- 1. SPECIAL CASE: MANGADEX (The most reliable) ---
    if (targetUrl.hostname.includes('mangadex.org')) {
      const chapterId = url.split('/').pop();
      const dexRes = await fetch(`https://api.mangadex.org/at-home/server/${chapterId}`);
      const dexData = await dexRes.json();
      
      if (dexData.chapter) {
        const hash = dexData.chapter.hash;
        const images = dexData.chapter.data.map(img => 
          `https://uploads.mangadex.org/data/${hash}/${img}`
        );
        return res.status(200).json({ success: true, images });
      }
    }

    // --- 2. UNIVERSAL SCRAPER (For other sites) ---
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': targetUrl.origin
      }
    });

    const html = await response.text();
    
    // Look for anything that resembles an image list in JSON or HTML
    const imgRegex = /(?:src|data-src|data-lazy|data-original)=["']([^"']+\.(?:jpg|jpeg|png|webp))["']/gi;
    let images = [];
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
      let src = match[1].trim();
      if (src.startsWith('//')) src = 'https:' + src;
      else if (src.startsWith('/')) src = targetUrl.origin + src;
      images.push(src);
    }

    const finalImages = [...new Set(images)].filter(img => !/logo|avatar|icon|banner|ads/i.test(img));

    if (finalImages.length < 5) {
      return res.status(200).json({ success: false, message: "Cloudflare or Bot protection blocked the ritual." });
    }

    res.status(200).json({ success: true, images: finalImages });

  } catch (error) {
    res.status(500).json({ success: false, message: "Connection lost." });
  }
}
