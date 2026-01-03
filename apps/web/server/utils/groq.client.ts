import Groq from "groq-sdk";

// Using Llama-3 70B for high-quality ADHD-friendly pedagogical logic
export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const GROQ_MODEL = "llama3-70b-8192";

console.log("[Groq Client] Initialized with model:", GROQ_MODEL);