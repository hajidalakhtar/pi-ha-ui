# ha-ui

Custom Pi startup header.

## What it does

1. **Replaces the Pi startup header with a split layout** (mirroring
   [pi-custom-header](https://github.com/utpalsinghdev/pi-extensions/blob/main/packages/pi-custom-header/README.md),
   but keeping the art that already shipped with ha-ui):

   - **Left column** — ASCII-art **Maxwell the cat** (58 frames from
     `http://ascii.live/maxwell`, scaled to a compact 8-line height) styled in Dracula
     purple (`#bd93f9`). The 58 frames advance through an `unref`ed self-rescheduling
     timeout chain instead of a `setInterval`, one pending timer at a time, for **5 full
     rotations** (~23 s at 80 ms per frame) — after that the loop stops re-arming and the
     header never writes to the terminal again. The first keystroke or agent run ends the
     spin early, and `--header-static` skips it entirely. Narrow terminals drop the
     portrait, and a portrait over 39 columns wide is required for it to show at all.
   - **Right column** — Pi version next to `Ha-UI v1.0.0`, session ID, model, provider,
     thinking level, local date/time, and workspace name and path.
   - The two columns are separated by a `│` line.
   - **Footer** — a full-width `─` rule plus the slogan
     `Manusia akan di gantikan oleh AI? Saya akan lawan 󰈸󰈸`, both drawn in **bold red**
     (`theme.style(..., { fg: rgbColor(255, 0, 0), bold: true })`), rendered under both columns.

   On narrow terminals (below `portrait width + 39` columns) the portrait is hidden and
   the info stacks in a single column. Every rendered line is clipped to the terminal
   width.

2. **Hides the loaded-resource listing** in the startup header — the
   `[Context]`, `[Skills]`, `[Prompts]`, `[Extensions]` blocks.

## How the resource listing is hidden

The listing is rendered by Pi in a container separate from the logo, so `setHeader()`
alone cannot remove it. The supported switch is the global setting:

```json
// ~/.pi/agent/settings.json
{
  "quietStartup": "header"
}
```

- `"header"` — keeps the header (version + key hints), hides the model-scope line and
  the loaded-resource listing. ✅ what ha-ui uses
- `true` — hides the entire startup header.
- `false` — shows everything (default).

On `session_start` the extension ensures this value when it is missing/false, and
notifies you to restart Pi. Changes to `settings.json` take effect on the next start.

## Commands

| Command | Effect |
|---|---|
| `/ha-ui` | Toggle the ha-ui header on/off |
| `/ha-ui on` | Enable the ha-ui header |
| `/ha-ui off` | Restore the built-in Pi header |

## Flags

| Flag | Effect |
|---|---|
| `--header-static` | Skip the startup spin (Maxwell stays on the first frame) |

## Scrolling

In `"tuiMode": "regular"` Pi renders inline in the main screen, so **any** write to the
terminal — the header, streaming agent output, the status line — snaps the viewport back
to the bottom, and the terminal never reports its scroll position. That is why the spin is
finite: it is the only phase where the header writes on its own, and typing or sending a
prompt ends it immediately. Once the spin is over, scroll-up works whenever Pi itself is
idle. While an agent streams, Pi's own output still pulls the view down; that is
regular-mode physics, not the header.

To scroll up freely at any time *and* let Maxwell spin for as long as you like, use
fullscreen mode:

```json
// ~/.pi/agent/settings.json
{
  "tuiMode": "fullscreen"
}
```

Pi then owns the viewport: mouse wheel scrolls its scrollback, and output does not move
a view you have scrolled away from.

## Notes

- Only active in TUI mode (`ctx.mode === "tui"`).
- Restoring the built-in header does not bring the resource listing back; that is
  controlled by `quietStartup`.
