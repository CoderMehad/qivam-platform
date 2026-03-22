export type AppEnv = {
  Variables: {
    admin: { id: string; mosqueId: string };
    apiKey: { id: string; name: string; rateLimit: number; analyticsOptOut: boolean };
    requestId: string;
  };
};
