import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AiNutritionPlan } from '../../../database/schemas/ai-nutrition-plan.entity';
import { User } from '../../../database/schemas/user.entity';
import { GenerateNutritionDto } from './dto/generate-nutrition.dto';

@Injectable()
export class AiNutritionService {
  private readonly genAI: GoogleGenerativeAI;

  constructor(
    @InjectRepository(AiNutritionPlan)
    private readonly aiNutritionPlansRepository: Repository<AiNutritionPlan>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('ai.geminiApiKey');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async generatePlan(userId: string, dto: GenerateNutritionDto): Promise<any> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
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

    const restrictions = dto.dietaryRestrictions?.join(', ') ?? 'None';
    const preferencesContext = `
Request Preferences:
- Dietary Restrictions: ${restrictions}
- Other Preferences / Constraints: ${dto.preferences ?? 'None specified'}
`;

    const systemInstruction = `
You are an expert clinical dietitian and sports nutritionist. 
Your task is to generate a highly personalized, scientific meal plan based on the user's profile and request preferences.
Calculate their TDEE and supply a targeted daily calorie intake and macronutrient targets.
Provide a list of meal items with ingredients, calories, and macro details (protein, carbs, fat).
You MUST format your output strictly as a JSON object matching this schema:
{
  "title": "string (descriptive name of the meal plan)",
  "goal": "string (the target fitness goal)",
  "targetCalories": "number (target daily calories)",
  "macrosTarget": {
    "proteinGrams": "number (daily protein in grams)",
    "carbsGrams": "number (daily carbs in grams)",
    "fatGrams": "number (daily fat in grams)"
  },
  "dietaryRestrictions": ["string (list of restrictions met)"],
  "notes": "string (general advice, timing, supplements or hydration recommendations)",
  "meals": [
    {
      "mealType": "string (Breakfast, Lunch, Dinner, or Snack)",
      "timeRecommendation": "string (suggested eating time, e.g. '08:00 AM')",
      "recipeName": "string (name of the meal/recipe)",
      "ingredients": ["string (ingredient item and amount, e.g. 'Oats 80g')"],
      "calories": "number (meal calories)",
      "proteinGrams": "number (meal protein in grams)",
      "carbsGrams": "number (meal carbs in grams)",
      "fatGrams": "number (meal fat in grams)"
    }
  ]
}
`;

    const prompt = `Generate a personalized nutrition plan for the following user profile and preferences:\n${userContext}\n${preferencesContext}`;

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

      const aiPlan = this.aiNutritionPlansRepository.create({
        userId,
        prompt,
        generatedPlan: textPlan,
      });

      const savedRecord = await this.aiNutritionPlansRepository.save(aiPlan);

      return {
        id: savedRecord.id,
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

        const aiPlan = this.aiNutritionPlansRepository.create({
          userId,
          prompt: prompt + ' [Fallback to Groq]',
          generatedPlan: textPlan,
        });

        const savedRecord = await this.aiNutritionPlansRepository.save(aiPlan);

        return {
          id: savedRecord.id,
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
    const plans = await this.aiNutritionPlansRepository.find({
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
        prompt: plan.prompt,
        generatedPlan: parsed,
        createdAt: plan.createdAt,
      };
    });
  }

  async findOne(userId: string, id: string): Promise<any> {
    const plan = await this.aiNutritionPlansRepository.findOne({
      where: { id, userId },
    });

    if (!plan) {
      throw new NotFoundException(`AI Nutrition Plan with ID ${id} not found`);
    }

    let parsed: any = null;
    try {
      parsed = plan.generatedPlan ? JSON.parse(plan.generatedPlan) : null;
    } catch (e) {
      parsed = plan.generatedPlan;
    }

    return {
      id: plan.id,
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

    const keys = groqKeysStr
      .split(',')
      .map((key) => key.trim())
      .filter(Boolean);
    if (keys.length === 0) {
      throw new Error('No valid Groq API keys found');
    }

    let lastError: any = null;
    const prompt = `Generate a personalized nutrition plan for the following user profile and preferences:\n${userContext}\n${preferencesContext}`;

    for (const key of keys) {
      try {
        const response = await fetch(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${key}`,
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
          },
        );

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(
            `Groq API returned status ${response.status}: ${errText}`,
          );
        }

        const data = await response.json();
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
