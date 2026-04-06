import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Only error tracking — no performance tracing on the client
  // Performance is monitored via Vercel Speed Insights instead
  tracesSampleRate: 0,

  // Disable replays to save ~30KB of bundle size
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,

  enabled: process.env.NODE_ENV === "production",
});
