import sharp from 'sharp';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, 'public');

// Read the square app icon SVG
const appIconSvg = fs.readFileSync(path.join(publicDir, 'rm-app-icon.svg'));

async function generateIcons() {
  console.log('🔥 Generating RM Bike Point icons from approved artwork...\n');

  // 1. icon-512.png (standard)
  await sharp(appIconSvg)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-512.png'));
  console.log('✅ icon-512.png');

  // 2. icon-192.png (standard)
  await sharp(appIconSvg)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'icon-192.png'));
  console.log('✅ icon-192.png');

  // 3. apple-touch-icon.png (180x180)
  await sharp(appIconSvg)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✅ apple-touch-icon.png');

  // 4. maskable-icon.png
  // Android adaptive icon: logo must fit within 66% of canvas (20% safe zone on each side)
  // The SVG already has 20% padding baked in, so we just export at 512x512
  await sharp(appIconSvg)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'maskable-icon.png'));
  console.log('✅ maskable-icon.png (adaptive/maskable)');

  // 5. favicon.ico (32x32 PNG — browsers accept PNG favicons)
  await sharp(appIconSvg)
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon.ico'));
  console.log('✅ favicon.ico (32x32)');

  // 6. favicon-16.png (some browsers use 16x16)
  await sharp(appIconSvg)
    .resize(16, 16)
    .png()
    .toFile(path.join(publicDir, 'favicon-16.png'));
  console.log('✅ favicon-16.png (16x16)');

  console.log('\n🏁 All icons generated from approved RM artwork!');
}

generateIcons().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
