import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  overwrite: true,
  schema: "graphql/schemas/**/*.graphqls",
  documents: "graphql/operations/**/*.graphql",
  generates: {
    "src/generated/": {
      preset: "client",
      plugins: [],
    },
  },
};

export default config;
