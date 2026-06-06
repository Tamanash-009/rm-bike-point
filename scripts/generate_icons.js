import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const SRC = 'public/rm-app-icon-source.png';
const OUT = 'public';

async function generate() {
  if (!fs.existsSync(SRC)) {
    console.error("Source icon not found at", SRC);
    process.exit(1);
  }

  const sizes = [48, 72, 96, 144, 192, 512];
  
  for (const size of sizes) {
    await sharp(SRC)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
      .toFile(path.join(OUT, `icon-${size}.png`));
    console.log(`Generated icon-${size}.png`);
  }

  // Favicon
  await sharp(SRC)
    .resize(48, 48)
    .toFile(path.join(OUT, 'favicon.ico')); // It might just write a png but extension is .ico (works in modern browsers)
  
  await sharp(SRC)
    .resize(192, 192)
    .toFile(path.join(OUT, 'favicon.png'));

  // Apple touch icon
  await sharp(SRC)
    .resize(180, 180)
    .toFile(path.join(OUT, 'apple-touch-icon.png'));

  // Maskable icon (usually the same as 512 if it has padding)
  await sharp(SRC)
    .resize(512, 512)
    .toFile(path.join(OUT, 'maskable-icon.png'));

  // Monochrome icon
  // The user requested: White RM symbol, transparent background, no text, no shadows.
  // Since we don't have vector logic here, we'll create the SVG inline and rasterize it via sharp.
  const svg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(80, 200) skewX(-25)">
    <!-- R -->
    <path d="M 0,0 L 150,0 C 200,0 200,80 150,80 L 100,80 L 150,140 L 100,140 L 60,80 L 40,80 L 30,140 L -20,140 Z" fill="#FFFFFF" />
    <!-- M -->
    <path d="M 170,140 L 210,0 L 260,60 L 310,0 L 280,140 L 240,140 L 260,60 L 220,140 Z" fill="#FFFFFF" />
    <!-- Red Square is White for monochrome -->
    <rect x="300" y="100" width="40" height="40" fill="#FFFFFF" />
  </g>
</svg>`;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(OUT, 'monochrome-icon.png'));
  console.log('Generated monochrome-icon.png');

  console.log("All icons generated!");
}

generate().catch(console.error);
