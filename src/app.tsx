import { DaasApp } from "./pages/DaasApp";
import { LocalApp } from "./pages/LocalApp";

const useDaas = new URLSearchParams(window.location.search).has("ext:daas");

export function App() {
  if (useDaas) {
    return <DaasApp />;
  }
  return <LocalApp />;
}
