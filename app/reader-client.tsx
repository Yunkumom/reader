"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type Chapter = { id: string; enTitle: string; zhTitle: string; pairCount: number; chapterIndex: number; globalStart: number };
type Theme = "light" | "eye" | "dark";
type FontFamily = "serif" | "sans";
type Location = { pairId: string; chapterIndex: number; pairIndex: number; pairTotal: number; globalIndex: number; globalTotal: number; pdfPage?: number };
type SearchItem = { id: string; en: string; zh: string; chapterIndex: number; pairIndex: number };
type Preferences = {
  theme: Theme;
  fontSize: number;
  lineHeight: number;
  font: FontFamily;
  width: number;
  showAll: boolean;
  scroll: number;
  lastPairId: string;
};

const defaults: Preferences = {
  theme: "eye",
  fontSize: 21,
  lineHeight: 1.82,
  font: "serif",
  width: 720,
  showAll: false,
  scroll: 0,
  lastPairId: "",
};

export default function ReaderClient({ chapters, version, pdfTotalPages }: { chapters: Chapter[]; version: "v1" | "v2" | "v3" | "v4"; pdfTotalPages?: number }) {
  const storageKey = `psychology-money-reader-${version}`;
  const [prefs, setPrefs] = useState<Preferences>(defaults);
  const [ready, setReady] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [currentTitle, setCurrentTitle] = useState("The Psychology of Money");
  const [location, setLocation] = useState<Location | null>(null);
  const [progress, setProgress] = useState(0);
  const [page, setPage] = useState({ current: 1, total: 1 });
  const [offlineReady, setOfflineReady] = useState(false);
  const [searchIndex, setSearchIndex] = useState<SearchItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [chapterProgress, setChapterProgress] = useState<Record<string, number>>({});
  const saveTimer = useRef<number | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey) || "{}") as Partial<Preferences>;
        setPrefs({ ...defaults, ...saved });
        setBookmarks(JSON.parse(localStorage.getItem(`${storageKey}-bookmarks`) || "[]"));
        setRecentIds(JSON.parse(localStorage.getItem(`${storageKey}-recent`) || "[]"));
        setChapterProgress(JSON.parse(localStorage.getItem(`${storageKey}-chapter-progress`) || "{}"));
      } catch {
        setPrefs(defaults);
      }
      setReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [storageKey]);

  useEffect(() => {
    if (!ready) return;
    const root = document.documentElement;
    root.dataset.theme = prefs.theme;
    root.dataset.font = prefs.font;
    root.style.setProperty("--font-size", `${prefs.fontSize}px`);
    root.style.setProperty("--line-height", String(prefs.lineHeight));
    root.style.setProperty("--measure", `${prefs.width}px`);
    root.classList.toggle("showAll", prefs.showAll);
    try {
      localStorage.setItem(storageKey, JSON.stringify(prefs));
    } catch {}
  }, [prefs, ready, storageKey]);

  useEffect(() => {
    if (!ready || (!prefs.lastPairId && prefs.scroll < 100)) return;
    const timer = window.setTimeout(() => {
      const savedPair = prefs.lastPairId ? document.getElementById(prefs.lastPairId) : null;
      if (savedPair) savedPair.scrollIntoView({ block: "start", behavior: "auto" });
      else window.scrollTo({ top: prefs.scroll, behavior: "auto" });
    }, 120);
    return () => window.clearTimeout(timer);
    // Restore only once after preferences load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js?v=11", { scope: "/", updateViaCache: "none" })
      .then((registration) => registration.update())
      .then(() => navigator.serviceWorker.ready)
      .then(() => {
        setOfflineReady(true);
        return fetch("/", { cache: "reload" }).catch(() => undefined);
      })
      .catch(() => setOfflineReady(false));
  }, []);

  useEffect(() => {
    const pairs = [...document.querySelectorAll<HTMLElement>("article.pair[data-pair-index]")];
    const frame = window.requestAnimationFrame(() => {
      setSearchIndex(pairs.map((pair) => ({
        id: pair.id,
        en: pair.querySelector<HTMLElement>(".enText")?.textContent || "",
        zh: pair.querySelector<HTMLElement>(".zhText")?.textContent || "",
        chapterIndex: Number(pair.dataset.chapterIndex || 0),
        pairIndex: Number(pair.dataset.pairIndex || 0),
      })));
    });

    const visible = new Map<HTMLElement, number>();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const element = entry.target as HTMLElement;
        if (entry.isIntersecting) visible.set(element, entry.boundingClientRect.top);
        else visible.delete(element);
      });
      const active = [...visible.entries()].sort((a, b) => Math.abs(a[1] - 82) - Math.abs(b[1] - 82))[0]?.[0];
      if (!active) return;
      const chapterIndex = Number(active.dataset.chapterIndex || 0);
      const nextLocation = {
        pairId: active.id,
        chapterIndex,
        pairIndex: Number(active.dataset.pairIndex || 0),
        pairTotal: Number(active.dataset.pairTotal || 1),
        globalIndex: Number(active.dataset.globalIndex || 0),
        globalTotal: Number(active.dataset.globalTotal || 1),
        pdfPage: Number(active.dataset.pdfPage || 0) || undefined,
      };
      setLocation(nextLocation);
      setCurrentTitle(chapters[chapterIndex]?.enTitle || "The Psychology of Money");
      if (ready) {
        const chapterId = chapters[chapterIndex]?.id;
        const percent = Math.round(((nextLocation.pairIndex + 1) / Math.max(1, nextLocation.pairTotal)) * 100);
        setPrefs((current) => current.lastPairId === nextLocation.pairId ? current : { ...current, lastPairId: nextLocation.pairId });
        setRecentIds((current) => {
          const next = [nextLocation.pairId, ...current.filter((id) => id !== nextLocation.pairId)].slice(0, 10);
          localStorage.setItem(`${storageKey}-recent`, JSON.stringify(next));
          return next;
        });
        if (chapterId) {
          setChapterProgress((current) => {
            if ((current[chapterId] || 0) >= percent) return current;
            const next = { ...current, [chapterId]: percent };
            localStorage.setItem(`${storageKey}-chapter-progress`, JSON.stringify(next));
            return next;
          });
        }
      }
    }, { rootMargin: "-70px 0px -62% 0px" });
    pairs.forEach((pair) => observer.observe(pair));
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [chapters, ready, storageKey]);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? (window.scrollY / max) * 100 : 0);
      const viewport = Math.max(1, window.innerHeight - 62);
      setPage({
        current: Math.min(Math.ceil(document.documentElement.scrollHeight / viewport), Math.floor(window.scrollY / viewport) + 1),
        total: Math.max(1, Math.ceil(document.documentElement.scrollHeight / viewport)),
      });
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => {
        setPrefs((current) => ({ ...current, scroll: window.scrollY }));
      }, 500);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closePanels = useCallback(() => {
    setTocOpen(false);
    setSettingsOpen(false);
    setNavigationOpen(false);
  }, []);

  const openOnly = (panel: "toc" | "settings" | "navigation") => {
    setTocOpen(panel === "toc");
    setSettingsOpen(panel === "settings");
    setNavigationOpen(panel === "navigation");
  };

  const scrollToPair = (id: string) => {
    closePanels();
    window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ block: "start", behavior: "smooth" }), 80);
  };

  const goToChapter = (chapterIndex: number) => {
    const chapter = chapters[chapterIndex];
    if (!chapter) return;
    closePanels();
    window.setTimeout(() => document.getElementById(chapter.id)?.scrollIntoView({ block: "start", behavior: "smooth" }), 80);
  };

  const toggleBookmark = () => {
    if (!location) return;
    setBookmarks((current) => {
      const next = current.includes(location.pairId)
        ? current.filter((id) => id !== location.pairId)
        : [location.pairId, ...current];
      localStorage.setItem(`${storageKey}-bookmarks`, JSON.stringify(next));
      return next;
    });
  };

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    if (query.length < 2) return [];
    return searchIndex.filter((item) => `${item.en}\n${item.zh}`.toLocaleLowerCase().includes(query)).slice(0, 40);
  }, [searchIndex, searchQuery]);

  const itemById = useMemo(() => new Map(searchIndex.map((item) => [item.id, item])), [searchIndex]);
  const currentItem = location ? itemById.get(location.pairId) : undefined;

  const togglePair = (pair: HTMLElement) => {
    const open = !pair.classList.contains("open");
    pair.classList.toggle("open", open);
    pair.querySelector(":scope > .translateButton")?.setAttribute("aria-pressed", String(open));
    pair.querySelector(":scope > .translation")?.setAttribute("aria-hidden", String(!open));
  };

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".translateButton, .english")) return;
      if (window.getSelection()?.toString()) return;
      const pair = target.closest<HTMLElement>(".pair");
      if (pair) togglePair(pair);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const pair = (event.target as HTMLElement).closest<HTMLElement>(".pair");
      if (!pair) return;
      event.preventDefault();
      togglePair(pair);
    };
    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  const setTheme = (theme: Theme) => setPrefs((current) => ({ ...current, theme }));
  const themes: Theme[] = ["light", "eye", "dark"];
  const toggleAllTranslations = () => {
    const next = !prefs.showAll;
    if (!next) {
      document.querySelectorAll<HTMLElement>(".pair.open").forEach((pair) => {
        pair.classList.remove("open");
        pair.querySelector(":scope > .translateButton")?.setAttribute("aria-pressed", "false");
        pair.querySelector(":scope > .translation")?.setAttribute("aria-hidden", "true");
      });
    }
    setPrefs((current) => ({ ...current, showAll: next }));
  };
  const numberedChapter = currentTitle.match(/^(\d+)/)?.[1];
  const compactChapter = numberedChapter
    ? `Ch ${numberedChapter}`
    : currentTitle.startsWith("Introduction") ? "Intro" : currentTitle === "Dedication" ? "Dedication" : "Front";
  const locationLabel = version === "v4"
    ? location
      ? `${compactChapter} · ¶ ${location.pairIndex + 1}/${location.pairTotal} · PDF ${location.pdfPage ?? "–"}/${pdfTotalPages ?? "–"}`
      : `Cover · PDF 1/${pdfTotalPages ?? "–"}`
    : location
      ? `${compactChapter} · ¶ ${location.pairIndex + 1}/${location.pairTotal} · p. ${page.current}/${page.total}`
      : `Cover · p. ${page.current}/${page.total}`;

  return (
    <>
      <header className="topbar">
        <button className="iconButton" onClick={() => openOnly("toc")} aria-label="開啟章節目錄">☰</button>
        <button className="locationButton" onClick={() => openOnly("navigation")} aria-label="開啟閱讀位置與書籍導覽">
          <span className="locationTitle">{currentTitle}</span>
          <small>{locationLabel}</small>
        </button>
        <button
          className={`iconButton ${prefs.showAll ? "active" : ""}`}
          onClick={toggleAllTranslations}
          aria-label={prefs.showAll ? "隱藏所有中文" : "顯示所有中文"}
        >
          文
        </button>
        <button className="iconButton textButton" onClick={() => openOnly("settings")} aria-label="開啟閱讀設定">Aa</button>
        <button
          className="iconButton"
          onClick={() => setTheme(themes[(themes.indexOf(prefs.theme) + 1) % themes.length])}
          aria-label="切換閱讀模式"
        >
          ◐
        </button>
      </header>
      <div className="progressTrack"><div className="progressBar" style={{ width: `${progress}%` }} /></div>

      <div className={`scrim ${tocOpen || settingsOpen || navigationOpen ? "show" : ""}`} onClick={closePanels} />
      <aside className={`panel tocPanel ${tocOpen ? "show" : ""}`} aria-hidden={!tocOpen}>
        <div className="panelHead"><div><h2>Contents｜目錄</h2><p className={offlineReady ? "offlineReady" : "offlineWaiting"}>{offlineReady ? "✓ Ready offline｜離線已就緒" : "Preparing offline copy…｜準備離線內容…"}</p></div><button className="closeButton" onClick={closePanels}>✕</button></div>
        <nav>
          {chapters.map((chapter) => (
            <button
              className="chapterLink"
              key={chapter.id}
              onClick={() => {
                closePanels();
                window.setTimeout(() => document.getElementById(chapter.id)?.scrollIntoView({ block: "start" }), 80);
              }}
            >
              <span>{chapter.enTitle}</span>
              <small>{chapter.zhTitle}<b>{chapterProgress[chapter.id] || 0}%</b></small>
            </button>
          ))}
        </nav>
      </aside>

      <aside className={`panel readerNavPanel ${navigationOpen ? "show" : ""}`} aria-hidden={!navigationOpen}>
        <div className="panelHead">
          <div><h2>Book navigation｜書籍導覽</h2><p className="locationSummary">{location ? version === "v4" ? `${currentTitle} · 段落 ${location.pairIndex + 1}/${location.pairTotal} · PDF 頁 ${location.pdfPage ?? "–"}/${pdfTotalPages ?? "–"}` : `${currentTitle} · 段落 ${location.pairIndex + 1}/${location.pairTotal} · 頁 ${page.current}/${page.total}` : version === "v4" ? `Book cover｜書籍封面 · PDF 頁 1/${pdfTotalPages ?? "–"}` : "Book cover｜書籍封面"}</p></div>
          <button className="closeButton" onClick={closePanels} aria-label="關閉書籍導覽">✕</button>
        </div>

        {currentItem && (
          <div className="currentPassage">
            <strong>Current paragraph｜目前段落</strong>
            <p>{currentItem.en}</p>
            <p lang="zh-Hant">{currentItem.zh}</p>
          </div>
        )}

        <div className="navActions">
          <button onClick={() => goToChapter((location?.chapterIndex || 0) - 1)} disabled={!location || location.chapterIndex === 0}>← Previous<br /><small>上一章</small></button>
          <button className={location && bookmarks.includes(location.pairId) ? "selected" : ""} onClick={toggleBookmark} disabled={!location}>{location && bookmarks.includes(location.pairId) ? "★ Saved" : "☆ Bookmark"}<br /><small>{location && bookmarks.includes(location.pairId) ? "已加入書籤" : "加入書籤"}</small></button>
          <button onClick={() => goToChapter((location?.chapterIndex ?? -1) + 1)} disabled={Boolean(location && location.chapterIndex >= chapters.length - 1)}>Next →<br /><small>下一章</small></button>
        </div>

        <button className="continueButton" onClick={() => prefs.lastPairId && scrollToPair(prefs.lastPairId)} disabled={!prefs.lastPairId}>↩ Continue from last position｜回到上次位置</button>

        <label className="searchBox">
          <span>Search English or Chinese｜搜尋中英文</span>
          <input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Money, saving, 財富、儲蓄…" />
        </label>
        {searchQuery.trim().length >= 2 && (
          <NavigationList title={`${searchResults.length} results｜搜尋結果`} items={searchResults} chapters={chapters} onSelect={scrollToPair} empty="No matching text｜找不到相符內容" />
        )}

        <NavigationList title={`Bookmarks (${bookmarks.length})｜書籤`} items={bookmarks.map((id) => itemById.get(id)).filter((item): item is SearchItem => Boolean(item))} chapters={chapters} onSelect={scrollToPair} empty="No bookmarks yet｜尚未加入書籤" />
        <NavigationList title="Recently read｜最近閱讀" items={recentIds.map((id) => itemById.get(id)).filter((item): item is SearchItem => Boolean(item))} chapters={chapters} onSelect={scrollToPair} empty="Reading history will appear here｜閱讀紀錄會顯示在這裡" />
      </aside>

      <aside className={`panel settingsPanel ${settingsOpen ? "show" : ""}`} aria-hidden={!settingsOpen}>
        <div className="panelHead"><h2>Reading settings｜閱讀設定</h2><button className="closeButton" onClick={closePanels}>✕</button></div>
        <SettingSlider label="Text size｜字體大小" value={`${prefs.fontSize} px`} min={16} max={32} step={1} number={prefs.fontSize} onChange={(fontSize) => setPrefs((current) => ({ ...current, fontSize }))} />
        <SettingSlider label="Line spacing｜行距" value={prefs.lineHeight.toFixed(2)} min={1.5} max={2.1} step={0.04} number={prefs.lineHeight} onChange={(lineHeight) => setPrefs((current) => ({ ...current, lineHeight }))} />
        <SegmentSetting label="Typeface｜字體" value={prefs.font} choices={[{ value: "serif", label: "Serif｜襯線" }, { value: "sans", label: "Sans｜無襯線" }]} onChange={(font) => setPrefs((current) => ({ ...current, font: font as FontFamily }))} />
        <SegmentSetting label="Page width｜頁面寬度" value={String(prefs.width)} choices={[{ value: "620", label: "窄" }, { value: "720", label: "標準" }, { value: "840", label: "寬" }]} onChange={(width) => setPrefs((current) => ({ ...current, width: Number(width) }))} />
        <SegmentSetting label="Theme｜閱讀模式" value={prefs.theme} choices={[{ value: "light", label: "日間" }, { value: "eye", label: "護眼" }, { value: "dark", label: "夜間" }]} onChange={(theme) => setTheme(theme as Theme)} />
        <div className="setting">
          <div className="settingRow"><label>Reading version｜閱讀版本</label><span>{version}</span></div>
          <div className="versionLinks">
            <Link href="/">Latest v11｜最新版</Link>
            <Link href="/v10">Previous v10｜前一版</Link>
          </div>
        </div>
      </aside>

    </>
  );
}

