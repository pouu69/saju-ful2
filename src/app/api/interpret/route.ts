import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import { SYSTEM_PROMPT, FEW_SHOT_EXAMPLES, getInterpretationPrompt } from '@/lib/ai/prompts';
import { getTemplateInterpretation } from '@/lib/ai/templates';
import { SajuResult } from '@/lib/saju/types';
import { logger } from '@/lib/logger';

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
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL,
    })
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
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  await logger.info('OpenAI', 'Request', {
    model,
    baseURL: process.env.OPENAI_BASE_URL,
    userPrompt,
  });

  const stream = await openai!.chat.completions.create({
    model,
    max_completion_tokens: 8192,
    reasoning_effort: 'low',
    stream: true,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      ...FEW_SHOT_EXAMPLES,
      { role: 'user', content: userPrompt },
    ],
  });

  let fullResponse = '';
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content;
          if (text) {
            fullResponse += text;
            controller.enqueue(sseEncode(text));
          }
        }
        await logger.info('OpenAI', 'Response', { model, response: fullResponse });
        controller.enqueue(sseDone());
        controller.close();
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        await logger.error('OpenAI', 'Stream error', { model, error: errorMsg });
        controller.enqueue(sseError('OpenAI 해석 중 오류가 발생했습니다.'));
        controller.close();
      }
    },
  });
}

async function streamGemini(userPrompt: string): Promise<ReadableStream> {
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  await logger.info('Gemini', 'Request', { model, userPrompt });

  const fewShotContents = FEW_SHOT_EXAMPLES.map(ex => ({
    role: ex.role === 'assistant' ? 'model' as const : 'user' as const,
    parts: [{ text: ex.content }],
  }));

  const stream = gemini!.models.generateContentStream({
    model,
    config: { systemInstruction: SYSTEM_PROMPT },
    contents: [
      ...fewShotContents,
      { role: 'user', parts: [{ text: userPrompt }] },
    ],
  });

  let fullResponse = '';
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of await stream) {
          const text = chunk.text;
          if (text) {
            fullResponse += text;
            controller.enqueue(sseEncode(text));
          }
        }
        await logger.info('Gemini', 'Response', { model, response: fullResponse });
        controller.enqueue(sseDone());
        controller.close();
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        await logger.error('Gemini', 'Stream error', { model, error: errorMsg });
        controller.enqueue(sseError('Gemini 해석 중 오류가 발생했습니다.'));
        controller.close();
      }
    },
  });
}

export async function POST(request: Request) {
  const { interpretationType, sajuResult, partnerSajuResult } = await request.json() as {
    interpretationType: string;
    sajuResult: SajuResult;
    partnerSajuResult?: SajuResult;
  };

  const userPrompt = getInterpretationPrompt(interpretationType, sajuResult, partnerSajuResult);
  await logger.info('API', `POST /api/interpret`, { interpretationType });

  let body: ReadableStream;
  let provider: string;

  if (openai) {
    provider = 'OpenAI';
    body = await streamOpenAI(userPrompt);
  } else if (gemini) {
    provider = 'Gemini';
    body = await streamGemini(userPrompt);
  } else {
    provider = 'Template';
    const templateText = getTemplateInterpretation(interpretationType, sajuResult, partnerSajuResult);
    body = streamTemplate(templateText);
  }

  await logger.info('API', `Using provider: ${provider}`);
  return new Response(body, { headers: SSE_HEADERS });
}
