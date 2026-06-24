import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AiChatHistory } from '../../../database/schemas/ai-chat-history.entity';
import { User } from '../../../database/schemas/user.entity';
import { AskQuestionDto } from './dto/ask-question.dto';

@Injectable()
export class AiChatService {
  private readonly genAI: GoogleGenerativeAI;

  constructor(
    @InjectRepository(AiChatHistory)
    private readonly aiChatHistoryRepository: Repository<AiChatHistory>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('ai.geminiApiKey');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async ask(userId: string, dto: AskQuestionDto): Promise<AiChatHistory> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Fetch conversation memory (last 10 messages)
    const history = await this.aiChatHistoryRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 10,
    });
    
    // Sort chronologically (oldest to newest)
    const chronologicalHistory = history.reverse();
    const historyContext = chronologicalHistory
      .map((h) => `User: ${h.question}\nAI: ${h.answer}`)
      .join('\n\n');

    const userProfileContext = `
User Profile:
- Age: ${user.age ?? 'Not specified'}
- Gender: ${user.gender ?? 'Not specified'}
- Height: ${user.height ?? 'Not specified'} cm
- Current Weight: ${user.currentWeight ?? 'Not specified'} kg
- Target Weight: ${user.targetWeight ?? 'Not specified'} kg
- Activity Level: ${user.activityLevel ?? 'Not specified'}
- Fitness Goal: ${user.fitnessGoal ?? 'Not specified'}
`;

    const systemInstruction = `
You are a supportive, scientifically accurate AI fitness and nutrition coach. 
Answer the user's fitness, exercise, and nutrition questions.
Keep answers concise, direct, and actionable. Use markdown where helpful.
If asked about medical symptoms, diagnoses, or clinical conditions, politely advise the user to consult a physician or medical professional.
You have access to the user's physical profile context and their recent conversation history below.
`;

    const prompt = `
User Profile Context:
${userProfileContext}

Conversation History Context:
${historyContext}

User Question: ${dto.question}
`;

    try {
      if (!this.genAI) {
        throw new Error('Gemini API key is not configured');
      }

      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction,
      });

      const response = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const answer = response.response.text();

      const chatLog = this.aiChatHistoryRepository.create({
        userId,
        question: dto.question,
        answer,
      });

      return this.aiChatHistoryRepository.save(chatLog);
    } catch (geminiError) {
      // Gemini failed. Fall back to Groq!
      try {
        const answer = await this.generateWithGroq(
          prompt,
          systemInstruction,
        );

        const chatLog = this.aiChatHistoryRepository.create({
          userId,
          question: dto.question,
          answer,
        });

        return this.aiChatHistoryRepository.save(chatLog);
      } catch (groqError) {
        throw new InternalServerErrorException(
          `AI Chat failed. Gemini Error: ${geminiError.message}. Groq Fallback Error: ${groqError.message}`,
        );
      }
    }
  }

  async getHistory(userId: string): Promise<AiChatHistory[]> {
    return this.aiChatHistoryRepository.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });
  }

  private async generateWithGroq(
    prompt: string,
    systemInstruction: string,
  ): Promise<string> {
    const groqKeysStr = this.configService.get<string>('ai.groqApiKeys');
    if (!groqKeysStr) {
      throw new Error('Groq keys are not configured');
    }

    const keys = groqKeysStr.split(',').map((key) => key.trim()).filter(Boolean);
    if (keys.length === 0) {
      throw new Error('No valid Groq API keys found');
    }

    let lastError: any = null;

    for (const key of keys) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: systemInstruction },
              { role: 'user', content: prompt },
            ],
            temperature: 0.7,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Groq API returned status ${response.status}: ${errText}`);
        }

        const data = await response.json() as any;
        return data.choices[0].message.content;
      } catch (error) {
        lastError = error;
      }
    }

    throw new Error(`All Groq keys failed. Last error: ${lastError?.message}`);
  }
}
