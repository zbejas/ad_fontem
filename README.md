# Ad Fontem

[![GitHub build status](https://img.shields.io/github/actions/workflow/status/zbejas/ad_fontem/main.yml?label=main%20build)](https://github.com/zbejas/ad_fontem/actions/workflows/main.yml)
[![GitHub build status](https://img.shields.io/github/actions/workflow/status/zbejas/ad_fontem/dev.yml?label=dev%20build)](https://github.com/zbejas/ad_fontem/actions/workflows/dev.yml)
[![GitHub last commit](https://img.shields.io/github/last-commit/zbejas/ad_fontem)](https://github.com/zbejas/ad_fontem/commits/main)
[![GitHub issues](https://img.shields.io/github/issues/zbejas/ad_fontem)](https://github.com/zbejas/ad_fontem/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/zbejas/ad_fontem)](https://github.com/zbejas/ad_fontem/pulls)
[![GitHub license](https://img.shields.io/github/license/zbejas/ad_fontem)](https://github.com/zbejas/ad_fontem/blob/main/LICENSE.md)
[![Release](https://img.shields.io/github/v/release/zbejas/ad_fontem)](https://github.com/zbejas/ad_fontem/releases)
[![Repo size](https://img.shields.io/github/repo-size/zbejas/ad_fontem)](https://github.com/zbejas/ad_fontem/)
[![Docker Image Size (latest by date)](https://img.shields.io/docker/image-size/zbejas/ad_fontem?sort=date)](https://hub.docker.com/r/zbejas/ad_fontem)
[![Docker Pulls](https://img.shields.io/docker/pulls/zbejas/ad_fontem)](https://hub.docker.com/r/zbejas/ad_fontem)

**Ad Fontem** _(Latin: "to the source")_ is a Discord bot built with Bun and TypeScript that monitors YouTube links and identifies original content sources. It helps combat content theft by automatically finding and sharing the original creators when reaction videos or reposts are detected.

The bot was created to support original content creators and help communities discover the source material behind reaction videos and reposts. When someone shares a YouTube link, the bot analyzes the video description to find attribution to original content and replies with links to the source material.

> _Also, I dislike reaction content as it is quite a bit._

> [!IMPORTANT]
> This bot respects content creators' rights and focuses on proper attribution. It only identifies content that is explicitly credited in video descriptions, helping to promote original creators rather than replacing human judgment about fair use or copyright.

## ✨ Features

- **🔍 Smart Link Detection**: Automatically detects YouTube URLs in Discord messages across all servers
- **📝 Description Analysis**: Analyzes video descriptions to find original content attribution
- **🤖 AI-Powered Fallback**: Optional Ollama LLM integration for complex description parsing when regex patterns fail
- **⚡ Real-time Processing**: Instant analysis and response to YouTube links
- **🎯 Accurate Attribution**: Uses _"sophisticated"_ regex patterns and AI to identify genuine original content links
- **📊 Comprehensive Logging**: Winston-based logging with file rotation and debug modes
- **🐳 Docker Ready**: Fully containerized with Docker Compose support
- **🔧 Configurable**: Extensive environment variable configuration for different use cases

## 🚀 Installation

### Before You Start

You'll need to set up a few things before you can run the bot:

- **Discord Bot**: Create a bot on the [Discord Developer Portal](https://discord.com/developers/applications) and get the bot token
  - Follow the Discord.py guide to create a bot and get the token
  - Make sure to give the bot the necessary permissions: `bot`
  - Enable "Message Content Intent" in the bot settings
  - The bot will monitor ALL servers it's added to
- **YouTube API**: Get a YouTube Data API v3 key from the [Google Cloud Console](https://console.developers.google.com/). Instructions [here](https://developers.google.com/youtube/v3/getting-started).
- **Optional Ollama**: Set up [Ollama](https://ollama.ai/) for advanced AI-powered content analysis

> [!WARNING]
> Keep your bot token and API keys secure. Never share them publicly or commit them to version control. If compromised, regenerate them immediately through their respective platforms.

### 🐳 Docker (Recommended)

The easiest way to run Ad Fontem is using Docker Compose. A `compose.yml` file is provided in the repository.

1. **Clone the repository:**

   ```bash
   git clone https://github.com/zbejas/ad_fontem.git
   cd ad_fontem
   ```

2. **Configure environment variables:**

   ```bash
   cp .env.example .env
   ```

   Edit the `.env` file with your credentials (see Environment Variables section below).

3. **Start the bot:**

   ```bash
   docker compose up -d
   ```

> [!TIP]
> You can check the logs using:
>
> ```bash
> docker compose logs -f ad_fontem
> ```
>
> The `-f` flag follows the logs in real-time.

All application data and logs are stored in the container. You can check available Docker tags on the [Docker Hub page](https://hub.docker.com/r/zbejas/ad_fontem/tags).

### 📦 Manual Installation

> [!IMPORTANT]
> Manual installation requires [Bun](https://bun.sh/) to be installed on your system. Make sure you have Bun v1.0+ before proceeding.

1. **Clone and install dependencies:**

   ```bash
   git clone https://github.com/zbejas/ad_fontem.git
   cd ad_fontem
   bun install
   ```

2. **Configure environment variables:**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the bot:**

   ```bash
   bun run start
   ```

## ⚙️ Environment Variables

The application uses the following environment variables, which should be defined in a `.env` file (see `.env.example`):

### Required Configuration

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `DISCORD_BOT_TOKEN` | Discord bot token from Developer Portal | `abc1234` | ✔ |
| `YOUTUBE_API_KEY` | YouTube Data API v3 key from Google Cloud | `cba4321` | ✔ |

### Optional Configuration

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `DEBUG` | Enable verbose debug logging | `false` | `true` |
| `OLLAMA_ENABLED` | Enable Ollama AI analysis | `false` | `true` |
| `OLLAMA_URL` | Ollama server endpoint | `None` | `http://ollama:11434` |
| `OLLAMA_MODEL` | Ollama model to use | `None` | `llama3.1:8b` |
| `OLLAMA_ONLY` | Skip regex, use only AI analysis | `false` | `true` |
| `OLLAMA_PROMPT` | Custom prompt for AI analysis | _(see .env.example)_ | _(custom prompt)_ |

> [!TIP]
> The `OLLAMA_ONLY` setting is useful when regex patterns aren't catching complex attribution formats. The AI model can understand natural language attribution better than regex patterns.

## 🔧 How It Works

When someone posts a YouTube link in a Discord server where the bot is present:

1. **🔍 Link Detection**: Bot automatically identifies YouTube URLs in messages
2. **📊 API Fetch**: Retrieves video details and description using YouTube Data API v3
3. **🧠 Analysis Phase**:
   - **Regex First**: Searches for common attribution patterns like "Original:", "Credit:", "Reacts to:"
   - **AI Fallback**: If enabled, uses Ollama LLM for complex natural language analysis
4. **✅ Validation**: Verifies found links are valid YouTube URLs
5. **💬 Response**: Posts original content information with proper attribution

### Attribution Patterns Detected

The bot recognizes various attribution formats:

- `Original: https://youtube.com/watch?v=...`
- `Credit: https://youtube.com/watch?v=...`
- `Reacts to: https://youtube.com/watch?v=...`
- `From: https://youtube.com/watch?v=...`
- `Video by: https://youtube.com/watch?v=...`
- And many more natural language patterns via AI analysis

## 🐛 Troubleshooting

### Common Issues

- **Bot doesn't respond to links**: Check that "Message Content Intent" is enabled in Discord Developer Portal
- **API rate limits**: YouTube API has quotas; consider implementing caching for high-traffic servers
- **Ollama connection errors**: Ensure Ollama is running and accessible at the configured URL
- **No original content found**: Bot only finds explicitly credited content in descriptions

### Debug Mode

Enable debug logging to troubleshoot issues:

```env
DEBUG=true
```

This will provide detailed logs about:

- YouTube API requests and responses
- Regex pattern matching attempts
- Ollama AI analysis (if enabled)
- Discord message processing

### Logs

Application logs are stored in `logs/app.log` with automatic rotation:

- Maximum file size: 10MB
- Maximum files: 5
- Format: `YYYY-MM-DD HH:mm:ss [LEVEL] message`

---

**Ad Fontem** - _Supporting original content creators, one link at a time._ 🎬✨
