import * as Sentry from "@sentry/browser";
import { defaultStackParser, makeFetchTransport } from "@sentry/browser";
import { Forma } from "forma-embedded-view-sdk/auto";
import { ErrorInfo } from "preact";

export function captureException(
  error: Error | any,
  message: string,
  errorInfo?: ErrorInfo | undefined,
) {
  Sentry.addBreadcrumb({
    message: "Error info",
    data: {
      error,
      errorInfo,
    },
  });
  Sentry.withScope((scope) => {
    scope.setTags({
      owner: "ecosystem",
      projectId: Forma.getProjectId(),
    });
    Sentry.captureException(new Error(message));
  });
}

const enableSentry = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const origin = searchParams.get("origin");
  if (!origin) return false;

  const url = new URL(origin);
  const isHostForma = url.host.startsWith("app.autodeskforma");

  const isProduction =
    window.location.href.split("?")[0] === "https://spacemakerai.github.io/forma-dynamo-extension/";
  console.log("Sentry enabled: ", isHostForma && isProduction);
  return isHostForma && isProduction;
};

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  release: import.meta.env.VITE_SENTRY_RELEASE,
  enabled: enableSentry(),
  transport: makeFetchTransport,
  stackParser: defaultStackParser,
});

export { Sentry };
