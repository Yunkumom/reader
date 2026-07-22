import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const root = path.resolve(import.meta.dirname, "..");
const outDir = path.join(root, "public", "book", "v5");
const book = JSON.parse(fs.readFileSync(path.join(root, "app", "book-data-v5.json"), "utf8"));
const pageMap = JSON.parse(fs.readFileSync(path.join(root, "app", "pdf-page-map-v5.json"), "utf8"));
fs.mkdirSync(outDir, { recursive: true });

const chapterFiles = [];
const searchItems = [];
let globalIndex = 0;

book.sections.forEach((section, chapterIndex) => {
  const pairs = section.pairs.map((pair, pairIndex) => {
    const id = `${section.id}-p-${pair.sourcePairIndex}-${pair.chunkIndex}`;
    const enriched = { ...pair, id, pairIndex, globalIndex, pdfPage: pageMap.pageByPairId[id] };
    searchItems.push({ id, chapterIndex, pairIndex, pdfPage: enriched.pdfPage, en: pair.en, zh: pair.zh });
    globalIndex += 1;
    return enriched;
  });
  const payload = { id: section.id, chapterIndex, enTitle: section.enTitle, zhTitle: section.zhTitle, pairs };
  const filename = `chapter-${String(chapterIndex).padStart(2, "0")}.json`;
  const json = `${JSON.stringify(payload)}\n`;
  fs.writeFileSync(path.join(outDir, filename), json);
  chapterFiles.push({
    id: section.id,
    chapterIndex,
    enTitle: section.enTitle,
    zhTitle: section.zhTitle,
    pairCount: pairs.length,
    url: `/book/v5/${filename}`,
    bytes: Buffer.byteLength(json),
  });
});

const searchJson = `${JSON.stringify(searchItems)}\n`;
fs.writeFileSync(path.join(outDir, "search-index.json"), searchJson);
const contentHash = createHash("sha256").update(JSON.stringify(chapterFiles)).update(searchJson).digest("hex").slice(0, 16);
const manifest = {
  version: "v5",
  contentHash,
  title: book.title,
  zhTitle: book.zhTitle,
  author: book.author,
  zhAuthor: book.zhAuthor,
  pdfTotalPages: pageMap.pdfTotalPages,
  totalPairs: globalIndex,
  splitPolicy: book.splitPolicy,
  searchUrl: "/book/v5/search-index.json",
  chapters: chapterFiles,
  offlineUrls: ["/book/v5/search-index.json", ...chapterFiles.map((chapter) => chapter.url)],
};
fs.writeFileSync(path.join(outDir, "manifest.json"), `${JSON.stringify(manifest)}\n`);
console.log(JSON.stringify({ chapters: chapterFiles.length, pairs: globalIndex, searchBytes: Buffer.byteLength(searchJson), contentHash }, null, 2));
