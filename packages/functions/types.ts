export type AppEnv = {
  Variables: {
    admin: { id: string; mosqueId: string | null };
    apiKey: { id: string; name: string; rateLimit: number; analyticsEnabled: boolean };
    requestId: string;
  };
};
