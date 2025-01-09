export declare module "preact/src/jsx" {
  namespace JSXInternal {
    interface IntrinsicElements {
      "weave-button": JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
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
      "weave-search-box": JSXInternal.HTMLAttributes<HTMLInputElement> & {
        placeholder?: string;
        disabled?: boolean;
        variant?: "box" | "line";
        onclear?: (e: CustomEvent) => void;
        onInput?: (e: CustomEvent<string>) => void;
      };
      "weave-radio-button-group": {
        name?: string;
        key?: number;
        style?: object;
        children?: ComponentChildren;
        onChange?: (e: CustomEvent) => void;
      };
      "weave-radio-button": {
        key?: string;
        name?: string;
        value?: string;
        checked?: boolean;
        label?: string;
        children?: ComponentChildren;
        style?: string | object;
        id?: string;
        disabled?: boolean;
        onChange?: (e: CustomEvent) => void;
      };
      "weave-slider": Omit<JSXInternal.InputHTMLAttributes<HTMLInputElement>, "onInput"> & {
        onInput?: (e: CustomEvent<string>) => void;
      };
      "weave-input": JSXInternal.InputHTMLAttributes<HTMLInputElement> & {
        showlabel?: "true" | "false";
        variant?: "box" | "inline";
        label?: string | undefined;
      };
      "weave-checkbox": Omit<JSX.HTMLAttributes<HTMLElement>, "onChange"> & {
        checked?: boolean;
        onChange: (e: CustomEvent<{ checked: boolean }>) => void;
      };
      "forma-select-native": Omit<JSX.SelectHTMLAttributes<HTMLSelectElement>, "onChange"> & {
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
      "forma-tabs": {
        selectedtab?: number;
        gap?: string;
        children?: ComponentChildren;
        onChange?: (e: CustomEvent) => void;
      };
      "forma-tab": {
        for?: string;
        hpadding?: string;
        label?: string;
        disabled?: boolean;
      };
      "weave-tripple-dot": JSX.HTMLAttributes<HTMLElement>;

      "forma-context-menu": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > &
        any;
      "forma-context-menu-container": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > &
        any;

      "forma-context-menu": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > &
        any;
      "forma-context-menu-item": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > &
        any;
    }
  }
}
