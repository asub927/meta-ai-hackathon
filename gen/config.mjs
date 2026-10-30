// U14 generator config. The model id lives here, not in code.
// Secrets and endpoint live in the environment, never in this file:
//   GEN_GATEWAY_URL  OpenAI-compatible chat-completions endpoint
//   GEN_GATEWAY_KEY  bearer key for that endpoint
//   GEN_MODEL        overrides `model` below when set
//   GEN_MAX_TOKENS   overrides `maxTokens` below when set (the harness
//                    gateway model thinks on every call, so live runs
//                    against it need headroom above the 1024 thinking budget)
export const config = {
  model: "claude-sonnet-4-6",
  maxTokens: Number(process.env.GEN_MAX_TOKENS) || 2000,
  temperature: 0,
};
