import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const processedDir = path.join(rootDir, 'processed_content');

// Helper to sanitize filename
function sanitizeFilename(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// 1. Process Psychology of Money
const pomSourceDir = path.join(rootDir, 'public', 'book', 'v5');
const pomTargetDir = path.join(processedDir, 'psychology-money');
fs.mkdirSync(pomTargetDir, { recursive: true });

if (fs.existsSync(pomSourceDir)) {
  const manifestPath = path.join(pomSourceDir, 'manifest.json');
  let chaptersList = [];
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    chaptersList = manifest.sections || manifest.chapters || [];
  }

  for (let i = 0; i <= 25; i++) {
    const numStr = i < 10 ? `0${i}` : `${i}`;
    const chFile = path.join(pomSourceDir, `chapter-${numStr}.json`);
    if (!fs.existsSync(chFile)) continue;

    const data = JSON.parse(fs.readFileSync(chFile, 'utf8'));
    const enTitle = data.enTitle || `Chapter ${i}`;
    const zhTitle = data.zhTitle || `第 ${i} 章`;
    const slug = sanitizeFilename(enTitle);
    const fileName = `${numStr}-${slug || 'chapter'}.md`;

    let md = `# ${enTitle}\n## ${zhTitle}\n\n`;
    if (data.pairs && Array.isArray(data.pairs)) {
      data.pairs.forEach((p, idx) => {
        md += `### Paragraph ${idx + 1}\n\n`;
        md += `**[EN]** ${p.en}\n\n`;
        md += `**[ZH]** ${p.zh}\n\n---\n\n`;
      });
    }

    fs.writeFileSync(path.join(pomTargetDir, fileName), md, 'utf8');
  }
  console.log('✓ Psychology of Money Markdown files generated successfully!');
}

// 2. Process Positive Psychology Progress
const pppSourceDir = path.join(rootDir, 'public', 'book', 'positive-psychology-progress');
const pppTargetDir = path.join(processedDir, 'positive-psychology-progress');
fs.mkdirSync(pppTargetDir, { recursive: true });

if (fs.existsSync(pppSourceDir)) {
  for (let i = 0; i <= 12; i++) {
    const numStr = i < 10 ? `0${i}` : `${i}`;
    const chFile = path.join(pppSourceDir, `chapter-${numStr}.json`);
    if (!fs.existsSync(chFile)) continue;

    const data = JSON.parse(fs.readFileSync(chFile, 'utf8'));
    const enTitle = data.enTitle || `Section ${i}`;
    const zhTitle = data.zhTitle || `第 ${i} 節`;
    const slug = sanitizeFilename(enTitle);
    const fileName = `${numStr}-${slug || 'section'}.md`;

    let md = `# ${enTitle}\n## ${zhTitle}\n\n`;
    if (data.pairs && Array.isArray(data.pairs)) {
      data.pairs.forEach((p, idx) => {
        md += `### Paragraph ${idx + 1}\n\n`;
        md += `**[EN]** ${p.en}\n\n`;
        md += `**[ZH]** ${p.zh}\n\n---\n\n`;
      });
    }

    fs.writeFileSync(path.join(pppTargetDir, fileName), md, 'utf8');
  }
  console.log('✓ Positive Psychology Progress Markdown files generated successfully!');
}
