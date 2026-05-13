# Ollama Models

This app can compare multiple local and cloud-hosted Ollama models from the same UI.

## Configure Models

Add a comma-separated model list to `.env`:

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:3b
OLLAMA_MODELS=gpt-oss:120b-cloud,qwen3.5:cloud,gemini-3-flash-preview:cloud,ministral-3:8b-cloud,nemotron-3-nano:30b-cloud,qwen2.5:3b,qwen3:4b,gemma3:4b,llama3.2:3b,qwen2.5:14b
```

`OLLAMA_MODEL` is the default model. `OLLAMA_MODELS` controls which models appear in the selector.

## Pull Models

Sign in before pulling cloud-hosted models:

```bash
ollama signin
```

Cloud-hosted models:

```bash
ollama pull gpt-oss:120b-cloud
ollama pull qwen3.5:cloud
ollama pull gemini-3-flash-preview:cloud
ollama pull ministral-3:8b-cloud
ollama pull nemotron-3-nano:30b-cloud
```

Local models:

```bash
ollama pull qwen2.5:3b
ollama pull qwen3:4b
ollama pull gemma3:4b
ollama pull llama3.2:3b
ollama pull qwen2.5:14b
```

For this app's default local Ollama API setup, use local cloud tags such as `gpt-oss:120b-cloud`. The direct Ollama Cloud API uses model names such as `gpt-oss:120b`, but that requires using Ollama's remote API host and authentication.

## Cloud Model Metadata

Cloud models may appear in `ollama list` with `SIZE` shown as `-` or may be returned by Ollama's local API with a zero size. This is expected because the weights are hosted by Ollama Cloud instead of being stored locally.

The app displays cloud model weight as:

```text
Cloud-hosted
```

Known cloud models also get fallback metadata when Ollama does not return full details:

- `gpt-oss:120b-cloud`: GPT-OSS, 120B, cloud-hosted
- `qwen3.5:cloud`: Qwen 3.5, cloud-hosted
- `gemini-3-flash-preview:cloud`: Gemini 3 Flash Preview, cloud-hosted
- `ministral-3:8b-cloud`: Ministral 3 8B, cloud-hosted
- `nemotron-3-nano:30b-cloud`: Nemotron 3 Nano 30B total / 3.5B active, cloud-hosted

Use the exact model tags listed in `.env`; cloud model tags can be tag-specific and are not always available under generic names.

## Known Cloud Access Issue

Some cloud models may return a `403` response from Ollama Cloud:

```text
this model requires a subscription
```

This means the current Ollama account does not have access to that model. It is not an app bug. For comparison runs, remove unavailable cloud models from `OLLAMA_MODELS` unless the signed-in Ollama account has the required subscription.

Some cloud tags can also return:

```text
pull model manifest: file does not exist
```

If that happens, first check `ollama signin`, `ollama list`, and the local Ollama version. If the model still cannot be pulled, remove it from `OLLAMA_MODELS` until the tag is available to the local Ollama client.

Check installed models:

```bash
ollama list
```

## Use in the App

1. Start Ollama.
2. Start the app with `npm run dev`.
3. Open `http://localhost:3000`.
4. Choose a model in `Event Details` or `Ollama Settings`.
5. Generate the campaign.

The `Generated` panel shows the model used, timing metrics, and token counts. Generate the same test event with different models to compare output quality and latency.

## Structured Output Handling

Local Ollama models use structured output through a JSON schema in the backend request. This makes local responses more reliable for the campaign result shape.

Ollama Cloud models currently should not be treated as supporting structured outputs in the same way. For cloud models, the backend:

- asks the model to return only JSON;
- parses the response;
- retries once with a stricter JSON-only instruction if parsing fails;
- returns a clear error to the UI if the retry still does not produce valid campaign JSON.

If a cloud model fails with an invalid JSON error, try again, switch to another model, or reduce the requested post count.

## Missing Models

If a model is listed in `OLLAMA_MODELS` but has not been pulled, the app marks it as `Missing`. Pull it with:

```bash
ollama pull model-name:tag
```

Then refresh the app.
