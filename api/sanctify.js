export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing URL' });

  try {
    const targetUrl = new URL(url);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Referer': targetUrl.origin
      }
    });

    const html = await response.text();

    // 1. Find all possible image sources (src, data-src, data-lazy-src)
    // This regex looks for anything that looks like an image path inside quotes
    const imgRegex = /(?:src|data-src|data-lazy-src|data-optimized-src)\s*=\s*["']([^"']+\.(?:jpg|jpeg|png|webp|gif)[^"']*)["']/gi;
    
    let matches;
    let images = [];

    while ((matches = imgRegex.exec(html)) !== null) {
      let imgSrc = matches[1];

      // 2. Fix Relative Paths (e.g., /wp-content/... -> https://site.com/wp-content/...)
      if (imgSrc.startsWith('//')) {
        imgSrc = 'https:' + imgSrc;
      } else if (imgSrc.startsWith('/')) {
        imgSrc = targetUrl.origin + imgSrc;
      } else if (!imgSrc.startsWith('http')) {
        imgSrc = targetUrl.origin + '/' + imgSrc;
      }

      images.push(imgSrc);
    }

    // 3. Clean and Filter
    // We remove duplicates and filter out UI icons/avatars
    const filteredImages = [...new Set(images)].filter(img => {
      const isClutter = /logo|avatar|icon|thumb|banner|loader|proxy|wp-custom/i.test(img);
      const isMangaContent = /chapter|manga|wp-content\/uploads/i.test(img) || img.includes('kunmanga.com');
      return !isClutter || isMangaContent;
    });

    if (filteredImages.length === 0) {
      return res.status(200).json({ success: false, message: "The void is too strong." });
    }

    res.status(200).json({
      success: true,
