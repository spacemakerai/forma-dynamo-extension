import * as Sentry from "@sentry/browser";
import { defaultStackParser, makeFetchTransport } from "@sentry/browser";

const enableSentry = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const origin = searchParams.get("origin");

  if (!origin) return false;

  const url = new URL(origin);
  return (
    url.host.startsWith("app.autodeskforma") &&
    window.location.href.split("?")[0] ===
      "https://spacemakerai.github.io/forma-extensions-samples/dynamo/dist/index.html"
  );
};

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  release: import.meta.env.VITE_SENTRY_RELEASE,
  enabled: enableSentry(),
  transport: makeFetchTransport,
  stackParser: defaultStackParser,
});

export { Sentry };
