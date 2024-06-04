import { DaasApp } from "./pages/DaasApp";
import { LocalApp } from "./pages/LocalApp";

const useDaas = localStorage.getItem("useDaas") === "true";

console.log(localStorage.getItem("useDaas"));

export function App() {
  if (useDaas) {
    return <DaasApp />;
  }
  return <LocalApp />;
}
