import { render } from "preact";
import { App } from "./app.tsx";
import "./styles.css";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";

render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
  document.getElementById("app")!,
);
