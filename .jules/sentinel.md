## 2026-03-01 - Exposed API Key in Vite Config
**Vulnerability:** The `GEMINI_API_KEY` was exposed in the client-side JavaScript bundle via the `define` configuration in `vite.config.ts`.
**Learning:** Vite's `define` property replaces variables globally in the source code during build. Injecting sensitive environment variables here, even if prefixed with `process.env`, exposes them to anyone who inspects the frontend code. This is a critical risk for any API key that shouldn't be public.
**Prevention:** Never use Vite's `define` (or `import.meta.env` without a `VITE_` prefix if not intended for public use) to inject sensitive keys. Sensitive operations requiring API keys should be moved to a secure backend or serverless function.
