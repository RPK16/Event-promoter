# PromoPulse

PromoPulse is an intelligent event marketing and campaign generation platform. It helps event organizers, small businesses, and marketing specialists automate the creation of professional marketing strategies and social media content tailored to their specific audience and goals.

## Core Features

- **Automated Marketing Strategy**: Generates a comprehensive executive summary outlining the campaign approach.
- **Multi-Channel Content**: Creates platform-specific posts for Instagram, Facebook, Email, and Twitter.
- **Targeted Messaging**: Optimizes content based on primary and alternative target audiences.
- **Custom Tone & Vibe**: Tailors the language to match your brand personality (e.g., Professional, Energetic, Formal).
- **Campaign Timeline**: Provides a structured schedule of posts with simulated dates and times leading up to the event.
- **Visual Asset Management**: Allows easy management of event imagery and sponsor logos.

## How to Run Locally

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **Ollama** running locally
- One or more configured Ollama models, for example `qwen2.5:3b`

### 1. Install Dependencies

```bash
npm install
```

### 2. Pull an Ollama Model

Install and start Ollama, then pull at least one model:

```bash
ollama pull qwen2.5:3b
```

You can verify that Ollama is available with:

```bash
ollama list
```

By default, the app expects Ollama at `http://localhost:11434`.

### 3. Configure Environment Variables

Create a `.env` file in the root directory (using `.env.example` as a template):

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:3b
OLLAMA_MODELS=gpt-oss:120b-cloud,qwen3.5:cloud,gemini-3-flash-preview:cloud,ministral-3:8b-cloud,nemotron-3-nano:30b-cloud,qwen2.5:3b,qwen3:4b,gemma3:4b,llama3.2:3b,qwen2.5:14b
```

`OLLAMA_MODEL` is the default model selected when the app starts. `OLLAMA_MODELS` is the comma-separated list shown in the model selector.

### 4. Start the Development Server

```bash
npm run dev
```

The app will be accessible at [http://localhost:3000](http://localhost:3000).

## Model Comparison

The app supports switching between multiple Ollama models from **Event Details** and **Ollama Settings**. See [`docs/ollama-models.md`](docs/ollama-models.md) for model configuration, cloud model notes, known access issues and comparison workflow.

## Verify Before Commit

Use these checks before committing changes:

```bash
npm run lint
npm run build
```

`npm run dev` starts the local development server. `npm run build` creates a production bundle and is useful as a final validation step before committing.

---

## Run with Docker

If you prefer to use Docker, first make sure the container can reach your Ollama instance.

### 1. Build the Image

```bash
docker build -t promopulse-app .
```

### 2. Run the Container on Windows/macOS

```powershell
docker run -p 3000:3000 ^
  -e OLLAMA_BASE_URL=http://host.docker.internal:11434 ^
  -e OLLAMA_MODEL=qwen2.5:3b ^
  -e OLLAMA_MODELS=gpt-oss:120b-cloud,qwen3.5:cloud,gemini-3-flash-preview:cloud,ministral-3:8b-cloud,nemotron-3-nano:30b-cloud,qwen2.5:3b,qwen3:4b,gemma3:4b,llama3.2:3b,qwen2.5:14b ^
  promopulse-app
```
