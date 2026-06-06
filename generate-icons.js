import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The approved RM Bike Point icon image (1024x1024 with outer dark bg)
const sourceFile = 'C:/Users/chakr/.gemini/antigravity-ide/brain/69f53b83-6d90-47ba-9e38-2dd31b9af0d2/media__1780706101543.jpg';
const publicDir = path.join(__dirname, 'public');

async function generateIcons() {
  console.log('🔥 Generating icons from APPROVED RM Bike Point artwork...\n');

  // The source image is 1024×1024 with the icon centered
  // The actual rounded square starts ~at pixel 95 from each edge (outer dark bg ~9%)
  // We extract just the icon square by cropping the outer dark margin
  const meta = await sharp(sourceFile).metadata();
  console.log(`Source: ${meta.width}×${meta.height}`);

  const w = meta.width;
  const h = meta.height;

  // Crop the outer dark background — icon sits inside roughly 9% margin on each side
  const cropMargin = Math.round(w * 0.09);
  const cropSize = w - cropMargin * 2;

  // Extract the icon square
  const iconBuffer = await sharp(sourceFile)
    .extract({ left: cropMargin, top: cropMargin, width: cropSize, height: cropSize })
    .toBuffer();

  // icon-512.png
  await sharp(iconBuffer).resize(512, 512).png().toFile(`${publicDir}/icon-512.png`);
  console.log('✅ icon-512.png');

  // icon-192.png
  await sharp(iconBuffer).resize(192, 192).png().toFile(`${publicDir}/icon-192.png`);
  console.log('✅ icon-192.png');

  // apple-touch-icon.png (180×180)
  await sharp(iconBuffer).resize(180, 180).png().toFile(`${publicDir}/apple-touch-icon.png`);
  console.log('✅ apple-touch-icon.png');

  // maskable-icon.png — needs 20% safe zone padding, so icon should fill 80% of canvas
  // We add ~12.5% padding on each side to achieve 75% fill (safe zone)
  const maskableSize = 512;
  const innerSize = Math.round(maskableSize * 0.72); // icon at 72%, safe at ~14% each side
  const pad = Math.round((maskableSize - innerSize) / 2);
  const resizedForMask = await sharp(iconBuffer).resize(innerSize, innerSize).png().toBuffer();
  await sharp({
    create: { width: maskableSize, height: maskableSize, channels: 4, background: { r: 13, g: 13, b: 13, alpha: 1 } }
  })
    .composite([{ input: resizedForMask, top: pad, left: pad }])
    .png()
    .toFile(`${publicDir}/maskable-icon.png`);
  console.log('✅ maskable-icon.png (with safe zone padding)');

  // favicon.ico (32×32)
  await sharp(iconBuffer).resize(32, 32).png().toFile(`${publicDir}/favicon.ico`);
  console.log('✅ favicon.ico');

  // favicon-16.png
  await sharp(iconBuffer).resize(16, 16).png().toFile(`${publicDir}/favicon-16.png`);
  console.log('✅ favicon-16.png');

  // Also save full source as rm-app-icon source for reference
  await sharp(iconBuffer).resize(512, 512).png().toFile(`${publicDir}/rm-app-icon-source.png`);
  console.log('✅ rm-app-icon-source.png');

  console.log('\n🏁 All icons generated from the APPROVED artwork!');
}

generateIcons().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
