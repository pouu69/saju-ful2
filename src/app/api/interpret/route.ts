import OpenAI from 'openai';
import { SYSTEM_PROMPT, getRoomPrompt } from '@/lib/ai/prompts';
import { SajuResult } from '@/lib/saju/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  const { roomId, sajuResult, userName } = await request.json() as {
    roomId: string;
    sajuResult: SajuResult;
    userName: string;
  };

  const userPrompt = getRoomPrompt(roomId, sajuResult);

  const stream = await openai.chat.completions.create({
    model: 'gpt-5.2-nano',
    max_tokens: 1024,
    stream: true,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
  });

  const encoder = new TextEncoder();

  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content;
          if (text) {
            const data = `data: ${JSON.stringify({ text })}\n\n`;
            controller.enqueue(encoder.encode(data));
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (error) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'AI 해석 중 오류가 발생했습니다.' })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
