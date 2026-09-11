import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const destination = path.join(root, "public/fonts");
const families = [
  ["Inter", "inter"],
  ["Lexend", "lexend"],
  ["Lora", "lora"],
  ["Nunito", "nunito"],
  ["Source Sans 3", "sourcesans3"],
  ["Source Serif 4", "sourceserif4"],
];
const [option, ...extras] = process.argv.slice(2);
if ((option !== undefined && option !== "--refresh") || extras.length)
  throw new Error("Usage: download-fonts.mjs [--refresh]");
if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0")
  throw new Error("TLS verification must be enabled");
if (fs.existsSync(destination) && option !== "--refresh")
  throw new Error(
    "Font assets already exist; use --refresh only for an intentional upstream update",
  );

async function download(url, limit) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(120000),
    redirect: "error",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} from ${new URL(url).host}`);
  const chunks = [];
  let size = 0;
  for await (const chunk of response.body) {
    size += chunk.length;
    if (size > limit) throw new Error("Font resource exceeds size limit");
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

const files = new Map();
const records = [];
for (const [family, id] of families) {
  console.log(`Downloading ${family}: variable normal 400–700, Latin and Latin extended`);
  const cssSource = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@400..700&display=swap`;
  const licenseSource = `https://api.github.com/repos/google/fonts/contents/ofl/${id}/OFL.txt`;
  const licenseData = JSON.parse((await download(licenseSource, 100000)).toString("utf8"));
  if (licenseData.encoding !== "base64") throw new Error(`Missing license content for ${family}`);
  const license = Buffer.from(licenseData.content, "base64");
  if (!license.toString("utf8").includes("SIL OPEN FONT LICENSE Version 1.1"))
    throw new Error(`Missing expected redistribution license for ${family}`);
  files.set(`${id}/OFL.txt`, license);
  const css = (await download(cssSource, 100000)).toString("utf8");
  for (const subset of ["latin", "latin-ext"]) {
    const block = [...css.matchAll(/\/\* ([\w-]+) \*\/\s*@font-face\s*\{([^}]+)\}/g)].find(
      (match) => match[1] === subset,
    )?.[2];
    const source = block?.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2)\)/)?.[1];
    const unicodeRange = block?.match(/unicode-range:\s*([^;]+);/)?.[1];
    if (
      !source ||
      !unicodeRange ||
      !/font-weight:\s*400 700;/.test(block) ||
      !/font-style:\s*normal;/.test(block)
    )
      throw new Error(`Missing variable ${subset} declaration for ${family}`);
    const bytes = await download(source, 500000);
    if (bytes.toString("ascii", 0, 4) !== "wOF2" || bytes.readUInt32BE(8) !== bytes.length)
      throw new Error(`Invalid WOFF2 payload for ${family}`);
    const filename = `${id}/${subset}-wght.woff2`;
    files.set(filename, bytes);
    records.push({
      family,
      subset,
      file: filename,
      style: "normal",
      weight: "400 700",
      unicodeRange,
      bytes: bytes.length,
      sha512: createHash("sha512").update(bytes).digest("base64"),
      source,
      cssSource,
      license: `${id}/OFL.txt`,
      licenseSource,
      licenseBlobSha: licenseData.sha,
    });
    console.log(`${family} ${subset}: ${bytes.length} verified WOFF2 bytes`);
  }
}

// Save only after all font payloads and redistribution notices have been validated.
for (const [relative, bytes] of files) {
  const file = path.join(destination, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, bytes);
}
fs.writeFileSync(
  path.join(destination, "font-assets.json"),
  JSON.stringify(
    {
      downloadedAt: new Date().toISOString(),
      license: "OFL-1.1",
      fonts: records,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `FONT_DOWNLOAD_COMPLETE: ${records.length} WOFF2 files and ${families.length} original licenses`,
);
