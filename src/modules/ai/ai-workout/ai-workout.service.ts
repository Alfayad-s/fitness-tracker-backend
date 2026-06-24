import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AiWorkoutPlan } from '../../../database/schemas/ai-workout-plan.entity';
import { User } from '../../../database/schemas/user.entity';
import { GenerateWorkoutDto } from './dto/generate-workout.dto';

@Injectable()
export class AiWorkoutService {
  private readonly genAI: GoogleGenerativeAI;

  constructor(
    @InjectRepository(AiWorkoutPlan)
    private readonly aiWorkoutPlansRepository: Repository<AiWorkoutPlan>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('ai.geminiApiKey');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async generatePlan(userId: string, dto: GenerateWorkoutDto): Promise<any> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (!this.genAI) {
      throw new InternalServerErrorException('Gemini API key is not configured');
    }

    const userContext = `
User Profile:
- Age: ${user.age ?? 'Not specified'}
- Gender: ${user.gender ?? 'Not specified'}
- Height: ${user.height ?? 'Not specified'} cm
- Current Weight: ${user.currentWeight ?? 'Not specified'} kg
- Target Weight: ${user.targetWeight ?? 'Not specified'} kg
- Activity Level: ${user.activityLevel ?? 'Not specified'}
- Fitness Goal: ${user.fitnessGoal ?? 'Not specified'}
`;

    const userPrefs = dto.preference ?? dto.preferences ?? 'None specified';
    const preferencesContext = `
Request Preferences:
- Target Workout Goal: ${dto.goal}
- Weekly Workout Days: ${dto.daysPerWeek ?? 3} days per week
- Other Preferences / Constraints: ${userPrefs}
`;

    const systemInstruction = `
You are an expert personal trainer and sports scientist (CSCS certified). 
Your task is to generate a highly personalized, scientific workout plan based on the user's profile and request preferences.
Ensure the exercises match the user's goals and difficulty level.
You MUST format your output strictly as a JSON object matching this schema:
{
  "title": "string (descriptive name of the routine)",
  "goal": "string (the target fitness goal)",
  "difficulty": "string (Beginner, Intermediate, or Hard)",
  "weeklyFrequency": "number (number of days)",
  "notes": "string (safety instructions, warm-up tips, progressive overload advise)",
  "days": [
    {
      "dayNumber": "number (e.g. 1)",
      "dayName": "string (e.g. Upper Body Focus)",
      "exercises": [
        {
          "exerciseName": "string (name of the exercise)",
          "sets": "number (number of sets)",
          "reps": "number (number of repetitions per set, or duration in seconds)",
          "restSeconds": "number (recommended rest time between sets in seconds)",
          "executionNotes": "string (form execution cue, safety tips)"
        }
      ]
    }
  ]
}
`;

    const prompt = `Generate a personalized workout plan for the following user profile and preferences:\n${userContext}\n${preferencesContext}`;

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
        generationConfig: {
          responseMimeType: 'application/json',
        },
      });

      const textPlan = response.response.text();
      // Validate that it parses as JSON
      const parsedPlan = JSON.parse(textPlan);

      const aiPlan = this.aiWorkoutPlansRepository.create({
        userId,
        goal: dto.goal,
        prompt,
        generatedPlan: textPlan,
      });

      const savedRecord = await this.aiWorkoutPlansRepository.save(aiPlan);

      return {
        id: savedRecord.id,
        goal: savedRecord.goal,
        prompt: savedRecord.prompt,
        generatedPlan: parsedPlan,
        createdAt: savedRecord.createdAt,
      };
    } catch (geminiError) {
      // Gemini failed. Fall back to Groq!
      try {
        const { textPlan, parsedPlan } = await this.generateWithGroq(
          userContext,
          preferencesContext,
          systemInstruction,
        );

        const aiPlan = this.aiWorkoutPlansRepository.create({
          userId,
          goal: dto.goal,
          prompt: prompt + ' [Fallback to Groq]',
          generatedPlan: textPlan,
        });

        const savedRecord = await this.aiWorkoutPlansRepository.save(aiPlan);

        return {
          id: savedRecord.id,
          goal: savedRecord.goal,
          prompt: savedRecord.prompt,
          generatedPlan: parsedPlan,
          createdAt: savedRecord.createdAt,
        };
      } catch (groqError) {
        throw new InternalServerErrorException(
          `AI Generation failed. Gemini Error: ${geminiError.message}. Groq Fallback Error: ${groqError.message}`,
        );
      }
    }
  }

  async getHistory(userId: string): Promise<any[]> {
    const plans = await this.aiWorkoutPlansRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    return plans.map((plan) => {
      let parsed: any = null;
      try {
        parsed = plan.generatedPlan ? JSON.parse(plan.generatedPlan) : null;
      } catch (e) {
        parsed = plan.generatedPlan;
      }
      return {
        id: plan.id,
        goal: plan.goal,
        prompt: plan.prompt,
        generatedPlan: parsed,
        createdAt: plan.createdAt,
      };
    });
  }

  async findOne(userId: string, id: string): Promise<any> {
    const plan = await this.aiWorkoutPlansRepository.findOne({
      where: { id, userId },
    });

    if (!plan) {
      throw new NotFoundException(`AI Workout Plan with ID ${id} not found`);
    }

    let parsed: any = null;
    try {
      parsed = plan.generatedPlan ? JSON.parse(plan.generatedPlan) : null;
    } catch (e) {
      parsed = plan.generatedPlan;
    }

    return {
      id: plan.id,
      goal: plan.goal,
      prompt: plan.prompt,
      generatedPlan: parsed,
      createdAt: plan.createdAt,
    };
  }

  private async generateWithGroq(
    userContext: string,
    preferencesContext: string,
    systemInstruction: string,
  ): Promise<{ textPlan: string; parsedPlan: any; usedModel: string }> {
    const groqKeysStr = this.configService.get<string>('ai.groqApiKeys');
    if (!groqKeysStr) {
      throw new Error('Groq keys are not configured');
    }

    const keys = groqKeysStr.split(',').map((key) => key.trim()).filter(Boolean);
    if (keys.length === 0) {
      throw new Error('No valid Groq API keys found');
    }

    let lastError: any = null;
    const prompt = `Generate a personalized workout plan for the following user profile and preferences:\n${userContext}\n${preferencesContext}`;

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
            response_format: { type: 'json_object' },
            temperature: 0.7,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Groq API returned status ${response.status}: ${errText}`);
        }

        const data = await response.json() as any;
        const textPlan = data.choices[0].message.content;
        const parsedPlan = JSON.parse(textPlan);

        return { textPlan, parsedPlan, usedModel: 'llama-3.3-70b-versatile' };
      } catch (error) {
        lastError = error;
      }
    }

    throw new Error(`All Groq keys failed. Last error: ${lastError?.message}`);
  }
}
