import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import { SYSTEM_PROMPT, getRoomPrompt } from '@/lib/ai/prompts';
import { getTemplateInterpretation } from '@/lib/ai/templates';
import { SajuResult } from '@/lib/saju/types';

const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
};

const encoder = new TextEncoder();

function sseEncode(text: string): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify({ text })}\n\n`);
}

function sseDone(): Uint8Array {
  return encoder.encode('data: [DONE]\n\n');
}

function sseError(msg: string): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`);
}

// SDK 싱글톤 (모듈 레벨에서 한 번만 생성)
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const gemini = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

function streamTemplate(text: string): ReadableStream {
  const chunks = text.split('\n');
  return new ReadableStream({
    async start(controller) {
      for (const line of chunks) {
        controller.enqueue(sseEncode(line + '\n'));
        await new Promise(r => setTimeout(r, 50));
      }
      controller.enqueue(sseDone());
      controller.close();
    },
  });
}

async function streamOpenAI(userPrompt: string): Promise<ReadableStream> {
  const stream = await openai!.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    max_tokens: 1024,
    stream: true,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
  });

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content;
          if (text) controller.enqueue(sseEncode(text));
        }
        controller.enqueue(sseDone());
        controller.close();
      } catch {
        controller.enqueue(sseError('OpenAI 해석 중 오류가 발생했습니다.'));
        controller.close();
      }
    },
  });
}

async function streamGemini(userPrompt: string): Promise<ReadableStream> {
  const stream = gemini!.models.generateContentStream({
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    contents: [
      { role: 'user', parts: [{ text: `${SYSTEM_PROMPT}\n\n${userPrompt}` }] },
    ],
  });

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of await stream) {
          const text = chunk.text;
          if (text) controller.enqueue(sseEncode(text));
        }
        controller.enqueue(sseDone());
        controller.close();
      } catch {
        controller.enqueue(sseError('Gemini 해석 중 오류가 발생했습니다.'));
        controller.close();
      }
    },
  });
}

export async function POST(request: Request) {
  const { roomId, sajuResult } = await request.json() as {
    roomId: string;
    sajuResult: SajuResult;
  };

  const userPrompt = getRoomPrompt(roomId, sajuResult);

  let body: ReadableStream;

  if (openai) {
    body = await streamOpenAI(userPrompt);
  } else if (gemini) {
    body = await streamGemini(userPrompt);
  } else {
    const templateText = getTemplateInterpretation(roomId, sajuResult);
    body = streamTemplate(templateText);
  }

  return new Response(body, { headers: SSE_HEADERS });
}
