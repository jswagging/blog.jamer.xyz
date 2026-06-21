function parseFrontMatter(raw) {
  const fmMatch = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  let meta = {};
  let body = raw;

  if (fmMatch) {
    const block = fmMatch[1];
    body = raw.slice(fmMatch[0].length);
    block.split('\n').forEach((line) => {
      const idx = line.indexOf(':');
      if (idx === -1) return;
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      meta[key] = value;
    });
  }

  return { meta, body };
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function excerptOf(body, length = 160) {
  const text = body
    .replace(/^#.*$/m, '')
    .replace(/[#*_`>~-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > length ? text.slice(0, length).trim() + '…' : text;
}

async function loadAllPosts() {
  const manifestRes = await fetch('resources/markdowns/index.json', { cache: 'no-store' });
  if (!manifestRes.ok) {
    throw new Error('Could not load resources/markdowns/index.json');
  }
  const filenames = await manifestRes.json();

  const posts = await Promise.all(
    filenames.map(async (filename) => {
      const res = await fetch(`resources/markdowns/${filename}`, { cache: 'no-store' });
      if (!res.ok) return null;
      const raw = await res.text();
      const { meta, body } = parseFrontMatter(raw);
      return {
        filename,
        title: meta.title || filename.replace(/\.md$/, ''),
        date: meta.date || '',
        body,
      };
    })
  );

  return posts
    .filter(Boolean)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

async function loadPost(filename) {
  const res = await fetch(`resources/markdowns/${filename}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Could not load resources/markdowns/${filename}`);
  const raw = await res.text();
  return parseFrontMatter(raw);
}
