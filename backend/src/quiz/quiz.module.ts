import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { QuizController } from "./quiz.controller";
import { QuizService } from "./quiz.service";
import { Question, QuestionSchema } from "./schemas/question.schema";
import {
  UserProgress,
  UserProgressSchema,
} from "./schemas/user-progress.schema";
import { MastraService } from "../mastra/mastra.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Question.name, schema: QuestionSchema },
      { name: UserProgress.name, schema: UserProgressSchema },
    ]),
    // Add JwtModule for token verification
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET"),
        signOptions: { expiresIn: "7d" },
      }),
    }),
  ],
  controllers: [QuizController],
  providers: [QuizService, MastraService],
  exports: [QuizService],
})
export class QuizModule {}
