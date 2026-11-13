const { GoogleGenAI } = require('@google/genai');

const EMBED_MODEL = process.env.GEMINI_EMBED_MODEL || 'gemini-embedding-001';
const CHAT_MODEL = process.env.GEMINI_CHAT_MODEL || 'gemini-3.5-flash';

let client;
const ai = () => (client ||= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }));

// texts -> list of number arrays (768 numbers each)
exports.embed = async (texts, taskType) => {
  const out = [];
  for (let i = 0; i < texts.length; i += 50) {
    const res = await ai().models.embedContent({
      model: EMBED_MODEL,
      contents: texts.slice(i, i + 50),
      config: { taskType, outputDimensionality: 768 },
    });
    out.push(...res.embeddings.map((e) => e.values));
  }
  return out;
};

exports.answer = async (system, prompt) => {
  const res = await ai().models.generateContent({
    model: CHAT_MODEL,
    contents: prompt,
    config: { systemInstruction: system, temperature: 0.2 },
  });
  return res.text;
};