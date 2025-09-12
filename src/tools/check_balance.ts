import { z } from "zod";
// Avoid importing types from xmcp to keep compatibility with Zod v4

// Define the schema for tool parameters
export const schema = {
  name: z.string().describe("The name of the user to greet"),
};

// Define tool metadata
export const metadata = {
  name: "check_balance",
  description: "check ethereum address balance via coinbase api",
  annotations: {
    title: "check ethereum address balance via coinbase api",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
} as const;

// Tool implementation
export default async function check_balance({ name }: { name: string }) {
  const result = `Hello, ${name}!`;

  return {
    content: [{ type: "text", text: result }],
  };
}
