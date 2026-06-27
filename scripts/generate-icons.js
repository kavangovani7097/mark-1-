/**
 * Generates SQUADR PWA icons at 512x512 and 192x192.
 * Run: node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const BG = '#0A0A12';
const WINE = '#7B2D42';

// iOS-style corner radius (~22.37% of icon size)
const IOS_CORNER_RATIO = 0.2237;

const BASE_SIZE = 512;
const BASE = {
  radius: 58,
  top: { x: 256, y: 170 },
  bottomLeft: { x: 156, y: 342 },
  bottomRight: { x: 356, y: 342 },
};

function buildSvg(size) {
  const scale = size / BASE_SIZE;
  const cornerRadius = size * IOS_CORNER_RATIO;
  const r = BASE.radius * scale;

  const circles = [BASE.top, BASE.bottomLeft, BASE.bottomRight]
    .map(
      ({ x, y }) =>
        `<circle cx="${x * scale}" cy="${y * scale}" r="${r}" fill="${WINE}"/>`
    )
    .join('\n    ');

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="clip">
      <rect width="${size}" height="${size}" rx="${cornerRadius}" ry="${cornerRadius}"/>
    </clipPath>
  </defs>
  <g clip-path="url(#clip)">
    <rect width="${size}" height="${size}" fill="${BG}"/>
    ${circles}
  </g>
</svg>`;
}

async function generateIcon(size, outputPath) {
  const svg = buildSvg(size);
  await sharp(Buffer.from(svg))
    .png({ compressionLevel: 9 })
    .toFile(outputPath);
  console.log(`Wrote ${outputPath} (${size}x${size})`);
}

async function main() {
  const publicDir = path.join(__dirname, '..', 'public');
  await generateIcon(512, path.join(publicDir, 'logo512.png'));
  await generateIcon(192, path.join(publicDir, 'logo192.png'));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
