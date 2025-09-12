import { streamText, UIMessage, convertToModelMessages, tool } from 'ai';
import { z } from 'zod';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const queryModel = url.searchParams.get('model') ?? undefined;
    const { messages, model: bodyModel }: { messages: UIMessage[]; model?: string } = await req.json();

    if (!Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Missing messages' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const chosenModel = (queryModel ?? bodyModel).trim();

    const result = streamText({
      model: chosenModel,
      messages: convertToModelMessages(messages),
      tools: {
        weather: tool({
          description: 'Get the weather in a location (fahrenheit)',
          inputSchema: z.object({
            location: z.string().describe('The location to get the weather for'),
          }),
          execute: async ({ location }: { location: string }) => {
            // Example stubbed tool implementation
            const temperature = Math.round(Math.random() * (90 - 32) + 32);
            return { location, temperature };
          },
        }),
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (err: any) {
    console.error('Chat API error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
