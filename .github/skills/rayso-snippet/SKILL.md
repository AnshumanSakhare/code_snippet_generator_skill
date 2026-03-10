---
name: rayso-snippet
description: "Generate beautiful code snippet PNG images using ray.so. Use when: creating shareable code images, exporting syntax-highlighted code as a styled PNG, turning a code block into a ray.so screenshot, capturing code snippets as images with themes like candy, breeze, midnight, sunset, noir, ice, sand, forest. Supports all languages, dark/light mode, padding control, background toggle."
argument-hint: "describe the snippet (e.g. 'generate a ray.so image for the selected code in TypeScript with candy theme')"
---

# ray.so Snippet Generator

Automates generating beautiful code snippet images from [ray.so](https://ray.so) using Puppeteer.

## When to Use

- User asks to "generate a ray.so image", "create a code snippet image", or "export code as PNG"
- User wants a shareable/presentable screenshot of a code block
- User wants to create a code image with a specific theme or language

## Prerequisites

Ensure Node.js is installed. Install dependencies once before first use:

```bash
cd .github/skills/rayso-snippet/scripts
npm install
```

## Procedure

### Step 1 — Gather Parameters

Collect the following from the user's request. Defaults are shown:

| Parameter    | Default     | Options |
|--------------|-------------|---------|
| `code`       | (required)  | any code string |
| `language`   | `auto`      | `javascript`, `typescript`, `python`, `rust`, `go`, `css`, `html`, `bash`, `json`, `sql`, `java`, `cpp`, `csharp`, `swift`, `kotlin`, `php`, `ruby`, `scala`, `yaml`, `markdown`, `auto` |
| `theme`      | `candy`     | `candy`, `breeze`, `midnight`, `sunset`, `noir`, `ice`, `sand`, `forest`, `mono`, `jasmine`, `dreamscape` |
| `background` | `true`      | `true`, `false` |
| `darkMode`   | `true`      | `true`, `false` |
| `padding`    | `32`        | `16`, `32`, `64`, `128` |
| `title`      | `Untitled`  | any string |
| `output`     | `snippet.png` | filename or path |
| `keepTempFile` | `false`   | `true`, `false` — set to `true` to keep the temp input file |

### Step 2 — Run the Generator

Run the script from the workspace root:

```bash
node .github/skills/rayso-snippet/scripts/generate.js \
  --code "YOUR CODE HERE" \
  --language javascript \
  --theme candy \
  --output snippet.png \
  --title "My Snippet" \
  --padding 32 \
  --darkMode true \
  --background true
```

**Windows (PowerShell):**
```powershell
node .github\skills\rayso-snippet\scripts\generate.js `
  --code "YOUR CODE HERE" `
  --language javascript `
  --theme candy `
  --output snippet.png `
  --title "My Snippet"
```

### Step 3 — Multi-line Code

For multi-line code, write it to a temp file and pass it:

```bash
node .github/skills/rayso-snippet/scripts/generate.js --file ./mycode.js --language typescript --theme midnight --output out.png
```

### Step 4 — Confirm Output

After the script runs, confirm the PNG was saved at the specified `--output` path and show it to the user.

The temp input file (passed via `--file`) is **automatically deleted** after the PNG is saved. Pass `--keepTempFile true` to skip deletion.

## Theme Previews

| Theme       | Description |
|-------------|-------------|
| `candy`     | Vibrant pink/purple gradient (default ray.so look) |
| `breeze`    | Soft blue/green gradient |
| `midnight`  | Dark blue/black |
| `sunset`    | Warm orange/red gradient |
| `noir`      | Clean black background |
| `ice`       | Cool cyan/blue pastel |
| `sand`      | Warm beige/tan |
| `forest`    | Deep green |
| `mono`      | Monochrome gray |

## Notes

- The script uses Puppeteer to automate ray.so and screenshot the rendered frame
- The output is a transparent-background PNG cropped to just the code frame
- First run may take longer as Puppeteer downloads Chrome
- If the website layout changes and the script fails, check the selector in `scripts/generate.js`
