export declare module "preact/src/jsx" {
  namespace JSXInternal {
    interface IntrinsicElements {
      "weave-button": JSX.HTMLAttributes<HTMLElement> & {
        type?: "button" | "submit" | "reset";
        variant?: "outlined" | "flat" | "solid";
        density?: "high" | "medium";
        iconposition?: "left" | "right";
      };
      "weave-slider": Omit<
        JSXInternal.HTMLAttributes<HTMLInputElement>,
        "onInput"
      > & {
        onInput?: (e: CustomEvent<string>) => void;
      };
      "weave-input": JSXInternal.HTMLAttributes<HTMLInputElement> & {
        showlabel?: "true" | "false";
      };
    }
  }
}
