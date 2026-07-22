# Psychology Money & Positive Psychology Reader v11
## 金錢心理學與正向心理學研究 雙語閱讀器

[![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-Online-success?style=flat-square&logo=github)](https://yunkumom.github.io/reader/)
[![PWA Ready](https://img.shields.io/badge/PWA-Offline_Capable-blue?style=flat-square)](https://yunkumom.github.io/reader/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](./LICENSE)

A mobile-first, offline-capable bilingual reader for *The Psychology of Money* by Morgan Housel and *Positive Psychology Progress: Empirical Validation of Interventions* by Seligman et al.

---

## 🌐 Live Access / 線上閱讀網址

- **Live Reader Web App**: [**https://yunkumom.github.io/reader/**](https://yunkumom.github.io/reader/)
- **GitHub Repository**: [**https://github.com/Yunkumom/reader**](https://github.com/Yunkumom/reader)

---

## 📁 Repository Organization & Folder Usage Guide / 資料夾架構與使用說明

This repository is organized into a clean, intuitive, and modular structure:

```text
Psychology-Money-Reader-v11-source/
├── README.md                           # Main user & developer guide (This file)
├── AGENTS.md                           # AI operating guide & command menu
├── index.html                          # Primary executable standalone reader entry
│
├── source_materials/                   # 📁 Folder 1: Original book & paper raw source materials
│   ├── psychology-money/               # Raw book JSONs (chapters 00..25, manifest, search index)
│   ├── positive-psychology-progress/   # Raw paper JSONs & original PDF figures (Figure 1, Figure 2, Table 1)
│   └── publications.json               # Master publications catalog metadata
│
├── processed_content/                  # 📁 Folder 2: Processed bilingual content stored in Markdown format (.md)
│   ├── psychology-money/               # Markdown formatted bilingual chapters (.md)
│   └── positive-psychology-progress/   # Markdown formatted bilingual paper sections (.md)
│
├── reader_versions/                    # 📁 Folder 3: Reader version records & working builds
│   ├── v11_latest/                     # Active v11 Reader (Progressive loading, IndexedDB, PWA)
│   ├── v10_pwa_offline/                # v10 Working Version record (PWA & Service Worker)
│   └── v9_bilingual_figures/           # v9 Working Version record (Bilingual & Figure rendering)
│
├── _meta/                              # Reconstruction blueprints & architecture documentation
│   ├── owner_private_blueprint.md      # Owner-only private blueprint
│   └── public_blueprint.md             # Shareable public blueprint with GitHub Pages URLs
│
├── _agent/                             # Agent guidelines, interaction contracts & log notes
│   ├── AGENT_HANDOFF.md                # Detailed interaction contracts & bug fix records
│   └── README.md                       # Agent area instructions
│
├── _human/                             # Human maintenance layer (Visual HTML maps & quick fixes)
│   ├── system-map.html                 # Architecture, folder, data flow & module map
│   └── quick-fixes.html                # User-facing settings & troubleshooting guide
│
└── _pending/                           # Archived holding area for obsolete material & backup iterations
```

### Folder Usage Details / 各資料夾用途與規範

1. **`source_materials/` (Original Book Source Materials)**:
   * Stores all raw JSON datasets, original PDF figure images (Table 1, Figure 1, Figure 2), and catalog metadata.
   * Serves as the immutable source of truth for the publication contents.

2. **`processed_content/` (Processed Content in Markdown Format)**:
   * Contains clean, readable Markdown (`.md`) files formatted with bilingual English `[EN]` and Chinese `[ZH]` paragraph alignment for easy editing, inspection, or static document generation.

3. **`reader_versions/` (Application and Reader Version Records)**:
   * Preserves stable working versions of the application (e.g., `v11_latest`, `v10_pwa_offline`, `v9_bilingual_figures`) as mandated by version preservation rules.

4. **`_meta/`**:
   * Contains private and public architecture blueprints for project reconstruction.

5. **`_agent/`**:
   * Stores agent operating guidelines, prompt logs, and technical handoff records (`AGENT_HANDOFF.md`).

6. **`_human/`**:
   * Contains visual system maps (`system-map.html`) and quick troubleshooting guides (`quick-fixes.html`) for human maintainers.

7. **`_pending/`**:
   * Safe archive holding area for obsolete files and previous experiment iterations.

---

## 📱 How to Use the Reader / 閱讀器操作指南

### 1. Progressive Section Loading & Offline Storage (漸進載入與離線儲存)
- **Instant FCP (< 50ms)**: On first launch, the reader loads only Section 0 for instant startup.
- **Background Progressive Queue**: Remaining sections are cached progressively in the background into the device's **IndexedDB** (`ReaderOfflineCacheDB`).
- **Zero Repeated Downloads**: On subsequent visits, content is loaded 100% locally from IndexedDB for zero network latency and zero data usage.
- **PWA Installation**: Tap "Add to Home Screen" on iOS Safari or Android Chrome to install as a native offline PWA app.

### 2. Interactive Reading Controls (閱讀器對照與操作)
- **Single Tap Paragraph (單擊英文段落)**: Expands/collapses the Chinese translation directly below as an independent paragraph block.
- **Tap-to-Reveal Screen Navigation (點擊螢幕顯示翻頁圖示)**: Tapping the screen reveals the floating `❮` (Prev) and `❯` (Next) side buttons for 4 seconds, automatically fading out to maintain a clean, distraction-free reading view.
- **Double Tap (雙擊英文段落)**: Reads the paragraph aloud using browser Speech Synthesis (TTS).
- **Top Header Bar**:
  - `▦` (Library & Contents): Switch between *The Psychology of Money* and *Positive Psychology Progress*, or jump to any chapter.
  - `文` (Toggle All): Show/hide Chinese translations across the entire chapter.
  - `⌕` (Search & Bookmarks): Perform full-text search in English or Chinese, or manage saved bookmarks.
  - `Aa` (Settings): Customize text size, line spacing, typeface (Serif/Sans), page width, theme (Eye-care/Light/Dark), and speech rate.

---

## 🛠️ Build & Maintenance Scripts

Generate Markdown content files from source JSON:
```bash
node scripts/build-markdown-content.mjs
```

Organize source materials:
```bash
node scripts/organize-source-materials.mjs
```

Preserve working reader versions:
```bash
node scripts/organize-reader-versions.mjs
```
