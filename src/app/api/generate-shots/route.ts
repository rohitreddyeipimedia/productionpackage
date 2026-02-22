import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { input, numShots, startIndex, totalShots } = await req.json();

    const prompt = `You are a professional film production assistant. Create ${numShots} shots for this screenplay.

PROJECT DETAILS:
- Title: ${input.title}
- Duration: ${input.duration} seconds
- Aspect Ratio: ${input.aspectRatio}
- This is batch starting at shot ${startIndex + 1} of ${totalShots} total shots
- Generate shots ${startIndex + 1} to ${startIndex + numShots}

SCREENPLAY:
${input.script}

Generate exactly ${numShots} shots. Return as JSON:

{
  "shots": [
    {
      "id": "shot-${startIndex + 1}",
      "shotNumber": ${startIndex + 1},
      "timestamp": "00:XX",
      "framing": "Wide/Mid/Close/Extreme Close",
      "lens": "24mm/35mm/50mm/85mm/135mm",
      "movement": "Static/Pan/Tilt/Dolly/Track/etc",
      "duration": "Xs",
      "description": "Detailed shot description",
      "lighting": "Lighting description"
    }
  ],
  "characters": [
    {
      "character": {
        "name": "Character Name",
        "ageRange": "30-40",
        "look": "Description",
        "mjPortraitPrompt": "Midjourney portrait prompt"
      },
      "outfit": "Clothing description",
      "materials": "Fabric materials",
      "condition": "Condition"
    }
  ],
  "environments": [
    {
      "setting": "Setting name",
      "timeOfDay": "Time",
      "lightingSetup": "Lighting",
      "atmosphere": "Atmosphere"
    }
  ]
}

IMPORTANT:
1. Generate EXACTLY ${numShots} shots in this batch
2. Timestamps should be distributed across the film duration
3. Keep descriptions concise but detailed
4. Include characters and environments only if startIndex is 0`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 4000,
    });

    const content = completion.choices[0].message.content;
    
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }
    
    // Validate JSON
    try {
      const data = JSON.parse(content);
      return NextResponse.json(data);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Content:', content.substring(0, 500));
      throw new Error('Invalid JSON response from OpenAI');
    }
  } catch (error: any) {
    console.error('Generate shots error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate shots' },
      { status: 500 }
    );
  }
}
