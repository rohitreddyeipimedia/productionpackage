import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { packs, input } = await req.json();

    const prompt = `Create Midjourney prompts for each shot in this production package.

Packs:
${JSON.stringify(packs, null, 2)}

For each shot, create a detailed Midjourney prompt with:
- Cinematic style
- Lighting description
- Camera angle
- Mood and atmosphere
- Aspect ratio (16:9)

Return as JSON array:
[
  {
    "shotId": "shot-id",
    "shotName": "Wide shot of house",
    "prompt": "cinematic wide shot of Victorian house exterior, golden hour lighting, 35mm film look, atmospheric, moody, --ar 16:9 --v 6"
  }
]`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0].message.content;
    const parsed = JSON.parse(content || '[]');
    const mjPrompts = Array.isArray(parsed) ? parsed : parsed.prompts || [];

    return NextResponse.json(mjPrompts);
  } catch (error: any) {
    console.error('Page 4 error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate MJ prompts' },
      { status: 500 }
    );
  }
}
