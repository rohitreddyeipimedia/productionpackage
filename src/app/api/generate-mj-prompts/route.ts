import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { shots, characters, environments, input, startIndex } = await req.json();

    let visualContext = 'No visual references provided.';
    if (input.references && input.references.length > 0) {
      visualContext = input.references.map((ref: any, idx: number) => {
        return `${idx + 1}. [${ref.category.toUpperCase()}] ${ref.fileName}
   Context: "${ref.comment || 'No details provided'}"`;
      }).join('\n');
    }

    const visualNotes = input.visualStyleNotes || 'No additional visual notes.';

    const shotsInfo = shots.map((s: any, i: number) => `
SHOT ${startIndex + i + 1}:
- Timestamp: ${s.timestamp}
- Framing: ${s.framing}
- Description: ${s.description}
- Lighting: ${s.lighting}
`).join('\n');

    const prompt = `Generate detailed Midjourney prompts for these shots.

PROJECT: ${input.title}
ASPECT RATIO: ${input.aspectRatio}

VISUAL REFERENCES (MUST BE INCORPORATED):
${visualContext}

VISUAL DIRECTION:
${visualNotes}

SHOTS:
${shotsInfo}

Return JSON with detailed prompts incorporating all reference details.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 4000,
    });

    const content = completion.choices[0].message.content;
    const data = JSON.parse(content || '{}');

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Generate MJ prompts error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate MJ prompts' },
      { status: 500 }
    );
  }
}
