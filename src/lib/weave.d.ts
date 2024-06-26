export declare module "preact/src/jsx" {
  namespace JSXInternal {
    interface IntrinsicElements {
      "weave-button": JSX.HTMLAttributes<HTMLElement> & {
        type?: "button" | "submit" | "reset";
        variant?: "outlined" | "flat" | "solid";
        density?: "high" | "medium";
        iconposition?: "left" | "right";
      };
      "weave-tooltip": JSXInternal.HTMLAttributes<HTMLElement> & {
        nub?:
          | "up-left"
          | "up-right"
          | "up-center"
          | "down-center"
          | "down-left"
          | "down-right"
          | "left-center"
          | "right-center";
        text?: string;
        description?: string;
        link?: string;
        closedelay?: number;
        width?: string;
        shortcutmac?: string;
        shortcutwindows?: string;
        splitshortcutonspace?: boolean;
      };
      "weave-slider": Omit<JSXInternal.HTMLAttributes<HTMLInputElement>, "onInput"> & {
        onInput?: (e: CustomEvent<string>) => void;
      };
      "weave-input": JSXInternal.HTMLAttributes<HTMLInputElement> & {
        showlabel?: "true" | "false";
      };
      "weave-checkbox": Omit<JSX.HTMLAttributes<HTMLElement>, "onChange"> & {
        checked?: boolean;
        onChange: (e: CustomEvent<{ checked: boolean }>) => void;
      };
      "forma-select-native": Omit<JSX.HTMLAttributes<HTMLSelectElement>, "onChange"> & {
        onChange?: (event: CustomEvent<{ value: string }>) => void;
      };
      "weave-progress-bar": {
        percentcomplete?: string;
      };
      "weave-skeleton-item": JSX.HTMLAttributes<HTMLElement> & {
        height?: string;
        width?: string;
        radius?: string;
      };
    }
  }
}
