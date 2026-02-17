import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  topic?: string;
  difficulty: "easy" | "medium" | "hard";
  section?: string;
}

@Injectable()
export class MastraService {
  private readonly logger = new Logger(MastraService.name);
  private genAI: GoogleGenerativeAI;
  private model;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>("GEMINI_API_KEY");

    if (!apiKey) {
      this.logger.warn(
        "GEMINI_API_KEY not found. AI features will be disabled.",
      );
      return;
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    
    const modelName = this.configService.get<string>("GEMINI_MODEL") || "gemini-2.5-flash";
    
    this.logger.log(`Initializing Gemini model: ${modelName}`);
    
    this.model = this.genAI.getGenerativeModel({ 
      model: modelName,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    });

    this.logger.log(`✅ Successfully initialized Gemini AI with model: ${modelName}`);
  }

  async generateQuizQuestions(
    content: string,
    count: number = 10,
    difficulty: "easy" | "medium" | "hard" = "medium",
  ): Promise<QuizQuestion[]> {
    if (!this.model) {
      throw new Error(
        "Gemini API is not configured. Please set GEMINI_API_KEY in .env",
      );
    }

    try {
      this.logger.log(
        `Generating ${count} ${difficulty} quiz questions from content (${content.length} chars)`,
      );

      // Split content into sections for comprehensive coverage
      const sections = this.splitContentIntoSections(content, count);
      
      const difficultyGuidelines = this.getDifficultyGuidelines(difficulty);

      const prompt = `You are an expert quiz generator. Analyze the ENTIRE provided content thoroughly and generate exactly ${count} multiple-choice questions.

CRITICAL REQUIREMENTS:
1. **FULL COVERAGE**: Questions MUST be distributed across ALL sections of the material from BEGINNING to END
2. **DIFFICULTY LEVEL**: ALL questions MUST be "${difficulty.toUpperCase()}" difficulty
3. **NO REPETITION**: Each question covers different parts of the content
4. **VALIDATION**: Every question must be answerable from the provided content

DIFFICULTY GUIDELINES FOR "${difficulty.toUpperCase()}":
${difficultyGuidelines}

CONTENT SECTIONS (You must cover ALL of these):

--- SECTION 1: BEGINNING ---
${sections[0]}

--- SECTION 2: EARLY-MIDDLE ---
${sections[1] || 'N/A'}

--- SECTION 3: MIDDLE ---
${sections[2] || 'N/A'}

--- SECTION 4: LATE-MIDDLE ---
${sections[3] || 'N/A'}

--- SECTION 5: END ---
${sections[4] || 'N/A'}

RESPONSE FORMAT (JSON ONLY - NO MARKDOWN, NO CODE BLOCKS):
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Detailed explanation referencing which section this came from",
    "topic": "Topic name",
    "difficulty": "${difficulty}",
    "section": "beginning|early-middle|middle|late-middle|end"
  }
]

MANDATORY RULES:
- Return ONLY the JSON array, no extra text
- Exactly ${count} questions
- All questions ${difficulty.toUpperCase()} difficulty
- Distribute questions across ALL 5 sections
- Each option should be plausible but only ONE correct
- Explanations must be clear and reference the source section

Generate the ${count} ${difficulty} questions now:`;

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      this.logger.log("Received response from Gemini AI");

      // Parse the JSON response
      let questions;
      try {
        const cleanedText = text
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();

        questions = JSON.parse(cleanedText);
      } catch (parseError) {
        this.logger.error("Failed to parse AI response as JSON");
        this.logger.debug(`Raw response preview: ${text.substring(0, 500)}`);
        throw new Error("Failed to parse AI response. Please try again.");
      }

      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error("AI did not return valid questions");
      }

      // Validate and enforce difficulty
      const validatedQuestions = questions.map((q, index) => ({
        question: q.question || `Question ${index + 1}`,
        options: Array.isArray(q.options) && q.options.length === 4
          ? q.options
          : ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: typeof q.correctAnswer === "number"
          ? q.correctAnswer
          : 0,
        explanation: q.explanation || "No explanation provided.",
        topic: q.topic || "General",
        difficulty: difficulty, // Force the requested difficulty
        section: q.section || this.determineSectionFromIndex(index, questions.length),
      }));

      // Analyze distribution
      const distribution = this.analyzeDistribution(validatedQuestions);
      this.logger.log(
        `Successfully generated ${validatedQuestions.length} ${difficulty} questions`,
      );
      this.logger.log(`Question distribution: ${JSON.stringify(distribution)}`);

      return validatedQuestions;
    } catch (error) {
      this.logger.error("Error generating quiz questions:", error.message);
      throw new Error(`Failed to generate quiz questions: ${error.message}`);
    }
  }

  private splitContentIntoSections(content: string, questionCount: number): string[] {
    // Clean and normalize content
    const cleaned = content.replace(/\s+/g, ' ').trim();
    const totalLength = cleaned.length;
    
    // Always split into 5 sections for comprehensive coverage
    const sectionCount = 5;
    const sectionSize = Math.floor(totalLength / sectionCount);
    
    const sections: string[] = [];
    
    for (let i = 0; i < sectionCount; i++) {
      const start = i * sectionSize;
      const end = i === sectionCount - 1 ? totalLength : (i + 1) * sectionSize;
      const section = cleaned.substring(start, end);
      
      // Limit each section to 3000 chars to fit in prompt
      const limitedSection = section.length > 3000 
        ? section.substring(0, 3000) + "..."
        : section;
      
      sections.push(limitedSection);
    }
    
    this.logger.log(`Split ${totalLength} chars into ${sections.length} sections for full coverage`);
    return sections;
  }

  private getDifficultyGuidelines(difficulty: string): string {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return `- Focus on basic facts, definitions, and simple recall
- Questions should be straightforward with obvious correct answers
- Minimal analysis or critical thinking required
- Example: "What is the definition of X?" or "Which of these is a characteristic of Y?"
- Wrong options should be clearly different from the correct answer`;
      
      case 'medium':
        return `- Require understanding and application of concepts
- Some analysis and reasoning needed
- May involve simple problem-solving or comparing concepts
- Example: "How does X affect Y?" or "What is the relationship between A and B?"
- Wrong options should be plausible but clearly incorrect upon reflection`;
      
      case 'hard':
        return `- Complex scenarios requiring deep analysis and synthesis
- Critical thinking and evaluation of multiple factors
- Edge cases, nuanced situations, and advanced applications
- May require combining multiple concepts or identifying subtle differences
- Example: "Given conditions X, Y, and Z, what would be the most likely outcome and why would alternative approaches fail?"
- Wrong options should be sophisticated and require careful reasoning to eliminate`;
      
      default:
        return '- Standard difficulty level requiring understanding of core concepts';
    }
  }

  private determineSectionFromIndex(index: number, total: number): string {
    const position = index / total;
    if (position < 0.2) return 'beginning';
    if (position < 0.4) return 'early-middle';
    if (position < 0.6) return 'middle';
    if (position < 0.8) return 'late-middle';
    return 'end';
  }

  private analyzeDistribution(questions: QuizQuestion[]): object {
    const distribution = {
      beginning: 0,
      'early-middle': 0,
      middle: 0,
      'late-middle': 0,
      end: 0,
      total: questions.length,
    };

    questions.forEach(q => {
      if (q.section && distribution.hasOwnProperty(q.section)) {
        distribution[q.section]++;
      }
    });

    return distribution;
  }

  async generateFromPDF(
    pdfText: string,
    options?: { count?: number; difficulty?: "easy" | "medium" | "hard" },
  ): Promise<QuizQuestion[]> {
    return this.generateQuizQuestions(
      pdfText,
      options?.count || 10,
      options?.difficulty || "medium",
    );
  }

  async generateFollowUpQuestions(
    topic: string,
    incorrectConcepts: string[],
  ): Promise<QuizQuestion[]> {
    const content = `Topic: ${topic}\nConcepts needing reinforcement: ${incorrectConcepts.join(", ")}`;
    return this.generateQuizQuestions(content, 5, "easy");
  }
}
