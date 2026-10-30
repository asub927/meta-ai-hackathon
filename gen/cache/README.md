# gen/cache — recorded gateway responses

One file per model call: `<spec-id>.attempt<1|2>.json`, holding `{key, request, content}`.
The CLI replays a file when present and records after a live call.
`GEN_CACHE=replay` fails closed when the file is absent, so CI never needs
the network or the key.

`gen-stickers-31-12.attempt1.json` is a hand-authored fixture in recorded
shape, standing in for a gateway response. Delete it and run the CLI with
`GEN_GATEWAY_URL` and `GEN_GATEWAY_KEY` set to replace it with a live
recording. The harness gateway works too: `GEN_GATEWAY_PROTOCOL=anthropic`
with `ANTHROPIC_BASE_URL` and `ANTHROPIC_AUTH_TOKEN`, plus `GEN_MAX_TOKENS`
headroom (the harness model thinks long; the eval uses 16000).
Never commit keys here: responses only.
