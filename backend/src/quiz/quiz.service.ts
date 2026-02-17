import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Question, QuestionDocument } from "./schemas/question.schema";
import {
  UserProgress,
  UserProgressDocument,
} from "./schemas/user-progress.schema";
import { MastraService } from "../mastra/mastra.service";
import * as fs from "fs/promises";
import pdfParse from "pdf-parse";
import { v4 as uuidv4 } from "uuid";
import { Subject, Observable } from "rxjs";
import { MessageEvent } from "@nestjs/common";

// 🔧 FIX: Define MulterFile interface
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

interface GenerationStream {
  subject: Subject<MessageEvent>;
  status: "processing" | "completed" | "error";
  userId: string;
}

@Injectable()
export class QuizService {
  private readonly logger = new Logger(QuizService.name);
  private activeGenerations = new Map<string, boolean>();
  private generationStreams = new Map<string, GenerationStream>();

  constructor(
    @InjectModel(Question.name) private questionModel: Model<QuestionDocument>,
    @InjectModel(UserProgress.name)
    private userProgressModel: Model<UserProgressDocument>,
    private mastraService: MastraService,
  ) {}

  async getQuizQuestions(userId: string, limit?: number) {
    try {
      this.logger.log(`Fetching quiz questions for user: ${userId}`);

      const query = this.questionModel
        .find({ userId, isActive: true })
        .select("-__v")
        .sort({ createdAt: -1 })
        .lean();

      if (limit && limit > 0) {
        query.limit(limit);
      }

      const questions = await query.exec();

      if (!questions || questions.length === 0) {
        this.logger.warn(`No questions found for user ${userId}`);
        return [];
      }

      this.logger.log(`Found ${questions.length} questions for user ${userId}`);

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

  async startQuizGeneration(data: {
    file: MulterFile; // 🔧 CHANGED: Use MulterFile interface
    userId: string;
    topic: string;
    questionCount: number;
    difficulty?: "easy" | "medium" | "hard";
  }): Promise<string> {
    const { file, userId, topic, questionCount, difficulty = "medium" } = data;
    const generationId = uuidv4();

    if (this.activeGenerations.has(userId)) {
      throw new Error(
        "You already have a quiz generation in progress. Please wait for it to complete.",
      );
    }

    const subject = new Subject<MessageEvent>();

    this.generationStreams.set(generationId, {
      subject,
      status: "processing",
      userId,
    });

    this.activeGenerations.set(userId, true);

    this.processUploadedFileStreaming({
      file,
      userId,
      topic,
      questionCount,
      difficulty,
      generationId,
      subject,
    }).catch((error) => {
      this.logger.error(`Error in background processing: ${error.message}`);
      const stream = this.generationStreams.get(generationId);
      if (stream) {
        stream.status = "error";
        stream.subject.next({
          data: {
            type: "error",
            message: error.message,
          },
        } as MessageEvent);
        stream.subject.complete();
      }
      this.activeGenerations.delete(userId);
    });

    return generationId;
  }

  streamQuizGeneration(
    userId: string,
    generationId: string,
  ): Observable<MessageEvent> {
    const stream = this.generationStreams.get(generationId);

    if (!stream) {
      const errorSubject = new Subject<MessageEvent>();
      errorSubject.next({
        data: {
          type: "error",
          message: "Generation not found or expired",
        },
      } as MessageEvent);
      errorSubject.complete();
      return errorSubject.asObservable();
    }

    if (stream.userId !== userId) {
      const errorSubject = new Subject<MessageEvent>();
      errorSubject.next({
        data: {
          type: "error",
          message: "Unauthorized: This generation belongs to another user",
        },
      } as MessageEvent);
      errorSubject.complete();
      return errorSubject.asObservable();
    }

    return stream.subject.asObservable();
  }

  private async processUploadedFileStreaming(data: {
    file: MulterFile; // 🔧 CHANGED: Use MulterFile interface
    userId: string;
    topic: string;
    questionCount: number;
    difficulty: "easy" | "medium" | "hard";
    generationId: string;
    subject: Subject<MessageEvent>;
  }) {
    const {
      file,
      userId,
      topic,
      questionCount,
      difficulty,
      generationId,
      subject,
    } = data;

    try {
      this.logger.log(
        `[${generationId}] Processing file: ${file.filename} for user ${userId}`,
      );

      if (!userId) {
        throw new Error("UserId is required for question generation");
      }

      subject.next({
        data: {
          type: "progress",
          message: "Extracting text from file...",
          progress: 10,
        },
      } as MessageEvent);

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

      this.logger.log(
        `[${generationId}] Extracted ${extractedText.length} characters from file`,
      );
      await fs.unlink(file.path);

      subject.next({
        data: {
          type: "progress",
          message: "Generating questions with AI...",
          progress: 20,
        },
      } as MessageEvent);

      const questions = await this.mastraService.generateQuizQuestions(
        extractedText,
        questionCount,
        difficulty,
      );

      this.logger.log(
        `[${generationId}] AI generated ${questions.length} questions`,
      );

      subject.next({
        data: {
          type: "progress",
          message: "Deactivating old questions...",
          progress: 60,
        },
      } as MessageEvent);

      const deactivateResult = await this.questionModel
        .updateMany({ userId, isActive: true }, { $set: { isActive: false } })
        .exec();

      this.logger.log(
        `[${generationId}] Deactivated ${deactivateResult.modifiedCount} old questions`,
      );

      subject.next({
        data: {
          type: "progress",
          message: "Saving questions in parallel...",
          progress: 70,
        },
      } as MessageEvent);

      const startTime = Date.now();

      const questionPromises = questions.map((q) => {
        if (
          !userId ||
          !topic ||
          !q.question ||
          !q.options ||
          q.correctAnswer === undefined
        ) {
          this.logger.error(`[${generationId}] Invalid question data:`, {
            hasUserId: !!userId,
            hasTopic: !!topic,
            hasQuestion: !!q.question,
            hasOptions: !!q.options,
            hasCorrectAnswer: q.correctAnswer !== undefined,
          });
          throw new Error("Invalid question data - missing required fields");
        }

        return this.questionModel.create({
          userId,
          topic,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          difficulty: q.difficulty || difficulty,
          sourceFile: file.originalname,
          generationId,
          isActive: true,
        });
      });

      const savedQuestions = await Promise.all(questionPromises);

      const saveTime = Date.now() - startTime;
      this.logger.log(
        `[${generationId}] ⚡ Saved ${savedQuestions.length} questions in parallel (${saveTime}ms)`,
      );

      const streamPromises = savedQuestions.map((saved, index) => {
        const progress = 70 + ((index + 1) / savedQuestions.length) * 30;

        return new Promise<void>((resolve) => {
          subject.next({
            data: {
              type: "question",
              question: {
                _id: saved._id.toString(),
                question: saved.question,
                options: saved.options,
                correctAnswer: saved.correctAnswer,
                explanation: saved.explanation,
                topic: saved.topic,
                difficulty: saved.difficulty,
              },
              progress: Math.min(progress, 99),
              questionNumber: index + 1,
              totalQuestions: savedQuestions.length,
            },
          } as MessageEvent);

          resolve();
        });
      });

      await Promise.all(streamPromises);

      this.logger.log(
        `[${generationId}] ✅ Streamed all ${savedQuestions.length} questions`,
      );

      subject.next({
        data: {
          type: "complete",
          message: `Successfully generated ${savedQuestions.length} questions`,
          totalQuestions: savedQuestions.length,
          progress: 100,
          saveTimeMs: saveTime,
        },
      } as MessageEvent);

      subject.complete();

      const stream = this.generationStreams.get(generationId);
      if (stream) {
        stream.status = "completed";
      }
      this.activeGenerations.delete(userId);

      setTimeout(() => {
        this.generationStreams.delete(generationId);
        this.logger.log(`[${generationId}] Cleaned up generation stream`);
      }, 60000);

      this.logger.log(
        `[${generationId}] ✅ Completed successfully in ${saveTime}ms`,
      );
    } catch (error) {
      this.logger.error(`[${generationId}] Error: ${error.message}`);
      this.logger.error(`[${generationId}] Error stack:`, error.stack);

      subject.next({
        data: {
          type: "error",
          message: error.message,
        },
      } as MessageEvent);
      subject.complete();

      const stream = this.generationStreams.get(generationId);
      if (stream) {
        stream.status = "error";
      }
      this.activeGenerations.delete(userId);

      try {
        await fs.unlink(file.path);
      } catch {}

      throw error;
    }
  }

  async submitAnswer(
    userId: string,
    body: { questionId: string; selectedAnswer: number },
  ) {
    const { questionId, selectedAnswer } = body;

    try {
      const question = await this.questionModel.findById(questionId);
      if (!question) {
        throw new NotFoundException("Question not found");
      }

      if (question.userId !== userId) {
        throw new NotFoundException("Question not found");
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

  async cleanupOldQuestions() {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const result = await this.questionModel
        .deleteMany({
          isActive: false,
          updatedAt: { $lt: sevenDaysAgo },
        })
        .exec();

      this.logger.log(
        `🧹 Cleaned up ${result.deletedCount} old inactive questions`,
      );
      return result.deletedCount;
    } catch (error) {
      this.logger.error(`Error cleaning up old questions: ${error.message}`);
      return 0;
    }
  }
}