function SettingSlider({ label, value, number, min, max, step, onChange }: { label: string; value: string; number: number; min: number; max: number; step: number; onChange: (value: number) => void }) {
  return <div className="setting"><div className="settingRow"><label>{label}</label><span>{value}</span></div><input aria-label={label} type="range" min={min} max={max} step={step} value={number} onChange={(event) => onChange(Number(event.target.value))} /></div>;
}

function SegmentSetting({ label, value, choices, onChange }: { label: string; value: string; choices: { value: string; label: string }[]; onChange: (value: string) => void }) {
  return <div className="setting"><div className="settingRow"><label>{label}</label></div><div className="segments">{choices.map((choice) => <button key={choice.value} className={value === choice.value ? "selected" : ""} onClick={() => onChange(choice.value)}>{choice.label}</button>)}</div></div>;
}

function NavigationList({ title, items, chapters, onSelect, empty }: { title: string; items: SearchItem[]; chapters: Chapter[]; onSelect: (id: string) => void; empty: string }) {
  return (
    <section className="navigationSection">
      <h3>{title}</h3>
      {items.length === 0 ? <p className="emptyState">{empty}</p> : (
        <div className="navigationResults">
          {items.map((item) => (
            <button key={item.id} onClick={() => onSelect(item.id)}>
              <small>{chapters[item.chapterIndex]?.enTitle} · ¶ {item.pairIndex + 1}</small>
              <span>{item.en || item.zh}</span>
              {item.zh && <em>{item.zh}</em>}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
