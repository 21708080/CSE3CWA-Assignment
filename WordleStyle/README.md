# WordleStyle

Assessment 1 frontend starter built with Next.js, React and TypeScript.

## Included

- Compact responsive WordleStyle interface
- Playable Phoneme Wordle builder and standalone HTML export
- Playable Phoneme Word Search builder and standalone HTML export
- Home, About, Wordle, Word Search and Settings routes
- Reusable component structure ready for later database work

## Run

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## v5: generated-game CSS themes

- The WordleStyle builder appearance is selectable as Light, Dark, or System in Settings and saved in a cookie.
- The builder always uses the compact layout.
- Uploaded CSS is read locally in the browser and embedded automatically in later Wordle and Word Search standalone `.html` exports; it is not uploaded to a server.
- An example theme is included at `public/themes/wordlestyle-theme-example.css`.

Recommended generated-game variables include `--game-bg`, `--game-bg-accent`, `--game-surface`, `--game-surface-soft`, `--game-text`, `--game-muted`, `--game-primary`, `--game-primary-hover`, `--game-border`, and `--game-radius`. Word Search also exposes `--game-highlight`, `--game-found`, `--game-found-text`, and `--game-answer`. Wordle also exposes `--game-correct`, `--game-present`, and `--game-absent`.

## System-wide generated game theme

The generated Wordle and Word Search theme is configured once on the Settings page. Crimson is the default. A custom `.css` file can be uploaded in Settings and is stored locally in the browser, then embedded automatically into every generated standalone HTML activity. Builder appearance (Light / Dark / System) remains a separate cookie-backed setting.
