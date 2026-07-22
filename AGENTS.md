# Psychology Money Reader - AI Operating Guide & Repository Structure

This file provides operating rules, folder organization guidelines, and usage instructions for the Psychology Money Reader project.
本檔提供「金錢心理學與正向心理學閱讀器」專案之 AI 操作指南、資料夾架構說明與使用手冊。

---

## 📁 Repository Layout & Folder Guide / 資料夾架構與使用指南

```text
Psychology-Money-Reader-v11-source/
├── README.md                           # Main user & developer guide
├── AGENTS.md                           # Active AI operating guide & command menu
├── index.html                          # Primary executable standalone reader entry
│
├── source_materials/                   # 📁 Folder 1: Original book & paper raw source materials
│   ├── psychology-money/               # Raw JSONs (chapters 00..25, manifest, search index)
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

---

## 📖 How to Use the Reader / 閱讀器使用指南

1. **Online Mobile & Desktop Web App (線上直接開啟)**:
   * **Live Web App URL**: [https://yunkumom.github.io/reader/](https://yunkumom.github.io/reader/)
   * **GitHub Repository**: [https://github.com/Yunkumom/reader](https://github.com/Yunkumom/reader)

2. **Mobile Progressive Loading & Offline PWA (手機漸進載入與離線存取)**:
   * **Instant FCP (< 50ms)**: Loads Section 0 immediately on first launch.
   * **IndexedDB Local Storage**: Background queue progressively saves all chapters to local IndexedDB (`ReaderOfflineCacheDB`).
   * **Zero Repeated Downloads**: Subsequent visits or offline reading load 100% locally from IndexedDB.
   * **Add to Home Screen**: On iOS Safari (Share ➔ Add to Home Screen) or Android Chrome (Menu ➔ Install App) to use as a native offline PWA.

3. **Reading Interactions (閱讀互動操作)**:
   * **Single Tap Paragraph (點擊段落)**: Toggles Chinese translation expand/collapse right below the English paragraph.
   * **Tap Screen for Navigation (點擊螢幕顯示翻頁按鈕)**: Tapping the screen reveals the floating `❮` (Prev) and `❯` (Next) side arrows for 4 seconds, after which they auto-hide for distraction-free reading.
   * **Double Tap (雙擊英文段落)**: Reads the paragraph aloud using Speech Synthesis (TTS).
   * **Top Navigation Bar**: Access Library catalog (`▦`), Chapter TOC, Full-text Search (`⌕`), Bookmarks (`☆`), and Settings (`Aa`).

---

## 🛠️ Project Command Menu / 專案常用指令列

### Common Commands / 常用指令
1. Build Markdown Content: `node scripts/build-markdown-content.mjs`
2. Organize Source Materials: `node scripts/organize-source-materials.mjs`
3. Preserve Reader Versions: `node scripts/organize-reader-versions.mjs`
4. Check Git Status: `git status`
5. Push to GitHub: `git push origin main`

### Predicted Next Commands / 預測下一步指令
1. Commit recent folder structure reorganizations.
2. Push updated structure to GitHub main branch.
3. Test GitHub Pages deployment at `https://yunkumom.github.io/reader/`.
