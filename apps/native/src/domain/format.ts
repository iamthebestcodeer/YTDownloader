const BYTE_UNITS = ["B", "KB", "MB", "GB", "TB"];

export function formatBytes(bytes: number): string {
	if (bytes < 1) return "0 B";
	const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), BYTE_UNITS.length - 1);
	const value = bytes / 1024 ** exponent;
	const digits = exponent === 0 || value >= 100 ? 0 : 1;
	return `${value.toFixed(digits)} ${BYTE_UNITS[exponent]}`;
}

/** 75 → "1:15", 3725 → "1:02:05". */
export function formatDuration(totalSeconds: number): string {
	const seconds = Math.max(0, Math.round(totalSeconds));
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const rest = seconds % 60;
	const paddedSeconds = String(rest).padStart(2, "0");
	if (hours === 0) return `${minutes}:${paddedSeconds}`;
	return `${hours}:${String(minutes).padStart(2, "0")}:${paddedSeconds}`;
}

/** 45 → "45s left", 600 → "10m left". */
export function formatEta(seconds: number): string {
	if (seconds < 60) return `${Math.max(0, Math.round(seconds))}s left`;
	if (seconds < 3600) return `${Math.round(seconds / 60)}m left`;
	return `${Math.floor(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m left`;
}
