import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { AiChatService } from './ai-chat.service';
import { AiChatHistory } from '../../../database/schemas/ai-chat-history.entity';
import { User } from '../../../database/schemas/user.entity';
import { AskQuestionDto } from './dto/ask-question.dto';
import { NotFoundException, InternalServerErrorException } from '@nestjs/common';

// Mock the @google/generative-ai module
const mockGenerateContent = jest.fn();

jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => {
      return {
        getGenerativeModel: jest.fn().mockImplementation(() => {
          return {
            generateContent: mockGenerateContent,
          };
        }),
      };
    }),
  };
});

describe('AiChatService', () => {
  let service: AiChatService;

  const mockAiChatHistoryRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string) => {
      if (key === 'ai.geminiApiKey') return 'mock-gemini-key';
      if (key === 'ai.groqApiKeys') return 'gsk_key1,gsk_key2';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiChatService,
        {
          provide: getRepositoryToken(AiChatHistory),
          useValue: mockAiChatHistoryRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AiChatService>(AiChatService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('ask', () => {
    const mockUser = {
      id: 'user-uuid',
      age: 28,
      gender: 'Male',
      height: '180.0',
      currentWeight: '80.0',
      targetWeight: '75.0',
      activityLevel: 'Active',
      fitnessGoal: 'Lose weight',
    };

    it('should answer a user question successfully using Gemini', async () => {
      const dto: AskQuestionDto = {
        question: 'Should I do cardio before or after weights?',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockAiChatHistoryRepository.find.mockResolvedValue([
        { question: 'What is protein?', answer: 'It builds muscle.' },
      ]);
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => 'You should do cardio after weights to preserve strength.',
        },
      });

      const mockSavedRecord = {
        id: 'chat-uuid',
        userId: 'user-uuid',
        question: dto.question,
        answer: 'You should do cardio after weights to preserve strength.',
        createdAt: new Date(),
      };

      mockAiChatHistoryRepository.create.mockReturnValue(mockSavedRecord);
      mockAiChatHistoryRepository.save.mockResolvedValue(mockSavedRecord);

      const result = await service.ask('user-uuid', dto);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: 'user-uuid' } });
      expect(mockGenerateContent).toHaveBeenCalled();
      expect(mockAiChatHistoryRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'user-uuid',
        question: dto.question,
      }));
      expect(result.answer).toBe('You should do cardio after weights to preserve strength.');
    });

    it('should throw NotFoundException if user is not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.ask('invalid-user', { question: 'hello' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should fall back to Groq if Gemini fails', async () => {
      const dto: AskQuestionDto = {
        question: 'Should I do cardio before or after weights?',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockAiChatHistoryRepository.find.mockResolvedValue([]);
      mockGenerateContent.mockRejectedValue(new Error('API quota limit exceeded'));

      const mockFetch = jest.spyOn(global, 'fetch').mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              choices: [
                {
                  message: {
                    content: 'Groq answer: Do weights first.',
                  },
                },
              ],
            }),
        } as any),
      );

      const mockSavedRecord = {
        id: 'chat-uuid-groq',
        userId: 'user-uuid',
        question: dto.question,
        answer: 'Groq answer: Do weights first.',
        createdAt: new Date(),
      };

      mockAiChatHistoryRepository.create.mockReturnValue(mockSavedRecord);
      mockAiChatHistoryRepository.save.mockResolvedValue(mockSavedRecord);

      const result = await service.ask('user-uuid', dto);

      expect(result.answer).toBe('Groq answer: Do weights first.');
      expect(mockFetch).toHaveBeenCalled();
      mockFetch.mockRestore();
    });

    it('should throw InternalServerErrorException if both Gemini and Groq calls fail', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockAiChatHistoryRepository.find.mockResolvedValue([]);
      mockGenerateContent.mockRejectedValue(new Error('API quota limit exceeded'));

      const mockFetch = jest.spyOn(global, 'fetch').mockImplementation(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          text: () => Promise.resolve('Groq rate limit'),
        } as any),
      );

      await expect(
        service.ask('user-uuid', { question: 'hello' }),
      ).rejects.toThrow(InternalServerErrorException);

      mockFetch.mockRestore();
    });
  });

  describe('getHistory', () => {
    it('should return plan history', async () => {
      const mockHistory = [
        { id: '1', question: 'Q1', answer: 'A1' },
      ];
      mockAiChatHistoryRepository.find.mockResolvedValue(mockHistory);

      const result = await service.getHistory('user-uuid');

      expect(mockAiChatHistoryRepository.find).toHaveBeenCalledWith({
        where: { userId: 'user-uuid' },
        order: { createdAt: 'ASC' },
      });
      expect(result).toEqual(mockHistory);
    });
  });
});
