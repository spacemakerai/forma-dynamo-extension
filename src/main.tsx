import { render } from "preact";
import { App } from "./app.tsx";
import "./styles.css";
import { ErrorBoundary } from "./pages/components/ErrorBoundary.tsx";

render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
  document.getElementById("app")!,
);
