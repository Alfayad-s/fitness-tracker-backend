import { registerAs } from '@nestjs/config';

export default registerAs('ai', () => ({
  geminiApiKey: process.env.GEMINI_API_KEY,
  groqApiKeys: process.env.GROQ_API_KEYS,
}));
