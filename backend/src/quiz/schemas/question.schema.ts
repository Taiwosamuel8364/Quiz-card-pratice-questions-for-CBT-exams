import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type QuestionDocument = Question & Document;

@Schema({ timestamps: true })
export class Question {
  @Prop({ required: true })
  userId: string; // Changed from courseId

  @Prop({ required: true })
  question: string;

  @Prop({ type: [String], required: true })
  options: string[];

  @Prop({ required: true })
  correctAnswer: number;

  @Prop()
  explanation: string;

  @Prop()
  topic: string;

  @Prop({ enum: ["easy", "medium", "hard"], default: "medium" })
  difficulty: string;

  @Prop()
  sourceFile: string;

  @Prop()
  generationId: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);

// Update indexes
QuestionSchema.index({ userId: 1, isActive: 1 }); // Changed from courseId
QuestionSchema.index({ generationId: 1 });
