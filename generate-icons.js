import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SOURCE = path.join(__dirname, 'public', 'rm-app-icon-source.png');
const PUBLIC = path.join(__dirname, 'public');

async function getIconBuffer() {
  return sharp(SOURCE).toBuffer();
}

async function generate() {
  console.log('🚀 Generating Material You compliant PWA icons from approved artwork...\n');

  const iconBuf = await getIconBuffer();

  // ── Standard icons (no padding) ──────────────────────────────
  await sharp(iconBuf).resize(512, 512).png().toFile(`${PUBLIC}/icon-512.png`);
  console.log('✅ icon-512.png  (512×512, purpose: any)');

  await sharp(iconBuf).resize(192, 192).png().toFile(`${PUBLIC}/icon-192.png`);
  console.log('✅ icon-192.png  (192×192, purpose: any)');

  await sharp(iconBuf).resize(180, 180).png().toFile(`${PUBLIC}/apple-touch-icon.png`);
  console.log('✅ apple-touch-icon.png  (180×180)');

  await sharp(iconBuf).resize(48, 48).png().toFile(`${PUBLIC}/favicon-48.png`);
  console.log('✅ favicon-48.png  (48×48)');
  await sharp(iconBuf).resize(32, 32).png().toFile(`${PUBLIC}/favicon.ico`);
  console.log('✅ favicon.ico  (32×32)');
  await sharp(iconBuf).resize(16, 16).png().toFile(`${PUBLIC}/favicon-16.png`);
  console.log('✅ favicon-16.png  (16×16)');

  // ── Material You / Adaptive maskable icon ────────────────────
  // Android requires content inside the "safe zone" = central 80% of the canvas
  // So we pad to 20% on each side → icon fills 60% of the total canvas (very safe)
  const MASK_SIZE = 512;
  const INNER = Math.round(MASK_SIZE * 0.60);     // icon = 60% of canvas
  const PAD   = Math.round((MASK_SIZE - INNER) / 2); // 20% padding each side

  const resizedInner = await sharp(iconBuf).resize(INNER, INNER).png().toBuffer();

  // Dark matte background (#0D0D0D) — matches app theme
  await sharp({
    create: {
      width: MASK_SIZE,
      height: MASK_SIZE,
      channels: 4,
      background: { r: 13, g: 13, b: 13, alpha: 1 }
    }
  })
    .composite([{ input: resizedInner, top: PAD, left: PAD }])
    .png()
    .toFile(`${PUBLIC}/maskable-icon.png`);

  console.log(`✅ maskable-icon.png  (${MASK_SIZE}×${MASK_SIZE}, icon at 60%, safe-zone 20%, purpose: maskable)`);

  // ── Also generate a 1024 version for Vercel/social sharing ──
  await sharp(iconBuf).resize(1024, 1024).png().toFile(`${PUBLIC}/icon-1024.png`);
  console.log('✅ icon-1024.png  (1024×1024, for social/store listings)');

  console.log('\n🏁 All Material You compliant icons generated!\n');
  console.log('📋 Summary:');
  console.log('  icon-512.png     → PWA standard icon');
  console.log('  icon-192.png     → PWA standard icon');
  console.log('  maskable-icon.png → Android adaptive (Material You)');
  console.log('  apple-touch-icon → iOS home screen');
  console.log('  favicon.ico      → Browser tab');
}

generate().catch(err => { console.error('Error:', err); process.exit(1); });
