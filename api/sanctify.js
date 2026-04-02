export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'No URL provided' });

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Referer': 'https://www.google.com/'
      }
    });

    const html = await response.text();
    const origin = new URL(url).origin;

    // 1. Target the Madara 'wp-manga-chapter-img' class specifically
    const images = [];
    const imgMatches = html.matchAll(/class=["']wp-manga-chapter-img[^>]+(?:src|data-src|data-lazy-src)=["']([^"']+)["']/gi);

    for (const match of imgMatches) {
        let src = match[1].trim();
        if (src.startsWith('//')) src = 'https:' + src;
        else if (src.startsWith('/')) src = origin + src;
        images.push(src);
    }

    // 2. Fallback: If specific class search fails, grab everything in wp-content
    if (images.length === 0) {
      const fallbackMatches = html.matchAll(/(?:src|data-src|data-lazy-src)=["']([^"']+\/(?:uploads|wp-content)\/[^"']+\.(?:jpg|jpeg|png|webp))["']/gi);
      for (const match of fallbackMatches) {
        let src = match[1].trim();
        if (src.startsWith('//')) src = 'https:' + src;
        else if (src.startsWith('/')) src = origin + src;
        images.push(src);
      }
    }

    const finalImages = [...new Set(images)].filter(img => !/logo|avatar|icon|banner|ads/i.test(img));

    if (finalImages.length === 0) {
      return res.status(200).json({ success: false });
    }

    res.status(200).json({ success: true, images: finalImages });

  } catch (error) {
    res.status(500).json({ success: false, message: "Ritual Interrupted" });
  }
}
