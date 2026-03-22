import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

const ses = new SESv2Client({ region: "eu-west-1" });

interface SendApiKeyEmailParams {
  to: string;
  name: string;
  apiKey: string;
  prefix: string;
}

export async function sendApiKeyEmail({ to, name, apiKey, prefix }: SendApiKeyEmailParams): Promise<void> {
  const command = new SendEmailCommand({
    FromEmailAddress: "Qivam <noreply@qivam.com>",
    Destination: { ToAddresses: [to] },
    Content: {
      Simple: {
        Subject: { Data: "Your Qivam API Key" },
        Body: {
          Text: {
            Data: [
              `Hi ${name},`,
              "",
              "Your Qivam API key is ready to use:",
              "",
              `  ${apiKey}`,
              "",
              `Key prefix: ${prefix}`,
              "",
              "Include it in requests via the X-API-Key header:",
              "",
              `  curl -H "X-API-Key: ${apiKey}" https://api.qivam.com/v1/mosques`,
              "",
              "API documentation: https://docs.qivam.com",
              "",
              "— Qivam",
            ].join("\n"),
          },
        },
      },
    },
  });

  await ses.send(command);
}
