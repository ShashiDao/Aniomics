export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'No URL provided' });

  try {
    const targetUrl = new URL(url);

    // --- 1. MANGADEX OFFICIAL API LOGIC ---
    if (targetUrl.hostname.includes('mangadex.org')) {
      const chapterId = url.split('/').filter(Boolean).pop();
      const serverRes = await fetch(`https://api.mangadex.org/at-home/server/${chapterId}`);
      const serverData = await serverRes.json();
      
      if (serverData.chapter) {
        const { baseUrl, hash, data } = serverData.chapter;
        // Construct correct URLs using the baseUrl provided by the API
        const images = data.map(img => `${baseUrl}/data/${hash}/${img}`);
        return res.status(200).json({ success: true, images });
      }
    }

    // --- 2. UNIVERSAL SCRAPER FALLBACK ---
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': targetUrl.origin
      }
    });

    const html = await response.text();
    const imgRegex = /(?:src|data-src|data-lazy|data-original)=["']([^"']+\.(?:jpg|jpeg|png|webp))["']/gi;
    let images = [];
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
      let src = match[1].trim();
      if (src.startsWith('//')) src = 'https:' + src;
      else if (src.startsWith('/')) src = targetUrl.origin + src;
      images.push(src);
    }

    // Filter out credits and logos
    const finalImages = [...new Set(images)].filter(img => 
      !/logo|avatar|icon|banner|ads|external|credit/i.test(img)
    );

    if (finalImages.length < 3) return res.status(200).json({ success: false });

    res.status(200).json({ success: true, images: finalImages });

  } catch (error) {
    res.status(500).json({ success: false });
  }
}
