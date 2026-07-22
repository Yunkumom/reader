import fs from "node:fs";

const inputPath = new URL("../app/book-data-v1.json", import.meta.url);
const outputPath = new URL("../app/book-data-v2.json", import.meta.url);
const MAX_CHARS = 150;
const MAX_SENTENCES = 3;

const enSegmenter = new Intl.Segmenter("en", { granularity: "sentence" });
const zhSegmenter = new Intl.Segmenter("zh-Hant", { granularity: "sentence" });

function sentences(text, segmenter) {
  return [...segmenter.segment(text)].map(({ segment }) => segment.trim()).filter(Boolean);
}

function visibleLength(text) {
  return text.replace(/\*\*/g, "").replace(/^>\s*/, "").length;
}

function alignSegments(en, zh) {
  if (en.length === zh.length) return en.map((text, index) => ({ en: [text], zh: [zh[index]] }));

  const totalEn = Math.max(1, en.reduce((sum, text) => sum + visibleLength(text), 0));
  const totalZh = Math.max(1, zh.reduce((sum, text) => sum + visibleLength(text), 0));
  const dp = Array.from({ length: en.length + 1 }, () => Array(zh.length + 1).fill(null));
  dp[0][0] = { cost: 0, previous: null };

  for (let i = 0; i <= en.length; i += 1) {
    for (let j = 0; j <= zh.length; j += 1) {
      const state = dp[i][j];
      if (!state) continue;
      for (let takeEn = 1; takeEn <= 3 && i + takeEn <= en.length; takeEn += 1) {
        for (let takeZh = 1; takeZh <= 3 && j + takeZh <= zh.length; takeZh += 1) {
          const enLength = en.slice(i, i + takeEn).reduce((sum, text) => sum + visibleLength(text), 0);
          const zhLength = zh.slice(j, j + takeZh).reduce((sum, text) => sum + visibleLength(text), 0);
          const expectedRatio = totalZh / totalEn;
          const actualRatio = (zhLength + 1) / (enLength + 1);
          const ratioCost = Math.abs(Math.log(actualRatio / expectedRatio));
          const boundaryEn = (en.slice(0, i + takeEn).reduce((sum, text) => sum + visibleLength(text), 0)) / totalEn;
          const boundaryZh = (zh.slice(0, j + takeZh).reduce((sum, text) => sum + visibleLength(text), 0)) / totalZh;
          const groupingCost = 0.12 * (takeEn + takeZh - 2) + 0.08 * Math.abs(takeEn - takeZh);
          const cost = state.cost + ratioCost + Math.abs(boundaryEn - boundaryZh) * 1.4 + groupingCost;
          const nextI = i + takeEn;
          const nextJ = j + takeZh;
          if (!dp[nextI][nextJ] || cost < dp[nextI][nextJ].cost) {
            dp[nextI][nextJ] = { cost, previous: { i, j, takeEn, takeZh } };
          }
        }
      }
    }
  }

  const aligned = [];
  let i = en.length;
  let j = zh.length;
  while (i > 0 || j > 0) {
    const step = dp[i][j]?.previous;
    if (!step) return [{ en, zh }];
    aligned.push({
      en: en.slice(step.i, step.i + step.takeEn),
      zh: zh.slice(step.j, step.j + step.takeZh),
    });
    i = step.i;
    j = step.j;
  }
  return aligned.reverse();
}

function strongClauses(text, language) {
  const boundary = language === "en" ? /(?<=[;:])\s+|\s+(?=[—–]\s*)/u : /(?<=[；：])|(?<=——)/u;
  return text.split(boundary).map((part) => part.trim()).filter(Boolean);
}

function numericAnchors(text) {
  return [...text.matchAll(/\d[\d,.]*%?/g)].map((match) => match[0].replace(/[,.]$/g, ""));
}

function anchorsStayTogether(units, enText, zhText) {
  const enAnchors = numericAnchors(enText);
  const zhAnchors = numericAnchors(zhText);
  const sharedUnique = [...new Set(enAnchors)].filter((anchor) =>
    enAnchors.filter((value) => value === anchor).length === 1
    && zhAnchors.filter((value) => value === anchor).length === 1,
  );
  return sharedUnique.every((anchor) => {
    const enIndex = units.findIndex((unit) => unit.en.some((text) => text.includes(anchor)));
    const zhIndex = units.findIndex((unit) => unit.zh.some((text) => text.includes(anchor)));
    return enIndex === zhIndex;
  });
}

function refineLongUnit(unit) {
  if (unit.en.length !== 1 || unit.zh.length !== 1 || visibleLength(unit.en[0]) <= MAX_CHARS * 1.2) return [unit];
  const enClauses = strongClauses(unit.en[0], "en");
  const zhClauses = strongClauses(unit.zh[0], "zh");
  if (enClauses.length < 2 || enClauses.length !== zhClauses.length || enClauses.length > 5) return [unit];
  if (Math.max(...enClauses.map(visibleLength)) > MAX_CHARS * 1.35) return [unit];
  return enClauses.map((text, index) => ({ en: [text], zh: [zhClauses[index]], clauseSplit: true }));
}

function splitPair(pair) {
  if (visibleLength(pair.en) <= MAX_CHARS || pair.en.startsWith("> ") || /(^|\n)\s*-\s/.test(pair.en)) return [pair];

  const enSentences = sentences(pair.en, enSegmenter);
  const zhSentences = sentences(pair.zh, zhSegmenter);
  const aligned = alignSegments(enSentences, zhSentences);
  if (!anchorsStayTogether(aligned, pair.en, pair.zh)) return [pair];
  const units = aligned.flatMap(refineLongUnit);
  const chunks = [];
  let current = null;

  for (const unit of units) {
    const enText = unit.en.join(" ");
    const zhText = unit.zh.join("");
    const unitSentences = unit.en.length;
    const canJoin = current
      && current.en.length + 1 + visibleLength(enText) <= MAX_CHARS
      && current.sentenceCount + unitSentences <= MAX_SENTENCES
      && !unit.clauseSplit
      && !current.clauseSplit;

    if (canJoin) {
      current.en += ` ${enText}`;
      current.zh += zhText;
      current.sentenceCount += unitSentences;
    } else {
      if (current) chunks.push({ en: current.en, zh: current.zh });
      current = { en: enText, zh: zhText, sentenceCount: unitSentences, clauseSplit: Boolean(unit.clauseSplit) };
    }
  }
  if (current) chunks.push({ en: current.en, zh: current.zh });
  return chunks.length ? chunks : [pair];
}

const book = JSON.parse(fs.readFileSync(inputPath, "utf8"));
let sourcePairs = 0;
let outputPairs = 0;
let overLimit = 0;

book.sections = book.sections.map((section) => ({
  ...section,
  pairs: section.pairs.flatMap((pair, sourcePairIndex) => {
    sourcePairs += 1;
    const chunks = splitPair(pair);
    outputPairs += chunks.length;
    overLimit += chunks.filter((chunk) => visibleLength(chunk.en) > MAX_CHARS * 1.35).length;
    return chunks.map((chunk, chunkIndex) => ({ ...chunk, sourcePairIndex, chunkIndex }));
  }),
}));
book.readerVersion = "v2";
book.splitPolicy = { maxEnglishCharacters: MAX_CHARS, maxEnglishSentences: MAX_SENTENCES };

fs.writeFileSync(outputPath, `${JSON.stringify(book, null, 2)}\n`);
console.log(JSON.stringify({ sourcePairs, outputPairs, addedPairs: outputPairs - sourcePairs, overLimit }, null, 2));
