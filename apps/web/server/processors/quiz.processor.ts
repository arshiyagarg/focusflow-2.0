import { groq, GROQ_MODEL } from "../utils/groq.client";

export const generateMicroQuiz = async (content: string) => {
  console.log("[Quiz Processor] Generating engagement check...");

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an ADHD learning assistant. Generate a 3-question micro-quiz in JSON format. Keep questions short. Output format: { \"questions\": [{ \"text\": \"string\", \"options\": [{ \"text\": \"string\", \"isCorrect\": boolean }] }] }"
        },
        {
          role: "user",
          content: `Generate a quiz for this content: ${content}`
        }
      ],
      model: GROQ_MODEL,
      response_format: { type: "json_object" },
      temperature: 0.5,
    });

    const quizData = JSON.parse(chatCompletion.choices[0].message.content || "{}");
    console.log("[Quiz Processor] Quiz generated successfully");
    return quizData;
  } catch (error) {
    console.error("[Quiz Processor] Groq Error:", error);
    return null;
  }
};