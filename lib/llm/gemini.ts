import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

let _genAI: GoogleGenerativeAI | null = null;
let _openai: OpenAI | null = null;

function getGeminiClient() {
  if (!_genAI) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY not set");
    _genAI = new GoogleGenerativeAI(key);
  }
  return _genAI;
}

function getOpenAIClient() {
  if (!_openai) {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY not set");
    _openai = new OpenAI({ apiKey: key });
  }
  return _openai;
}

async function generateWithGemini(prompt: string): Promise<string> {
  const model = getGeminiClient().getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: { temperature: 0.4, maxOutputTokens: 1500 },
  });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

async function generateWithOpenAI(prompt: string): Promise<string> {
  const response = await getOpenAIClient().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.4,
    max_tokens: 1500,
  });
  return response.choices[0]?.message?.content ?? "";
}

export async function generateText(prompt: string): Promise<string> {
  try {
    return await generateWithGemini(prompt);
  } catch (geminiError) {
    console.warn("Gemini failed, falling back to OpenAI:", geminiError);
    return await generateWithOpenAI(prompt);
  }
}
