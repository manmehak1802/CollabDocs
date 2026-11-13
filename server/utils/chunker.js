const entities = { '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" };

// Turns the editor's HTML into plain text
exports.htmlToText = (html = '') =>
  html
    .replace(/<\/(p|h[1-6]|li|div|blockquote)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&(nbsp|amp|lt|gt|quot|#39);/g, (m) => entities[m])
    .replace(/\n{3,}/g, '\n\n')
    .trim();

// Splits text into pieces of about 800 characters
exports.chunkText = (text, max = 800) => {
  const parts = text.split(/\n+/).map((s) => s.trim()).filter(Boolean);
  const chunks = [];
  let cur = '';
  for (const p of parts) {
    if (p.length > max) {
      if (cur) { chunks.push(cur); cur = ''; }
      for (let i = 0; i < p.length; i += max) chunks.push(p.slice(i, i + max));
      continue;
    }
    if (cur && cur.length + 1 + p.length > max) {
      chunks.push(cur);
      cur = p;
    } else {
      cur = cur ? cur + '\n' + p : p;
    }
  }
  if (cur) chunks.push(cur);
  return chunks.slice(0, 60);
};