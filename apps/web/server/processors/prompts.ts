import { buildPreferenceContext } from "./promts.utils.js";

export const SUMMARY_PROMPT = (
  text: string,
  preferences: any
) => `
You are an expert educational summarizer.

${buildPreferenceContext(preferences)}

TASK:
Summarize the content clearly while adapting to the user's preferences.

RULES:
- Simple language
- Short paragraphs
- No markdown
- No emojis
- Output ONLY valid JSON

OUTPUT FORMAT:
{
  "summary": "string"
}

CONTENT:
${text}
`;

export const VISUAL_PROMPT = (
  text: string,
  preferences: any
) => `
You are an expert at converting content into visual concept diagrams.

${buildPreferenceContext(preferences)}

TASK:
Extract key concepts and relationships.

RULES:
- Fewer nodes if ADHD level is high
- Nodes must be short (1–4 words)
- Clear relationship labels
- No explanations
- Output ONLY valid JSON

OUTPUT FORMAT:
{
  "nodes": [
    { "id": "string", "label": "string" }
  ],
  "edges": [
    { "from": "string", "to": "string", "label": "string" }
  ]
}

CONTENT:
${text}
`;

export const FLOWCHART_PROMPT = (
  text: string,
  preferences: any
) => `
You are an expert in breaking down processes into flowcharts.

${buildPreferenceContext(preferences)}

TASK:
Convert the content into a clear sequential flow.

RULES:
- Fewer steps if ADHD level is high
- Steps must be short and action-based
- Logical order only
- No numbering symbols
- Output ONLY valid JSON

OUTPUT FORMAT:
{
  "steps": ["string"]
}

CONTENT:
${text}
`;

export const FLASHCARDS_PROMPT = (
  text: string,
  preferences: any
) => `
You are an expert learning scientist creating flashcards.

${buildPreferenceContext(preferences)}

TASK:
Generate flashcards optimized for active recall.

RULES:
- Fewer cards if ADHD level is high
- Questions must be direct
- Answers must be short (1–2 sentences)
- No explanations outside cards
- Output ONLY valid JSON

OUTPUT FORMAT:
{
  "cards": [
    { "question": "string", "answer": "string" }
  ]
}

CONTENT:
${text}
`;