import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty?: "easy" | "medium" | "hard";
}

@Injectable()
export class MastraService {
  private readonly logger = new Logger(MastraService.name);
  private apiKeys: string[];
  private currentKeyIndex: number = 0;
  private modelName: string;
  private invalidKeys: Set<string> = new Set();

  constructor(private configService: ConfigService) {
    const apiKeyString = this.configService.get<string>("GEMINI_API_KEY");
    this.modelName =
      this.configService.get<string>("GEMINI_MODEL") || "gemini-2.5-flash";

    if (!apiKeyString) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    this.apiKeys = apiKeyString
      .split(",")
      .map((key) => key.trim())
      .filter((key) => key.length > 0);

    this.logger.log(
      `✅ Gemini AI initialized with ${this.apiKeys.length} API key(s) and model: ${this.modelName}`,
    );
  }

  private getNextValidKey(): { key: string; index: number } | null {
    const startIndex = this.currentKeyIndex;
    let attempts = 0;

    while (attempts < this.apiKeys.length) {
      const key = this.apiKeys[this.currentKeyIndex];
      const index = this.currentKeyIndex;

      this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;

      if (!this.invalidKeys.has(key)) {
        return { key, index };
      }

      attempts++;
    }

    return null;
  }

  private splitIntoChunks(
    content: string,
    chunkSize: number = 12000,
  ): string[] {
    const chunks: string[] = [];
    const paragraphs = content.split(/\n\n+/);
    let currentChunk = "";

    for (const paragraph of paragraphs) {
      if (currentChunk.length + paragraph.length > chunkSize) {
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
        }

        if (paragraph.length > chunkSize) {
          const sentences = paragraph.split(/\. +/);
          currentChunk = "";

          for (const sentence of sentences) {
            if (currentChunk.length + sentence.length > chunkSize) {
              if (currentChunk.trim()) {
                chunks.push(currentChunk.trim());
              }
              currentChunk = sentence + ". ";
            } else {
              currentChunk += sentence + ". ";
            }
          }
        } else {
          currentChunk = paragraph;
        }
      } else {
        currentChunk += "\n\n" + paragraph;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  async generateQuizQuestions(
    content: string,
    count: number = 10,
    difficulty: "easy" | "medium" | "hard" = "medium",
  ): Promise<QuizQuestion[]> {
    this.logger.log(`📚 Processing ${content.length} characters of content`);
    this.logger.log(`🎯 Target: ${count} ${difficulty} questions`);

    const chunks = this.splitIntoChunks(content, 12000);
    this.logger.log(`📄 Split content into ${chunks.length} chunk(s)`);

    const questionsPerChunk = Math.ceil(count / chunks.length);
    const allQuestions: QuizQuestion[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunkNum = i + 1;
      const isLastChunk = i === chunks.length - 1;

      const questionsNeeded = isLastChunk
        ? count - allQuestions.length
        : questionsPerChunk;

      if (questionsNeeded <= 0) break;

      this.logger.log(
        `\n📖 Processing chunk ${chunkNum}/${chunks.length} (${chunks[i].length} chars, ${questionsNeeded} questions)`,
      );

      try {
        const chunkQuestions = await this.generateQuestionsFromChunk(
          chunks[i],
          questionsNeeded,
          difficulty,
          chunkNum,
          chunks.length,
        );

        allQuestions.push(...chunkQuestions);

        this.logger.log(
          `✅ Chunk ${chunkNum}: Generated ${chunkQuestions.length} questions. Total: ${allQuestions.length}/${count}`,
        );

        if (i < chunks.length - 1 && chunks.length > 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error: any) {
        this.logger.error(
          `⚠️ Failed to generate questions from chunk ${chunkNum}: ${error.message}`,
        );

        if (allQuestions.length === 0 && i === chunks.length - 1) {
          throw error;
        }
      }
    }

    if (allQuestions.length === 0) {
      throw new Error("Failed to generate any questions from the document");
    }

    this.logger.log(
      `\n🎉 Successfully generated ${allQuestions.length} questions from ${chunks.length} chunk(s)`,
    );

    return allQuestions;
  }

  // 🔧 IMPROVED: Better prompts for each difficulty level
  private getDifficultyPrompt(difficulty: "easy" | "medium" | "hard"): string {
    switch (difficulty) {
      case "easy":
        return `
DIFFICULTY: EASY
- Test basic recall and understanding
- Questions should be straightforward but not trivial
- Wrong options should be clearly incorrect upon careful reading
- Avoid trick questions
- Example: "What is X?" or "Which of the following describes Y?"`;

      case "medium":
        return `
DIFFICULTY: MEDIUM  
- Test application and analysis of concepts
- Require students to understand relationships between ideas
- Wrong options should be plausible but distinguishable with careful thought
- May include scenario-based questions
- Mix terminology, concepts, and application
- Example: "If X occurs, what is the most likely result?" or "How does A relate to B?"`;

      case "hard":
        return `
DIFFICULTY: HARD
- Test deep understanding, synthesis, and critical thinking
- Create DECEPTIVE distractors that seem correct at first glance
- All wrong options MUST be highly plausible and closely related to the topic
- Include subtle differences between options
- Test edge cases, exceptions, and nuanced distinctions
- Avoid obvious extremes or absurd options
- Students should need to carefully distinguish between similar concepts
- Mix common misconceptions as wrong answers
- Example wrong options:
  ✅ GOOD: "Mitosis produces two diploid cells" vs "Meiosis produces two diploid cells" (subtle difference)
  ❌ BAD: "Mitosis produces two diploid cells" vs "Mitosis produces bananas" (obviously wrong)`;
    }
  }

  private async generateQuestionsFromChunk(
    content: string,
    count: number,
    difficulty: "easy" | "medium" | "hard",
    chunkNum: number,
    totalChunks: number,
  ): Promise<QuizQuestion[]> {
    const maxAttempts = this.apiKeys.length;
    let lastError: any;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const keyData = this.getNextValidKey();

      if (!keyData) {
        throw new Error(
          `All ${this.apiKeys.length} API keys are invalid or exhausted.`,
        );
      }

      const { key, index } = keyData;
      const maskedKey = `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;

      try {
        this.logger.log(
          `  Attempt ${attempt}/${maxAttempts} using API key #${index + 1} (${maskedKey})`,
        );

        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({
          model: this.modelName,
          generationConfig: {
            temperature: 0.8, // 🔧 Increased for more creative distractors
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 8192,
          },
        });

        const contextInfo =
          totalChunks > 1
            ? `\n\nNOTE: This is section ${chunkNum} of ${totalChunks} from a larger document. Generate questions specifically from THIS section.`
            : "";

        // 🔧 IMPROVED: Much better prompt with difficulty-specific instructions
        const prompt = `You are an expert exam writer creating CBT (Computer-Based Test) questions for professional certification exams.

CONTENT (Section ${chunkNum}/${totalChunks}):
${content}${contextInfo}

${this.getDifficultyPrompt(difficulty)}

CRITICAL REQUIREMENTS FOR DISTRACTORS (Wrong Answers):
${
  difficulty === "hard"
    ? `
⚠️ HARD MODE - CREATE CHALLENGING DISTRACTORS:
1. ALL wrong options must be plausible and closely related to the correct answer
2. Use common misconceptions as wrong answers
3. Include partially correct statements that are subtly wrong
4. Test fine distinctions between similar concepts
5. Avoid obviously wrong answers like unrelated terms
6. Make students think carefully - no "gimme" questions
7. Wrong answers should only be distinguishable with deep understanding

GOOD EXAMPLE (Hard):
Question: "What is the primary function of the rough endoplasmic reticulum?"
✅ Correct: "Synthesis and modification of proteins destined for secretion"
✅ Good Distractor: "Synthesis and modification of all cellular proteins" (too broad - plausible misconception)
✅ Good Distractor: "Lipid synthesis and detoxification" (that's smooth ER - common confusion)
✅ Good Distractor: "Protein synthesis and packaging into vesicles" (mixing ER and Golgi functions)

BAD EXAMPLE (Too Easy):
❌ Bad Distractor: "Converting sunlight to energy" (obviously wrong - that's chloroplasts)
❌ Bad Distractor: "Storing genetic information" (obviously wrong - that's nucleus)
`
    : difficulty === "medium"
      ? `
📊 MEDIUM MODE - BALANCED CHALLENGE:
1. Mix obviously wrong and plausible distractors (2 plausible, 1 clearly wrong)
2. Include one option that's close but not quite right
3. Test understanding of relationships between concepts
4. Options should require reading the question carefully
`
      : `
📖 EASY MODE - CLEAR BUT NOT TRIVIAL:
1. One clearly wrong option is acceptable
2. Other options should still require basic understanding
3. Focus on testing recall and basic comprehension
4. Avoid trick questions
`
}

STRICT JSON FORMAT - EXACTLY ${count} QUESTIONS:
[
  {
    "question": "Clear, specific question about the content",
    "options": [
      "First option (mix the position of correct answer)",
      "Second option (plausible distractor)", 
      "Third option (plausible distractor)",
      "Fourth option (${difficulty === "hard" ? "highly plausible distractor" : "clearly wrong or plausible distractor"})"
    ],
    "correctAnswer": 2,
    "explanation": "Detailed explanation why this is correct AND why others are wrong",
    "difficulty": "${difficulty}"
  }
]

ADDITIONAL REQUIREMENTS:
1. Cover DIFFERENT topics from this section
2. Exactly 4 options per question
3. correctAnswer must be 0, 1, 2, or 3 (index, NOT the letter A/B/C/D)
4. Return ONLY valid JSON - NO markdown, NO backticks, NO extra text
5. Questions should be concise but clear
6. Avoid questions that can be answered without reading the content
7. Randomize the position of the correct answer (don't always put it in the same position)

Generate EXACTLY ${count} challenging ${difficulty} questions now:`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text().trim();

        this.logger.log(
          `  ✅ API key #${index + 1} responded (${text.length} chars)`,
        );

        text = this.cleanJsonResponse(text);
        const questions = this.parseQuestions(text, count);
        this.validateQuestions(questions, count);

        this.logger.log(
          `  ✅ Generated ${questions.length} valid questions from chunk ${chunkNum}`,
        );

        return questions;
      } catch (error: any) {
        lastError = error;
        this.logger.error(`  ❌ Attempt ${attempt} failed: ${error.message}`);

        if (
          error.message.includes("API_KEY_INVALID") ||
          error.message.includes("API key not valid")
        ) {
          this.invalidKeys.add(key);
          this.logger.error(
            `  ❌ API key #${index + 1} (${maskedKey}) is INVALID`,
          );
          continue;
        }

        if (error.message.includes("429") || error.message.includes("quota")) {
          this.logger.warn(
            `  ⏳ API key #${index + 1} quota exceeded. Trying next key...`,
          );
          continue;
        }

        if (attempt < maxAttempts) {
          const delay = 2000;
          this.logger.warn(`  Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    const validKeysCount = this.apiKeys.length - this.invalidKeys.size;
    throw new Error(
      `Failed to generate questions from chunk ${chunkNum} after ${maxAttempts} attempts. ` +
        `Valid keys: ${validKeysCount}/${this.apiKeys.length}. ` +
        `Last error: ${lastError.message}`,
    );
  }

  private cleanJsonResponse(text: string): string {
    text = text.replace(/```json\s*/gi, "");
    text = text.replace(/```\s*/g, "");

    const firstBracket = text.indexOf("[");
    if (firstBracket > 0) {
      text = text.substring(firstBracket);
    }

    const lastBracket = text.lastIndexOf("]");
    if (lastBracket > 0 && lastBracket < text.length - 1) {
      text = text.substring(0, lastBracket + 1);
    }

    text = text
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]")
      .replace(/:\s*'([^']*)'/g, ': "$1"')
      .replace(/"\s*:\s*"/g, '": "')
      .trim();

    return text;
  }

  private parseQuestions(text: string, expectedCount: number): QuizQuestion[] {
    try {
      const parsed = JSON.parse(text);

      if (Array.isArray(parsed)) {
        return parsed;
      }

      if (parsed.questions && Array.isArray(parsed.questions)) {
        return parsed.questions;
      }

      throw new Error(
        "Response is not an array or does not contain a questions array",
      );
    } catch (parseError: any) {
      this.logger.error(`JSON Parse Error: ${parseError.message}`);

      const jsonArrayMatch = text.match(/\[[\s\S]*\]/);
      if (jsonArrayMatch) {
        try {
          const extracted = JSON.parse(jsonArrayMatch[0]);
          if (Array.isArray(extracted)) {
            this.logger.log("✅ Successfully extracted JSON array using regex");
            return extracted;
          }
        } catch (regexError) {
          this.logger.error(`Regex extraction also failed`);
        }
      }

      try {
        return this.manualJsonFix(text);
      } catch (manualError) {
        throw new Error(`Unable to parse JSON response: ${parseError.message}`);
      }
    }
  }

  private manualJsonFix(text: string): QuizQuestion[] {
    this.logger.warn("Attempting manual JSON fix...");

    const questionRegex = /\{[^}]*"question"\s*:\s*"[^"]*"[^}]*\}/g;
    const matches = text.match(questionRegex);

    if (!matches || matches.length === 0) {
      throw new Error("No valid question objects found in response");
    }

    const questions: QuizQuestion[] = [];

    for (const match of matches) {
      try {
        let cleaned = match
          .replace(/,\s*}/g, "}")
          .replace(/:\s*'([^']*)'/g, ': "$1"');

        const question = JSON.parse(cleaned);

        if (
          question.question &&
          question.options &&
          Array.isArray(question.options)
        ) {
          questions.push(question);
        }
      } catch (err) {
        // Skip invalid questions
      }
    }

    if (questions.length === 0) {
      throw new Error("Manual parsing found no valid questions");
    }

    this.logger.log(
      `✅ Manual parsing recovered ${questions.length} questions`,
    );
    return questions;
  }

  private validateQuestions(
    questions: QuizQuestion[],
    expectedCount: number,
  ): void {
    if (!Array.isArray(questions)) {
      throw new Error("Questions is not an array");
    }

    if (questions.length === 0) {
      throw new Error("No questions were generated");
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];

      if (!q.question || typeof q.question !== "string") {
        throw new Error(
          `Question ${i + 1}: Missing or invalid 'question' field`,
        );
      }

      if (!Array.isArray(q.options)) {
        throw new Error(`Question ${i + 1}: 'options' must be an array`);
      }

      if (q.options.length !== 4) {
        while (q.options.length < 4) {
          q.options.push(`Option ${q.options.length + 1}`);
        }

        if (q.options.length > 4) {
          q.options = q.options.slice(0, 4);
        }
      }

      if (
        typeof q.correctAnswer !== "number" ||
        q.correctAnswer < 0 ||
        q.correctAnswer > 3
      ) {
        this.logger.warn(
          `Question ${i + 1}: Invalid correctAnswer. Setting to 0.`,
        );
        q.correctAnswer = 0;
      }

      if (!q.explanation || typeof q.explanation !== "string") {
        q.explanation = `The correct answer is ${String.fromCharCode(65 + q.correctAnswer)}.`;
      }

      if (!q.difficulty) {
        q.difficulty = "medium";
      }
    }

    this.logger.log(`✅ Validated ${questions.length} questions successfully`);
  }

  getApiKeyStatus(): { total: number; valid: number; invalid: number } {
    return {
      total: this.apiKeys.length,
      valid: this.apiKeys.length - this.invalidKeys.size,
      invalid: this.invalidKeys.size,
    };
  }
}
