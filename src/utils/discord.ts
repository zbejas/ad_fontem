import { Client, GatewayIntentBits, Partials, Message } from 'discord.js';
import { getLogger } from './logger';
import { config } from './config';
import {
    findYouTubeLink,
    extractYouTubeVideoId,
    getVideoDetails,
    findOriginalContentLinks
} from './youtube';

const logger = getLogger();

/**
 * Discord client instance with configured intents and partials
 */
export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel],
});

/**
 * Handle the bot ready event - log connection details
 */
function handleBotReady() {
    logger.info(`Ad Fontem Bot connected as ${client.user?.tag}`);
    logger.info(`Connected to ${client.guilds.cache.size} guild(s):`);

    client.guilds.cache.forEach(guild => {
        logger.info(`- ${guild.name} (${guild.id})`);
    });

    logger.info('Bot is ready to monitor YouTube links in messages across all servers');
}

/**
 * Build message content for original content links
 */
async function buildOriginalContentMessage(originalLinks: string[]): Promise<{ content: string; validLinksFound: number }> {
    let messageContent = `🔗 **Original Content Found!**\n`;
    let validLinksFound = 0;

    // Process each original link
    for (let i = 0; i < originalLinks.length; i++) {
        const originalLink = originalLinks[i]!;
        logger.info(`Processing original content link ${i + 1}: ${originalLink}`);

        // Get original video details
        const originalVideoId = extractYouTubeVideoId(originalLink);
        if (originalVideoId) {
            const originalVideoDetails = await getVideoDetails(originalVideoId);
            if (originalVideoDetails) {
                validLinksFound++;
                if (originalLinks.length > 1) {
                    messageContent += `\n**Original Video ${i + 1}:** "${originalVideoDetails.title}"\n`;
                } else {
                    messageContent += `**Original Video:** "${originalVideoDetails.title}"\n`;
                }
                messageContent += `**Channel:** ${originalVideoDetails.channelTitle}\n`;
                messageContent += `**Link:** ${originalLink}\n`;
            } else {
                // Video not found, skip this link entirely
                logger.info(`Original video not found, skipping link: ${originalLink}`);
            }
        } else {
            // Non-YouTube original link - still include it
            validLinksFound++;
            if (originalLinks.length > 1) {
                messageContent += `\n**Original Content ${i + 1}:** ${originalLink}\n`;
            } else {
                messageContent += `**Link:** ${originalLink}\n`;
            }
        }
    }

    if (validLinksFound > 0) {
        messageContent += `\n*This appears to be a repost. Here's the original content.*`;
    }

    return { content: messageContent, validLinksFound };
}

/**
 * Process original content links and send reply if found
 */
async function processOriginalContent(message: Message, videoDetails: any) {
    const originalLinks = await findOriginalContentLinks(videoDetails.description);

    if (originalLinks.length > 0) {
        logger.info(`Found ${originalLinks.length} original content link(s)`);

        const { content: messageContent, validLinksFound } = await buildOriginalContentMessage(originalLinks);

        // Only send reply if we found at least one valid link
        if (validLinksFound > 0) {
            await message.reply({
                content: messageContent,
                allowedMentions: { repliedUser: false }
            });

            logger.info(`Replied with ${validLinksFound} valid original content link(s)`);
        } else {
            logger.info(`No valid original content links found (all videos unavailable)`);
        }
    } else {
        logger.debug(`No original content links found in description for: ${videoDetails.title}`);
    }
}

/**
 * Handle incoming messages and process YouTube links
 */
async function handleMessage(message: Message) {
    // Ignore bot messages and DMs (only process guild messages)
    if (message.author.bot || !message.guild) return;

    // Check if message contains a YouTube link
    const youtubeLink = findYouTubeLink(message.content);
    if (!youtubeLink) return;

    logger.info(`YouTube link detected from ${message.author.tag}: ${youtubeLink}`);

    try {
        // Extract video ID from the link
        const videoId = extractYouTubeVideoId(youtubeLink);
        if (!videoId) {
            logger.warn(`Could not extract video ID from: ${youtubeLink}`);
            return;
        }

        // Get video details from YouTube API
        const videoDetails = await getVideoDetails(videoId);
        if (!videoDetails) {
            logger.warn(`Could not fetch video details for ID: ${videoId}`);
            return;
        }

        logger.info(`Processing video: "${videoDetails.title}" by ${videoDetails.channelTitle}`);

        // Process original content links
        await processOriginalContent(message, videoDetails);

    } catch (error) {
        logger.error(`Error processing YouTube link ${youtubeLink}: ${error}`);
    }
}

/**
 * Initialize Discord bot and set up message monitoring for YouTube links
 */
export async function initializeBot() {
    client.once('ready', handleBotReady);
    client.on('messageCreate', handleMessage);
    client.on('error', error => {
        logger.error(`Discord client error: ${error}`);
    });

    return client.login(config.DISCORD_BOT_TOKEN);
}
