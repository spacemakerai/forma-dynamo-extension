import { DaasApp } from "./pages/DaasApp";
import { LocalApp } from "./pages/LocalApp";

const useDaas = new URLSearchParams(window.location.search).has("ext:daas");
const daasBetaOptIn = localStorage.getItem("daas-beta-opt") === "true";

export function App() {
  if (useDaas || daasBetaOptIn) {
    return <DaasApp />;
  }
  return <LocalApp />;
}
