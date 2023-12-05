import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  const { prompt } = await req.json();

  if (!prompt) {
    return new Response("Please send your prompt", { status: 400 });
  }

  const completion = await openai.completions.create({
    model: "gpt-3.5-turbo-instruct",
    prompt,
    max_tokens: 200,
    temperature: 0,
  });

  const response =
    completion.choices[0].text?.trim() || "Sorry, there was a problem!";

  return Response.json({ text: response });
}
