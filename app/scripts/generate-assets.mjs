#!/usr/bin/env node
/**
 * Rendert die App-Store-Assets aus den Quell-SVGs in `app/assets/source/`.
 *
 * `sharp` ist bewusst KEINE Projekt-Abhaengigkeit (reines Build-Werkzeug fuer
 * Assets). Es wird einmalig in ein Wegwerf-Verzeichnis installiert und ueber
 * NODE_PATH eingebunden — package.json bleibt unberuehrt:
 *
 *   TMP=$(mktemp -d)
 *   npm --prefix "$TMP" i --no-save --no-audit --no-fund sharp@0.34.4
 *   NODE_PATH="$TMP/node_modules" node scripts/generate-assets.mjs
 *
 * Erzeugt:
 *   assets/icon.png           1024x1024, OHNE Alpha (App Store lehnt Transparenz ab)
 *   assets/adaptive-icon.png  1024x1024, MIT Alpha, Motiv in der zentralen 66% Safe Zone
 *   assets/splash-icon.png    1024x1024, MIT Alpha, reduzierte Variante fuer #1a1a2e
 *   assets/favicon.png         256x256,  OHNE Alpha
 */

import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';

const require = createRequire(import.meta.url);

let sharp;
try {
  sharp = require('sharp');
} catch {
  console.error(
    [
      'Fehler: `sharp` nicht gefunden.',
      '',
      'Dieses Skript so aufrufen (installiert nichts global und aendert package.json nicht):',
      '  TMP=$(mktemp -d)',
      '  npm --prefix "$TMP" i --no-save --no-audit --no-fund sharp@0.34.4',
      '  NODE_PATH="$TMP/node_modules" node scripts/generate-assets.mjs',
    ].join('\n'),
  );
  process.exit(1);
}

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(here, '..');
const srcDir = path.join(appRoot, 'assets', 'source');
const outDir = path.join(appRoot, 'assets');

/** Splash-Hintergrund aus app.json — nur als Flatten-Farbe fuer alphafreie Ziele. */
const BRAND_NAVY = { r: 0x1a, g: 0x1a, b: 0x2e };

const targets = [
  { src: 'icon.svg', out: 'icon.png', size: 1024, alpha: false },
  { src: 'adaptive-icon.svg', out: 'adaptive-icon.png', size: 1024, alpha: true },
  { src: 'splash-icon.svg', out: 'splash-icon.png', size: 1024, alpha: true },
  { src: 'icon.svg', out: 'favicon.png', size: 256, alpha: false },
];

for (const { src, out, size, alpha } of targets) {
  const svg = await fs.readFile(path.join(srcDir, src));

  let pipeline = sharp(svg, { density: 384 }).resize(size, size, {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  });

  // Ohne Alpha: auf Markenfarbe flatten, damit Apple keine Transparenz sieht.
  pipeline = alpha
    ? pipeline.ensureAlpha()
    : pipeline.flatten({ background: BRAND_NAVY }).removeAlpha();

  await pipeline.png({ compressionLevel: 9, palette: false }).toFile(path.join(outDir, out));

  const meta = await sharp(path.join(outDir, out)).metadata();
  console.log(
    `${out.padEnd(20)} ${meta.width}x${meta.height}  channels=${meta.channels}  alpha=${meta.hasAlpha}`,
  );

  if (meta.width !== size || meta.height !== size) {
    throw new Error(`${out}: erwartet ${size}x${size}, bekommen ${meta.width}x${meta.height}`);
  }
  if (meta.hasAlpha !== alpha) {
    throw new Error(`${out}: erwartet hasAlpha=${alpha}, bekommen ${meta.hasAlpha}`);
  }
}

console.log('\nFertig. Verifikation:');
console.log('  sips -g pixelWidth -g pixelHeight -g hasAlpha assets/icon.png');
