# Psychology Money Reader v11 - Agent Handoff

## Current product

- Main route: `/` (v11)
- Previous route: `/v10`
- Main reader component: `app/v5-reader.tsx`
- Main styles: `app/globals.css`
- Service worker/offline cache: `public/sw.js`
- Publication catalog: `public/publications.json`

## Publication data

- *The Psychology of Money*: `public/book/v5/`
- *Positive Psychology Progress*: `public/book/positive-psychology-progress/`
- Original paper figures: `public/book/positive-psychology-progress/figures/`

## Current interaction contract

- Single tap on an English paragraph: show/hide its Chinese translation.
- Double tap: read the selected English sentence aloud using the device voice.
- Paragraph controls appear at the upper-right only after selection.
- Text size is adjustable from 16-32 px with A-/A+ buttons and a range slider.
- Only v11 and v10 are shown in the visible version selector.
- Reading preferences, bookmarks, recent locations, and selected publication are device-local.
- Publication content and figures are downloaded in the background for offline reading.

## Development

```bash
npm ci
npm run lint
npm run build
```

The app uses Next-compatible React components compiled with Vinext/Vite. No API key is required for speech; it uses the browser/device speech synthesis voice.

## Notes for the next agent

1. Preserve v10 before changing the main route.
2. Increment the public reader version for meaningful behavior changes.
3. Update the service-worker cache name and registration query when releasing a new version.
4. Keep publication manifests and `offlineUrls` aligned with every chapter, search index, and figure asset.
5. Test touch behavior and the settings panel on a narrow mobile viewport.
