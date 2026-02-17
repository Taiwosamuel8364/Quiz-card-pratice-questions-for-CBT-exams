import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import { ConfigService } from "@nestjs/config";
import * as fs from "fs";
import * as path from "path";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Get environment
  const nodeEnv = configService.get<string>("NODE_ENV") || "development";

  // Get frontend URLs from environment variable
  const frontendUrls = configService.get<string>("FRONTEND_URL");

  let corsOptions;

  if (nodeEnv === "production") {
    const allowedOrigins = frontendUrls
      ? frontendUrls.split(",").map((url) => url.trim())
      : [];

    corsOptions = {
      origin: allowedOrigins,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    };
  } else {
    corsOptions = {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);

        if (
          origin.startsWith("http://localhost") ||
          origin.startsWith("http://127.0.0.1")
        ) {
          return callback(null, true);
        }

        if (frontendUrls) {
          const allowedOrigins = frontendUrls
            .split(",")
            .map((url) => url.trim());
          if (allowedOrigins.includes(origin)) {
            return callback(null, true);
          }
        }

        callback(new Error("Not allowed by CORS"));
      },
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    };
  }

  app.enableCors(corsOptions);

  // Increase body size limit for file uploads
  app.use((req, res, next) => {
    if (req.path === "/api/quiz/upload") {
      // For file upload endpoint, allow larger payloads
      req.setTimeout(300000); // 5 minutes timeout for large files
    }
    next();
  });

  app.useGlobalPipes(new ValidationPipe());

  const port = configService.get<number>("PORT") || 4000;

  await app.listen(port, "0.0.0.0");

  console.log(`🚀 Backend running on: http://localhost:${port}`);
  console.log(`🌍 Environment: ${nodeEnv}`);
  console.log(
    `📡 CORS: ${nodeEnv === "production" ? "Strict origins only" : "Development mode - all localhost allowed"}`,
  );
}
bootstrap();
