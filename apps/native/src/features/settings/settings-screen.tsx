import { type ThemePreference, useSettingsStore } from "@/src/store/settings-store";
import { type ChipOption, OptionChips } from "@/src/ui/option-chips";
import { Screen } from "@/src/ui/screen";
import { Section } from "@/src/ui/section";

import { STANDARD_QUALITY_CHOICES } from "../download-options/choices";
import { DownloadOptionsForm } from "../download-options/download-options-form";
import { YtDlpCard } from "./yt-dlp-card";

const THEME_CHOICES: ReadonlyArray<ChipOption<ThemePreference>> = [
	{ value: "system", label: "System" },
	{ value: "light", label: "Light" },
	{ value: "dark", label: "Dark" },
];

const CONCURRENCY_CHOICES: ReadonlyArray<ChipOption<number>> = [
	{ value: 1, label: "One at a time" },
	{ value: 2, label: "2" },
	{ value: 3, label: "3" },
];

export function SettingsScreen() {
	const settings = useSettingsStore();

	return (
		<Screen>
			<Section title="Default download">
				<DownloadOptionsForm
					options={settings.defaults}
					qualityChoices={STANDARD_QUALITY_CHOICES}
					onChange={settings.updateDefaults}
				/>
			</Section>
			<Section title="Simultaneous downloads">
				<OptionChips
					accessibilityLabel="Simultaneous downloads"
					options={CONCURRENCY_CHOICES}
					selected={settings.maxConcurrentDownloads}
					onSelect={settings.setMaxConcurrentDownloads}
				/>
			</Section>
			<Section title="Appearance">
				<OptionChips
					accessibilityLabel="Theme"
					options={THEME_CHOICES}
					selected={settings.theme}
					onSelect={settings.setTheme}
				/>
			</Section>
			<Section title="Downloader">
				<YtDlpCard />
			</Section>
		</Screen>
	);
}
