import type { SSTConfig } from "sst";
import { Database } from "./stacks/Database";
import { Storage } from "./stacks/Storage";
import { Api } from "./stacks/Api";

export default {
  config() {
    return {
      name: "openislam",
      region: "eu-west-1",
    };
  },
  stacks(app) {
    app.stack(Database).stack(Storage).stack(Api);
  },
} satisfies SSTConfig;
