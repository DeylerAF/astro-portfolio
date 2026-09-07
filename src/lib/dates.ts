/** Years only. Months live in the YAML so they are on hand for LinkedIn and
 *  the CV, but the site reads better without them. */
export function formatPeriod(start: string, end?: string): string {
    const year = (value: string) => value.slice(0, 4);
    return `${year(start)} — ${end ? year(end) : "Present"}`;
}

export function isOngoing(end?: string): boolean {
    return end === undefined;
}

/** Sorts engagements newest first, with the ongoing ones on top. */
export function byMostRecent(
    a: { start: string; end?: string },
    b: { start: string; end?: string },
): number {
    if (isOngoing(a.end) !== isOngoing(b.end)) return isOngoing(a.end) ? -1 : 1;
    return b.start.localeCompare(a.start);
}
