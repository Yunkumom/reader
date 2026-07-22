"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import Image from "next/image";

type Pair = { id: string; en: string; zh: string; pairIndex: number; globalIndex: number; pdfPage: number };
type Chapter = { id: string; chapterIndex: number; enTitle: string; zhTitle: string; pairs: Pair[] };
type ChapterMeta = { id: string; chapterIndex: number; enTitle: string; zhTitle: string; pairCount: number; url: string; bytes: number };
type Manifest = { version: string; title: string; zhTitle: string; author: string; zhAuthor: string; pdfTotalPages: number; totalPairs: number; searchUrl: string; chapters: ChapterMeta[]; offlineUrls: string[] };
type Publication = { id: string; type: "book" | "paper"; title: string; zhTitle: string; author: string; zhAuthor: string; year: number; pdfTotalPages: number; manifestUrl: string; description: string; zhDescription: string };
type SearchItem = { id: string; chapterIndex: number; pairIndex: number; pdfPage: number; en: string; zh: string };
type Theme = "light" | "eye" | "dark";
type VoiceLanguage = "en" | "zh";
type ReaderVersion = "v5" | "v6" | "v7" | "v8" | "v9" | "v10" | "v11";
type TapAction = "voice" | "translation" | "copy";
type Preferences = { theme: Theme; fontSize: number; lineHeight: number; font: "serif" | "sans"; width: number; showAll: boolean; chapterIndex: number; lastPairId: string; speechRate: number; continuousSpeech: boolean; tapAction: TapAction };
type SpeechState = { pairId: string; language: VoiceLanguage; sentenceIndex: number; playing: boolean } | null;

const defaults: Preferences = { theme: "eye", fontSize: 21, lineHeight: 1.82, font: "serif", width: 720, showAll: false, chapterIndex: 0, lastPairId: "", speechRate: 1, continuousSpeech: false, tapAction: "voice" };
const defaultPublication: Publication = { id: "psychology-money", type: "book", title: "The Psychology of Money", zhTitle: "金錢心理學", author: "Morgan Housel", zhAuthor: "摩根・豪瑟", year: 2020, pdfTotalPages: 242, manifestUrl: "/book/v5/manifest.json", description: "Timeless lessons on wealth, greed, and happiness.", zhDescription: "關於財富、貪婪與幸福的恆久課題。" };

function sentences(text: string, language: VoiceLanguage) {
  const clean = text.replace(/^>\s*/, "").replace(/\*\*/g, "").replace(/\n\s*-\s*/g, " ");
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter(language === "zh" ? "zh-Hant" : "en", { granularity: "sentence" });
    const output: string[] = [];
    for (const { segment } of segmenter.segment(clean)) {
      const part = segment.trim();
      if (!part) continue;
      if (/^[⁰¹²³⁴⁵⁶⁷⁸⁹]+$/u.test(part) && output.length) output[output.length - 1] += part;
      else output.push(part);
    }
    return output;
  }
  return clean.split(language === "zh" ? /(?<=[。！？])/u : /(?<=[.!?])\s+/u).map((part) => part.trim()).filter(Boolean);
}

function RichText({ text }: { text: string }) {
  return text.split(/(\*\*.*?\*\*)/g).map((part, index) => part.startsWith("**") && part.endsWith("**") ? <strong key={index}>{part.slice(2, -2)}</strong> : <span key={index}>{part}</span>);
}

function SentenceRuns({ text, language, activeIndex, onSpeak, interactive }: { text: string; language: VoiceLanguage; activeIndex?: number; onSpeak: (index: number) => void; interactive: boolean }) {
  return sentences(text, language).map((sentence, index) => (
    <span
      className={`sentence ${activeIndex === index ? "speaking" : ""}`}
      data-sentence-index={index}
      key={`${index}-${sentence.slice(0, 16)}`}
      onClick={interactive ? (event) => { event.stopPropagation(); onSpeak(index); } : undefined}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={interactive ? (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.stopPropagation(); onSpeak(index); } } : undefined}
    ><RichText text={sentence} />{" "}</span>
  ));
}

function ReadingBlock({ text, language, activeIndex, onSpeak, interactive }: { text: string; language: VoiceLanguage; activeIndex?: number; onSpeak: (index: number) => void; interactive: boolean }) {
  const className = language === "en" ? "enText" : "zhText";
  const lines = text.split("\n").filter(Boolean);
  if (text.startsWith("> ")) return <blockquote className={className}><SentenceRuns text={text.slice(2)} language={language} activeIndex={activeIndex} onSpeak={onSpeak} interactive={interactive} /></blockquote>;
  if (lines.length > 0 && lines.every((line) => line.startsWith("- "))) {
    return <ul className={className}>{lines.map((line, index) => <li key={index}><RichText text={line.slice(2)} /></li>)}</ul>;
  }
  return <p className={className}><SentenceRuns text={text} language={language} activeIndex={activeIndex} onSpeak={onSpeak} interactive={interactive} /></p>;
}

