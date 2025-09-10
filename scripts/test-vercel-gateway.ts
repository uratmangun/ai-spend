import { streamText } from 'ai';
import 'dotenv/config';

async function main() {
  const result = streamText({
    model: 'stealth/sonoma-sky-alpha',
    prompt: 'do you love me',
  
  });

  for await (const textPart of result.textStream) {
    process.stdout.write(textPart);
  }

  console.log();
  console.log('Token usage:', await result.usage);
  console.log('Finish reason:', await result.finishReason);
}

main().catch(console.error);