import type { SSTConfig } from "sst";
import { MainStack } from "./stacks/MainStack";

export default {
  config() {
    return {
      name: "qivam",
      region: "eu-west-1",
    };
  },
  stacks(app) {
    app.stack(MainStack);
  },
} satisfies SSTConfig;
