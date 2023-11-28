import { captureException, Sentry } from "../../util/sentry";
import { ComponentChildren } from "preact";
import { useCallback, useErrorBoundary } from "preact/hooks";

export function useCustomErrorBoundary(): [unknown, () => void] {
  const [error, resetError] = useErrorBoundary((error, errorInfo) => {
    captureException(
      error,
      "Unknown error caught in error boundary",
      errorInfo,
    );
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
