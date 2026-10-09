# ha-ui

Custom Pi startup header.

## What it does

1. **Replaces the Pi block logo with an ASCII-art HA-UI bull** (coral body, `yellow`
   `HA-UI` wordmark) via `ctx.ui.setHeader()`. Below the logo sits a **bold red**
   tagline:

   ```
   Manusia akan digantikan oleh AI.  Hidup Jokowi !!
   ```
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

## Notes

- Only active in TUI mode (`ctx.mode === "tui"`).
- Restoring the built-in header does not bring the resource listing back; that is
  controlled by `quietStartup`.
