import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
} from "class-validator";

export class CreateQuizDto {
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsNumber()
  @IsOptional()
  questionCount?: number;

  @IsEnum(["easy", "medium", "hard"])
  @IsOptional()
  difficulty?: "easy" | "medium" | "hard";
}
