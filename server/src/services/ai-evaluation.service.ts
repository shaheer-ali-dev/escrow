import OpenAI from "openai";
import { env } from "../config/env.js";

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export interface AIEvaluationResult {
  passed: boolean;
  confidenceScore: number;
  reasoning: string;
  checks: Array<{
    name: string;
    passed: boolean;
    details: string;
  }>;
  deterministic: boolean;
}

export async function evaluateWithAI(
  requirementDescription: string,
  submissionContent: string,
  type: "work" | "code" | "documentation",
  language?: string,
  testResults?: string
): Promise<AIEvaluationResult> {
  let systemPrompt = "";
  let userPrompt = "";

  if (type === "code") {
    systemPrompt = `You are an expert code reviewer for a blockchain escrow system.
Evaluate code quality, security, functionality, and compliance with requirements.
Return JSON with this exact structure:
{
  "passed": boolean,
  "confidenceScore": number (0-100),
  "reasoning": string,
  "checks": [
    {
      "name": string,
      "passed": boolean,
      "details": string
    }
  ],
  "deterministic": boolean
}`;

    userPrompt = `
REQUIREMENT:
${requirementDescription}

CODE (${language || "unknown"}):
${submissionContent}

TEST RESULTS:
${testResults || "No test results provided"}

Evaluate the code against:
1. Functionality - Does it work as required?
2. Security - Any vulnerabilities?
3. Code Quality - Clean, readable, maintainable?
4. Tests - Is it tested?
5. Documentation - Comments and docstrings?

Return detailed JSON evaluation.`;
  } else if (type === "documentation") {
    systemPrompt = `You are an expert documentation reviewer.
Evaluate if documentation meets requirements and is of high quality.
Return JSON with this exact structure:
{
  "passed": boolean,
  "confidenceScore": number (0-100),
  "reasoning": string,
  "checks": [
    {
      "name": string,
      "passed": boolean,
      "details": string
    }
  ],
  "deterministic": boolean
}`;

    userPrompt = `
REQUIREMENT:
${requirementDescription}

DOCUMENTATION:
${submissionContent}

Evaluate the documentation for:
1. Completeness - Covers all aspects?
2. Clarity - Easy to understand?
3. Accuracy - Correct information?
4. Structure - Well-organized?
5. Examples - Practical examples included?

Return detailed JSON evaluation.`;
  } else {
    systemPrompt = `You are an expert work quality evaluator for a blockchain escrow system.
Your job is to evaluate if a freelancer has completed the work requirements.
Be strict but fair. Return JSON with this exact structure:
{
  "passed": boolean,
  "confidenceScore": number (0-100),
  "reasoning": string,
  "checks": [
    {
      "name": string,
      "passed": boolean,
      "details": string
    }
  ],
  "deterministic": boolean
}`;

    userPrompt = `
REQUIREMENT:
${requirementDescription}

SUBMITTED WORK:
${submissionContent}

Evaluate if the submitted work meets the requirement.
Consider:
1. Completeness - Does it cover all aspects?
2. Quality - Is the work production-ready?
3. Documentation - Is it well-documented?
4. Testing - Is it tested and verified?
5. Standards - Does it follow best practices?

Return detailed JSON evaluation.`;
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("No response from OpenAI");

    const evaluation = JSON.parse(content);
    return {
      passed: evaluation.passed,
      confidenceScore: Math.min(100, Math.max(0, evaluation.confidenceScore)),
      reasoning: evaluation.reasoning,
      checks: evaluation.checks,
      deterministic: evaluation.deterministic,
    };
  } catch (error: any) {
    console.error("AI Evaluation Error:", error);
    throw new Error(`AI evaluation failed: ${error.message}`);
  }
}