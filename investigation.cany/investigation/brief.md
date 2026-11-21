# Brief

**Question:** Rebuild/upgrade the Pontaj Ture time-tracking app in its own folder: keep 100% of existing functionality (calculations, wizard, modals, guides), make it properly responsive (viewport-fit=cover, safe-area insets, no unwanted horizontal scroll), make it work offline + as a PWA (service worker pre-caches index.html, styles.css, app.js, guides.js, guides-data.json, icons, locale pages; manifest.json), make the Supabase integration not break when offline and not force a blocking login on open, use relative ./ paths, then bump the SW cache version, clean old caches, and run `node build.js` to finalize dist/.

**Targets:**
- /home/kill/Documents/ Craft Anything/Pontaj Ture

**Constraints:**
- Change files only inside the project folder (its own folder, not a new app/ instance); the workspace IS the project.
- Do not change data: nothing else to study. Keep 100% functionality of calculations, wizard, modals, guides.
- Run `node build.js` at the end to update dist/.
- Never start dev servers, watchers or anything that doesn't exit.

