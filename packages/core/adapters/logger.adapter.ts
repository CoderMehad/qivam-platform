type LogLevel = "debug" | "info" | "warn" | "error";

const isProduction = process.env.SST_STAGE === "production";

export function log(
  level: LogLevel,
  message: string,
  extras?: Record<string, unknown>,
): void {
  if (level === "debug" && isProduction) return;

  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...extras,
  };

  const output = JSON.stringify(entry);

  switch (level) {
    case "error":
      console.error(output);
      break;
    case "warn":
      console.warn(output);
      break;
    default:
      console.log(output);
  }
}
