import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY!;

export function getGeminiClient() {
  return new GoogleGenAI({ apiKey });
}

export function getGeminiModel() {
  return "gemini-2.5-flash";
}