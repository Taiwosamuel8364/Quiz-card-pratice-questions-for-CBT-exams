import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type QuestionDocument = Question & Document;

@Schema({ timestamps: true })
export class Question {
  @Prop({ required: true })
  courseId: string;

  @Prop({ required: true })
  question: string;

  @Prop({ type: [String], required: true })
  options: string[];

  @Prop({ required: true, type: Number })
  correctAnswer: number;

  @Prop()
  explanation: string;

  @Prop()
  topic: string;

  @Prop()
  difficulty: string;

  @Prop()
  sourceFile: string;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);