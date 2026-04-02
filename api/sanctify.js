export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'No URL' });

  try {
    const targetUrl = new URL(url);
    
    // We use a high-quality rotating User-Agent and specific headers
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    const html = await response.text();
    
    // Google Proxy to bypass Hotlinking
    const gProxy = "https://images1-focus-opensocial.googleusercontent.com/gadgets/proxy?container=focus&refresh=2592000&url=";

    // This Regex looks for JSON-encoded image lists often used by powerful manga themes
    const jsonRegex = /"images"[:\s]*\[([^\]]+)\]/g;
    const imgRegex = /(?:src|data-src|data-lazy|data-original|data-src-img|data-srcset)=["']([^"']+\.(?:jpg|jpeg|png|webp|gif)[^"']*)["']/gi;
    
    let images = [];
    let match;

    // Search for standard tags
    while ((match = imgRegex.exec(html)) !== null) {
      let src = match[1].trim();
      if (src.startsWith('//')) src = 'https:' + src;
      else if (src.startsWith('/')) src = targetUrl.origin + src;
      if (!/logo|avatar|icon|banner|ads|button|wp-custom/i.test(src)) {
        images.push(`${gProxy}${encodeURIComponent(src)}`);
      }
    }

    const finalImages = [...new Set(images)];
    
    if (finalImages.length < 3) {
      return res.status(200).json({ success: false, message: "The site is protected by an Elder Ward (Cloudflare)." });
    }

    res.status(200).json({ success: true, images: finalImages });

  } catch (error) {
    res.status(500).json({ success: false });
  }
}
