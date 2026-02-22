import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { generateUUID } from '@/lib/utils';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { shots, input } = await req.json();

    const prompt = `Group these shots into production packs (shooting days/locations).

Shots:
${JSON.stringify(shots, null, 2)}

Create packs where:
- Each pack has shots from the same location
- Packs are organized logically for shooting
- Include equipment and personnel requirements

Return as JSON:
{
  "shots": [...original shots...],
  "packs": [
    {
      "id": "unique-id",
      "name": "House Interior Day",
      "shots": ["shot-id-1", "shot-id-2"],
      "location": "INT. HOUSE - DAY",
      "requirements": ["Camera A", "Lighting kit", "Actor: JOHN"]
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0].message.content;
    const packs = JSON.parse(content || '{}');

    if (packs.packs) {
      packs.packs = packs.packs.map((pack: any) => ({
        ...pack,
        id: pack.id || generateUUID(),
      }));
    }

    return NextResponse.json(packs);
  } catch (error: any) {
    console.error('Page 3 error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate packs' },
      { status: 500 }
    );
  }
}
