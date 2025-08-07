import { getLogger } from './logger';
import { config } from './config';

const logger = getLogger();

export interface VideoDetails {
    description: string;
    channelId: string;
    title: string;
    channelTitle: string;
}

/**
 * Extracts YouTube video ID from various YouTube URL formats
 * @param url The YouTube URL
 * @returns The video ID or null if not found
 */
export function extractYouTubeVideoId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }

    return null;
}

/**
 * Finds the first YouTube video link in a block of text using regex.
 * @param text The text to search within.
 * @returns The found URL or null.
 */
export function findYouTubeLink(text: string): string | null {
    const pattern = /(https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)[a-zA-Z0-9_-]{11})/;
    const match = text.match(pattern);
    return match ? match[0] : null;
}

/**
 * Fetches the description and channel ID of a YouTube video using its ID.
 * @param videoId The ID of the YouTube video.
 * @returns A promise that resolves to an object with description and channelId, or null.
 */
export async function getVideoDetails(videoId: string): Promise<VideoDetails | null> {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${config.YOUTUBE_API_KEY}`;

    try {
        logger.debug(`Fetching video details for ID: ${videoId}`);
        const response = await fetch(url);

        if (!response.ok) {
            logger.error(`YouTube API HTTP error! Status: ${response.status}`);
            return null;
        }

        const data = await response.json() as any;

        if (data.items && data.items.length > 0) {
            const snippet = data.items[0].snippet;
            logger.debug(`Found video: ${snippet.title} by ${snippet.channelTitle}`);
            return {
                description: snippet.description,
                channelId: snippet.channelId,
                title: snippet.title,
                channelTitle: snippet.channelTitle
            };
        } else {
            logger.warn(`Video with ID '${videoId}' not found.`);
            return null;
        }
    } catch (error) {
        logger.error("Failed to fetch video details:", error);
        return null;
    }
}

/**
 * Extracts original content links from video description using regex patterns
 * @param description The video description to analyze
 * @returns Array of found original content URLs
 */
export function extractOriginalContentLinks(description: string): string[] {
    const foundLinks: string[] = [];

    // Common patterns for original content attribution
    const patterns = [
        // "Original: https://..." or "Original video: https://..."
        /(?:original(?:\s+video)?|source):\s*(https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)[a-zA-Z0-9_-]{11})/gi,
        // "Credit: https://..." or "Credits: https://..."
        /credits?:\s*(https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)[a-zA-Z0-9_-]{11})/gi,
        // "From: https://..." 
        /from:\s*(https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)[a-zA-Z0-9_-]{11})/gi,
        // "Reacts to: https://..." or "Reacting to: https://..."
        /reacts?\s+to:\s*(https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)[a-zA-Z0-9_-]{11})/gi,
        // "Video by: https://..." 
        /video\s+by:\s*(https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)[a-zA-Z0-9_-]{11})/gi,
        // "By: https://..." 
        /by:\s*(https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)[a-zA-Z0-9_-]{11})/gi,
    ];

    // Extract links using specific patterns
    for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(description)) !== null) {
            if (match[1] && !foundLinks.includes(match[1])) {
                foundLinks.push(match[1]);
                logger.debug(`Found original content link with pattern: ${match[1]}`);
            }
        }
    }

    // If no specific patterns found, look for general attribution patterns
    if (foundLinks.length === 0) {
        const generalPattern = /(?:originally|source|credit|from|reacts?\s+to|video\s+by|by).*?(https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)[a-zA-Z0-9_-]{11})/gi;
        let match;
        while ((match = generalPattern.exec(description)) !== null) {
            if (match[1] && !foundLinks.includes(match[1])) {
                foundLinks.push(match[1]);
                logger.debug(`Found original content link with general pattern: ${match[1]}`);
            }
        }
    }

    return foundLinks;
}

/**
 * Legacy function for backward compatibility - returns first link found
 * @param description The video description to analyze
 * @returns The found original content URL or null
 */
export function extractOriginalContentLink(description: string): string | null {
    const links = extractOriginalContentLinks(description);
    return links.length > 0 ? links[0]! : null;
}

/**
 * Ollama LLM logic to extract links when regex fails (if enabled).
 * @param description The video description to analyze.
 * @returns A promise that resolves to an array of found URLs
 */
export async function extractLinksWithOllama(description: string): Promise<string[]> {
    // Check if Ollama is enabled in config
    if (!config.OLLAMA_ENABLED) {
        logger.debug("Ollama is disabled in configuration, skipping LLM extraction");
        return [];
    }

    logger.info("Trying advanced extraction with local LLM...");

    try {
        // Use configuration values for Ollama
        const prompt = `${config.OLLAMA_PROMPT} Text: '${description}'`;

        const ollamaResponse = await fetch(`${config.OLLAMA_URL}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: config.OLLAMA_MODEL,
                prompt: prompt,
                stream: false,
                keep_alive: 0
            })
        });

        if (!ollamaResponse.ok) {
            logger.warn(`Ollama server not available or error: ${ollamaResponse.status}`);
            return [];
        }

        const ollamaData = await ollamaResponse.json() as any;
        const response = ollamaData.response;

        logger.debug(`Ollama raw response: ${response}`);

        // Extract all YouTube links from the response
        const foundLinks: string[] = [];

        // First try to parse as array format [link1, link2]
        if (response.trim().startsWith('[') && response.trim().endsWith(']')) {
            try {
                // Remove brackets and split by comma
                const arrayContent = response.trim().slice(1, -1);
                const links = arrayContent.split(',').map((link: string) => link.trim().replace(/['"]/g, ''));

                logger.debug(`Found array format with ${links.length} potential links`);

                for (const link of links) {
                    logger.debug(`Processing array item: "${link}"`);
                    const validatedLink = findYouTubeLink(link);
                    if (validatedLink && !foundLinks.includes(validatedLink)) {
                        foundLinks.push(validatedLink);
                        logger.info(`Ollama found original content link: ${validatedLink}`);
                    }
                }
            } catch (error) {
                logger.debug(`Failed to parse array format, falling back to line-by-line: ${error}`);
            }
        }

        // If no links found with array parsing, fall back to line-by-line parsing
        if (foundLinks.length === 0) {
            const lines = response.split('\n');
            logger.debug(`Split response into ${lines.length} lines`);

            for (const line of lines) {
                logger.debug(`Processing line: "${line.trim()}"`);
                const validatedLink = findYouTubeLink(line.trim());
                if (validatedLink && !foundLinks.includes(validatedLink)) {
                    foundLinks.push(validatedLink);
                    logger.info(`Ollama found original content link: ${validatedLink}`);
                }
            }
        }

        return foundLinks;
    } catch (error) {
        logger.warn("Ollama extraction failed:", error);
        return [];
    }
}

/**
 * Legacy function for backward compatibility - returns first link found by Ollama
 */
export async function extractLinkWithOllama(description: string): Promise<string | null> {
    const links = await extractLinksWithOllama(description);
    return links.length > 0 ? links[0]! : null;
}

/**
 * Main function to find original content link from a video description
 * @param description The video description
 * @returns Promise that resolves to the original content URL or null
 */
export async function findOriginalContentLink(description: string): Promise<string | null> {
    // If OLLAMA_ONLY is enabled, skip regex and go straight to Ollama
    if (config.OLLAMA_ONLY && config.OLLAMA_ENABLED) {
        logger.debug("OLLAMA_ONLY mode enabled, skipping regex patterns");
        return await extractLinkWithOllama(description);
    }

    // First try regex patterns
    const regexResult = extractOriginalContentLink(description);
    if (regexResult) {
        return regexResult;
    }

    // If regex fails, try Ollama (if enabled in config)
    if (config.OLLAMA_ENABLED) {
        return await extractLinkWithOllama(description);
    }

    logger.debug("No original content link found and Ollama is disabled");
    return null;
}

/**
 * Main function to find ALL original content links from a video description
 * @param description The video description
 * @returns Promise that resolves to an array of original content URLs
 */
export async function findOriginalContentLinks(description: string): Promise<string[]> {
    // If OLLAMA_ONLY is enabled, skip regex and go straight to Ollama
    if (config.OLLAMA_ONLY && config.OLLAMA_ENABLED) {
        logger.debug("OLLAMA_ONLY mode enabled, skipping regex patterns");
        return await extractLinksWithOllama(description);
    }

    // First try regex patterns
    const regexResults = extractOriginalContentLinks(description);
    if (regexResults.length > 0) {
        return regexResults;
    }

    // If regex fails, try Ollama (if enabled in config)
    if (config.OLLAMA_ENABLED) {
        return await extractLinksWithOllama(description);
    }

    logger.debug("No original content links found and Ollama is disabled");
    return [];
}
