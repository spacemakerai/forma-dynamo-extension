import {
  BrowserClient,
  Hub as SentryHub,
  makeFetchTransport,
  defaultStackParser,
} from "@sentry/browser";

const sentryClient = new BrowserClient({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  release: import.meta.env.VITE_SENTRY_RELEASE,
  integrations: [],
  enabled: true,
  transport: makeFetchTransport,
  stackParser: defaultStackParser,
});

const hub = new SentryHub(sentryClient);

export { hub as Sentry };