export default function V5Reader({ version = "v11" }: { version?: ReaderVersion }) {
  const libraryVersion = version === "v8" || version === "v9" || version === "v10" || version === "v11";
  const [publicationId, setPublicationId] = useState(defaultPublication.id);
  const [publications, setPublications] = useState<Publication[]>([defaultPublication]);
  const [catalogReady, setCatalogReady] = useState(!libraryVersion);
  const storageKey = `psychology-money-reader-${version}${libraryVersion ? `-${publicationId}` : ""}`;
  const previousStorageKey = version === "v11" ? `psychology-money-reader-v10-${publicationId}` : version === "v10" ? `psychology-money-reader-v9-${publicationId}` : version === "v9" ? `psychology-money-reader-v8-${publicationId}` : version === "v8" && publicationId === defaultPublication.id ? "psychology-money-reader-v7" : version === "v7" ? "psychology-money-reader-v6" : storageKey;
  const currentPublication = publications.find((item) => item.id === publicationId) || defaultPublication;
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [prefs, setPrefs] = useState<Preferences>(defaults);
  const [ready, setReady] = useState(false);
  const [panel, setPanel] = useState<"toc" | "nav" | "settings" | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchIndex, setSearchIndex] = useState<SearchItem[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [location, setLocation] = useState<Pair | null>(null);
  const [openPairs, setOpenPairs] = useState<Set<string>>(new Set());
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [offline, setOffline] = useState({ done: 0, total: 0, complete: false });
  const [speech, setSpeech] = useState<SpeechState>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [error, setError] = useState("");
  const [selectedPairId, setSelectedPairId] = useState("");
  const [copyNotice, setCopyNotice] = useState("");
  const pendingTarget = useRef<string>("");
  const chapterCache = useRef(new Map<string, Chapter>());
  const prefsRef = useRef(prefs);
  const singleTapTimer = useRef<ReturnType<typeof window.setTimeout> | null>(null);

  useEffect(() => { prefsRef.current = prefs; }, [prefs]);
  useEffect(() => () => {
    if (singleTapTimer.current) window.clearTimeout(singleTapTimer.current);
  }, []);

  useEffect(() => {
    if (panel !== "settings") return;
    requestAnimationFrame(() => document.querySelector<HTMLElement>(".settingsPanel")?.scrollTo({ top: 0 }));
  }, [panel]);

  useEffect(() => {
    if (!libraryVersion) return;
    let cancelled = false;
    fetch("/publications.json").then((response) => response.json()).then((items: Publication[]) => {
      if (cancelled) return;
      const usable = items.length ? items : [defaultPublication];
      const savedId = localStorage.getItem("psychology-money-reader-v8-active-publication") || defaultPublication.id;
      setPublications(usable);
      setPublicationId(usable.some((item) => item.id === savedId) ? savedId : defaultPublication.id);
      setCatalogReady(true);
    }).catch(() => {
      if (!cancelled) setCatalogReady(true);
    });
    return () => { cancelled = true; };
  }, [libraryVersion]);

  const fetchChapter = useCallback(async (meta: ChapterMeta) => {
    const cached = chapterCache.current.get(meta.url);
    if (cached) return cached;
    const response = await fetch(meta.url);
    if (!response.ok) throw new Error("Chapter unavailable");
    const data = await response.json() as Chapter;
    chapterCache.current.set(meta.url, data);
    return data;
  }, []);

  const loadChapter = useCallback(async (chapterIndex: number, targetId = "") => {
    if (!manifest) return;
    const meta = manifest.chapters[chapterIndex];
    if (!meta) return;
    pendingTarget.current = targetId;
    setError("");
    try {
      const data = await fetchChapter(meta);
      setChapter(data);
      setLocation(null);
      setOpenPairs(new Set());
      setPrefs((current) => ({ ...current, chapterIndex, lastPairId: targetId || current.lastPairId }));
      setPanel(null);
    } catch {
      setError("This chapter is not available yet. Reconnect once to finish the offline download.｜本章尚未下載完成，請連線一次以完成離線下載。");
    }
  }, [fetchChapter, manifest]);

  useEffect(() => {
    if (!catalogReady) return;
    let cancelled = false;
    try {
      const saved = { ...defaults, ...JSON.parse(localStorage.getItem(storageKey) || localStorage.getItem(previousStorageKey) || "{}") } as Preferences;
      requestAnimationFrame(() => {
        setPrefs(saved);
        setBookmarks(JSON.parse(localStorage.getItem(`${storageKey}-bookmarks`) || localStorage.getItem(`${previousStorageKey}-bookmarks`) || "[]"));
        setRecentIds(JSON.parse(localStorage.getItem(`${storageKey}-recent`) || localStorage.getItem(`${previousStorageKey}-recent`) || "[]"));
      });
      fetch(currentPublication.manifestUrl).then((response) => response.json()).then(async (data: Manifest) => {
        if (cancelled) return;
        setManifest(data);
        const index = Math.min(Math.max(0, saved.chapterIndex), data.chapters.length - 1);
        const firstChapter = await fetchChapter(data.chapters[index]);
        if (cancelled) return;
        pendingTarget.current = saved.lastPairId;
        setChapter(firstChapter);
        setReady(true);
      }).catch(() => { if (!cancelled) setError("Unable to open the book.｜無法開啟書籍。"); });
    } catch {
      requestAnimationFrame(() => setPrefs(defaults));
    }
    return () => { cancelled = true; };
  }, [catalogReady, currentPublication.manifestUrl, fetchChapter, previousStorageKey, storageKey]);

  useEffect(() => {
    if (!ready) return;
    const root = document.documentElement;
    root.dataset.theme = prefs.theme;
    root.dataset.font = prefs.font;
    root.style.setProperty("--font-size", `${prefs.fontSize}px`);
    root.style.setProperty("--line-height", String(prefs.lineHeight));
    root.style.setProperty("--measure", `${prefs.width}px`);
    localStorage.setItem(storageKey, JSON.stringify(prefs));
  }, [prefs, ready, storageKey]);

  useEffect(() => {
    if (!chapter) return;
    const frame = requestAnimationFrame(() => {
      const target = pendingTarget.current && document.getElementById(pendingTarget.current);
      if (target) target.scrollIntoView({ block: "start" });
      else window.scrollTo({ top: 0 });
      pendingTarget.current = "";
    });
    const pairs = [...document.querySelectorAll<HTMLElement>("article.pair[data-pair-index]")];
    const visible = new Map<HTMLElement, number>();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.isIntersecting ? visible.set(entry.target as HTMLElement, entry.boundingClientRect.top) : visible.delete(entry.target as HTMLElement));
      const active = [...visible.entries()].sort((a, b) => Math.abs(a[1] - 82) - Math.abs(b[1] - 82))[0]?.[0];
      if (!active) return;
      const pair = chapter.pairs[Number(active.dataset.pairIndex || 0)];
      if (!pair) return;
      setLocation(pair);
      setProgress(((pair.pairIndex + 1) / Math.max(1, chapter.pairs.length)) * 100);
      setPrefs((current) => ({ ...current, chapterIndex: chapter.chapterIndex, lastPairId: pair.id }));
      setRecentIds((current) => {
        const next = [pair.id, ...current.filter((id) => id !== pair.id)].slice(0, 10);
        localStorage.setItem(`${storageKey}-recent`, JSON.stringify(next));
        return next;
      });
    }, { rootMargin: "-70px 0px -62% 0px" });
    pairs.forEach((pair) => observer.observe(pair));
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [chapter, storageKey]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const replaceOutdatedInterface = Boolean(navigator.serviceWorker.controller);
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "CACHE_PROGRESS") setOffline({ done: event.data.done, total: event.data.total, complete: false });
      if (event.data?.type === "CACHE_COMPLETE") setOffline({ done: event.data.total, total: event.data.total, complete: true });
    };
    const onControllerChange = () => {
      if (!replaceOutdatedInterface || !navigator.onLine || sessionStorage.getItem("reader-sw-v11-reloaded")) return;
      sessionStorage.setItem("reader-sw-v11-reloaded", "1");
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    navigator.serviceWorker.register("/sw.js?v=11", { updateViaCache: "none" }).then((registration) => registration.update()).catch(() => undefined);
    return () => {
      navigator.serviceWorker.removeEventListener("message", onMessage);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  useEffect(() => {
    if (!manifest || !("serviceWorker" in navigator)) return;
    const warm = () => navigator.serviceWorker.ready.then((registration) => registration.active?.postMessage({ type: "WARM_BOOK", urls: [currentPublication.manifestUrl, ...manifest.offlineUrls] }));
    warm();
    navigator.serviceWorker.addEventListener("controllerchange", warm);
    window.addEventListener("online", warm);
    return () => { navigator.serviceWorker.removeEventListener("controllerchange", warm); window.removeEventListener("online", warm); };
  }, [currentPublication.manifestUrl, manifest]);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const refresh = () => setVoices(window.speechSynthesis.getVoices());
    refresh();
    window.speechSynthesis.addEventListener("voiceschanged", refresh);
    return () => { window.speechSynthesis.removeEventListener("voiceschanged", refresh); window.speechSynthesis.cancel(); };
  }, []);

  const stopSpeech = useCallback(() => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeech(null);
  }, []);

  const playSentence = useCallback((pairId: string, language: VoiceLanguage, sentenceIndex: number) => {
    if (!("speechSynthesis" in window) || !chapter) return;
    const pair = chapter.pairs.find((item) => item.id === pairId);
    if (!pair) return;
    const parts = sentences(language === "en" ? pair.en : pair.zh, language);
    function speakAt(index: number) {
      const safeIndex = Math.min(Math.max(0, index), Math.max(0, parts.length - 1));
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(parts[safeIndex] || "");
      utterance.lang = language === "zh" ? "zh-TW" : "en-US";
      utterance.rate = prefsRef.current.speechRate;
      utterance.voice = voices.find((voice) => voice.localService && voice.lang.toLowerCase().startsWith(language === "zh" ? "zh" : "en")) || voices.find((voice) => voice.lang.toLowerCase().startsWith(language === "zh" ? "zh" : "en")) || null;
      utterance.onstart = () => setSpeech({ pairId, language, sentenceIndex: safeIndex, playing: true });
      utterance.onend = () => {
        if (prefsRef.current.continuousSpeech && safeIndex + 1 < parts.length) speakAt(safeIndex + 1);
        else setSpeech({ pairId, language, sentenceIndex: safeIndex, playing: false });
      };
      utterance.onerror = () => setSpeech({ pairId, language, sentenceIndex: safeIndex, playing: false });
      setSpeech({ pairId, language, sentenceIndex: safeIndex, playing: true });
      window.speechSynthesis.speak(utterance);
    }
    speakAt(sentenceIndex);
  }, [chapter, voices]);

  const togglePair = useCallback((pairId: string) => {
    setOpenPairs((current) => {
      const next = new Set(current);
      if (next.has(pairId)) next.delete(pairId);
      else next.add(pairId);
      return next;
    });
  }, []);

  const handleParagraphTap = (event: MouseEvent<HTMLElement>, pair: Pair) => {
    setSelectedPairId(pair.id);
    if (version === "v9" || version === "v10" || version === "v11") {
      if (event.detail >= 2) {
        if (singleTapTimer.current) window.clearTimeout(singleTapTimer.current);
        singleTapTimer.current = null;
        const sentence = (event.target as HTMLElement).closest<HTMLElement>(".sentence");
        playSentence(pair.id, "en", Number(sentence?.dataset.sentenceIndex || 0));
        return;
      }
      if (singleTapTimer.current) window.clearTimeout(singleTapTimer.current);
      singleTapTimer.current = window.setTimeout(() => {
        togglePair(pair.id);
        singleTapTimer.current = null;
      }, 240);
      return;
    }
    if (version === "v5" || prefs.tapAction === "translation") {
      togglePair(pair.id);
      return;
    }
    if (prefs.tapAction === "copy") {
      copyText(pair.en).then((copied) => {
        setCopyNotice(copied ? "Copied｜已複製" : "Copy unavailable｜無法複製");
        window.setTimeout(() => setCopyNotice(""), 1400);
      });
      return;
    }
    const sentence = (event.target as HTMLElement).closest<HTMLElement>(".sentence");
    playSentence(pair.id, "en", Number(sentence?.dataset.sentenceIndex || 0));
  };

  const openSearch = async () => {
    setSearchOpen((open) => !open);
    if (searchIndex || searchLoading || !manifest) return;
    setSearchLoading(true);
    try {
      const response = await fetch(manifest.searchUrl);
      setSearchIndex(await response.json() as SearchItem[]);
    } finally {
      setSearchLoading(false);
    }
  };

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    if (!searchIndex || query.length < 2) return [];
    return searchIndex.filter((item) => `${item.en}\n${item.zh}`.toLocaleLowerCase().includes(query)).slice(0, 40);
  }, [searchIndex, searchQuery]);

  const toggleBookmark = () => {
    if (!location) return;
    setBookmarks((current) => {
      const next = current.includes(location.id) ? current.filter((id) => id !== location.id) : [location.id, ...current];
      localStorage.setItem(`${storageKey}-bookmarks`, JSON.stringify(next));
      return next;
    });
  };

  const choosePublication = (id: string) => {
    if (id === publicationId) {
      setPanel(null);
      return;
    }
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeech(null);
    setReady(false);
    setManifest(null);
    setChapter(null);
    setSearchIndex(null);
    setSearchQuery("");
    setSearchOpen(false);
    setLocation(null);
    setProgress(0);
    setOpenPairs(new Set());
    setSelectedPairId("");
    setError("");
    setOffline({ done: 0, total: 0, complete: false });
    localStorage.setItem("psychology-money-reader-v8-active-publication", id);
    setPublicationId(id);
    setPanel(null);
  };

  const selectSearchItem = (item: SearchItem) => loadChapter(item.chapterIndex, item.id);
  const themes: Theme[] = ["light", "eye", "dark"];
  const chapterMeta = manifest?.chapters[chapter?.chapterIndex || 0];
  const compactChapter = currentPublication.type === "paper" ? `§ ${(chapter?.chapterIndex || 0) + 1}` : chapterMeta?.enTitle.match(/^(\d+)/)?.[1] ? `Ch ${chapterMeta.enTitle.match(/^(\d+)/)?.[1]}` : chapterMeta?.enTitle.startsWith("Introduction") ? "Intro" : chapterMeta?.enTitle === "Dedication" ? "Dedication" : "Front";
  const locationLabel = location && manifest ? `${compactChapter} · ¶ ${location.pairIndex + 1}/${chapter?.pairs.length || 1} · PDF ${location.pdfPage}/${manifest.pdfTotalPages}` : manifest ? `Opening · PDF 1/${manifest.pdfTotalPages}` : "Opening reader…";
  const offlineLabel = offline.complete ? "✓ Available offline｜已可離線閱讀" : offline.total ? `Offline publication ${offline.done}/${offline.total}｜離線下載 ${offline.done}/${offline.total}` : "Preparing background download…｜準備背景下載…";

  if (!manifest || !chapter || !ready) {
    return <main className="reader v5Shell"><header className="bookCover"><p className="eyebrow">Bilingual reading edition · {version}</p><h1>{currentPublication.title}</h1><p className="zhCover">{currentPublication.zhTitle}</p><p className="author">{currentPublication.author}｜{currentPublication.zhAuthor}</p><p className="loadingStatus">Opening quickly; this publication will download in the background.<br />快速開啟中；這份刊物將於背景下載。</p>{error && <p className="loadError">{error}</p>}</header></main>;
  }

  return (
    <>
      <header className="topbar">
        <button className="iconButton" onClick={() => setPanel("toc")} aria-label={libraryVersion ? "開啟刊物與章節目錄" : "開啟章節目錄"}>{libraryVersion ? "▦" : "☰"}</button>
        <button className="locationButton" onClick={() => setPanel("nav")} aria-label="開啟閱讀位置與書籍導覽"><span className="locationTitle">{chapter.enTitle}</span><small>{locationLabel}</small></button>
        <button className={`iconButton ${prefs.showAll ? "active" : ""}`} onClick={() => setPrefs((current) => ({ ...current, showAll: !current.showAll }))} aria-label={prefs.showAll ? "隱藏所有中文" : "顯示所有中文"}>文</button>
        <button className="iconButton textButton" onClick={() => setPanel("settings")} aria-label="開啟閱讀設定">Aa</button>
        <button className="iconButton" onClick={() => setPrefs((current) => ({ ...current, theme: themes[(themes.indexOf(current.theme) + 1) % themes.length] }))} aria-label="切換閱讀模式">◐</button>
      </header>
      <div className="progressTrack"><div className="progressBar" style={{ width: `${progress}%` }} /></div>
      <div className={`scrim ${panel ? "show" : ""}`} onClick={() => setPanel(null)} />

      <aside className={`panel tocPanel ${panel === "toc" ? "show" : ""}`} aria-hidden={panel !== "toc"}>
        <div className="panelHead"><div><h2>{libraryVersion ? "Library & contents｜書庫與目錄" : "Contents｜目錄"}</h2><p className={offline.complete ? "offlineReady" : "offlineWaiting"}>{offlineLabel}</p></div><button className="closeButton" onClick={() => setPanel(null)}>✕</button></div>
        {libraryVersion && <section className="publicationSection" aria-label="刊物選擇"><h3>Publications｜刊物</h3><div className="publicationList">{publications.map((item) => <button className={`publicationCard ${item.id === publicationId ? "selected" : ""}`} key={item.id} onClick={() => choosePublication(item.id)}><span className="publicationType">{item.type === "book" ? "BOOK｜書籍" : "PAPER｜論文"}</span><strong>{item.title}</strong><em>{item.zhTitle}</em><small>{item.author} · {item.year} · PDF {item.pdfTotalPages} pages</small>{item.id === publicationId && <b>Current｜目前閱讀</b>}</button>)}</div></section>}
        {libraryVersion && <h3 className="contentsHeading">Current contents｜目前刊物目錄</h3>}
        <nav>{manifest.chapters.map((meta) => <button className="chapterLink" key={meta.id} onClick={() => loadChapter(meta.chapterIndex)}><span>{meta.enTitle}</span><small>{meta.zhTitle}<b>{meta.chapterIndex === chapter.chapterIndex ? `${Math.round(progress)}%` : ""}</b></small></button>)}</nav>
      </aside>

      <aside className={`panel readerNavPanel ${panel === "nav" ? "show" : ""}`} aria-hidden={panel !== "nav"}>
        <div className="panelHead"><div><h2>Book navigation｜書籍導覽</h2><p className="locationSummary">{chapter.enTitle} · PDF 頁 {location?.pdfPage || "–"}/{manifest.pdfTotalPages}</p></div><button className="closeButton" onClick={() => setPanel(null)}>✕</button></div>
        <div className="navActions">
          <button onClick={() => loadChapter(chapter.chapterIndex - 1)} disabled={chapter.chapterIndex === 0}>← Previous<br /><small>上一章</small></button>
          <button className={location && bookmarks.includes(location.id) ? "selected" : ""} onClick={toggleBookmark} disabled={!location}>{location && bookmarks.includes(location.id) ? "★ Saved" : "☆ Bookmark"}<br /><small>{location && bookmarks.includes(location.id) ? "已加入書籤" : "加入書籤"}</small></button>
          <button onClick={() => loadChapter(chapter.chapterIndex + 1)} disabled={chapter.chapterIndex >= manifest.chapters.length - 1}>Next →<br /><small>下一章</small></button>
        </div>
        <button className="continueButton" onClick={() => prefs.lastPairId && loadChapter(prefs.chapterIndex, prefs.lastPairId)}>↩ Continue from last position｜回到上次位置</button>
        <button className={`searchToggle ${searchOpen ? "selected" : ""}`} onClick={openSearch}>⌕ Search English or Chinese｜搜尋中英文</button>
        {searchOpen && <div className="searchDrawer"><label className="searchBox"><span>Search｜搜尋</span><input autoFocus type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Money, saving, 財富、儲蓄…" /></label>{searchLoading ? <p className="emptyState">Loading full-book search…｜載入全文搜尋…</p> : searchQuery.trim().length >= 2 ? <NavigationList title={`${searchResults.length} results｜搜尋結果`} items={searchResults} chapters={manifest.chapters} onSelect={selectSearchItem} empty="No matching text｜找不到相符內容" /> : null}</div>}
        <NavigationList title={`Bookmarks (${bookmarks.length})｜書籤`} items={(searchIndex || []).filter((item) => bookmarks.includes(item.id))} chapters={manifest.chapters} onSelect={selectSearchItem} empty="Open search once to load saved passages｜開啟搜尋後即可載入書籤段落" />
        <NavigationList title="Recently read｜最近閱讀" items={(searchIndex || []).filter((item) => recentIds.includes(item.id)).sort((a, b) => recentIds.indexOf(a.id) - recentIds.indexOf(b.id))} chapters={manifest.chapters} onSelect={selectSearchItem} empty="Reading history stays on this device｜閱讀紀錄保存在此裝置" />
      </aside>

      <aside className={`panel settingsPanel ${panel === "settings" ? "show" : ""}`} aria-hidden={panel !== "settings"}>
        <div className="panelHead"><h2>Reading settings｜閱讀設定</h2><button className="closeButton" onClick={() => setPanel(null)}>✕</button></div>
        <TextSizeSetting value={prefs.fontSize} onChange={(fontSize) => setPrefs((current) => ({ ...current, fontSize }))} />
        <SettingSlider label="Line spacing｜行距" value={prefs.lineHeight.toFixed(2)} min={1.5} max={2.1} step={.04} number={prefs.lineHeight} onChange={(lineHeight) => setPrefs((current) => ({ ...current, lineHeight }))} />
        <SegmentSetting label="Typeface｜字體" value={prefs.font} choices={[{ value: "serif", label: "Serif｜襯線" }, { value: "sans", label: "Sans｜無襯線" }]} onChange={(font) => setPrefs((current) => ({ ...current, font: font as Preferences["font"] }))} />
        <SegmentSetting label="Page width｜頁面寬度" value={String(prefs.width)} choices={[{ value: "620", label: "窄" }, { value: "720", label: "標準" }, { value: "840", label: "寬" }]} onChange={(width) => setPrefs((current) => ({ ...current, width: Number(width) }))} />
        <SegmentSetting label="Theme｜閱讀模式" value={prefs.theme} choices={[{ value: "light", label: "日間" }, { value: "eye", label: "護眼" }, { value: "dark", label: "夜間" }]} onChange={(theme) => setPrefs((current) => ({ ...current, theme: theme as Theme }))} />
        <SettingSlider label="Voice speed｜語音速度" value={`${prefs.speechRate.toFixed(2)}×`} min={.75} max={1.5} step={.05} number={prefs.speechRate} onChange={(speechRate) => setPrefs((current) => ({ ...current, speechRate }))} />
        {version === "v9" || version === "v10" || version === "v11" ? <p className="voiceNote">Single tap: Chinese translation · Double tap: English voice<br />單點：中文翻譯 · 雙點：英文朗讀</p> : version !== "v5" && <SegmentSetting label="Tap paragraph｜點按段落" value={prefs.tapAction} choices={[{ value: "voice", label: "🔊 朗讀" }, { value: "translation", label: "中 翻譯" }, { value: "copy", label: "複製" }]} onChange={(tapAction) => setPrefs((current) => ({ ...current, tapAction: tapAction as TapAction }))} />}
        {(version === "v10" || version === "v11") && <div className="setting"><div className="settingRow"><label>Reading version｜閱讀版本</label><span>{version}</span></div><div className="versionLinks"><Link className={version === "v11" ? "selected" : ""} href="/">Latest v11｜最新版</Link><Link className={version === "v10" ? "selected" : ""} href="/v10">Previous v10｜前一版</Link></div></div>}
        <p className="voiceNote">Device voice; no API key. Offline speech requires an installed system voice.<br />使用裝置語音，不需 API Key；離線朗讀需手機已安裝對應語音。</p>
      </aside>

      <main className={`reader v5Reader ${version === "v6" ? "v6Reader" : ""} ${version === "v7" || version === "v8" || version === "v9" || version === "v10" || version === "v11" ? "v7Reader" : ""} ${version === "v9" || version === "v10" || version === "v11" ? "v9Reader" : ""} ${prefs.showAll ? "showAll" : ""}`} aria-label="Bilingual publication reader">
        {chapter.chapterIndex === 0 && <header className="bookCover"><p className="eyebrow">Bilingual reading edition · {version}</p><h1>{manifest.title}</h1><p className="zhCover">{manifest.zhTitle}</p><p className="author">{manifest.author}｜{manifest.zhAuthor}</p></header>}
        <section className="chapter" id={chapter.id}>
          <header className={`chapterTitle pair ${openPairs.has(`${chapter.id}-title`) || prefs.showAll ? "open" : ""}`}><button className="translateButton" onClick={() => setOpenPairs((current) => new Set(current).add(`${chapter.id}-title`))}>中</button><div className="english"><h2>{chapter.enTitle}</h2></div><div className="translation"><h3>{chapter.zhTitle}</h3></div></header>
          {chapter.pairs.map((pair) => {
            const open = prefs.showAll || openPairs.has(pair.id);
            const activeEn = speech?.pairId === pair.id && speech.language === "en" ? speech.sentenceIndex : undefined;
            const activeZh = speech?.pairId === pair.id && speech.language === "zh" ? speech.sentenceIndex : undefined;
            const selected = selectedPairId === pair.id;
            const speakButton = <button className="speakButton" onClick={(event) => { event.stopPropagation(); setSelectedPairId(pair.id); playSentence(pair.id, "en", 0); }} aria-label="Read English sentence｜朗讀英文">{version === "v5" ? "▶" : "🔊"}</button>;
            const translateButton = <button className="translateButton" onClick={(event) => { event.stopPropagation(); setSelectedPairId(pair.id); togglePair(pair.id); }} aria-label="顯示或隱藏中文翻譯">中</button>;
            const figures = (version === "v10" || version === "v11") && currentPublication.id === "positive-psychology-progress" ? figuresForPair(pair.id) : [];
            return <article className={`pair ${open ? "open" : ""} ${selected ? "controlsVisible" : ""}`} id={pair.id} data-pair-index={pair.pairIndex} data-pdf-page={pair.pdfPage} key={pair.id} tabIndex={0} onFocus={() => setSelectedPairId(pair.id)}>
              {figures.map((figure) => <figure className="sourceFigure" key={figure.src}><Image src={figure.src} alt={figure.alt} width={figure.width} height={figure.height} sizes="(max-width: 760px) 100vw, 720px" loading="lazy" unoptimized /><figcaption>{figure.caption}</figcaption></figure>)}
              {version === "v7" || version === "v8" || version === "v9" || version === "v10" || version === "v11" ? <div className="paragraphControls" aria-hidden={!selected}>{speakButton}{translateButton}</div> : <>{speakButton}{translateButton}</>}
              <div className="english" onClick={(event) => handleParagraphTap(event, pair)}><ReadingBlock text={pair.en} language="en" activeIndex={activeEn} onSpeak={(index) => playSentence(pair.id, "en", index)} interactive={version === "v5"} /></div>
              <div className="translation"><button className="translationSpeakButton" onClick={(event) => { event.stopPropagation(); playSentence(pair.id, "zh", 0); }} aria-label="朗讀中文">🔊 中文</button><ReadingBlock text={pair.zh} language="zh" activeIndex={activeZh} onSpeak={(index) => playSentence(pair.id, "zh", index)} interactive={version === "v5"} /></div>
            </article>;
          })}
        </section>
        <div className="chapterPager"><button onClick={() => loadChapter(chapter.chapterIndex - 1)} disabled={chapter.chapterIndex === 0}>← 上一章</button><button onClick={() => loadChapter(chapter.chapterIndex + 1)} disabled={chapter.chapterIndex >= manifest.chapters.length - 1}>下一章 →</button></div>
        {error && <p className="loadError">{error}</p>}
      </main>

      {speech && <div className="speechPlayer" aria-live="polite"><button onClick={() => playSentence(speech.pairId, speech.language, speech.sentenceIndex - 1)} aria-label="上一句">‹</button><button onClick={stopSpeech} aria-label="停止朗讀">■</button><button onClick={() => playSentence(speech.pairId, speech.language, speech.sentenceIndex + 1)} aria-label="下一句">›</button><button className="speechLanguage" onClick={() => playSentence(speech.pairId, speech.language === "en" ? "zh" : "en", speech.sentenceIndex)}>{speech.language === "en" ? "EN" : "中文"}</button><label><input type="checkbox" checked={prefs.continuousSpeech} onChange={(event) => setPrefs((current) => ({ ...current, continuousSpeech: event.target.checked }))} /> Auto｜連續</label><small>Sentence {speech.sentenceIndex + 1}｜第 {speech.sentenceIndex + 1} 句</small></div>}
      {copyNotice && <div className="copyToast" role="status">{copyNotice}</div>}
    </>
  );
}

