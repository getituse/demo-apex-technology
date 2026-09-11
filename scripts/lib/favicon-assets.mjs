import { deflateSync, inflateSync } from "node:zlib";

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type), data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, checksum]);
}

export function resizePng(source, size) {
  if (!Number.isInteger(size) || size < 1 || size > 512) throw new Error("Invalid favicon size");
  if (source.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a")
    throw new Error("Manifest icon must be PNG");
  const compressed = [];
  let width, height, channels;
  let finished = false;
  for (let offset = 8; offset < source.length;) {
    const length = source.readUInt32BE(offset);
    if (offset + length + 12 > source.length) throw new Error("Truncated PNG");
    const type = source.toString("ascii", offset + 4, offset + 8);
    const data = source.subarray(offset + 8, offset + 8 + length);
    if (
      crc32(source.subarray(offset + 4, offset + 8 + length)) !==
      source.readUInt32BE(offset + 8 + length)
    )
      throw new Error("PNG integrity error");
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      if (
        data[8] !== 8 ||
        ![2, 6].includes(data[9]) ||
        data[10] !== 0 ||
        data[11] !== 0 ||
        data[12] !== 0 ||
        width !== height ||
        width < 512 ||
        width > 2048
      )
        throw new Error("Use a square, non-interlaced 8-bit RGB/RGBA PNG, 512–2048px");
      channels = data[9] === 6 ? 4 : 3;
    }
    if (type === "IDAT") compressed.push(data);
    offset += length + 12;
    if (type === "IEND") {
      finished = true;
      break;
    }
  }
  if (!finished || !channels) throw new Error("Incomplete PNG");
  const stride = width * channels;
  const raw = inflateSync(Buffer.concat(compressed), { maxOutputLength: (stride + 1) * height });
  if (raw.length !== (stride + 1) * height) throw new Error("Invalid PNG pixel length");
  const pixels = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    if (filter > 4) throw new Error("Invalid PNG filter");
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? pixels[y * stride + x - channels] : 0;
      const b = y ? pixels[(y - 1) * stride + x] : 0;
      const c = y && x >= channels ? pixels[(y - 1) * stride + x - channels] : 0;
      const p = a + b - c;
      const paeth =
        Math.abs(p - a) <= Math.abs(p - b) && Math.abs(p - a) <= Math.abs(p - c)
          ? a
          : Math.abs(p - b) <= Math.abs(p - c)
            ? b
            : c;
      pixels[y * stride + x] =
        (raw[y * (stride + 1) + 1 + x] + [0, a, b, Math.floor((a + b) / 2), paeth][filter]) & 255;
    }
  }
  const scaled = Buffer.alloc(size * (size * channels + 1));
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const from =
        (Math.floor((y * height) / size) * width + Math.floor((x * width) / size)) * channels;
      pixels.copy(scaled, y * (size * channels + 1) + 1 + x * channels, from, from + channels);
    }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = channels === 4 ? 6 : 2;
  return Buffer.concat([
    source.subarray(0, 8),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(scaled)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
