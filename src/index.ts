import { initializeBot } from './utils/discord';
import { getLogger } from './utils/logger';

const logger = getLogger();

/**
 * Application entry point
 * Initializes and starts the Discord bot
 */
async function main() {
    try {
        logger.info('Starting Ad Fontem Bot...');
        await initializeBot();
        logger.info('Bot initialization completed successfully');
    } catch (error) {
        logger.error(`Failed to start bot: ${error}`);
        process.exit(1);
    }
}

// Start the application
main();