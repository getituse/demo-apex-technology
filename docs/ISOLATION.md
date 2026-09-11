# Proving this project stands alone

This site ships as its own repository and its own deployment. Nothing it needs may live
outside its root. That is not something to assume — it is something to check, and this is
the procedure.

Run it after any change to imports, configuration, dependencies or build output.

## 1. Build with everything else hidden

The only honest test of isolation is to remove what the project must not need, then build.

1. Rename every sibling directory beside this project so it cannot be resolved — append a
   suffix such as `.isolated-away` rather than deleting anything.
2. Do the same to any shared source, script or asset directory in the parent folder.
3. From this project's root, run its production build.
4. Restore every renamed directory, whether the build passed or failed.

Wrap steps 1–4 so the restore always runs. A crash that leaves directories renamed is worse
than a failed build, and the restore must be repeatable on its own.

The build must succeed, and its output must still match the reference snapshot: same routes,
same rendered HTML, same theme tokens, same static artifacts, same public assets.

## 2. No file may point outside the project

Scan every source and configuration file — not build output, not `node_modules` — and reject:

- a relative import specifier that resolves above the project root;
- an absolute path naming the parent folder;
- a `file:`, `link:` or `portal:` dependency range in `package.json`;
- a `workspaces` field in `package.json`;
- a symbolic link or directory junction anywhere in the tree.

Report the check that ran and the number of files it read. "It looks fine" is not a result.

## 3. The output must not mention anyone else

Search the built output for any other site's identifier, brand name and asset path. Zero
matches. A stylesheet, a script chunk or a JSON payload that names another customer's site
is a packaging defect even when nothing renders it.

## 4. Run it

The project's own gate — typecheck, lint, tests, build — must pass from this directory with
no argument selecting a site, no environment variable and no parent configuration.

## What a failure means

A failure here is a defect in how the project was assembled, not a reason to relax the check.
Fix the reference, re-run the build, and record what was wrong and why it was missed.
