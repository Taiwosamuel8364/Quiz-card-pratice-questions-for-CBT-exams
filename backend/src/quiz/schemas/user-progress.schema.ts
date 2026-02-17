import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type UserProgressDocument = UserProgress & Document;

@Schema({ timestamps: true })
export class UserProgress {
  @Prop({ required: true })
  userId: string;

  @Prop({ default: 0 })
  totalQuestions: number;

  @Prop({ default: 0 })
  correctAnswers: number;

  @Prop({ type: Object, default: {} })
  courseProgress: Record<string, any>;

  @Prop({ type: [String], default: [] })
  completedQuestions: string[];

  @Prop({ type: [String], default: [] })
  incorrectQuestions: string[];
}

export const UserProgressSchema = SchemaFactory.createForClass(UserProgress);
