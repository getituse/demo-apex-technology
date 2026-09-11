import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "build/**",
      ".react-router/**",
      "node_modules/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      // Vendored UI UX Pro Max skill. Not our code; linting it produces hundreds of
      // errors from its bundled .cjs and Python helpers.
      ".github/prompts/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,

      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],

      // The brief bans raw HTML injection outright.
      "react/no-danger": "off",
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message: "dangerouslySetInnerHTML is banned. Render content as React nodes.",
        },
      ],

      // framer-motion is the legacy name of the same library; motion/react is current.
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "framer-motion",
              message:
                "Import from 'motion/react' instead — framer-motion is the legacy package name.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["scripts/**/*.mjs", "*.config.{ts,mts,mjs,js}"],
    languageOptions: { globals: globals.node },
  },
);
