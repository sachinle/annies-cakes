#!/usr/bin/env node
/**
 * Generates public/og-image.png — the social share card.
 *
 * Deliberately a build-time script rather than next/og. ImageResponse
 * rasterises through satori + sharp at request time and failed here
 * with "Input buffer contains unsupported image format" (it fetches its
 * default font over the network, and a failed fetch is handed to sharp
 * as if it were an image). A static PNG has no runtime dependency, no
 * network call, and no cold-start cost — a share card either exists or
 * the build fails, which is the right trade for something crawlers and
 * WhatsApp fetch unpredictably.
 *
 * Run: node scripts/generate-og.mjs
 */
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const W = 1200;
const H = 630;

// Text is drawn as SVG <text> with a generic family. Rendered by
// librsvg inside sharp, which uses the system font stack — no webfont
// fetch, so this cannot fail the way the runtime version did.
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0"    stop-color="#fff0f3"/>
      <stop offset="0.55" stop-color="#ffd7e0"/>
      <stop offset="1"    stop-color="#ffb26a"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- Cake mark, matching the favicon so a shared link is recognisably
       the same brand as the browser tab. -->
  <g transform="translate(525, 96)">
    <rect width="150" height="150" rx="36" fill="#e05c78"/>
    <g transform="translate(75, 0)">
      <rect x="-63" y="113" width="126" height="11" rx="5.5" fill="#ffffff"/>
      <path d="M-55 78 H55 V108 Q55 113 50 113 H-50 Q-55 113 -55 108 Z" fill="#ffbdd0"/>
      <path d="M-58 78 V69 Q-58 55 -44 55 H44 Q58 55 58 69 V78
               Q43 105 29 78 Q14 105 0 78 Q-14 105 -29 78 Q-43 105 -58 78 Z" fill="#ffffff"/>
      <circle cx="0" cy="42" r="13" fill="#ffd93d"/>
    </g>
  </g>

  <text x="${W / 2}" y="336" text-anchor="middle"
        font-family="Trebuchet MS, Verdana, DejaVu Sans, sans-serif"
        font-size="72" font-weight="700" fill="#5f4d40"
        letter-spacing="-1">Annie&#39;s Homemade Cakes</text>

  <text x="${W / 2}" y="392" text-anchor="middle"
        font-family="Trebuchet MS, Verdana, DejaVu Sans, sans-serif"
        font-size="31" fill="#85705f">Baked fresh to order in Coimbatore</text>

  <rect x="${W / 2 - 178}" y="440" width="356" height="60" rx="30" fill="#5f4d40"/>
  <text x="${W / 2}" y="479" text-anchor="middle"
        font-family="Trebuchet MS, Verdana, DejaVu Sans, sans-serif"
        font-size="25" font-weight="600" fill="#ffffff">annieshomemadecakes</text>
</svg>`;

const out = resolve(process.cwd(), "public");
mkdirSync(out, { recursive: true });

const info = await sharp(Buffer.from(svg))
  .png({ compressionLevel: 9 })
  .toFile(resolve(out, "og-image.png"));

console.log(`✓ public/og-image.png  ${info.width}x${info.height}  ${info.size} bytes`);
