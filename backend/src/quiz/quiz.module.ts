import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { MulterModule } from "@nestjs/platform-express";
import { QuizController } from "./quiz.controller";
import { QuizService } from "./quiz.service";
import { Question, QuestionSchema } from "./schemas/question.schema";
import { UserProgress, UserProgressSchema } from "./schemas/user-progress.schema";
import { MastraModule } from "../mastra/mastra.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Question.name, schema: QuestionSchema },
      { name: UserProgress.name, schema: UserProgressSchema },
    ]),
    MulterModule.register({
      dest: "./uploads",
    }),
    MastraModule,
  ],
  controllers: [QuizController],
  providers: [QuizService],
  exports: [QuizService],
})
export class QuizModule {}
