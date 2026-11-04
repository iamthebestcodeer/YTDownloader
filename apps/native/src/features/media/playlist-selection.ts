/**
 * Which playlist videos are picked, as 1-based positions. `undefined` means all of them,
 * which keeps "whole playlist" the cheap default and the yt-dlp call unchanged.
 */
export type PlaylistSelection = readonly number[] | undefined;

export function isPicked(selection: PlaylistSelection, position: number): boolean {
	return selection === undefined || selection.includes(position);
}

export function pickedCount(selection: PlaylistSelection, total: number): number {
	return selection === undefined ? total : selection.length;
}

export function togglePosition(
	selection: PlaylistSelection,
	position: number,
	total: number,
): PlaylistSelection {
	const current = selection ?? allPositions(total);
	const next = current.includes(position)
		? current.filter((item) => item !== position)
		: [...current, position].sort((a, b) => a - b);
	return next.length === total ? undefined : next;
}

export function selectAll(): PlaylistSelection {
	return undefined;
}

export function selectNone(): PlaylistSelection {
	return [];
}

function allPositions(total: number): number[] {
	return Array.from({ length: total }, (_, index) => index + 1);
}
