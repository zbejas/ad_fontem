import { getLogger } from './logger';

const logger = getLogger();

class Config {
    DISCORD_BOT_TOKEN: string;
    DEBUG: boolean;
    YOUTUBE_API_KEY: string;
    OLLAMA_ENABLED: boolean;
    OLLAMA_ONLY: boolean;
    OLLAMA_URL: string;
    OLLAMA_MODEL: string;
    OLLAMA_PROMPT: string;

    constructor() {
        logger.info("Loading environment variables");

        // Using Bun.env instead of dotenv
        const env = Bun.env;

        this.DISCORD_BOT_TOKEN = env.DISCORD_BOT_TOKEN?.trim() || '';
        this.DEBUG = env.DEBUG?.trim().toLowerCase() === 'true';
        this.YOUTUBE_API_KEY = env.YOUTUBE_API_KEY?.trim() || '';
        this.OLLAMA_ENABLED = env.OLLAMA_ENABLED?.trim().toLowerCase() === 'true';
        this.OLLAMA_ONLY = env.OLLAMA_ONLY?.trim().toLowerCase() === 'true';
        this.OLLAMA_URL = env.OLLAMA_URL?.trim() || 'http://localhost:11434';
        this.OLLAMA_MODEL = env.OLLAMA_MODEL?.trim() || '';
        this.OLLAMA_PROMPT = env.OLLAMA_PROMPT?.trim() || '';

        logger.info("Bot will monitor all servers");

        if (!this.validateEnvVars()) {
            logger.error("Failed to load environment variables");
            logger.debug(`Environment variables: ${JSON.stringify(env)}`);
            return;
        }

        logger.info("Successfully loaded environment variables");
        logger.info(`Debug mode is set to: ${this.DEBUG}`);
        logger.debug(`Configuration: ${JSON.stringify(this.getSanitizedConfig(), null, 2)}`);
    }

    /**
     * Validates that all required environment variables are set
     * @returns True if all required variables are set, false otherwise
     */
    private validateEnvVars(): boolean {
        const requiredVars = ['DISCORD_BOT_TOKEN', 'YOUTUBE_API_KEY'];
        let allVarsSet = true;

        requiredVars.forEach(varName => {
            if (!this[varName as keyof Config]) {
                logger.error(`${varName} environment variable not set`);
                allVarsSet = false;
            }
        });

        // Additional validation for Ollama when enabled
        if (this.OLLAMA_ENABLED) {
            if (!this.OLLAMA_MODEL || this.OLLAMA_MODEL.trim() === '') {
                logger.error('OLLAMA_MODEL environment variable not set or empty, but Ollama is enabled');
                allVarsSet = false;
            }
            if (!this.OLLAMA_PROMPT || this.OLLAMA_PROMPT.trim() === '') {
                logger.error('OLLAMA_PROMPT environment variable not set or empty, but Ollama is enabled');
                allVarsSet = false;
            }
            if (!this.OLLAMA_URL || this.OLLAMA_URL.trim() === '') {
                logger.error('OLLAMA_URL environment variable not set or empty, but Ollama is enabled');
                allVarsSet = false;
            }
        }

        return allVarsSet;
    }

    /**
     * Creates a sanitized version of the config for logging, with sensitive values hidden
     * @returns Sanitized configuration object
     */
    private getSanitizedConfig(): Record<string, any> {
        const sanitized = { ...this };

        if (sanitized.DISCORD_BOT_TOKEN) {
            sanitized.DISCORD_BOT_TOKEN = this.obfuscateString(sanitized.DISCORD_BOT_TOKEN);
        }

        if (sanitized.YOUTUBE_API_KEY) {
            sanitized.YOUTUBE_API_KEY = this.obfuscateString(sanitized.YOUTUBE_API_KEY);
        }

        return sanitized;
    }

    /**
     * Obfuscates a string for display in logs
     * @param input - The string to obfuscate
     * @returns Obfuscated string with last 4 characters visible
     */
    private obfuscateString(input: string): string {
        const obfuscationLength = input.length - 4;
        return '*'.repeat(obfuscationLength) + input.slice(obfuscationLength);
    }
}

export const config = new Config();
