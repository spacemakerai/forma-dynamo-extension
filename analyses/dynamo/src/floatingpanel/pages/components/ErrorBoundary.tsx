import { Sentry } from "../../util/sentry";
import { ComponentChildren } from "preact";
import { useCallback, useErrorBoundary } from "preact/hooks";
import { Forma } from "forma-embedded-view-sdk/auto";

export function useCustomErrorBoundary(): [unknown, () => void] {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const [error, resetError] = useErrorBoundary((error, errorInfo) => {
    Sentry.addBreadcrumb({
      message: "Error boundary triggered",
      data: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        error,
        errorInfo,
      },
    });
    Sentry.withScope((scope) => {
      scope.setExtra("errorinfo", errorInfo);
      scope.setTags({
        owner: "analyze-extensions",
        projectId: Forma.getProjectId(),
      });
      Sentry.captureException(error);
    });
  });

  const resetErrorWithBreadcrumb = useCallback(() => {
    Sentry.addBreadcrumb({ message: "Reset error boundary" });
    resetError();
  }, [resetError]);

  return [error, resetErrorWithBreadcrumb];
}

export function ErrorBoundary({ children }: { children: ComponentChildren }) {
  const [error, resetError] = useCustomErrorBoundary();
  if (!error) return <>{children}</>;
  return (
    <section class="error-view">
      <p class="error-title">Unexpected error occurred</p>
      <p>We have been notified of this error and will look into it.</p>
      <p>
        <weave-button
          variant="solid"
          density="high"
          onClick={() => {
            resetError();
          }}
        >
          Retry
        </weave-button>
      </p>
    </section>
  );
}
