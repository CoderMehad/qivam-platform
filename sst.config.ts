import type { SSTConfig } from "sst";
import { MainStack } from "./stacks/MainStack";

export default {
  config() {
    return {
      name: "openislam",
      region: "eu-west-1",
    };
  },
  stacks(app) {
    app.stack(MainStack);
  },
} satisfies SSTConfig;