function figuresForPair(pairId: string) {
  const base = "/book/positive-psychology-progress/figures";
  if (pairId === "ppp-chapter-10-pair-0") return [{ src: `${base}/table-1.png`, width: 1023, height: 1196, alt: "Original Table 1: Classification of Character Strengths", caption: "Original PDF · Table 1 · PDF page 16｜原始 PDF・表 1・第 16 頁" }];
  if (pairId === "ppp-chapter-6-pair-3") return [
    { src: `${base}/figure-1.png`, width: 1424, height: 1092, alt: "Original Figure 1 showing Steen Happiness Index scores", caption: "Original PDF · Figure 1: Happiness scores · PDF page 18｜原始 PDF・圖 1：幸福感分數・第 18 頁" },
    { src: `${base}/figure-2.png`, width: 1424, height: 1064, alt: "Original Figure 2 showing CES-D depressive symptom scores", caption: "Original PDF · Figure 2: Depressive symptoms · PDF page 19｜原始 PDF・圖 2：憂鬱症狀・第 19 頁" },
  ];
  if (pairId === "ppp-chapter-11-pair-0") return [{ src: `${base}/figure-1.png`, width: 1424, height: 1092, alt: "Original Figure 1 showing Steen Happiness Index scores", caption: "Original PDF · Figure 1 · PDF page 18｜原始 PDF・圖 1・第 18 頁" }];
  if (pairId === "ppp-chapter-11-pair-2") return [{ src: `${base}/figure-2.png`, width: 1424, height: 1064, alt: "Original Figure 2 showing CES-D depressive symptom scores", caption: "Original PDF · Figure 2 · PDF page 19｜原始 PDF・圖 2・第 19 頁" }];
  return [];
}

