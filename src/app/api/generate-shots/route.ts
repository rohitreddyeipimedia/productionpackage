import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { input, numShots } = await req.json();

    const prompt = `You are a professional film production assistant. Create shots, characters, and environments for this screenplay.

PROJECT DETAILS:
- Title: ${input.title}
- Duration: ${input.duration} seconds
- Aspect Ratio: ${input.aspectRatio}
- Number of Shots Needed: ${numShots} (calculated as 0.75 × duration)

SCREENPLAY:
${input.script}

Generate shots distributed across ${input.duration} seconds. Return as JSON:

{
  "shots": [
    {
      "id": "shot-1",
      "shotNumber": 1,
      "timestamp": "00:01",
      "framing": "Wide/Mid/Close/Extreme Close",
      "lens": "24mm/35mm/50mm/85mm/135mm",
      "movement": "Static/Pan/Tilt/Dolly/Track/etc",
      "duration": "2s",
      "description": "Detailed shot description",
      "lighting": "Lighting description"
    }
  ],
  "characters": [
    {
      "character": {
        "name": "Character Name",
        "ageRange": "30-40",
        "look": "Description of appearance and personality",
        "mjPortraitPrompt": "Detailed Midjourney portrait prompt"
      },
      "outfit": "Description of clothing",
      "materials": "Fabric materials",
      "condition": "Condition of clothing"
    }
  ],
  "environments": [
    {
      "setting": "Setting name",
      "timeOfDay": "Morning/Afternoon/Evening/Night",
      "lightingSetup": "Lighting description",
      "atmosphere": "Atmosphere description"
    }
  ]
}

IMPORTANT:
1. Generate EXACTLY ${numShots} shots
2. Distribute timestamps from 00:01 to 00:${input.duration}
3. Shot durations should add up to approximately ${input.duration} seconds
4. Include detailed character and environment packs based on the screenplay`;

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
    console.error('Generate shots error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate shots' },
      { status: 500 }
    );
  }
}
