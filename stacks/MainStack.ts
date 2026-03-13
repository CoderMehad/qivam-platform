import { Api, Bucket, StackContext } from "sst/constructs";

export function MainStack({ stack }: StackContext) {
  const mediaBucket = new Bucket(stack, "MediaBucket");

  const api = new Api(stack, "Api", {
    routes: {
      "ANY /{proxy+}": "packages/functions/src/api.handler",
    },
  });

  stack.addOutputs({
    ApiEndpoint: api.url,
    BucketName: mediaBucket.bucketName,
  });

  return { api, mediaBucket };
}
