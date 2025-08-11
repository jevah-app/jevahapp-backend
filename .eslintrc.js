module.exports = {
  parser: "@typescript-eslint/parser",
  extends: ["eslint:recommended", "@typescript-eslint/recommended"],
  plugins: ["@typescript-eslint"],
  env: {
    node: true,
    es2021: true,
  },
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: "module",
  },
  rules: {
    // TypeScript specific rules
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-non-null-assertion": "warn",

    // General rules
    "no-console": "warn",
    "no-debugger": "error",
    "no-duplicate-imports": "error",
    "no-unused-expressions": "error",
    "prefer-const": "error",
    "no-var": "error",

    // Code quality rules
    complexity: ["warn", 10],
    "max-depth": ["warn", 4],
    "max-lines": ["warn", 300],
    "max-params": ["warn", 5],
  },
  ignorePatterns: ["dist/", "node_modules/", "*.js", "*.d.ts"],
};
