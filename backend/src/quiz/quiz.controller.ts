import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Sse,
  Query,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { QuizService } from "./quiz.service";
import { diskStorage } from "multer";
import { extname } from "path";
import { v4 as uuidv4 } from "uuid";
import { Observable } from "rxjs";
import { MessageEvent } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

// 🔧 FIX: Import the File type directly from multer
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

@Controller("api/quiz")
export class QuizController {
  private readonly logger = new Logger(QuizController.name);

  constructor(
    private readonly quizService: QuizService,
    private readonly jwtService: JwtService,
  ) {}

  @Post("upload")
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: "./uploads",
        filename: (req, file, cb) => {
          const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      limits: {
        fileSize: 41943040, // 40MB
      },
      fileFilter: (req, file, cb) => {
        if (
          file.mimetype === "application/pdf" ||
          file.mimetype === "text/plain"
        ) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException("Only PDF and TXT files are allowed"),
            false,
          );
        }
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: MulterFile, // 🔧 CHANGED: Use custom interface
    @Body() body: any,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }

    const { topic, questionCount = 10, difficulty = "medium" } = body;

    if (!topic) {
      throw new BadRequestException("Topic is required");
    }

    const userId = req.user.userId;

    const generationId = await this.quizService.startQuizGeneration({
      file,
      userId,
      topic,
      questionCount: parseInt(questionCount, 10),
      difficulty: difficulty as "easy" | "medium" | "hard",
    });

    return {
      message: "Quiz generation started",
      generationId,
    };
  }

  @Sse("stream/:generationId")
  streamQuizGeneration(
    @Param("generationId") generationId: string,
    @Query("token") token: string,
  ): Observable<MessageEvent> {
    if (!token) {
      this.logger.error("SSE: No token provided");
      throw new UnauthorizedException("Token is required");
    }

    try {
      const payload = this.jwtService.verify(token);

      this.logger.log(
        `SSE: Token verified. Payload: ${JSON.stringify(payload)}`,
      );

      const userId = payload.sub;

      if (!userId) {
        this.logger.error(
          `SSE: No 'sub' field in token. Payload: ${JSON.stringify(payload)}`,
        );
        throw new UnauthorizedException(
          "Invalid token: missing user identifier",
        );
      }

      this.logger.log(
        `SSE: User ${userId} connecting to generation ${generationId}`,
      );

      return this.quizService.streamQuizGeneration(userId, generationId);
    } catch (error: any) {
      this.logger.error(`SSE: Auth error: ${error.message}`);

      if (error.name === "TokenExpiredError") {
        throw new UnauthorizedException("Token expired. Please login again.");
      }

      if (error.name === "JsonWebTokenError") {
        throw new UnauthorizedException("Invalid token");
      }

      throw new UnauthorizedException(
        `Authentication failed: ${error.message}`,
      );
    }
  }

  @Get("questions")
  @UseGuards(JwtAuthGuard)
  async getQuizQuestions(@Request() req, @Query("limit") limit?: string) {
    const userId = req.user.userId;
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    return this.quizService.getQuizQuestions(userId, limitNum);
  }

  @Post("submit")
  @UseGuards(JwtAuthGuard)
  async submitAnswer(
    @Request() req,
    @Body() body: { questionId: string; selectedAnswer: number },
  ) {
    const userId = req.user.userId;
    return this.quizService.submitAnswer(userId, body);
  }

  @Get("progress")
  @UseGuards(JwtAuthGuard)
  async getUserProgress(@Request() req) {
    const userId = req.user.userId;
    return this.quizService.getUserProgress(userId);
  }
}
