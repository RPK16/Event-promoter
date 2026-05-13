import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import type { CampaignResult, EventDetails, GeneratePostsRequestData, GenerationMetrics, OllamaModelInfo } from './src/types';

dotenv.config();

const PORT = 3000;
const DEFAULT_OLLAMA_BASE_URL = 'http://localhost:11434';
const DEFAULT_OLLAMA_MODEL = 'qwen2.5:7b';

type OllamaModelDetails = {
  family?: string;
  parameter_size?: string;
  quantization_level?: string;
};

type OllamaTag = {
  name: string;
  size?: number;
  modified_at?: string;
  digest?: string;
  details?: OllamaModelDetails;
};

type OllamaTagsResponse = {
  models?: OllamaTag[];
};

type OllamaGenerateResponse = {
  response?: string;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_duration?: number;
  eval_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
};

const campaignResultSchema = {
  type: 'object',
  properties: {
    marketingPlan: { type: 'string' },
    posts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          interval: { type: 'string' },
          channel: { type: 'string' },
          content: { type: 'string' },
          visualSuggestion: { type: 'string' },
          scheduledDate: { type: 'string' },
          scheduledTime: { type: 'string' },
        },
        required: ['id', 'interval', 'channel', 'content', 'visualSuggestion', 'scheduledDate', 'scheduledTime'],
      },
    },
  },
  required: ['marketingPlan', 'posts'],
} as const;

type OllamaGenerateRequest = {
  model: string;
  prompt: string;
  stream: false;
  options: {
    temperature: number;
    top_p: number;
    num_predict: number;
  };
  format?: typeof campaignResultSchema;
};

class UserFacingError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = 'UserFacingError';
    this.statusCode = statusCode;
  }
}

const knownCloudModelInfo: Record<string, OllamaModelInfo> = {
  'gpt-oss:120b-cloud': {
    size: 'Cloud-hosted',
    family: 'gpt-oss',
    parameterSize: '120B',
    quantizationLevel: 'Cloud',
  },
  'qwen3.5:cloud': {
    size: 'Cloud-hosted',
    family: 'qwen3.5',
    parameterSize: 'Cloud',
    quantizationLevel: 'Cloud',
  },
  'gemini-3-flash-preview:cloud': {
    size: 'Cloud-hosted',
    family: 'gemini-3-flash-preview',
    parameterSize: 'Cloud',
    quantizationLevel: 'Cloud',
  },
  'ministral-3:3b-cloud': {
    size: 'Cloud-hosted',
    family: 'ministral-3',
    parameterSize: '3B',
    quantizationLevel: 'Cloud',
  },
  'ministral-3:8b-cloud': {
    size: 'Cloud-hosted',
    family: 'ministral-3',
    parameterSize: '8B',
    quantizationLevel: 'Cloud',
  },
  'ministral-3:14b-cloud': {
    size: 'Cloud-hosted',
    family: 'ministral-3',
    parameterSize: '14B',
    quantizationLevel: 'Cloud',
  },
  'nemotron-3-nano:30b-cloud': {
    size: 'Cloud-hosted',
    family: 'nemotron-3-nano',
    parameterSize: '30B total / 3.5B active',
    quantizationLevel: 'Cloud',
  },
};

const nanosecondsToMilliseconds = (value: unknown) => {
  return typeof value === 'number' ? Math.round(value / 1_000_000) : undefined;
};

const bytesToGigabytes = (value: unknown) => {
  return typeof value === 'number' && value > 0 ? `${(value / 1024 / 1024 / 1024).toFixed(2)} GB` : undefined;
};

const isCloudModel = (name: unknown) => {
  return typeof name === 'string' && (name.includes(':cloud') || name.includes('-cloud'));
};

const errorMessage = (error: unknown) => {
  return error instanceof Error ? error.message : 'Unknown server error';
};

const errorStatusCode = (error: unknown) => {
  return error instanceof UserFacingError ? error.statusCode : 500;
};

const ollamaErrorMessage = async (response: Response, model: string) => {
  const errorText = await response.text();
  let ollamaMessage = errorText;

  try {
    const parsed = JSON.parse(errorText) as { error?: string };
    if (typeof parsed.error === 'string') {
      ollamaMessage = parsed.error;
    }
  } catch {
    // Ollama sometimes returns plain text instead of JSON.
  }

  const lowerMessage = ollamaMessage.toLowerCase();
  if (response.status === 403 && lowerMessage.includes('subscription')) {
    return `The selected Ollama Cloud model (${model}) requires a subscription on this Ollama account. Choose another model or upgrade/check Ollama Cloud access.`;
  }

  if (response.status === 401 || response.status === 403) {
    return `The selected Ollama model (${model}) is not accessible with the current Ollama account. Sign in with \`ollama signin\` or choose another model.`;
  }

  if (response.status === 404 || lowerMessage.includes('file does not exist') || lowerMessage.includes('manifest')) {
    return `The selected Ollama model (${model}) is not available locally. Pull it with \`ollama pull ${model}\` or choose another model.`;
  }

  return `Ollama could not generate with ${model}. ${ollamaMessage}`;
};

