import { Axiom } from "@axiomhq/js";

type LogLevel = "debug" | "info" | "warn" | "error";

const stage = process.env.SST_STAGE ?? "dev";
const isProduction = stage === "production";

let axiomClient: Axiom | null = null;

function getAxiomClient(): Axiom | null {
  const token = process.env.AXIOM_TOKEN;
  const dataset = process.env.AXIOM_DATASET;
  if (!token || !dataset) return null;
  if (!axiomClient) {
    axiomClient = new Axiom({ token });
  }
  return axiomClient;
}

export function log(
  level: LogLevel,
  message: string,
  extras?: Record<string, unknown>,
): void {
  if (level === "debug" && isProduction) return;

  const entry = {
    level,
    message,
    stage,
    service: "qivam-api",
    timestamp: new Date().toISOString(),
    ...extras,
  };

  // Always write to console (CloudWatch)
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

  // Ship to Axiom in production (fire-and-forget)
  const axiom = getAxiomClient();
  if (axiom) {
    const dataset = process.env.AXIOM_DATASET!;
    axiom.ingest(dataset, [entry]);
    axiom.flush().catch(() => {
      // Silently ignore flush errors — CloudWatch is the fallback
    });
  }
}
