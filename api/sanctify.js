export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing URL' });

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/119.0.0.0 Safari/537.36' }
    });
    const html = await response.text();

    // Regex to find image URLs that look like content (usually .jpg/webp/png)
    // We look for patterns common in manga readers
    const imgRegex = /https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp|gif)/gi;
    const allImages = html.match(imgRegex) || [];
    
    // Filter out icons, small avatars, or UI elements (images < some length/keywords)
    const filteredImages = [...new Set(allImages)].filter(img => {
      const isAd = /ads|banner|icon|logo|avatar|proxy/i.test(img);
      return !isAd;
    });

    res.status(200).json({
      success: true,
      images: filteredImages,
      title: "Sanctified Scroll"
    });
  } catch (error) {
    res.status(500).json({ error: 'Sanctification failed' });
  }
}
