import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { generateUUID } from '@/lib/utils';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { analysis, input } = await req.json();

    const prompt = `Based on this screenplay analysis, create a detailed shot list.

Analysis:
${JSON.stringify(analysis, null, 2)}

Original Script (first 3000 chars):
${input.script.substring(0, 3000)}

Generate shots with:
- Scene numbers
- Shot numbers within each scene
- Shot descriptions
- Camera angles and movements
- Character actions

Return as JSON object with "shots" array:
{
  "shots": [
    {
      "id": "unique-id",
      "sceneNumber": 1,
      "shotNumber": 1,
      "name": "Wide shot of house exterior",
      "description": "Camera pans across the facade",
      "location": "EXT. HOUSE - DAY",
      "characters": ["CHARACTER"],
      "timeOfDay": "DAY"
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0].message.content;
    const parsed = JSON.parse(content || '{}');
    
    // Extract shots array from response
    let shots: any[] = [];
    if (parsed.shots && Array.isArray(parsed.shots)) {
      shots = parsed.shots;
    } else if (Array.isArray(parsed)) {
      shots = parsed;
    }

    const shotsWithIds = shots.map((shot: any) => ({
      ...shot,
      id: shot.id || generateUUID(),
    }));

    return NextResponse.json({ shots: shotsWithIds });
  } catch (error: any) {
    console.error('Page 2 error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate shots' },
      { status: 500 }
    );
  }
}
