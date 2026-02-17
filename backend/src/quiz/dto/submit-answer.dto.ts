import { IsString, IsNotEmpty, IsOptional, IsNumber } from "class-validator";

export class SubmitAnswerDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  questionId: string;

  @IsNumber()
  @IsNotEmpty()
  answer: number; // Changed from selectedAnswer (string) to answer (number) - the index of the selected option

  @IsString()
  @IsOptional()
  courseId?: string; // Added courseId as optional

  @IsNumber()
  @IsOptional()
  timeSpent?: number;
}
