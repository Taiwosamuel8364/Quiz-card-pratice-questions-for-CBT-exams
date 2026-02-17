import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type CourseDocument = Course & Document;

@Schema({ timestamps: true })
export class Course {
  @Prop({ required: true, unique: true })
  courseId: string;

  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ type: [String] })
  topics: string[];

  @Prop()
  totalQuestions: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  sourceFile: string; // Path to uploaded PDF or content

  @Prop({ type: Object })
  metadata: {
    uploadedAt?: Date;
    fileSize?: number;
    pageCount?: number;
  };
}

export const CourseSchema = SchemaFactory.createForClass(Course);
