import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const sourceMatDir = path.join(rootDir, 'source_materials');

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

// 1. Copy publications catalog
copyRecursiveSync(path.join(rootDir, 'public', 'publications.json'), path.join(sourceMatDir, 'publications.json'));

// 2. Copy Psychology of Money raw JSON source
copyRecursiveSync(path.join(rootDir, 'public', 'book', 'v5'), path.join(sourceMatDir, 'psychology-money'));

// 3. Copy Positive Psychology Progress raw JSON & figures source
copyRecursiveSync(path.join(rootDir, 'public', 'book', 'positive-psychology-progress'), path.join(sourceMatDir, 'positive-psychology-progress'));

console.log('✓ Source materials copied and organized into source_materials/!');
