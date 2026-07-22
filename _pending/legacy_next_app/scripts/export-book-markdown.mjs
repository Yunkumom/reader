import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(root, "publications", "markdown");

const books = [
  {
    directory: "v5",
    slug: "the-psychology-of-money",
  },
  {
    directory: "positive-psychology-progress",
    slug: "positive-psychology-progress",
  },
];

const figures = {
  "ppp-chapter-7-pair-43": ["figure-1.png", "figure-2.png"],
  "ppp-chapter-10-pair-0": ["table-1.png"],
  "ppp-chapter-11-pair-0": ["figure-1.png"],
  "ppp-chapter-11-pair-2": ["figure-2.png"],
};

const figureAlt = {
  en: {
    "table-1.png": "Original Table 1: Classification of Character Strengths",
    "figure-1.png": "Original Figure 1: Steen Happiness Index scores",
    "figure-2.png": "Original Figure 2: CES-D depressive symptom scores",
  },
  zh: {
    "table-1.png": "原始表 1：品格優勢分類",
    "figure-1.png": "原始圖 1：Steen 幸福感指數分數",
    "figure-2.png": "原始圖 2：CES-D 憂鬱症狀分數",
  },
};

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

function imageMarkdown(bookDirectory, pairId, language) {
  return (figures[pairId] ?? [])
    .map((name) => {
      const src = `../../public/book/${bookDirectory}/figures/${name}`;
      return `![${figureAlt[language][name]}](${src})`;
    })
    .join("\n\n");
}

async function exportLanguage(book, manifest, chapters, language) {
  const isChinese = language === "zh";
  const title = isChinese ? manifest.zhTitle : manifest.title;
  const author = isChinese ? manifest.zhAuthor : manifest.author;
  const lines = [`# ${title}`, "", `${isChinese ? "作者" : "Author"}: ${author}`, ""];

  for (const chapter of chapters) {
    const chapterTitle = isChinese ? chapter.zhTitle : chapter.enTitle;
    lines.push(`## ${chapterTitle}`, "");

    let currentPage;
    for (const pair of chapter.pairs) {
      if (pair.pdfPage !== currentPage) {
        currentPage = pair.pdfPage;
        lines.push(
          `<a id="pdf-page-${currentPage}"></a>`,
          `*${isChinese ? `PDF 第 ${currentPage} 頁` : `PDF page ${currentPage}`}*`,
          "",
        );
      }

      const image = imageMarkdown(book.directory, pair.id, language);
      if (image) lines.push(image, "");

      const text = isChinese ? pair.zh : pair.en;
      if (text?.trim()) lines.push(text.trim().replace(/[ \t]+$/gm, ""), "");
    }
  }

  const suffix = isChinese ? "zh-TW" : "en";
  const output = path.join(outputDir, `${book.slug}-${suffix}.md`);
  await writeFile(output, `${lines.join("\n").trim()}\n`, "utf8");
  return output;
}

await mkdir(outputDir, { recursive: true });

for (const book of books) {
  const bookDir = path.join(root, "public", "book", book.directory);
  const manifest = await readJson(path.join(bookDir, "manifest.json"));
  const chapters = [];

  for (const item of manifest.chapters) {
    const chapterFile = path.join(root, "public", item.url.replace(/^\//, ""));
    chapters.push(await readJson(chapterFile));
  }

  await exportLanguage(book, manifest, chapters, "en");
  await exportLanguage(book, manifest, chapters, "zh");
}
