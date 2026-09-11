import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mode = process.argv[2];
if (!["unit", "e2e"].includes(mode) || process.argv.length !== 3)
  throw new Error("Use test-command.mjs unit|e2e");
const npm = [
  path.join(path.dirname(process.execPath), "node_modules/npm/bin/npm-cli.js"),
  path.resolve(path.dirname(process.execPath), "../lib/node_modules/npm/bin/npm-cli.js"),
].find((candidate) => fs.existsSync(candidate));
if (!npm)
  throw new Error("Cannot find npm beside Node; run npm run test or npm run test:e2e directly.");
const directory = path.join(root, "build/test-runs");
fs.mkdirSync(directory, { recursive: true });
const run = fs.mkdtempSync(path.join(directory, `${mode}-`));
const args = ["run", mode === "unit" ? "test" : "test:e2e"];
const record = {
  command: ["npm", ...args],
  startedAt: new Date().toISOString(),
  complete: false,
  exitCode: null,
  signal: null,
  error: null,
};
const save = () =>
  fs.writeFileSync(path.join(run, "completion.json"), JSON.stringify(record, null, 2));
save();
try {
  if (mode === "e2e") {
    for (const [source, name] of [
      ["build/e2e/artifacts", "previous-artifacts"],
      ["playwright-report", "previous-html-report"],
    ]) {
      const location = path.join(root, source);
      // Windows can retain directory handles after browser teardown. Snapshot rather than rename.
      if (fs.existsSync(location))
        fs.cpSync(location, path.join(run, name), {
          recursive: true,
          errorOnExist: true,
          force: false,
        });
    }
  }
} catch (error) {
  record.complete = true;
  record.exitCode = 1;
  record.error = error.message;
  save();
  throw error;
}
const reportPath = path.join(
  root,
  mode === "unit" ? "build/vitest-results.json" : "build/e2e/results.json",
);
if (fs.existsSync(reportPath)) fs.renameSync(reportPath, path.join(run, "previous-results.json"));
const child = spawn(process.execPath, [npm, ...args], {
  cwd: root,
  shell: false,
  stdio: ["ignore", "pipe", "pipe"],
});
for (const [stream, destination] of [
  [child.stdout, process.stdout],
  [child.stderr, process.stderr],
]) {
  stream.on("data", (chunk) => {
    destination.write(chunk);
    fs.appendFileSync(path.join(run, "output.log"), chunk);
  });
}
child.on("error", (error) => {
  record.error = error.message;
});
child.on("close", (code, signal) => {
  record.complete = true;
  record.exitCode = code;
  record.signal = signal;
  if (fs.existsSync(reportPath)) fs.copyFileSync(reportPath, path.join(run, "results.json"));
  save();
  process.exitCode = code === 0 && !signal && !record.error ? 0 : 1;
  console.log(`TEST_COMMAND_EXIT=${process.exitCode}; evidence=${path.relative(root, run)}`);
});
