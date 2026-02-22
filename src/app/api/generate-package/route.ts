import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { input, numShots } = await req.json();

    // Build comprehensive visual context
    let visualContext = 'No visual references provided.';
    if (input.references && input.references.length > 0) {
      visualContext = `USER UPLOADED REFERENCES:\n${input.references.map((ref: any, idx: number) => {
        return `${idx + 1}. [${ref.category.toUpperCase()}] ${ref.fileName}
   Context: "${ref.comment}"`;
      }).join('\n')}`;
    }

    const visualNotes = input.visualStyleNotes || 'No additional visual notes.';

    const prompt = `You are a professional film production assistant. Create a complete production package for this screenplay using the provided visual references.

PROJECT DETAILS:
- Title: ${input.title}
- Duration: ${input.duration} seconds
- Aspect Ratio: ${input.aspectRatio}
- Number of Shots Needed: ${numShots} (calculated as 0.75 × duration)

${visualContext}

OVERALL VISUAL DIRECTION:
${visualNotes}

CRITICAL INSTRUCTIONS:
You MUST incorporate the visual references into the production package:
- CAST references define the exact look of characters
- COSTUME references define what characters wear
- ENVIRONMENT references define locations and settings
- MOOD references define the cinematographic style
- LIGHTING references define the lighting setup for all scenes

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
        "description": "Detailed shot description incorporating visual references",
        "lighting": "Lighting description using lighting references"
      }
    ],
    "characters": [
      {
        "character": {
          "name": "Character Name",
          "ageRange": "30-40",
          "look": "Description using cast reference details",
          "mjPortraitPrompt": "Detailed Midjourney portrait prompt with cast reference specifics"
        },
        "outfit": "Description using costume references",
        "materials": "Fabric materials from references",
        "condition": "Condition from references"
      }
    ],
    "environments": [
      {
        "setting": "Setting name using environment references",
        "timeOfDay": "Morning/Afternoon/Evening/Night",
        "lightingSetup": "Lighting using references",
        "atmosphere": "Atmosphere using mood references"
      }
    ]
  },
  "mjPrompts": [
    {
      "shotNumber": 1,
      "shotDescription": "Brief description",
      "firstFrame": "Detailed first frame description incorporating all reference details - min 80 words",
      "environment": {
        "country": "Country",
        "city": "City type",
        "exactSetting": "Exact location from references",
        "timeOfDay": "Time",
        "weather": "Weather",
        "ambientDetails": "Ambient sounds and details"
      },
      "subject": {
        "primarySubject": "Human/Object",
        "name": "Name",
        "ageRange": "Age range from cast ref",
        "gender": "Gender",
        "ethnicity": "Ethnicity from cast ref",
        "skin": "Skin description",
        "face": "Face description from cast ref",
        "bodyType": "Body type"
      },
      "hair": {
        "hairStyle": "Style from cast ref",
        "hairColor": "Color",
        "hairTexture": "Texture",
        "hairCondition": "Condition",
        "lightingOnHair": "How light hits hair"
      },
      "costume": {
        "fullOutfitDescription": "Full outfit from costume refs",
        "colors": "Colors from refs",
        "materials": "Materials from refs",
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
        "emotionalTone": "Tone from mood refs",
        "atmosphere": "Atmosphere from mood refs",
        "narrativeContext": "Context",
        "viewerFeeling": "Viewer feeling"
      },
      "cinematography": {
        "dopInspiredBy": "Famous cinematographer",
        "style": "Cinematic commercial realism",
        "camera": "ARRI Alexa Mini LF",
        "focalLength": "Lens mm",
        "aperture": "f/stop",
        "lightingSetup": "Lighting from refs",
        "colorGrading": "Color grading from mood refs",
        "filmGrain": "Subtle/None/Heavy",
        "aspectRatio": "${input.aspectRatio}"
      },
      "parameters": "--ar ${input.aspectRatio} --style raw --seed [unique seed]",
      "negatives": "cartoon, illustration, painting, CGI, plastic skin, beauty retouch, anime",
      "fullPrompt": "Complete Midjourney prompt with all reference details incorporated"
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
8. CRITICAL: Every description must incorporate details from the visual references provided`;

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
