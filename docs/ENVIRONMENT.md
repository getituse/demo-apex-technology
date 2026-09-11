# Environment findings

Machine capability preflight for this repository. Run 2026-09-04, before any scaffolding.

**Typography integrated, 2026-09-07:** six original families now ship as twelve local normal
variable WOFF2 subsets (Latin/Latin-extended, 400–700), original OFL notices and SHA-512/source
records. Google Fonts binaries downloaded successfully. The GitHub raw-content host timed out;
its official contents API supplied the original license text with TLS on. Font acquisition is
explicit maintenance, not a build step; deployed fonts come from the site itself. The historical
system-font substitution below is superseded.

**Current download fix, 2026-09-07:** Fresh-cache mirror npm ci succeeded in **567.638s** for
clsx and Windows esbuild. Both full archives match the lockfile SHA-512, and the downloaded
executable reports 0.28.2. The previous 180s diagnostic deadline was too short. Use **Install
dependencies (approved mirror)** / `deps:install` for a locked install, or **Verify mirrored
dependency downloads** / `deps:verify` for the isolated Windows x64 probe. The runner enables
system CA trust and TLS verification with 900s request bounds. `.npmrc` explicitly enables
verification; inherited npm configuration had disabled it. The public registry remains 403 for
the tested tarball; source lockfile URLs stay public for deployment portability. See Q in
[resolveerror.md](../resolveerror.md). No working application dependencies were reinstalled.