const configuredOllamaModels = (defaultModel: string) => {
  const models = (process.env.OLLAMA_MODELS || defaultModel)
    .split(',')
    .map(model => model.trim())
    .filter(Boolean);

  return models.length > 0 ? models : [defaultModel];
};

const fallbackModelInfo = (name: string): OllamaModelInfo | null => {
  if (knownCloudModelInfo[name]) {
    return { name, ...knownCloudModelInfo[name] };
  }

  return isCloudModel(name) ? { name, size: 'Cloud-hosted', quantizationLevel: 'Cloud' } : null;
};

const modelInfoFromOllama = (model: OllamaTag): OllamaModelInfo => {
  const fallback = fallbackModelInfo(model.name) ?? {};

  return {
    name: model.name,
    size: isCloudModel(model.name) ? 'Cloud-hosted' : bytesToGigabytes(model.size) ?? fallback.size,
    modifiedAt: model.modified_at,
    digest: model.digest,
    family: model.details?.family ?? fallback.family,
    parameterSize: model.details?.parameter_size ?? fallback.parameterSize,
    quantizationLevel: model.details?.quantization_level ?? fallback.quantizationLevel,
  };
};

const normalizeEvent = (value: unknown): EventDetails => {
  const event = value as Partial<EventDetails> | undefined;

  return {
    id: event?.id ?? '',
    companyName: event?.companyName ?? '',
    eventName: event?.eventName ?? '',
    eventDescription: event?.eventDescription ?? '',
    location: event?.location ?? '',
    startDate: event?.startDate ?? '',
    endDate: event?.endDate ?? '',
    ticketPrices: event?.ticketPrices ?? '',
    sponsors: Array.isArray(event?.sponsors) ? event.sponsors : [],
    visualAssets: Array.isArray(event?.visualAssets) ? event.visualAssets : [],
    primaryTargetAudience: event?.primaryTargetAudience ?? '',
    secondaryAudiences: Array.isArray(event?.secondaryAudiences) ? event.secondaryAudiences : [],
    channels: Array.isArray(event?.channels) && event.channels.length > 0 ? event.channels : ['General'],
    tone: event?.tone ?? 'Professional',
    postCount: typeof event?.postCount === 'number' && event.postCount > 0 ? event.postCount : 6,
    budget: event?.budget ?? '',
  };
};

const normalizeGeneratedResult = (value: unknown): Pick<CampaignResult, 'marketingPlan' | 'posts'> => {
  if (!value || typeof value !== 'object') {
    throw new Error('AI response was not a JSON object');
  }

  const candidate = value as Partial<CampaignResult>;
  const posts = Array.isArray(candidate.posts) ? candidate.posts : [];
  if (posts.length === 0) {
    throw new Error('AI response did not include any posts');
  }

  return {
    marketingPlan: typeof candidate.marketingPlan === 'string' ? candidate.marketingPlan : '',
    posts: posts.map((post, index) => ({
      id: typeof post?.id === 'string' ? post.id : String(index + 1),
      interval: typeof post?.interval === 'string' ? post.interval : 'Unscheduled',
      channel: typeof post?.channel === 'string' ? post.channel : 'General',
      content: typeof post?.content === 'string' ? post.content : '',
      visualSuggestion: typeof post?.visualSuggestion === 'string'
        ? post.visualSuggestion
        : typeof post?.suggestedImageUrl === 'string'
          ? post.suggestedImageUrl
          : '',
      scheduledDate: typeof post?.scheduledDate === 'string' ? post.scheduledDate : '',
      scheduledTime: typeof post?.scheduledTime === 'string' ? post.scheduledTime : '',
    })),
  };
};

const parseJsonObjectFromText = (rawOutput: string) => {
  try {
    return JSON.parse(rawOutput);
  } catch {
    const jsonMatch = rawOutput.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON object found in model response');
    }

    return JSON.parse(jsonMatch[0]);
  }
};

const buildCampaignPrompt = (event: EventDetails) => `
You are an expert social media manager. Generate a comprehensive marketing plan and promotional posts for this event.

Event Name: ${event.eventName}
Company: ${event.companyName}
Description: ${event.eventDescription}
Location: ${event.location}
Start Date: ${event.startDate}
End Date: ${event.endDate}
Ticket Prices/Earning Strategy: ${event.ticketPrices}
Sponsors: ${event.sponsors.map(sponsor => sponsor.name).filter(Boolean).join(', ')}

Marketing Strategy Context:
Primary Target Audience: ${event.primaryTargetAudience}
Secondary Audiences: ${event.secondaryAudiences.filter(Boolean).join(', ')}
Channels: ${event.channels.join(', ')}
Tone/Vibe: ${event.tone}
Total Budget: ${event.budget}
Target Post Count: ${event.postCount}

Requirements:
1. Create a "marketingPlan" summary of approximately 200 words.
2. Generate exactly ${event.postCount} promotional posts distributed across ${event.channels.join(', ')}.
3. For each post, include "id", "interval", "channel", "content", "visualSuggestion", "scheduledDate", and "scheduledTime".

Return only a valid JSON object. Do not wrap it in markdown and do not include explanatory text.
`;

