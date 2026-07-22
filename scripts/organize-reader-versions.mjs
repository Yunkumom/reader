import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const versionsDir = path.join(rootDir, 'reader_versions');

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else if (exists) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

// 1. Create v11_latest working build
const v11Dir = path.join(versionsDir, 'v11_latest');
fs.mkdirSync(v11Dir, { recursive: true });
copyRecursiveSync(path.join(rootDir, 'index.html'), path.join(v11Dir, 'index.html'));
copyRecursiveSync(path.join(rootDir, 'public', 'manifest.webmanifest'), path.join(v11Dir, 'manifest.webmanifest'));
copyRecursiveSync(path.join(rootDir, 'public', 'sw.js'), path.join(v11Dir, 'sw.js'));
copyRecursiveSync(path.join(rootDir, 'app', 'book-data-v5.js'), path.join(v11Dir, 'book-data-v5.js'));

// 2. Create v10_pwa_offline working build
const v10Dir = path.join(versionsDir, 'v10_pwa_offline');
fs.mkdirSync(v10Dir, { recursive: true });
copyRecursiveSync(path.join(rootDir, 'index.html'), path.join(v10Dir, 'index.html'));
copyRecursiveSync(path.join(rootDir, 'public', 'sw.js'), path.join(v10Dir, 'sw.js'));

// 3. Create v9_bilingual_figures working build
const v9Dir = path.join(versionsDir, 'v9_bilingual_figures');
fs.mkdirSync(v9Dir, { recursive: true });
copyRecursiveSync(path.join(rootDir, 'app', 'v5-reader.tsx'), path.join(v9Dir, 'v5-reader.tsx'));

console.log('✓ Reader versions preserved and organized into reader_versions/!');
