import { z } from "zod";

// Define the schema for tool parameters
export const schema = {
  name: z.string().min(1).describe("The name of the user to greet"),
};

// Define tool metadata
export const metadata = {
  name: "greet",
  description: "Return a friendly greeting for the provided name",
  annotations: {
    title: "Simple greeting tool",
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
