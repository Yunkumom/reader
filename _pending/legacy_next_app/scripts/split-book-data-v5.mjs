import fs from "node:fs";

const inputPath = new URL("../app/book-data-v1.json", import.meta.url);
const outputPath = new URL("../app/book-data-v5.json", import.meta.url);
const MAX_CHARS = 112;
const MAX_SENTENCES = 3;

const enSegmenter = new Intl.Segmenter("en", { granularity: "sentence" });
const zhSegmenter = new Intl.Segmenter("zh-Hant", { granularity: "sentence" });

function sentences(text, segmenter) {
  const output = [];
  for (const { segment } of segmenter.segment(text)) {
    const clean = segment.trim();
    if (!clean) continue;
    if (/^[⁰¹²³⁴⁵⁶⁷⁸⁹]+$/u.test(clean) && output.length) output[output.length - 1] += clean;
    else output.push(clean);
  }
  return output;
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
          const ratioCost = Math.abs(Math.log(((zhLength + 1) / (enLength + 1)) / (totalZh / totalEn)));
          const boundaryEn = en.slice(0, i + takeEn).reduce((sum, text) => sum + visibleLength(text), 0) / totalEn;
          const boundaryZh = zh.slice(0, j + takeZh).reduce((sum, text) => sum + visibleLength(text), 0) / totalZh;
          const cost = state.cost + ratioCost + Math.abs(boundaryEn - boundaryZh) * 1.5 + .13 * (takeEn + takeZh - 2);
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
    aligned.push({ en: en.slice(step.i, step.i + step.takeEn), zh: zh.slice(step.j, step.j + step.takeZh) });
    i = step.i;
    j = step.j;
  }
  return aligned.reverse();
}

function numericAnchors(text) {
  return [...text.matchAll(/\d[\d,.]*%?/g)].map((match) => match[0].replace(/[,.]$/g, ""));
}

function mergeAnchorConflicts(input, enText, zhText) {
  let units = [...input];
  const enAnchors = numericAnchors(enText);
  const zhAnchors = numericAnchors(zhText);
  const anchors = [...new Set(enAnchors)].filter((anchor) =>
    enAnchors.filter((value) => value === anchor).length === 1
    && zhAnchors.filter((value) => value === anchor).length === 1,
  );
  for (const anchor of anchors) {
    const enIndex = units.findIndex((unit) => unit.en.some((text) => text.includes(anchor)));
    const zhIndex = units.findIndex((unit) => unit.zh.some((text) => text.includes(anchor)));
    if (enIndex < 0 || zhIndex < 0 || enIndex === zhIndex) continue;
    const from = Math.min(enIndex, zhIndex);
    const to = Math.max(enIndex, zhIndex);
    const merged = units.slice(from, to + 1).reduce((unit, part) => ({ en: [...unit.en, ...part.en], zh: [...unit.zh, ...part.zh] }), { en: [], zh: [] });
    units = [...units.slice(0, from), merged, ...units.slice(to + 1)];
  }
  return units;
}

function clauses(text, language, aggressive = false) {
  const boundary = language === "en"
    ? aggressive ? /(?<=[;:,])\s+|\s+(?=[—–]\s*)/u : /(?<=[;:])\s+|\s+(?=[—–]\s*)/u
    : aggressive ? /(?<=[；：，])|(?<=——)/u : /(?<=[；：])|(?<=——)/u;
  return text.split(boundary).map((part) => part.trim()).filter(Boolean);
}

function refineLongUnit(unit) {
  const enText = unit.en.join(" ");
  const zhText = unit.zh.join("");
  if (visibleLength(enText) <= MAX_CHARS * 1.18 || unit.en.length !== 1 || unit.zh.length !== 1) return [unit];
  for (const aggressive of [false, true]) {
    const enClauses = clauses(enText, "en", aggressive);
    const zhClauses = clauses(zhText, "zh", aggressive);
    if (enClauses.length < 2 || zhClauses.length < 2 || enClauses.length > 12 || zhClauses.length > 12) continue;
    const aligned = mergeAnchorConflicts(alignSegments(enClauses, zhClauses), enText, zhText);
    if (aligned.length > 1 && Math.max(...aligned.map((part) => visibleLength(part.en.join(" ")))) < visibleLength(enText)) {
      return aligned.map((part) => ({ ...part, clauseSplit: true }));
    }
  }
  return [unit];
}

