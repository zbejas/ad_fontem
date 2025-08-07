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
 * Initialize Discord bot and set up message monitoring for YouTube links
 */
export async function initializeBot() {
    client.once('ready', async () => {
        logger.info(`Ad Fontem Bot connected as ${client.user?.tag}`);
        logger.info(`Connected to ${client.guilds.cache.size} guild(s):`);

        client.guilds.cache.forEach(guild => {
            logger.info(`- ${guild.name} (${guild.id})`);
        });

        logger.info('Bot is ready to monitor YouTube links in messages across all servers');
    });

    // Monitor messages for YouTube links
    client.on('messageCreate', async (message: Message) => {
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

            // Check for original content links in description
            const originalLinks = await findOriginalContentLinks(videoDetails.description);

            if (originalLinks.length > 0) {
                logger.info(`Found ${originalLinks.length} original content link(s)`);

                let messageContent = `🔗 **Original Content Found!**\n`;

                // Process each original link
                for (let i = 0; i < originalLinks.length; i++) {
                    const originalLink = originalLinks[i]!;
                    logger.info(`Processing original content link ${i + 1}: ${originalLink}`);

                    // Get original video details
                    const originalVideoId = extractYouTubeVideoId(originalLink);
                    if (originalVideoId) {
                        const originalVideoDetails = await getVideoDetails(originalVideoId);
                        if (originalVideoDetails) {
                            if (originalLinks.length > 1) {
                                messageContent += `\n**Original Video ${i + 1}:** "${originalVideoDetails.title}"\n`;
                            } else {
                                messageContent += `**Original Video:** "${originalVideoDetails.title}"\n`;
                            }
                            messageContent += `**Channel:** ${originalVideoDetails.channelTitle}\n`;
                            messageContent += `**Link:** ${originalLink}\n`;
                        } else {
                            // Just share the link if we can't get details
                            if (originalLinks.length > 1) {
                                messageContent += `\n**Original Content ${i + 1}:** ${originalLink}\n`;
                            } else {
                                messageContent += `**Link:** ${originalLink}\n`;
                            }
                        }
                    } else {
                        // Non-YouTube original link
                        if (originalLinks.length > 1) {
                            messageContent += `\n**Original Content ${i + 1}:** ${originalLink}\n`;
                        } else {
                            messageContent += `**Link:** ${originalLink}\n`;
                        }
                    }
                }

                messageContent += `\n*This appears to be a repost. Here's the original content.*`;

                await message.reply({
                    content: messageContent,
                    allowedMentions: { repliedUser: false }
                });

                logger.info(`Replied with ${originalLinks.length} original content link(s)`);
            } else {
                logger.debug(`No original content links found in description for: ${videoDetails.title}`);
            }

        } catch (error) {
            logger.error(`Error processing YouTube link ${youtubeLink}: ${error}`);
        }
    });

    client.on('error', error => {
        logger.error(`Discord client error: ${error}`);
    });

    return client.login(config.DISCORD_BOT_TOKEN);
}