const generationMetricsFromOllama = (responseBody: OllamaGenerateResponse, fallbackMs: number): GenerationMetrics => ({
  totalMs: nanosecondsToMilliseconds(responseBody.total_duration) ?? fallbackMs,
  loadMs: nanosecondsToMilliseconds(responseBody.load_duration),
  promptEvalMs: nanosecondsToMilliseconds(responseBody.prompt_eval_duration),
  responseEvalMs: nanosecondsToMilliseconds(responseBody.eval_duration),
  promptEvalCount: typeof responseBody.prompt_eval_count === 'number' ? responseBody.prompt_eval_count : undefined,
  responseEvalCount: typeof responseBody.eval_count === 'number' ? responseBody.eval_count : undefined,
});

async function startServer() {
  const app = express();
  const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || DEFAULT_OLLAMA_BASE_URL;
  const OLLAMA_MODEL = process.env.OLLAMA_MODEL || DEFAULT_OLLAMA_MODEL;
  const availableModelNames = configuredOllamaModels(OLLAMA_MODEL);

  app.use(express.json());

  app.get('/api/config-status', async (_req, res) => {
    let ollamaAvailable = false;
    let modelAvailable = false;
    let modelInfo: OllamaModelInfo | null = fallbackModelInfo(OLLAMA_MODEL);
    let models = availableModelNames.map(name => ({
      name,
      available: false,
      info: fallbackModelInfo(name),
    }));

    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
      if (response.ok) {
        ollamaAvailable = true;
        const data = await response.json() as OllamaTagsResponse;
        const installedModels = Array.isArray(data.models) ? data.models : [];

        models = availableModelNames.map(name => {
          const model = installedModels.find(item => item.name === name);

          return {
            name,
            available: Boolean(model),
            info: model ? modelInfoFromOllama(model) : fallbackModelInfo(name),
          };
        });

        const configuredDefaultModel = installedModels.find(item => item.name === OLLAMA_MODEL);
        modelAvailable = Boolean(configuredDefaultModel);
        modelInfo = configuredDefaultModel ? modelInfoFromOllama(configuredDefaultModel) : fallbackModelInfo(OLLAMA_MODEL);
      }
    } catch {
      ollamaAvailable = false;
    }

    res.json({
      ollamaAvailable,
      modelAvailable,
      baseUrl: OLLAMA_BASE_URL,
      modelId: OLLAMA_MODEL,
      modelInfo,
      models,
    });
  });

  app.post('/api/generate-posts', async (req, res) => {
    const body = req.body as Partial<GeneratePostsRequestData>;
    const event = normalizeEvent(body.event);
    const requestedModel = typeof body.model === 'string' ? body.model.trim() : '';
    const selectedModel = availableModelNames.includes(requestedModel) ? requestedModel : OLLAMA_MODEL;
    const generationStartedAt = performance.now();

    try {
      const cloudModel = isCloudModel(selectedModel);
      const maxAttempts = cloudModel ? 2 : 1;
      let responseBody: OllamaGenerateResponse | null = null;
      let parsedOutput: Pick<CampaignResult, 'marketingPlan' | 'posts'> | null = null;

      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        const retryInstruction = attempt > 1
          ? '\n\nPrevious response was not valid JSON. Retry now. Return ONLY a valid JSON object that matches the requested shape.'
          : '';

        const requestBody: OllamaGenerateRequest = {
          model: selectedModel,
          prompt: `${buildCampaignPrompt(event)}${retryInstruction}`,
          stream: false,
          options: {
            temperature: attempt > 1 ? 0.2 : 0.7,
            top_p: 0.9,
            num_predict: 3072,
          },
        };

        if (!cloudModel) {
          requestBody.format = campaignResultSchema;
        }

        const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new UserFacingError(await ollamaErrorMessage(response, selectedModel), response.status);
        }

        responseBody = await response.json() as OllamaGenerateResponse;
        if (typeof responseBody.response !== 'string') {
          throw new Error('Invalid Ollama response format');
        }

        try {
          parsedOutput = normalizeGeneratedResult(parseJsonObjectFromText(responseBody.response));
          break;
        } catch {
          console.error(`Failed to parse JSON from ${selectedModel} output, attempt ${attempt}:`, responseBody.response);
        }
      }

      if (!parsedOutput || !responseBody) {
        throw new Error(`The selected ${cloudModel ? 'cloud ' : ''}model (${selectedModel}) did not return valid campaign JSON after ${maxAttempts} attempt${maxAttempts === 1 ? '' : 's'}. Try again, choose another model, or reduce the number of posts.`);
      }

      const generationTimeMs = Math.round(performance.now() - generationStartedAt);
      const result: CampaignResult = {
        ...parsedOutput,
        modelId: selectedModel,
        generationTimeMs,
        generationMetrics: generationMetricsFromOllama(responseBody, generationTimeMs),
      };

      res.json(result);
    } catch (error) {
      console.error('Ollama Error:', error);
      res.status(errorStatusCode(error)).json({ error: errorMessage(error) });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
