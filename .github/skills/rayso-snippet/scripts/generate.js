#!/usr/bin/env node
/**
 * ray.so snippet generator
 * Generates a PNG code snippet image by automating ray.so with Puppeteer.
 *
 * Usage:
 *   node generate.js --code "const x = 1" --language javascript --theme candy --output out.png
 *   node generate.js --file ./code.js --language typescript --theme midnight --output out.png
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      const val = argv[i + 1];
      if (val !== undefined && !val.startsWith('--')) {
        result[key] = val;
        i++;
      } else {
        result[key] = true;
      }
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Build the ray.so URL
// ---------------------------------------------------------------------------
function buildRaySoUrl(opts) {
  const {
    code,
    language = 'auto',
    theme = 'candy',
    background = 'true',
    darkMode = 'true',
    padding = '32',
    title = 'Untitled',
  } = opts;

  // ray.so expects base64-encoded code in the hash
  const encoded = Buffer.from(code).toString('base64');

  const params = new URLSearchParams({
    code: encoded,
    language,
    theme,
    background,
    darkMode,
    padding,
    title,
  });

  return `https://ray.so/#${params.toString()}`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const args = parseArgs(process.argv.slice(2));

  // Resolve the code to render
  let code = args.code;
  let tempFilePath = null; // track temp file for cleanup
  if (!code && args.file) {
    tempFilePath = path.resolve(args.file);
    if (!fs.existsSync(tempFilePath)) {
      console.error(`Error: file not found: ${tempFilePath}`);
      process.exit(1);
    }
    code = fs.readFileSync(tempFilePath, 'utf8');
  }

  if (!code) {
    console.error(
      'Usage:\n' +
      '  node generate.js --code "YOUR CODE" [options]\n' +
      '  node generate.js --file ./code.js [options]\n\n' +
      'Options:\n' +
      '  --language   javascript|typescript|python|rust|go|css|html|bash|json|sql|auto  (default: auto)\n' +
      '  --theme      candy|breeze|midnight|sunset|noir|ice|sand|forest|mono|jasmine|dreamscape  (default: candy)\n' +
      '  --background true|false  (default: true)\n' +
      '  --darkMode   true|false  (default: true)\n' +
      '  --padding    16|32|64|128  (default: 32)\n' +
      '  --title      snippet title  (default: Untitled)\n' +
      '  --output     output PNG path  (default: snippet.png)\n'
    );
    process.exit(1);
  }

  const outputPath = path.resolve(args.output || 'snippet.png');
  const url = buildRaySoUrl({ ...args, code });

  console.log(`Opening ray.so...`);
  console.log(`Theme: ${args.theme || 'candy'} | Language: ${args.language || 'auto'} | Padding: ${args.padding || '32'}`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // High-DPI viewport for crisp output
    await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 2 });

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for the code frame to render. ray.so uses CSS modules so class names
    // are hashed — we match on the partial class name patterns that have been
    // stable across versions.
    const frameSelector = await waitForFrame(page);

    if (!frameSelector) {
      throw new Error(
        'Could not locate the snippet frame on ray.so. ' +
        'The site layout may have changed. Check the selector in generate.js.'
      );
    }

    // Extra delay to let syntax highlighting and fonts settle
    await sleep(1500);

    const frameEl = await page.$(frameSelector);
    if (!frameEl) {
      throw new Error(`Frame element disappeared after being found: ${frameSelector}`);
    }

    await frameEl.screenshot({
      path: outputPath,
      omitBackground: true, // transparent background where applicable
    });

    console.log(`\nSaved snippet to: ${outputPath}`);

    // Auto-cleanup: delete the temp input file (unless --keepTempFile is set)
    if (tempFilePath && args.keepTempFile !== 'true') {
      fs.unlinkSync(tempFilePath);
      console.log(`Cleaned up temp file: ${tempFilePath}`);
    }
  } finally {
    await browser.close();
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Tries a series of known selectors for the ray.so frame element.
 * Returns the first matching selector, or null if none found.
 */
async function waitForFrame(page) {
  // These selectors are tried in priority order.
  // ray.so uses CSS modules with hashed names, so we match on partial[class*=] patterns.
  const candidates = [
    // Stable data-testid (if ray.so ever adds one)
    '[data-testid="frame"]',
    // Current ray.so CSS module class patterns (as of 2025-2026)
    '[class*="DefaultFrame-module"]',
    '[class*="Frame-module__"][class*="__outerFrame"]',
    '[class*="Frame-module__"][class*="__frameContainer"]',
    // CSS module class patterns used historically
    '[class*="Frame_frame"]',
    '[class*="frame__"]',
    '[class*="SnippetImage"]',
    // Generic outer wrapper fallback
    '[class*="EditorFrame"]',
    '[class*="editor-frame"]',
    // Last resort: the export canvas element
    'canvas',
  ];

  const timeout = 15000;
  const interval = 300;
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    for (const sel of candidates) {
      try {
        const el = await page.$(sel);
        if (el) return sel;
      } catch (_) {
        // ignore per-selector errors
      }
    }
    await sleep(interval);
  }

  return null;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
