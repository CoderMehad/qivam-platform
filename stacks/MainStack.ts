import { Api, Bucket, RDS, StackContext } from "sst/constructs";

export function MainStack({ stack }: StackContext) {
  const mediaBucket = new Bucket(stack, "MediaBucket");

  const rds = new RDS(stack, "Database", {
    engine: "postgresql15.5",
    defaultDatabaseName: "openislam",
  });

  const api = new Api(stack, "Api", {
    defaults: {
      function: {
        bind: [rds],
      },
    },
    routes: {
      "ANY /{proxy+}": "packages/functions/src/api.handler",
    },
  });

  stack.addOutputs({
    ApiEndpoint: api.url,
    BucketName: mediaBucket.bucketName,
  });

  return { api, mediaBucket, rds };
}
