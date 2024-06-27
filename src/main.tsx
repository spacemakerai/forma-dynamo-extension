import { render } from "preact";
import { App } from "./app.tsx";
import "./styles.css";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import { Forma } from "forma-embedded-view-sdk/auto";

const isProd = import.meta.env.MODE === "production";
const callbackUrl = isProd
  ? `${window.location.origin}${window.location.pathname}`
  : `${window.location.origin}/`;
Forma.auth.configure({
  clientId: import.meta.env.VITE_EXTENSION_CLIENT_ID,
  callbackUrl,
  scopes: ["data:read", "data:write"],
});

render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
  document.getElementById("app")!,
);
