import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Question, QuestionDocument } from "./schemas/question.schema";
import {
  UserProgress,
  UserProgressDocument,
} from "./schemas/user-progress.schema";
import { MastraService } from "../mastra/mastra.service";
import { CreateQuizDto } from "./dto/create-quiz.dto";
import * as fs from "fs/promises";
import pdfParse from "pdf-parse";

@Injectable()
export class QuizService {
  private readonly logger = new Logger(QuizService.name);

  constructor(
    @InjectModel(Question.name) private questionModel: Model<QuestionDocument>,
    @InjectModel(UserProgress.name)
    private userProgressModel: Model<UserProgressDocument>,
    private mastraService: MastraService,
  ) {}

  async getQuizQuestions(courseId: string, limit?: number) {
    try {
      this.logger.log(`Fetching quiz questions for course: ${courseId}`);

      const query = this.questionModel.find({ courseId }).select("-__v").lean();
      
      if (limit && limit > 0) {
        query.limit(limit);
      }

      const questions = await query.exec();

      if (!questions || questions.length === 0) {
        this.logger.warn(`No questions found for course ${courseId}`);
        return [];
      }

      this.logger.log(`Found ${questions.length} questions for course ${courseId}`);
      
      return questions.map((q) => ({
        _id: q._id.toString(),
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        topic: q.topic,
        difficulty: q.difficulty,
      }));
    } catch (error) {
      this.logger.error(`Error fetching questions: ${error.message}`);
      return [];
    }
  }

  async processUploadedFile(data: {
    file: any; // Changed to 'any' - simplest fix
    courseId: string;
    topic: string;
    questionCount: number;
    difficulty?: "easy" | "medium" | "hard";
  }) {
    const { file, courseId, topic, questionCount, difficulty = 'medium' } = data;

    try {
      this.logger.log(`Processing file: ${file.filename} with difficulty: ${difficulty}`);

      const deleteResult = await this.questionModel.deleteMany({ courseId }).exec();
      this.logger.log(`🗑️ Deleted ${deleteResult.deletedCount} previous questions for course ${courseId}`);

      let extractedText = "";

      if (file.mimetype === "application/pdf") {
        const dataBuffer = await fs.readFile(file.path);
        const pdfData = await pdfParse(dataBuffer);
        extractedText = pdfData.text;
      } else if (file.mimetype === "text/plain") {
        extractedText = await fs.readFile(file.path, "utf-8");
      } else {
        throw new Error(
          "File type not yet supported. Please use PDF or TXT files.",
        );
      }

      this.logger.log(`Extracted ${extractedText.length} characters from file`);

      await fs.unlink(file.path);

      // Generate questions using Mastra AI with difficulty
      const questions = await this.mastraService.generateQuizQuestions(
        extractedText,
        questionCount,
        difficulty,
      );

      const savedQuestions = [];
      for (const q of questions) {
        const question = new this.questionModel({
          courseId,
          topic,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          difficulty: q.difficulty || difficulty,
          sourceFile: file.originalname,
        });
        const saved = await question.save();
        savedQuestions.push(saved);
      }

      this.logger.log(
        `✅ Generated and saved ${savedQuestions.length} ${difficulty} questions`,
      );

      return {
        success: true,
        message: `Successfully generated ${savedQuestions.length} ${difficulty} questions from ${file.originalname}`,
        courseId,
        topic,
        difficulty,
        questionsGenerated: savedQuestions.length,
        deletedCount: deleteResult.deletedCount,
        questions: savedQuestions,
      };
    } catch (error) {
      this.logger.error(`Error processing file: ${error.message}`);

      try {
        await fs.unlink(file.path);
      } catch {}

      throw error;
    }
  }

  /**
   * Submit an answer and update user progress
   */
  async submitAnswer(userId: string, body: { questionId: string; selectedAnswer: number }) {
    const { questionId, selectedAnswer } = body;

    try {
      const question = await this.questionModel.findById(questionId);
      if (!question) {
        throw new NotFoundException('Question not found');
      }

      const isCorrect = selectedAnswer === question.correctAnswer;

      let progress = await this.userProgressModel.findOne({ userId });

      if (!progress) {
        progress = new this.userProgressModel({
          userId,
          totalQuestions: 1,
          correctAnswers: isCorrect ? 1 : 0,
          courseProgress: {},
        });
      } else {
        progress.totalQuestions += 1;
        if (isCorrect) {
          progress.correctAnswers += 1;
        }
      }

      await progress.save();

      return {
        correct: isCorrect,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        progress: {
          totalQuestions: progress.totalQuestions,
          correctAnswers: progress.correctAnswers,
          accuracy: (progress.correctAnswers / progress.totalQuestions) * 100,
        },
      };
    } catch (error) {
      this.logger.error(`Error submitting answer: ${error.message}`);
      throw error;
    }
  }

  async getUserProgress(userId: string) {
    try {
      const progress = await this.userProgressModel.findOne({ userId });

      if (!progress) {
        return {
          totalQuestions: 0,
          correctAnswers: 0,
          accuracy: 0,
          courseProgress: {},
        };
      }

      return {
        totalQuestions: progress.totalQuestions,
        correctAnswers: progress.correctAnswers,
        accuracy: (progress.correctAnswers / progress.totalQuestions) * 100,
        courseProgress: progress.courseProgress,
      };
    } catch (error) {
      this.logger.error(`Error fetching user progress: ${error.message}`);
      throw error;
    }
  }

  async createQuiz(createQuizDto: CreateQuizDto) {
    const { courseId, content, questionCount } = createQuizDto;

    try {
      this.logger.log(`Creating quiz for course ${courseId}`);

      const questions = await this.mastraService.generateQuizQuestions(
        content,
        questionCount || 10,
      );

      const savedQuestions = [];
      for (const q of questions) {
        const question = new this.questionModel({
          courseId,
          ...q,
        });
        const saved = await question.save();
        savedQuestions.push(saved);
      }

      this.logger.log(`Created ${savedQuestions.length} questions for course ${courseId}`);

      return {
        success: true,
        courseId,
        questionsGenerated: savedQuestions.length,
        questions: savedQuestions,
      };
    } catch (error) {
      this.logger.error(`Error creating quiz: ${error.message}`);
      throw error;
    }
  }
}
