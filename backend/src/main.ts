import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import * as fs from "fs";
import * as path from "path";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Enable CORS - UPDATE PORTS HERE
  app.enableCors({
    origin: [
      'http://localhost:3000',  // ← Your new frontend port
      'http://localhost:5173',  // Keep old one just in case
      'http://localhost:5174',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(new ValidationPipe());

  const port = process.env.PORT || 4000; // ← Your new backend port
  await app.listen(port);
  
  console.log(`🚀 Backend running on: http://localhost:${port}`);
  console.log(`📡 CORS enabled for: http://localhost:3000`);
}
bootstrap();





