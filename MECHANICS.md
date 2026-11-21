# MECHANICS — recovered from the original app (decompiled, not guessed)

Source: `calculator-ture.apk`, package `com.calculatorture.mobile`, `MainActivity` — the original's main program of the Calculator serviciu app, opened with `core_target_open` in **Deep mode** this turn (run 36, 2026-11-19). Static analysis only — the app was never run.

This turn re-opened the original's main program with `core_target_open` and ran the full decompilation sequence again; every result was **awaited to completion** (`coverage.status = complete`) before it was written here. Evidence ids in this document are this session's; they are the ones the build consumes.

## How the decompilation was done (requested tools vs. what works)

| Requested step | What happened this pass | Evidence |
|---|---|---|
| open the original's main program | `core_target_open` → target `t_d63ae98fdcca`, sha256 `d63ae98fdcca…`, kind `apk` | session state |
| native strings for names / settings / messages | `native_strings_find` refused: `not_supported — "An Android app is not native machine code."` | — |
| native function pseudocode / xrefs | `native_function_pseudocode` refused with the same code | — |
| follow the references | `android_class_users_find` on `Lcom/calculatorture/mobile/MainActivity;` — 12 references from the 4 methods in `classes.dex` | `ev_f53dc4dc1f5531a658b9dfb4a7c585b76bdbfc6fa7cc634b4aa8f403edb9ebeb` |
| read each function completely | `android_method_show` on every function — full Dalvik listings, complete | ids on each item below |

**Why the native tools cannot do this job.** This turn's `android_classes_find` found 1 class in 1 DEX file (`classes.dex`) — `com.calculatorture.mobile.MainActivity` — and the archive is Kotlin/Dalvik bytecode with **zero native `.so` libraries**. The native lifters work on machine code; Deep mode does not change that, so `native_strings_find` and `native_function_pseudocode` refuse the app with `not_supported — "An Android app is not native machine code."`. The equivalent Android decompiler path reads the same shipped bytes; there is no native "main program" for it to read — the main program is the single Kotlin class in the table below. JEB is not installed, so the built-in Dalvik decoder is the authoritative reader.

Every "address" below is a **DEX method reference plus its code range in `classes.dex`** (ranges from `android_method_show`).

## 1. Names, settings and messages

`android_resources_read` (complete; `ev_f4270f985996ea0c3afe31dc23187579117edabc1ca36970f0f71287c8dca19c`) decoded the shipped string/style table from `resources.arsc`:

- Package: `com.calculatorture.mobile`
- Launcher label (string `app_name`, id `0x7f020000`): **Pontaj Ture**
- Theme `AppTheme` (`0x7f030000`): `@0x01010054` = `#fff5f5f5`; `@0x01010451` = `#ff1d9e75`
- Launcher icons: `ic_launcher` / `ic_launcher_round` (mipmaps, `0x7f010000` / `0x7f010001`)

`AndroidManifest.xml` decoded (`ev_73e9e82b447938eab94dc565412e6954eed73703b010e211d59a452ad40c44b7`):

- `versionCode="1"`, `versionName="1.0"`, `compileSdkVersion="34"`, `platformBuildVersionCode="34"`, `minSdkVersion="21"`, `targetSdkVersion="34"`, `allowBackup="true"`, `hardwareAccelerated="true"`, `supportsRtl="false"`
- `<application android:theme="@0x7f030000" android:label="@0x7f020000" android:icon="@0x7f010000" android:roundIcon="@0x7f010001">`
- One activity, the original's main program: `android:name=".MainActivity"` (`android:label="@0x7f020000"`, `android:exported="true"`), with the `MAIN`/`LAUNCHER` intent filter.

## 2. The functions behind the app, with addresses

- `Lcom/calculatorture/mobile/MainActivity;-><init>()V` — `classes.dex 0x0000-0x0003` (2 instructions) — `ev_62a53cfde1d9d0261147db7c63e0df8d0bbb4f577b84b25ef8602d7025fcdce2`
- `Lcom/calculatorture/mobile/MainActivity;->onCreate(Landroid/os/Bundle;)V` — `classes.dex 0x0000-0x007e` (54 instructions) — `ev_b3d2e2b6d8b20e3a38c944ea14a68a9ce160e9b8404bfaea5740167c92b8e992`
- `Lcom/calculatorture/mobile/MainActivity;->onKeyDown(I Landroid/view/KeyEvent;)Z` — `classes.dex 0x0000-0x0018` (14 instructions) — `ev_8f76e6fd7003600f95adae73f75b1bd58bb7c99dc4682dbc9633ae3badfeb156`
- `Lcom/calculatorture/mobile/MainActivity;->onSaveInstanceState(Landroid/os/Bundle;)V` — `classes.dex 0x0000-0x000a` (5 instructions) — `ev_0359867a6d77c1953bdb93c4023a3c9366901bd1bf34d6bb2a348e362cf7b179`
- `Lcom/calculatorture/mobile/MainActivity;->onDestroy()V` — `classes.dex 0x0000-0x000a` (5 instructions) — `ev_98dff01f54bcce142c7f75fce84c5dd76f0a302a5c7d6eceba2d553c2fef690d`

