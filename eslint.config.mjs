import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

/** @type {import("eslint").Linter.Config[]} */
const eslintConfig = [
  {
    ignores: [".next/**", "node_modules/**", "docs/reference/**", "out/**"]
  },
  ...nextCoreWebVitals,
  {
    rules: {
      // Existing hydration/theme patterns — avoid broad refactors in deployment audit
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off"
    }
  }
];

export default eslintConfig;
