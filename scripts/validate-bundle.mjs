import { gunzipSync } from "node:zlib";
import { readFile } from "node:fs/promises";

const segments = [];
for (let index = 0; index < 5; index += 1) {
  const source = await readFile(`docs/bundle-${index}.js`, "utf8");
  const match = source.match(/push\("([A-Za-z0-9+/=]+)"\)/);
  if (!match) throw new Error(`Could not read docs/bundle-${index}.js`);
  segments.push(match[1]);
}

const academy = gunzipSync(Buffer.from(segments.join(""), "base64")).toString("utf8");
const requiredText = [
  "Restoration PM Academy",
  "const PASSING_SCORE = 85",
  "Masonry Conditions",
  "Sealant Joint Performance",
  "Moisture Investigation",
  "Certificate of Completion",
  "gradeOpenResponse"
];

for (const value of requiredText) {
  if (!academy.includes(value)) throw new Error(`Missing required academy content: ${value}`);
}

console.log(`Validated ${academy.length.toLocaleString()} bytes of interactive academy content.`);