Field (from `android_class_show`, `ev_21d5dcaa64d5109e70e92f5925e533ded634ae483973679213a00dd65f11fd1a`): `Lcom/calculatorture/mobile/MainActivity;->web:Landroid/webkit/WebView;`

Followed references (`android_class_users_find`, `ev_f53dc4dc1f5531a658b9dfb4a7c585b76bdbfc6fa7cc634b4aa8f403edb9ebeb`): 12 references to the `MainActivity` class and its `web` field from the 4 methods above, all in `classes.dex` (the only DEX holding the app's own code).

## 3. The real values (onCreate)

`Lcom/calculatorture/mobile/MainActivity;->onCreate(Landroid/os/Bundle;)V` — `ev_b3d2e2b6…`:

- A `WebView` is created and stored in the `web` field; `setContentView(web)`.
- WebView background: `Color.parseColor("#f5f5f5")` → `setBackgroundColor`.
- WebSettings — every call passes `true` except `cacheMode`: `setJavaScriptEnabled(true)`, `setDomStorageEnabled(true)`, `setDatabaseEnabled(true)`, `setAllowFileAccess(true)`, `setAllowContentAccess(true)`, `setAllowFileAccessFromFileURLs(true)`, `setAllowUniversalAccessFromFileURLs(true)`, `setLoadWithOverviewMode(true)`, `setUseWideViewPort(true)`, `setCacheMode(2)`, `setJavaScriptCanOpenWindowsAutomatically(true)`.
- User agent: the platform UA with `" CalculatorTure/1.0"` appended (`setUserAgentString`).
- Page loaded: `web.loadUrl("file:///android_asset/www/index.html")` when the incoming bundle is null; `web.restoreState(bundle)` otherwise.

## 4. The real rules

- **webViewSettingsRule** — `onCreate: every WebSettings call passes true (setJavaScriptEnabled, setDomStorageEnabled, setDatabaseEnabled, setAllowFileAccess, setAllowContentAccess, setAllowFileAccessFromFileURLs, setAllowUniversalAccessFromFileURLs, setLoadWithOverviewMode, setUseWideViewPort, setJavaScriptCanOpenWindowsAutomatically), setCacheMode(2); WebView background #f5f5f5; user agent = platform UA + " CalculatorTure/1.0".`
- **loadUrlRule** — `onCreate: if the incoming bundle is null → web.loadUrl("file:///android_asset/www/index.html"); otherwise → web.restoreState(bundle).`
- **backKeyRule** — `onKeyDown: if key == 4 (KEYCODE_BACK): if web != null && web.canGoBack() → web.goBack() and return true; otherwise invoke Activity.onKeyDown. If the key is not 4 → invoke Activity.onKeyDown.`
- **saveStateRule** — `onSaveInstanceState: invoke-super first; if web != null → web.saveState(bundle); return void.`
- **destroyRule** — `onDestroy: if web != null → web.destroy(); then invoke-super; return void.`

## 36. Decompilation run index — this turn (Deep mode, original's main program re-opened, 2026-11-19)

- Target: `t_d63ae98fdcca`; `calculator-ture.apk`; `sha256 d63ae98fdcca962c88490890a8c943fb0decd252aa6f6a72b44ae88e71f457bb`.
- This session's evidence ids: `ev_e832734927784588468560ffef1d7c23814a30312a63f7bb9d28019e19f33955` (classesFind), `ev_21d5dcaa64d5109e70e92f5925e533ded634ae483973679213a00dd65f11fd1a` (classShow), `ev_62a53cfde1d9d0261147db7c63e0df8d0bbb4f577b84b25ef8602d7025fcdce2` (methodShowInit), `ev_b3d2e2b6d8b20e3a38c944ea14a68a9ce160e9b8404bfaea5740167c92b8e992` (methodShowOnCreate), `ev_98dff01f54bcce142c7f75fce84c5dd76f0a302a5c7d6eceba2d553c2fef690d` (methodShowOnDestroy), `ev_8f76e6fd7003600f95adae73f75b1bd58bb7c99dc4682dbc9633ae3badfeb156` (methodShowOnKeyDown), `ev_0359867a6d77c1953bdb93c4023a3c9366901bd1bf34d6bb2a348e362cf7b179` (methodShowOnSaveInstanceState), `ev_f4270f985996ea0c3afe31dc23187579117edabc1ca36970f0f71287c8dca19c` (resourcesReadStrings), `ev_73e9e82b447938eab94dc565412e6954eed73703b010e211d59a452ad40c44b7` (resourcesReadManifest), `ev_f53dc4dc1f5531a658b9dfb4a7c585b76bdbfc6fa7cc634b4aa8f403edb9ebeb` (classUsersFind).
