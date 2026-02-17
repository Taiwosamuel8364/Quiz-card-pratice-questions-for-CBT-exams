import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { QuizModule } from "./quiz/quiz.module";
import { MastraModule } from "./mastra/mastra.module";
import { AuthModule } from "./auth/auth.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI || "mongodb://localhost:27017/quiz-app"),
    AuthModule,
    QuizModule,
    MastraModule,
  ],
})
export class AppModule {}
