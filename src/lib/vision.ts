import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY, // Must be public for client-side
  dangerouslyAllowBrowser: true
});

export async function analyzeImage(base64Image: string, category: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini", // or gpt-4o
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Describe this ${category} reference image in extreme detail for a film production. Include: colors, textures, lighting, mood, specific visual elements, style. Write 3-4 sentences.`
          },
          {
            type: "image_url",
            image_url: {
              url: base64Image,
              detail: "high"
            }
          }
        ]
      }
    ],
    max_tokens: 500
  });
  
  return response.choices[0].message.content || '';
}
