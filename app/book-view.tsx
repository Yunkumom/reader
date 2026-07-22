import ReaderClient from "./reader-client";

type Pair = { en: string; zh: string; sourcePairIndex?: number; chunkIndex?: number };
type Section = { id: string; enTitle: string; zhTitle: string; pairs: Pair[] };
type Book = {
  title: string;
  zhTitle: string;
  author: string;
  zhAuthor: string;
  sections: Section[];
};

function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={index}>{part.slice(2, -2)}</strong>
    ) : (
      <span key={index}>{part}</span>
    ),
  );
}

function BookBlock({ text, language }: { text: string; language: "en" | "zh" }) {
  const className = language === "en" ? "enText" : "zhText";
  const lines = text.split("\n").filter(Boolean);

  if (text.startsWith("> ")) {
    return <blockquote className={className}><RichText text={text.slice(2)} /></blockquote>;
  }

  if (lines.length > 0 && lines.every((line) => line.startsWith("- "))) {
    return <ul className={className}>{lines.map((line, index) => <li key={index}><RichText text={line.slice(2)} /></li>)}</ul>;
  }

  return <p className={className}><RichText text={text} /></p>;
}

export default function BookView({
  book,
  version,
  pdfPageMap,
  pdfTotalPages,
}: {
  book: Book;
  version: "v1" | "v2" | "v3" | "v4";
  pdfPageMap?: Record<string, number>;
  pdfTotalPages?: number;
}) {
  const totalPairs = book.sections.reduce((sum, section) => sum + section.pairs.length, 0);
  const chapters = book.sections.map(({ id, enTitle, zhTitle, pairs }, chapterIndex) => {
    const globalStart = book.sections.slice(0, chapterIndex).reduce((sum, section) => sum + section.pairs.length, 0);
    return { id, enTitle, zhTitle, pairCount: pairs.length, chapterIndex, globalStart };
  });

  return (
    <>
      <ReaderClient chapters={chapters} version={version} pdfTotalPages={pdfTotalPages} />
      <main className="reader" aria-label="Bilingual book reader">
      <header className="bookCover">
        <p className="eyebrow">Bilingual reading edition · {version}</p>
        <h1>{book.title}</h1>
        <p className="zhCover">{book.zhTitle}</p>
        <p className="author">{book.author}｜{book.zhAuthor}</p>
      </header>

      {book.sections.map((section, chapterIndex) => {
        const chapterMeta = chapters[chapterIndex];
        return (
        <section className="chapter" id={section.id} data-title={section.enTitle} data-chapter-index={chapterIndex} key={section.id}>
          <header className="chapterTitle pair" tabIndex={0}>
            <button className="translateButton" aria-label="顯示或隱藏中文章名" aria-pressed="false">中</button>
            <div className="english"><h2>{section.enTitle}</h2></div>
            <div className="translation" aria-hidden="true"><h3>{section.zhTitle}</h3></div>
          </header>

          {section.pairs.map((pair, pairIndex) => {
            const stablePairId = pair.sourcePairIndex === undefined
              ? `${section.id}-p-${pairIndex}`
              : `${section.id}-p-${pair.sourcePairIndex}-${pair.chunkIndex ?? 0}`;
            return (
            <article
              className="pair"
              id={stablePairId}
              tabIndex={0}
              key={stablePairId}
              data-chapter-index={chapterIndex}
              data-pair-index={pairIndex}
              data-pair-total={section.pairs.length}
              data-global-index={chapterMeta.globalStart + pairIndex}
              data-global-total={totalPairs}
              data-pdf-page={pdfPageMap?.[stablePairId]}
            >
              <button className="translateButton" aria-label="顯示或隱藏中文翻譯" aria-pressed="false">中</button>
              <div className="english"><BookBlock text={pair.en} language="en" /></div>
              <div className="translation" aria-hidden="true">
                {pair.zh.split(/\n\s*\n/).map((chunk, chunkIndex) => <BookBlock text={chunk} language="zh" key={chunkIndex} />)}
              </div>
            </article>
          )})}
        </section>
      )})}

      <footer className="readerFooter">
        <p>{version} · Your reading preferences and position stay on this device.</p>
        <p>{version} · 閱讀偏好與進度只會儲存在此裝置。</p>
      </footer>
      </main>
    </>
  );
}
