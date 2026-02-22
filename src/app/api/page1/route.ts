import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { script } = await req.json();

    const prompt = `Analyze this screenplay and extract:
1. Scene breakdown with locations
2. Characters in each scene
3. Time of day for each scene
4. Key visual elements

Screenplay:
${script}

Return as JSON with this structure:
{
  "scenes": [
    {
      "sceneNumber": 1,
      "location": "INT. HOUSE - DAY",
      "characters": ["CHARACTER NAME"],
n      "timeOfDay": "DAY",
      "keyElements": ["element1", "element2"]
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0].message.content;
    const analysis = JSON.parse(content || '{}');

    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error('Page 1 error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze script' },
      { status: 500 }
    );
  }
}
