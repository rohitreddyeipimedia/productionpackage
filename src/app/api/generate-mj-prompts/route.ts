import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { shots, characters, environments, input, startIndex } = await req.json();

    // Build rich visual context from references
    let visualContext = 'No visual references provided.';
    if (input.references && input.references.length > 0) {
      visualContext = input.references.map((ref: any) => {
        let contextDetails = `[${ref.category.toUpperCase()} REFERENCE: ${ref.fileName}]\n`;
        contextDetails += `User Notes: "${ref.comment}"\n`;
        if (ref.type === 'image') {
          contextDetails += `Type: Image Reference (visual details should be extracted from user notes)\n`;
        } else {
          contextDetails += `Type: Document Reference\n`;
        }
        return contextDetails;
      }).join('\n---\n');
    }

    const visualNotes = input.visualStyleNotes || 'No additional visual notes.';

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

    const prompt = `You are an expert film visual consultant and Midjourney prompt engineer. Generate detailed Midjourney prompts for these shots.

PROJECT: ${input.title}
ASPECT RATIO: ${input.aspectRatio}

VISUAL REFERENCES PROVIDED BY USER (CRITICAL - MUST BE INCORPORATED):
${visualContext}

OVERALL VISUAL DIRECTION:
${visualNotes}

CHARACTERS:
${JSON.stringify(characters, null, 2)}

ENVIRONMENTS:
${JSON.stringify(environments, null, 2)}

SHOTS TO GENERATE PROMPTS FOR:
${shotsInfo}

MANDATORY INSTRUCTIONS:
1. You MUST use specific details from the VISUAL REFERENCES in every prompt
2. For CAST references: Exact physical traits, hair style, face structure, ethnicity from user notes
3. For COSTUME references: Specific garments, colors, materials, fit, condition as described
4. For ENVIRONMENT references: Exact location type, geography, architecture, time of day
5. For MOOD references: Specific color palette, emotional tone, cinematic style
6. For LIGHTING references: Exact lighting setup, shadows, color temperature, quality of light

Generate prompts for exactly these ${shots.length} shots. Return as JSON:

{
  "mjPrompts": [
    {
      "shotNumber": ${startIndex + 1},
      "shotDescription": "Brief description of what this shot shows",
      "firstFrame": "EXTREMELY DETAILED description of the first frame - minimum 80 words. Describe exact composition, subject position, background elements, lighting quality, colors, textures, mood. Be specific about what is visible in the frame. INCORPORATE VISUAL REFERENCE DETAILS HERE.",
      "environment": {
        "country": "Country",
        "city": "City type (Metropolitan/Urban/etc)",
        "exactSetting": "Exact location description using environment references",
        "timeOfDay": "Specific time",
        "weather": "Weather conditions",
        "ambientDetails": "Ambient sounds, atmosphere details"
      },
      "subject": {
        "primarySubject": "Human/Object",
        "name": "Character name",
        "ageRange": "Age range from cast references",
        "gender": "Gender",
        "ethnicity": "Ethnicity from cast references",
        "skin": "Detailed skin description - tone, texture, lighting on skin",
        "face": "Detailed face description - features, expression, lighting matching cast ref",
        "bodyType": "Body type and posture"
      },
      "hair": {
        "hairStyle": "Detailed hairstyle from cast references",
        "hairColor": "Hair color with lighting effects",
        "hairTexture": "Texture description",
        "hairCondition": "Condition",
        "lightingOnHair": "How light interacts with hair"
      },
      "costume": {
        "fullOutfitDescription": "Complete outfit description using costume references",
        "colors": "Specific colors from references",
        "materials": "Fabric materials from references",
        "fit": "How it fits",
        "condition": "Condition from references",
        "accessories": "All accessories from references"
      },
      "action": {
        "primaryAction": "Main action happening",
        "bodyLanguage": "Body language details",
        "microExpressions": "Facial micro-expressions",
        "interaction": "Interaction with environment/others"
      },
      "mood": {
        "emotionalTone": "Emotional tone from mood references",
        "atmosphere": "Atmosphere from mood references",
        "narrativeContext": "Context in story",
        "viewerFeeling": "What viewer should feel"
      },
      "cinematography": {
        "dopInspiredBy": "Famous cinematographer name",
        "style": "Cinematic commercial realism",
        "camera": "ARRI Alexa Mini LF",
        "focalLength": "Lens mm",
        "aperture": "f/stop for depth of field",
        "lightingSetup": "Detailed lighting setup using lighting references",
        "colorGrading": "Color grading style",
        "filmGrain": "Subtle/None/Heavy",
        "aspectRatio": "${input.aspectRatio}"
      },
      "parameters": "--ar ${input.aspectRatio} --style raw --seed ${12345 + startIndex}",
      "negatives": "cartoon, illustration, painting, drawing, CGI, 3D render, plastic skin, beauty retouch, smooth skin, flawless skin, anime, manga, fantasy art, digital art, oversaturated colors, unnatural colors, distorted features, ugly, deformed, blurry, out of focus, watermark, text, logo, frame, border",
      "fullPrompt": "Complete detailed Midjourney prompt incorporating ALL visual reference details. Start with subject/environment description, then technical parameters."
    }
  ]
}

CRITICAL RULES:
1. FIRST FRAME must be MINIMUM 80 words and include specific details from visual references
2. Every section must reference the visual materials provided by the user
3. fullPrompt should be a complete, ready-to-use Midjourney command that reflects the uploaded references
4. Use unique seed numbers for each shot
5. Do not generic descriptions - use the specific details from user comments on references`;

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
