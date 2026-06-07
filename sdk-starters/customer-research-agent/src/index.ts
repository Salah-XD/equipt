import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "./prompts.js";

/**
 * customer-research-agent
 *
 * Usage:
 *   npm run start -- "<company name or URL>"
 *
 * Pipes a streaming research brief to stdout. Uses Anthropic's built-in
 * web search tool — no custom scrapers, no API keys beyond Anthropic.
 */

const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-4-5";

async function research(target: string): Promise<void> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY is not set. Copy .env.example to .env and fill it in.");
    process.exit(1);
  }

  const client = new Anthropic();

  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    tools: [
      {
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 8,
      },
    ],
    messages: [
      {
        role: "user",
        content: `Produce a research brief on: ${target}\n\nSearch the web as needed, then write the brief in the format specified in your instructions.`,
      },
    ],
  });

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      process.stdout.write(event.delta.text);
    }
  }
  process.stdout.write("\n");
}

const target = process.argv[2];
if (!target) {
  console.error('usage: npm run start -- "<company name or URL>"');
  process.exit(1);
}

research(target).catch((err) => {
  console.error("Error:", err.message || err);
  process.exit(1);
});
