/**
 * ha-ui — custom Pi startup header.
 *
 * 1. Hides the loaded-resource listing ("[Context]", "[Skills]", "[Extensions]",
 *    "[Prompts]", ...) by ensuring `quietStartup: "header"` in the global settings.
 *    `"header"` keeps the startup header (logo, version, key hints) but drops the
 *    model-scope line and the loaded-resource listing. `true` would hide the header too.
 *    The setting is written to ~/.pi/agent/settings.json and takes effect on the next start.
 *
 * 2. Replaces the Pi block logo with an ASCII-art HA-UI bull while keeping the
 *    version, adds a tagline under the logo, and a key-hint info line underneath
 *    the header.
 *
 * Commands:
 *   /ha-ui        toggle the ha-ui header on/off (off restores the built-in header)
 *   /ha-ui on     enable the ha-ui header
 *   /ha-ui off    restore the built-in header
 */

import type { ExtensionAPI, Theme } from "@earendil-works/pi-coding-agent";
import { VERSION } from "@earendil-works/pi-coding-agent";
import { foregroundAnsi, rgbColor, styleTextWithAnsi, truncateToWidth } from "@earendil-works/pi-tui";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const RESET = "\x1b[0m";

// Brand colors lifted from the built-in Pi logo.
const CORAL = rgbColor(228, 138, 122);
const YELLOW = rgbColor(234, 182, 93);
// Bold red used for the tagline.
const RED = rgbColor(255, 0, 0);

const TAGLINE = "Manusia akan digantikan oleh AI.  Hidup Jokowi !!";

/** The HA-UI bull ASCII art, one row per entry (no tabs, backend-agnostic). */
const HA_UI_ART = [
	`        _..---...,""-._     ,/}/)`,
	`     .''        ,      \`\`..'(/-<`,
	`    /   _      {      )         \\`,
	`   ;   _ \`.     \`.   <         a(`,
	` ,'   ( \\  )      \`.  \\ __.._ .: y`,
	`(  <\\_-) )'-.____...\\  \`._   //-'`,
	` \`. \`-' /-._)))      \`._)))`,
	`   \`...'         HA-UI`,
];

/**
 * Colorize the ASCII-art logo: coral body with a yellow "HA-UI" wordmark,
 * matching the built-in Pi brand palette.
 */
function bullLogoLines(theme: Theme): string[] {
	const mode = theme.getColorMode();
	const coral = (text: string) => `${foregroundAnsi(CORAL, mode)}${text}${RESET}`;
	const yellow = (text: string) => `${foregroundAnsi(YELLOW, mode)}${text}${RESET}`;

	const lines = HA_UI_ART.slice(0, -1).map(coral);
	const last = HA_UI_ART[HA_UI_ART.length - 1];
	const wordmarkAt = last.lastIndexOf("HA-UI");
	if (wordmarkAt < 0) {
		lines.push(coral(last));
		return lines;
	}
	lines.push(`${coral(last.slice(0, wordmarkAt))}${yellow(last.slice(wordmarkAt))}`);
	return lines;
}

/** Tagline rendered on the row right under the logo: bold red. */
function taglineLine(theme: Theme): string {
	return styleTextWithAnsi(TAGLINE, foregroundAnsi(RED, theme.getColorMode()), undefined, {
		bold: true,
	});
}

function createHaUiHeader(theme: Theme) {
	return {
		render(width: number): string[] {
			const art = bullLogoLines(theme);
			// Every line must fit the terminal width or Pi aborts the render.
			const lines = art.map((line, index) =>
				truncateToWidth(
					index === 0 ? `${line}  ${theme.fg("dim", `v${VERSION}`)}` : line,
					width,
					"",
				),
			);
			lines.push(truncateToWidth(taglineLine(theme), width, ""));
			return lines;
		},
		invalidate() {},
	};
}

const SETTINGS_PATH = join(homedir(), ".pi", "agent", "settings.json");

/**
 * Ensure the global settings hide the loaded-resource listing while keeping the
 * header. Safe to call repeatedly: it only writes when the value is missing/false.
 */
function ensureQuietStartup(): boolean {
	try {
		if (!existsSync(SETTINGS_PATH)) return false;
		const settings = JSON.parse(readFileSync(SETTINGS_PATH, "utf8")) as {
			quietStartup?: unknown;
		};
		if (settings.quietStartup === true || settings.quietStartup === "header") return false;
		settings.quietStartup = "header";
		writeFileSync(SETTINGS_PATH, `${JSON.stringify(settings, null, 2)}\n`, "utf8");
		return true;
	} catch {
		return false;
	}
}

export default function (pi: ExtensionAPI) {
	let enabled = true;

	pi.on("session_start", (_event, ctx) => {
		if (ctx.mode !== "tui") return;

		if (ensureQuietStartup()) {
			ctx.ui.notify(
				"ha-ui: hid the loaded-resource listing in settings.json — restart Pi to apply.",
				"info",
			);
		}

		enabled = true;
		ctx.ui.setHeader((_tui, theme) => createHaUiHeader(theme));
	});

	pi.registerCommand("ha-ui", {
		description: "Toggle the ha-ui custom header (on/off)",
		handler: async (args, ctx) => {
			if (ctx.mode !== "tui") {
				ctx.ui.notify("ha-ui only works in the terminal UI.", "warning");
				return;
			}

			const arg = (args ?? "").trim().toLowerCase();
			if (arg === "on") enabled = true;
			else if (arg === "off") enabled = false;
			else enabled = !enabled;

			ctx.ui.setHeader(enabled ? (_tui, theme) => createHaUiHeader(theme) : undefined);
			ctx.ui.notify(enabled ? "ha-ui header enabled." : "Built-in Pi header restored.", "info");
		},
	});
}
