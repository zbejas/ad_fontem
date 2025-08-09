import { getLogger } from './logger';

const logger = getLogger();

/**
 * Converts ISO 8601 duration (PT1H2M3S) to total seconds
 * @param duration ISO 8601 duration string from YouTube API
 * @returns Total seconds as number
 */
export function parseDuration(duration: string): number {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) {
        logger.warn(`Invalid duration format: ${duration}`);
        return 0;
    }

    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);

    return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Formats seconds into a human-readable duration string
 * @param totalSeconds Total seconds
 * @returns Formatted duration string (e.g., "1h 2m", "45m", "2m 30s")
 */
export function formatDuration(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts: string[] = [];

    if (hours > 0) {
        parts.push(`${hours}h`);
    }
    if (minutes > 0) {
        parts.push(`${minutes}m`);
    }
    if (seconds > 0 && hours === 0) { // Only show seconds if video is less than an hour
        parts.push(`${seconds}s`);
    }

    return parts.length > 0 ? parts.join(' ') : '0s';
}