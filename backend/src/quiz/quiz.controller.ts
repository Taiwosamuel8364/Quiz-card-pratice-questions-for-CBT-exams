import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Request,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { QuizService } from "./quiz.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { multerConfig } from "./config/multer.config";

@Controller("api/quiz")
@UseGuards(JwtAuthGuard)
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Get("questions")
  async getQuestions(
    @Query("courseId") courseId: string,
    @Request() req,
  ) {
    const userId = req.user.id;
    return this.quizService.getQuizQuestions(`user-${userId}`, undefined);
  }

  @Post("upload")
  @UseInterceptors(FileInterceptor("file", multerConfig))
  async uploadFile(
    @UploadedFile() file: any, // Changed to 'any' - simplest fix
    @Body("topic") topic: string,
    @Body("questionCount") questionCount: string,
    @Body("difficulty") difficulty: "easy" | "medium" | "hard",
    @Request() req,
  ) {
    const userId = req.user.id;

    const validDifficulty: "easy" | "medium" | "hard" =
      ["easy", "medium", "hard"].includes(difficulty)
        ? difficulty
        : "medium";

    return this.quizService.processUploadedFile({
      file,
      courseId: `user-${userId}`,
      topic,
      questionCount: parseInt(questionCount) || 10,
      difficulty: validDifficulty,
    });
  }

  @Post("submit")
  async submitAnswer(@Body() body: any, @Request() req) {
    const userId = req.user.id;
    return this.quizService.submitAnswer(userId, body);
  }

  @Get("progress")
  async getUserProgress(@Request() req) {
    const userId = req.user.id;
    return this.quizService.getUserProgress(userId);
  }
}