function splitPair(pair) {
  if (visibleLength(pair.en) <= MAX_CHARS || pair.en.startsWith("> ") || /(^|\n)\s*-\s/.test(pair.en)) return [pair];
  const alignedSentences = mergeAnchorConflicts(
    alignSegments(sentences(pair.en, enSegmenter), sentences(pair.zh, zhSegmenter)),
    pair.en,
    pair.zh,
  );
  const units = alignedSentences.flatMap(refineLongUnit);
  const chunks = [];
  let current = null;

  for (const unit of units) {
    const enText = unit.en.join(" ");
    const zhText = unit.zh.join("");
    const unitSentences = Math.max(1, unit.en.length);
    const canJoin = current
      && visibleLength(current.en) + 1 + visibleLength(enText) <= MAX_CHARS
      && current.sentenceCount + unitSentences <= MAX_SENTENCES;
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
  const limited = [];
  for (const chunk of chunks.length ? chunks : [pair]) {
    const enParts = sentences(chunk.en, enSegmenter);
    if (enParts.length <= MAX_SENTENCES) {
      limited.push(chunk);
      continue;
    }
    const units = mergeAnchorConflicts(alignSegments(enParts, sentences(chunk.zh, zhSegmenter)), chunk.en, chunk.zh);
    let group = null;
    for (const unit of units) {
      if (group && group.en.length + unit.en.length <= MAX_SENTENCES) {
        group.en.push(...unit.en);
        group.zh.push(...unit.zh);
      } else {
        if (group) limited.push({ en: group.en.join(" "), zh: group.zh.join("") });
        group = { en: [...unit.en], zh: [...unit.zh] };
      }
    }
    if (group) limited.push({ en: group.en.join(" "), zh: group.zh.join("") });
  }
  return limited;
}

function repairSourceAlignment(section) {
  if (section.id !== "chapter-8") return section.pairs;
  const pairs = section.pairs;
  const repaired = pairs.slice(0, 20).map((pair) => ({ ...pair }));
  repaired.push({ en: `${pairs[20].en} ${pairs[21].en}`.replace(/\s+/g, " ").trim(), zh: pairs[20].zh });
  for (let enIndex = 22; enIndex <= 42; enIndex += 1) {
    repaired.push({ en: pairs[enIndex].en, zh: pairs[enIndex - 1].zh });
  }
  const finalBoundary = "Compared to generations prior";
  const finalBoundaryIndex = pairs[43].en.indexOf(finalBoundary);
  repaired.push({
    en: pairs[43].en.slice(0, finalBoundaryIndex).trim(),
    zh: pairs[42].zh,
  });
  repaired.push({
    en: pairs[43].en.slice(finalBoundaryIndex).trim(),
    zh: pairs[43].zh,
  });
  repaired.push(...pairs.slice(44).map((pair) => ({ ...pair })));
  return repaired;
}

const book = JSON.parse(fs.readFileSync(inputPath, "utf8"));
let sourcePairs = 0;
let outputPairs = 0;
const lengths = [];

book.sections = book.sections.map((section) => ({
  ...section,
  pairs: repairSourceAlignment(section).flatMap((pair, sourcePairIndex) => {
    sourcePairs += 1;
    const chunks = splitPair(pair);
    outputPairs += chunks.length;
    chunks.forEach((chunk) => lengths.push(visibleLength(chunk.en)));
    return chunks.map((chunk, chunkIndex) => ({ en: chunk.en, zh: chunk.zh, sourcePairIndex, chunkIndex }));
  }),
}));
book.readerVersion = "v5";
book.splitPolicy = { targetEnglishCharacters: MAX_CHARS, maxEnglishSentences: MAX_SENTENCES, targetLinesAt30px: "5–6" };

fs.writeFileSync(outputPath, `${JSON.stringify(book, null, 2)}\n`);
lengths.sort((a, b) => a - b);
console.log(JSON.stringify({
  sourcePairs,
  outputPairs,
  addedPairs: outputPairs - sourcePairs,
  p90: lengths[Math.floor(lengths.length * .9)],
  p95: lengths[Math.floor(lengths.length * .95)],
  over150: lengths.filter((value) => value > 150).length,
  over200: lengths.filter((value) => value > 200).length,
  max: lengths.at(-1),
}, null, 2));
