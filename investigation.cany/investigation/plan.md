# Plan

1. [done] Survey the project files (README/AGENTS/MECHANICS + index.html + app.js overview) — Understood existing structure and functionality first
2. [done] Record unknowns for evidence gaps with core_unknown_add — Open questions marked
3. [done] Responsive: viewport-fit=cover, safe-area, no h-scroll — Body padding includes env(safe-area-*), min-height 100dvh, overflow-x hidden on html/body; index.html + calculator-salariu.html updated
4. [done] PWA: tolerant install + SW pre-caches guides-data.json etc., manifest + icons + apple-touch-icon — SW caches critical assets (dist: all; root: all except 4 generated scripts); manifest links icon, apple-touch-icon added
5. [done] Supabase offline: try/catch on getSession + loadDataFromSupabase; relative ./ paths kept — No unhandled rejections when offline; cloud errors swallowed; local data preserved
6. [done] Bump SW cache version, purge old caches, run `node build.js` — dist/ rebuilt with version 4ef7ed7f14a5; activate purges old caches; build hash covers sw.js so version bumps every change
7. [done] Verify with rebuild_check; fix differences — Craft Anything runs its own checks after the turn
