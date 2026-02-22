import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { input, numShots } = await req.json();

    const prompt = `You are a professional film production assistant. Create a complete production package for this screenplay.

PROJECT DETAILS:
- Title: ${input.title}
- Duration: ${input.duration} seconds
- Aspect Ratio: ${input.aspectRatio}
- Number of Shots Needed: ${numShots} (calculated as 0.75 × duration)

SCREENPLAY:
${input.script}

Generate a complete production package with the following structure. Return as a JSON object:

{
  "package": {
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
  },
  "mjPrompts": [
    {
      "shotNumber": 1,
      "shotDescription": "Brief description",
      "firstFrame": "Detailed first frame description",
      "environment": {
        "country": "Country",
        "city": "City type",
        "exactSetting": "Exact location",
        "timeOfDay": "Time",
        "weather": "Weather",
        "ambientDetails": "Ambient sounds and details"
      },
      "subject": {
        "primarySubject": "Human/Object",
        "name": "Name",
        "ageRange": "Age range",
        "gender": "Gender",
        "ethnicity": "Ethnicity",
        "skin": "Skin description",
        "face": "Face description",
        "bodyType": "Body type"
      },
      "hair": {
        "hairStyle": "Style",
        "hairColor": "Color",
        "hairTexture": "Texture",
        "hairCondition": "Condition",
        "lightingOnHair": "How light hits hair"
      },
      "costume": {
        "fullOutfitDescription": "Full outfit",
        "colors": "Colors",
        "materials": "Materials",
        "fit": "Fit",
        "condition": "Condition",
        "accessories": "Accessories"
      },
      "action": {
        "primaryAction": "Main action",
        "bodyLanguage": "Body language",
        "microExpressions": "Micro expressions",
        "interaction": "Interaction"
      },
      "mood": {
        "emotionalTone": "Emotional tone",
        "atmosphere": "Atmosphere",
        "narrativeContext": "Context",
        "viewerFeeling": "Viewer feeling"
      },
      "cinematography": {
        "dopInspiredBy": "Famous cinematographer",
        "style": "Cinematic commercial realism",
        "camera": "ARRI Alexa Mini LF",
        "focalLength": "Lens mm",
        "aperture": "f/stop",
        "lightingSetup": "Lighting",
        "colorGrading": "Color grading",
        "filmGrain": "Subtle/None/Heavy",
        "aspectRatio": "${input.aspectRatio}"
      },
      "parameters": "--ar ${input.aspectRatio} --style raw --seed [unique seed]",
      "negatives": "cartoon, illustration, painting, CGI, plastic skin, beauty retouch, anime",
      "fullPrompt": "Complete Midjourney prompt with all details and --ar ${input.aspectRatio} --style raw --seed [number] --no [negatives]"
    }
  ]
}

IMPORTANT:
1. Generate EXACTLY ${numShots} shots distributed across the screenplay duration
2. Each shot should have a timestamp (00:XX format) that progresses through the duration
3. Shot durations should add up to approximately ${input.duration} seconds
4. MJ prompts must be extremely detailed following the exact structure above
5. The fullPrompt field should contain the complete Midjourney command
6. Use aspect ratio ${input.aspectRatio} in all prompts
7. Each shot should have a unique seed number (12345, 12346, etc.)
8. Include detailed character, environment, and costume packs based on the screenplay`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 8000,
    });

    const content = completion.choices[0].message.content;
    const data = JSON.parse(content || '{}');

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Generate package error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate package' },
      { status: 500 }
    );
  }
}
