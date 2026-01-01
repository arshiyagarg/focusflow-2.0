import express from 'express';
import Groq from 'groq-sdk';

const router = express.Router();
const getGroqClient = () => new Groq({ apiKey: process.env.GROQ_API_KEY });

const ADHD_SYSTEM_PROMPT = `You are a specialized ADHD Study Coach. 
Your goal is to explain the following text simply in a format and type of content that is visually clear, structured, ADHD-friendly and easy to process.

STRICT FORMATTING RULES:
1. NO MARKDOWN: Never use symbols like *, #, **, _, or ~ for bold/italics.
2. BULLETED LISTS ONLY: Use a simple bullet (• or -) for every single point.
3. WORD LIMIT: Keep every bullet point under 15 words.
4. SPACING: Use EXACTLY two newlines between every bullet point to prevent visual clutter.
5. COLOR-CODING TAGS: Use these tags at the START of relevant bullets:
   - [TASK] for assignments, deadlines, or actions.
   - [DEF] for new terms, definitions, or vocabulary.
   - [KEY] for core concepts or the single most important takeaway.
6. Using bold terms for key concept
   
Example format:
[DEF] Photosynthesis: The process plants use to turn sunlight into food.

[KEY] Light energy is converted into chemical energy in the chloroplasts.

[TASK] Read chapter 4 for the lab on Monday.`;


router.post('/explain', async (req: any, res: any) => {
    const { context, messages } = req.body;
    try {
        const groq = getGroqClient();
        const response = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                { 
                    role: "system", 
                    content: "You are an ADHD study coach. Explain the following text simply, using bold terms for key concepts: " + context 
                },
                ...messages
            ],
            temperature: 0.5
        });
        res.json({ reply: response.choices[0]?.message?.content });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;