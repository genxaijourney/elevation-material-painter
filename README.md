# Elevation Material Painter

A standalone, single-file web app for **painting material take-offs** (stone, brick, siding, roof, trim…)
onto architectural CAD elevation drawings imported from PDF. No install, no server, no accounts — all
processing happens locally in the browser.

This is **step 1** of the elevation pipeline: paint the CAD → export a precise, pixel-aligned material
mask + color legend → feed it to the renderer so the AI never has to guess which region is which material.

## Use it
- **Live:** deployed on Vercel (see the deployment URL).
- **Local:** open `index.html` in **Chrome or Edge** (Firefox/Safari work too, minus direct-to-folder saving).

## What it does
- **Import PDF** elevation → auto **cleanup** removes hatch/stipple dots so flood-fill works on textured areas.
- **Fill** enclosed regions with a material color; **Line Repair** closes gaps; **Eraser** restores the original.
- **22 built-in materials**, each a fixed distinct color, so a downstream tool can map color → material reliably.
- **Zoom to 6400% with crisp pixels** and a **1px brush** (`[` / `]` to size) for pixel-level fine corrections.
- **Save Project** (`.matpaint.json` — raw + cleaned + painted images + legend), **Export PNG**, **Export Legend** (CSV/JSON).

Requires an internet connection the first time (to load the pdf.js renderer from a CDN); works offline after.
