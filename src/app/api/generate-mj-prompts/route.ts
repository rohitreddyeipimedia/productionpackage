import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { shots, characters, environments, input, startIndex } = await req.json();

    const shotsInfo = shots.map((s: any, i: number) => `
SHOT ${startIndex + i + 1}:
- Timestamp: ${s.timestamp}
- Framing: ${s.framing}
- Lens: ${s.lens}
- Movement: ${s.movement}
- Duration: ${s.duration}
- Description: ${s.description}
- Lighting: ${s.lighting}
`).join('\n');

    const prompt = `Generate detailed Midjourney prompts for these shots. Be EXTREMELY detailed - minimum 80 words for FIRST FRAME section.

PROJECT: ${input.title}
ASPECT RATIO: ${input.aspectRatio}

CHARACTERS:
${JSON.stringify(characters, null, 2)}

ENVIRONMENTS:
${JSON.stringify(environments, null, 2)}

SHOTS TO GENERATE PROMPTS FOR:
${shotsInfo}

Generate prompts for exactly these ${shots.length} shots. Return as JSON:

{
  "mjPrompts": [
    {
      "shotNumber": ${startIndex + 1},
      "shotDescription": "Brief description of what this shot shows",
      "firstFrame": "EXTREMELY DETAILED description of the first frame - minimum 80 words. Describe the exact composition, subject position, background elements, lighting quality, colors, textures, mood. Be specific about what is visible in the frame.",
      "environment": {
        "country": "Country",
        "city": "City type (Metropolitan/Urban/etc)",
        "exactSetting": "Exact location description",
        "timeOfDay": "Specific time",
        "weather": "Weather conditions",
        "ambientDetails": "Ambient sounds, atmosphere details"
      },
      "subject": {
        "primarySubject": "Human/Object",
        "name": "Character name",
        "ageRange": "Age range",
        "gender": "Gender",
        "ethnicity": "Ethnicity",
        "skin": "Detailed skin description - tone, texture, lighting on skin",
        "face": "Detailed face description - features, expression, lighting",
        "bodyType": "Body type and posture"
      },
      "hair": {
        "hairStyle": "Detailed hairstyle",
        "hairColor": "Hair color with lighting effects",
        "hairTexture": "Texture description",
        "hairCondition": "Condition",
        "lightingOnHair": "How light interacts with hair"
      },
      "costume": {
        "fullOutfitDescription": "Complete outfit description",
        "colors": "Specific colors",
        "materials": "Fabric materials",
        "fit": "How it fits",
        "condition": "Condition",
        "accessories": "All accessories"
      },
      "action": {
        "primaryAction": "Main action happening",
        "bodyLanguage": "Body language details",
        "microExpressions": "Facial micro-expressions",
        "interaction": "Interaction with environment/others"
      },
      "mood": {
        "emotionalTone": "Emotional tone",
        "atmosphere": "Atmosphere",
        "narrativeContext": "Context in story",
        "viewerFeeling": "What viewer should feel"
      },
      "cinematography": {
        "dopInspiredBy": "Famous cinematographer name",
        "style": "Cinematic commercial realism",
        "camera": "ARRI Alexa Mini LF",
        "focalLength": "Lens mm",
        "aperture": "f/stop for depth of field",
        "lightingSetup": "Detailed lighting setup",
        "colorGrading": "Color grading style",
        "filmGrain": "Subtle/None/Heavy",
        "aspectRatio": "${input.aspectRatio}"
      },
      "parameters": "--ar ${input.aspectRatio} --style raw --seed ${12345 + startIndex}",
      "negatives": "cartoon, illustration, painting, drawing, CGI, 3D render, plastic skin, beauty retouch, smooth skin, flawless skin, anime, manga, fantasy art, digital art, oversaturated colors, unnatural colors, distorted features, ugly, deformed, blurry, out of focus, watermark, text, logo, frame, border",
      "fullPrompt": "Complete detailed Midjourney prompt incorporating all above elements with --ar ${input.aspectRatio} --style raw --seed [number] --no [negatives]"
    }
  ]
}

CRITICAL:
1. FIRST FRAME must be MINIMUM 80 words - extremely detailed
2. Every section must be filled with specific details
3. fullPrompt should be a complete, ready-to-use Midjourney command
4. Use unique seed numbers for each shot`;

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
