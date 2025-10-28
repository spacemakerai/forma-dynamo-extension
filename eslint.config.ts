import js from "@eslint/js";
import prettier from "eslint-plugin-prettier/recommended";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
  js.configs.recommended,
  // Ideally we should be using recommendedTypeChecked, but too much of existing code breaks with it.
  tseslint.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat["jsx-runtime"],
  reactHooks.configs.flat.recommended,
  {
    settings: {
      react: {
        version: "18",
      },
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      "prettier/prettier": "warn",
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/non-nullable-type-assertion-style": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "react/no-unknown-property": "off",
      "react/no-unescaped-entities": "off",
      "react/prop-types": "off",
    },
  },
  prettier,
  {
    ignores: ["dist/"],
  },
);