> ## ✅ FINAL CONFIGURATION — read this first
>
> Sections 3–5 below describe a network where **every npm tarball is 403**, and the CDN workaround
> built around that. The diagnosis was right about `registry.npmjs.org`, but there is also a
> **sanctioned internal Artifactory mirror** that serves tarballs normally, anonymously.
>
> Neither registry alone is good enough:
>
> - **Public npm** — metadata fast, tarballs **403**.
> - **Artifactory** — tarballs fine, metadata **unusably slow** (~40 s per packument, and npm
>   fetches one for every foreign-platform binary; a full install ran 40+ minutes without finishing).
>
> **So use each for what it is good at:**
>
> ```powershell
> # 1. Resolve - public npm. Metadata only, no tarballs, nothing is 403.
> & 'C:\Program Files\nodejs\npm.cmd' install --package-lock-only --no-audit --no-fund `
>     --prefer-offline --registry=https://registry.npmjs.org/
>
> # 2. Download - Artifactory. `npm ci` fetches NO packuments, only tarballs.
> & 'C:\Program Files\nodejs\npm.cmd' ci --no-audit --no-fund `
>     --registry=https://artifacts.devops.bfsaws.net/artifactory/api/npm/NPM/ `
>     --replace-registry-host=always
> ```
>
> **Measured: 11.8 s + 131.4 s = ~2.5 minutes.** Proven end to end:
>
> ```
> ✓ 1922 modules transformed.
> dist/assets/index-CSs03uCD.css    4.92 kB │ gzip:   1.46 kB
> dist/assets/index-CUIrkNmE.js   391.98 kB │ gzip: 120.54 kB
> ✓ built in 42.49s
> ```
>
> **Native `esbuild.exe` (11.2 MB) installs and runs** — the `esbuild-wasm` override is no longer
> needed, and neither is `scripts/cdn-install.mjs` (keep it only as an offline fallback).
>
> **Tailwind v3 stays.** v4 cannot be resolved via public-npm metadata (`@tailwindcss/oxide-wasm32-wasi`
> forces a tarball fetch during `--package-lock-only`), and resolving it via Artifactory is the
> 40-minute path. Theming is unaffected.
>
> **Deploys anywhere.** Resolution happens against public npm, so `package-lock.json` and the
> committed `.npmrc` contain public URLs only — Cloudflare Pages / Netlify / GitHub Actions work
> unchanged. Full write-up: [resolveerror.md](../resolveerror.md) entries **H**, **H2** and **I**.
>
> Sections below remain accurate about `registry.npmjs.org`, PowerShell, Node/npm, git and terminal
> behaviour. Keep them — the CDN path is the proven fallback if Artifactory is ever unreachable.

**Verdict: GREEN.** One substitution remains: **Tailwind v3, not v4.**

**2026-09-05 reliability alternative:** Daily project operations now use VS Code `process` tasks
and `scripts/project-cli.mjs` to invoke Node bin entry points directly—no PowerShell command
parsing or `.ps1` launcher. Network/OS policy is unchanged. Current media is committed local
demo artwork, and fonts are deliberate system stacks; normal builds require no font/photo CDN.
The historical preflight below remains a record of the installation investigation.

**2026-09-06 targeted recheck:** Public clsx and Windows esbuild tarballs still returned 403.
Artifactory delivered clsx with a matching lockfile hash; the native archive timed out at 45s
and again at 180s, so fresh native access is not confirmed today. All six original font families
returned CSS and a real WOFF2 sample with HTTP 200. Node used system certificate trust and the
configured environment proxy without disabling TLS. These dated observations supersede blanket
claims about font unavailability, not the decision to keep the site offline. See
[resolveerror.md](../resolveerror.md) entry P. No dependencies or fonts were installed.

---

## 1. Node and npm

| Thing              | Value                                                   |
| ------------------ | ------------------------------------------------------- |
| Node               | **v26.7.0** — comfortably above the Node 22 requirement |
| npm                | **11.19.0**                                             |
| `node.exe` on PATH | `C:\Program Files\nodejs\node.exe`                      |

Bare `node -v` and the absolute path agreed in this session, but they have disagreed on this machine before. Trust the absolute path.

**Working invocation forms**

```powershell
& 'C:\Program Files\nodejs\node.exe' -v      # normal
& 'C:\Program Files\nodejs\npm.cmd' -v       # normal
C:\PROGRA~1\nodejs\node.exe -v               # fallback when the shell rejects '&'
```

---

## 2. PowerShell blocks bare `npm`

Confirmed, exactly as recorded in `resolveerror.md`:

```
npm : File C:\Program Files\nodejs\npm.ps1 cannot be loaded because
running scripts is disabled on this system.
```

`Get-ExecutionPolicy -List` returns **Undefined at every scope**, which falls back to `Restricted`. This is not a transient state — it will block `npm`, `npx`, and `uipro` in every session.

**Rule for this project:** never call bare `npm`. Use `& 'C:\Program Files\nodejs\npm.cmd'`.

---

## 3. The network blocks every npm tarball

This is the dominant constraint on the project.

| Request                                                      | Result            |
| ------------------------------------------------------------ | ----------------- |
| `GET registry.npmjs.org/clsx` (metadata)                     | **200**           |
| `GET registry.npmjs.org/clsx/-/clsx-2.1.1.tgz`               | **403 Forbidden** |
| `GET registry.npmjs.org/tailwindcss/-/tailwindcss-4.3.3.tgz` | **403 Forbidden** |
| `GET data.jsdelivr.com/v1/package/npm/clsx@2.1.1/flat`       | **200**           |
| `GET cdn.jsdelivr.net/npm/clsx@2.1.1/package.json`           | **200**           |

A 6 KB `clsx` tarball is refused just as firmly as a large one, so this is **not** a size or package policy — it is a blanket block on gzip archives by URL extension. Registry _metadata_ is unaffected.

The 403 body is npm's generic text and does **not** name a sanctioned alternative such as an internal Artifactory mirror. If one exists, pointing npm at it would remove every workaround below and should be preferred.

**Consequence:** plain `npm install` cannot work here. No registry mirror can fix it, because npm's install model requires tarballs.

### Node vs npm reachability

Raw Node `https.get` to `registry.npmjs.org` fails, while npm itself reaches it fine — npm applies proxy configuration that raw Node does not. Raw Node **can** reach `data.jsdelivr.com` and `cdn.jsdelivr.net` directly.

This shapes the install strategy: let **npm** talk to the registry for metadata, and let **Node** talk to jsDelivr for file content.

---

## 4. Tailwind decision: **v3**

| Test                                                            | Result                                  |
| --------------------------------------------------------------- | --------------------------------------- |
| `tailwindcss@4` alone, metadata-only resolve                    | OK (2 packages — v4 core is standalone) |
| `tailwindcss@4` + `@tailwindcss/vite`, metadata-only resolve    | **FAILED**                              |
| `tailwindcss@3` + postcss + autoprefixer, metadata-only resolve | **OK — 82 packages, 0 native binaries** |

The v4 failure:

```
npm error 403 Forbidden - GET
https://registry.npmjs.org/@tailwindcss/oxide-wasm32-wasi/-/oxide-wasm32-wasi-4.3.3.tgz
```

This is the decisive finding. `@tailwindcss/oxide-wasm32-wasi` has an incomplete packument, so **npm downloads a real tarball even in `--package-lock-only` mode**. That breaks the one resolution step the CDN workaround depends on, so no amount of CDN fallback can rescue Tailwind v4 here. `--omit=optional` does not avoid it.

Tailwind v3 is pure JavaScript with **zero native binaries in its tree**, so it resolves and installs cleanly.

**Decision: Tailwind v3 with postcss + autoprefixer.** Revisit only if an internal registry mirror becomes available.

Impact on the brief: section 3 of `complete_details.md` asks for Tailwind v4. The engine's design does not depend on v4 — semantic CSS-variable tokens, which the whole theme system is built on, work in v3 via `theme.extend` reading `var(--token)`. The practical differences are the config format (`tailwind.config.ts` instead of CSS-first `@theme`) and the import line (`@tailwind base/components/utilities` instead of `@import "tailwindcss"`).

---

## 5. Install strategy

Plain `npm install` is not available. Use two phases.

**Phase 1 — resolve (npm, metadata only, no tarballs)**

```powershell
& 'C:\Program Files\nodejs\npm.cmd' install --package-lock-only --no-audit --no-fund
```

**Phase 2 — materialise `node_modules` from jsDelivr**

A `scripts/cdn-install.mjs` that reads `package-lock.json` and, for every entry:

- `GET data.jsdelivr.com/v1/package/npm/<name>@<version>/flat` for the file list
- `GET cdn.jsdelivr.net/npm/<name>@<version><file>` for each file
- writes into the exact `node_modules/...` path the lockfile specifies

Run Node with `--use-system-ca` so it trusts the proxy's re-signed TLS certificates.

### jsDelivr availability, verified

| Package                                | Files | Total   | Largest file | Verdict |
| -------------------------------------- | ----- | ------- | ------------ | ------- |
| `@esbuild/win32-x64@0.25.9`            | 3     | 10.1 MB | 10.1 MB      | OK      |
| `@rollup/rollup-win32-x64-msvc@4.52.4` | 3     | 2.6 MB  | 2.6 MB       | OK      |
| `esbuild@0.25.9`                       | 7     | 0.1 MB  | 0.1 MB       | OK      |
| `vite@7.1.7`                           | 39    | 2.1 MB  | 1.3 MB       | OK      |
| `tailwindcss@3.4.17`                   | 252   | 5.5 MB  | 4.3 MB       | OK      |
| `react-router@7.9.3`                   | 68    | 3.7 MB  | 0.3 MB       | OK      |
| `motion@12.23.22`                      | 30    | 0.4 MB  | 0.3 MB       | OK      |
| `typescript@5.9.3`                     | 132   | 22.5 MB | 8.7 MB       | OK      |

A real file fetch of `@esbuild/win32-x64@0.25.9/package.json` returned **200**, confirming content downloads work and not just listings.

Crucially, the two **native binaries** Vite needs — esbuild's and Rollup's Windows builds — are both well under jsDelivr's caps. They are the packages most likely to have blocked the whole approach, and they do not.

### jsDelivr limits to respect

- **150 MB per package** and **50 MB per file.** Nothing in the planned stack is close.
- Skip foreign-platform optional dependencies (`os`/`cpu` fields) or hundreds of MB are wasted.
- Platform binaries omitted by `--omit=optional` must be added back explicitly.
- `unpkg.com` and `registry.npmmirror.com` may be unreachable; do not depend on them.

### Resolved — the full-stack resolve works, it is just slow

The full intended tree (react 19 + react-dom + react-router 7 + vite 7 + typescript 5 + tailwind v3 + postcss + autoprefixer + motion + lucide + zod + clsx + tailwind-merge + cva) resolves successfully:

```
exit code: 0
RESULT: SUCCESS - 157 packages resolved
elapsed: 237s
```

**Every request returned 200. Not one 403.** Earlier attempts appeared to hang because they were run without progress logging and were killed before finishing.

The cost is latency on large packuments, not blocking:

| Packument     | Cold fetch |
| ------------- | ---------- |
| `vite`        | 47.3 s     |
| `typescript`  | 25.2 s     |
| `react-dom`   | 19.8 s     |
| `tailwindcss` | 18.4 s     |
| `react`       | 16.6 s     |
| `@types/node` | 14.7 s     |

Later packages in the same run dropped to 0.4–4 s, so the proxy is slowest on first contact and on the very large documents.

**Every fetch logs `(cache updated)`, so this is a one-time cost.** A second resolve using the warm cache completed in **2–3 seconds**:

```powershell
& 'C:\Program Files\nodejs\npm.cmd' install --package-lock-only --no-audit --no-fund --prefer-offline
# -> up to date in 2s
```

**Rules that follow:**

- Budget roughly 4–5 minutes for the very first resolve on a cold npm cache. Do not kill it.
- Always pass `--loglevel=http` on the first run so progress is visible and a genuine 403 is distinguishable from slowness.
- Use `--prefer-offline` on every subsequent resolve.
- Do not delete the npm cache (`%LocalAppData%\npm-cache`); it is what makes this workable.

### The block covers executables too, not just archives

Discovered by an actual failed build, not by inspection. jsDelivr _lists_ every file, but the proxy refuses some of them:

| File                                                                       | Result            |
| -------------------------------------------------------------------------- | ----------------- |
| `@esbuild/win32-x64@0.28.2/esbuild.exe` (11.1 MB)                          | **403 Forbidden** |
| `@rollup/rollup-win32-x64-msvc@4.63.1/rollup.win32-x64-msvc.node` (2.7 MB) | **200 OK**        |
| `esbuild-wasm@0.28.2/esbuild.wasm` (14.0 MB)                               | **200 OK**        |
| any `.json`, `.js`, `.md`                                                  | **200 OK**        |

So the policy blocks `.tgz` **and** `.exe`, but not `.node` and not `.wasm`. Size is irrelevant — a 2.7 MB `.node` passes while a 11.1 MB `.exe` does not.

`unpkg.com` and `cdn.statically.io` were also tried for the same `.exe`: both **timed out, then ECONNRESET**. No CDN can deliver it.

**Consequence:** Rollup's native binary is fine, so Vite's bundler works. Only esbuild is affected, because it ships a standalone `.exe` rather than a Node addon.

### Fix: alias esbuild to esbuild-wasm

esbuild publishes an official pure-WebAssembly build with the same JavaScript API. Map it over the real package with an npm override in `package.json`:

```json
"overrides": {
  "esbuild": "npm:esbuild-wasm@0.28.2"
}
```

Effect on the tree, measured:

|                                | Before | After |
| ------------------------------ | ------ | ----- |
| Total packages                 | 157    | 132   |
| `@esbuild/*` platform packages | 26     | **0** |

The override must be present **before** the lockfile is generated. npm will not re-resolve an existing satisfied lockfile just because `overrides` changed — delete `package-lock.json` and resolve again if it was added late.

Keep the version in the override pinned to whatever `vite` requires; a mismatch between `vite`'s expected esbuild version and the aliased one will fail at build time.

---

## 6. UI UX Pro Max

Available and correctly initialised.

| Check                                     | Result  |
| ----------------------------------------- | ------- |
| `ui-ux-pro-max-cli` global                | 2.15.0  |
| `%APPDATA%\npm\uipro.cmd`                 | present |
| `.github/prompts/ui-ux-pro-max.prompt.md` | present |
| `.github/prompts/design-system/SKILL.md`  | present |
| `.github/prompts/design/SKILL.md`         | present |
| `.github/prompts/brand/SKILL.md`          | present |
| `.github/prompts/banner-design/SKILL.md`  | present |

Invoke as `uipro.cmd` — bare `uipro` resolves to `uipro.ps1` and hits the same execution-policy block as npm.

---

## 7. Git

| Thing                  | Value                          |
| ---------------------- | ------------------------------ |
| Version                | 2.52.0.windows.1               |
| Is this folder a repo? | **No** — `.git` does not exist |

If cloning anything over HTTPS later, use `git -c http.sslBackend=schannel clone <url>`; the OpenSSL backend fails here with `unable to get local issuer certificate`.

---

## 8. Terminal instability

PowerShell sessions collapsed **three times** during this preflight. The progression is consistent: output stops flushing, then `Write-Host` is "not recognized", then the `&` call operator is rejected with `AmpersandNotAllowed`.

Mitigations, in order of preference:

1. Spawn a fresh terminal. `--prefix` and `cmd.exe /c` do not help.
2. Prefer `C:\PROGRA~1\nodejs\node.exe` (8.3 short path) — no quoting, no `&` needed.
3. For anything with output worth keeping, write it to a file from inside Node rather than relying on the terminal buffer.

---

## 9. Rules for the remaining prompts

- Never call bare `npm`, `npx`, or `uipro`.
- Never spawn `npm.cmd` from Node's `child_process` without `shell: true`; on Node 20+ it returns `status: null` silently. Spawn `node <npm-prefix>/node_modules/npm/bin/npm-cli.js` instead. **This directly affects `scripts/tenant-cli.mjs` in Prompt 5.**
- Install via the two-phase CDN flow; expect a first install to be slow.
- Use Tailwind v3 syntax and config throughout.
- Run Node with `--use-system-ca` for anything making HTTPS requests.
- Playwright browser downloads will need `NODE_OPTIONS=--use-system-ca` and `PLAYWRIGHT_DOWNLOAD_CONNECTION_TIMEOUT=900000`.
