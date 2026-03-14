import { Api, Config, StackContext } from "sst/constructs";

export function MainStack({ stack }: StackContext) {
  const NEON_DATABASE_URL = new Config.Secret(stack, "NEON_DATABASE_URL");
  const JWT_SECRET = new Config.Secret(stack, "JWT_SECRET");

  // TODO: Re-add Bucket for mosque media (S3) when needed
  // const mediaBucket = new Bucket(stack, "MediaBucket");

  const api = new Api(stack, "Api", {
    defaults: {
      function: {
        bind: [NEON_DATABASE_URL, JWT_SECRET],
        environment: {
          SST_STAGE: stack.stage,
        },
      },
      throttle: {
        rate: 100,
        burst: 200,
      },
    },
    routes: {
      "ANY /{proxy+}": "packages/functions/src/api.handler",
    },
  });

  stack.addOutputs({
    ApiEndpoint: api.url,
  });

  return { api };
}
