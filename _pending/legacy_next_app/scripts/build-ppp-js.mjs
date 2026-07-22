import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const pppDir = path.join(root, "public", "book", "positive-psychology-progress");
const manifest = JSON.parse(fs.readFileSync(path.join(pppDir, "manifest.json"), "utf8"));
const searchIndex = JSON.parse(fs.readFileSync(path.join(pppDir, "search-index.json"), "utf8"));

const chapters = manifest.chapters.map((meta) => {
  const filename = path.basename(meta.url);
  const chapterData = JSON.parse(fs.readFileSync(path.join(pppDir, filename), "utf8"));
  return chapterData;
});

const bundle = {
  manifest,
  searchIndex,
  chapters,
};

const jsContent = `window.PPP_DATA = ${JSON.stringify(bundle, null, 2)};\n`;
fs.writeFileSync(path.join(pppDir, "ppp-data.js"), jsContent);
console.log("Successfully built ppp-data.js with", chapters.length, "chapters.");