async function copyText(text: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the selection-based copy path for restricted browsers.
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  return copied;
}

function SettingSlider({ label, value, number, min, max, step, onChange }: { label: string; value: string; number: number; min: number; max: number; step: number; onChange: (value: number) => void }) {
  return <div className="setting"><div className="settingRow"><label>{label}</label><span>{value}</span></div><input aria-label={label} type="range" min={min} max={max} step={step} value={number} onChange={(event) => onChange(Number(event.target.value))} /></div>;
}

function TextSizeSetting({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const update = (next: number) => onChange(Math.min(32, Math.max(16, next)));
  return <div className="setting textSizeSetting"><div className="settingRow"><label>Text size｜字體大小</label><strong>{value} px</strong></div><div className="textSizeControls"><button onClick={() => update(value - 1)} disabled={value <= 16} aria-label="縮小字體">A−</button><input aria-label="Text size｜字體大小" type="range" min={16} max={32} step={1} value={value} onChange={(event) => update(Number(event.target.value))} /><button onClick={() => update(value + 1)} disabled={value >= 32} aria-label="放大字體">A+</button></div></div>;
}

function SegmentSetting({ label, value, choices, onChange }: { label: string; value: string; choices: { value: string; label: string }[]; onChange: (value: string) => void }) {
  return <div className="setting"><div className="settingRow"><label>{label}</label></div><div className="segments">{choices.map((choice) => <button key={choice.value} className={value === choice.value ? "selected" : ""} onClick={() => onChange(choice.value)}>{choice.label}</button>)}</div></div>;
}

function NavigationList({ title, items, chapters, onSelect, empty }: { title: string; items: SearchItem[]; chapters: ChapterMeta[]; onSelect: (item: SearchItem) => void; empty: string }) {
  return <section className="navigationSection"><h3>{title}</h3>{items.length === 0 ? <p className="emptyState">{empty}</p> : <div className="navigationResults">{items.map((item) => <button key={item.id} onClick={() => onSelect(item)}><small>{chapters[item.chapterIndex]?.enTitle} · ¶ {item.pairIndex + 1} · PDF {item.pdfPage}</small><span>{item.en}</span><em>{item.zh}</em></button>)}</div>}</section>;
}
