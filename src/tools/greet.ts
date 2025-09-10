import { z } from "zod";
// Avoid importing types from xmcp to keep compatibility with Zod v4

// Define the schema for tool parameters
export const schema = {
  name: z.string().describe("The name of the user to greet"),
};

// Define tool metadata
export const metadata = {
  name: "greet",
  description: "Greet the user",
  annotations: {
    title: "Greet the user",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
} as const;

// Tool implementation
export default async function greet({ name }: { name: string }) {
  const result = `Hello, ${name}!`;

  return {
    content: [{ type: "text", text: result }],
  };
}
