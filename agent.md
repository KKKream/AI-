# Agent Guide

## Project Snapshot

- Project name: AI Background Studio
- Goal: a local web app that removes image backgrounds and exports transparent PNG files.
- Current maturity: runnable Vite + React app with production build verified.

## What The App Does Today

- Upload image files by click or drag and drop.
- Accept PNG, JPG, and WEBP input.
- Remove backgrounds in the browser with `@imgly/background-removal`.
- Let the user choose between a smaller fast model and a larger higher-quality model.
- Show model download progress during first use or preload.
- Preview original and processed output side by side.
- Download the result as a transparent PNG.

## Explicit Product Boundary

- This project currently supports AI background removal only.
- It does not provide a feature for removing third-party watermarks or copyright marks.

## Current Stack

- React 19
- Vite 8
- TypeScript 5
- `@imgly/background-removal`
- Browser-side ONNX runtime assets bundled into the build output

## Important Environment Notes

- Working directory: `D:/cursor/项目`
- Shell: PowerShell
- Use `npm.cmd`, not `npm`, because direct `npm` invocation is blocked by PowerShell execution policy in this environment.
- Node is available.
- Python tooling is not available, so the implementation direction is frontend-only.
- The file `ai-assistant-web-demo.code-workspace` points to a different directory and should be treated as stale unless the user says otherwise.

## Root Files That Matter

- `package.json`
  - Includes scripts for dev, build, and preview.
- `src/App.tsx`
  - Main UI and background-removal flow.
- `src/index.css`
  - App styling and responsive layout.
- `src/main.tsx`
  - React entry point.
- `index.html`
  - Root HTML shell.
- `dist/`
  - Production build output generated successfully on 2026-03-25.

## Commands

- Install dependencies:
  - `npm.cmd install`
- Start dev server:
  - `npm.cmd run dev`
- Build for production:
  - `npm.cmd run build`
- Preview production build:
  - `npm.cmd run preview`

## Verified State

- `npm.cmd run build` completed successfully on 2026-03-25.
- Build output exists in `dist/`.

## Notable Implementation Details

- The app uses browser-side processing, so the first run may download large model assets.
- Fast mode maps to `isnet_quint8`.
- Fine mode maps to `isnet_fp16`.
- Output is configured as PNG for transparent export.
- The current UI text is mostly English to avoid terminal encoding corruption during development in this environment.

## Useful Next Steps

1. Run `npm.cmd run dev` and do a manual browser check with a few real images.
2. Decide whether to keep the current English UI copy or localize it to Chinese once file encoding is handled cleanly.
3. If production hosting is needed later, consider hosting model assets explicitly and reviewing licensing requirements for `@imgly/background-removal`.
4. If the user wants more image-editing features, keep them within safe and legal boundaries such as owned-asset cleanup or generic object removal for user-controlled content.
