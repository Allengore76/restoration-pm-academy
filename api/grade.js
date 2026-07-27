import OpenAI from "openai";

const MAX_RESPONSE_LENGTH = 5000;

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return response.status(503).json({
      error: "AI grading is not configured on this deployment.",
      fallback: true
    });
  }

  const body = typeof request.body === "string" ? safeJsonParse(request.body) : request.body;
  const question = cleanString(body?.question, 1200);
  const learnerResponse = cleanString(body?.learnerResponse, MAX_RESPONSE_LENGTH);
  const modelAnswer = cleanString(body?.rubric?.modelAnswer, 5000);
  const concepts = Array.isArray(body?.rubric?.concepts)
    ? body.rubric.concepts.slice(0, 12).map((item) => cleanString(item?.label, 300)).filter(Boolean)
    : [];
  const minimumWords = Number.isFinite(body?.minimumWords)
    ? Math.max(1, Math.min(500, body.minimumWords))
    : 25;

  if (!question || !learnerResponse || !modelAnswer || concepts.length === 0) {
    return response.status(400).json({
      error: "Question, response, model answer, and rubric concepts are required."
    });
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const result = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5-mini",
      instructions: [
        "You grade restoration-construction training answers for a project-management learner.",
        "Score technical meaning, not exact wording. Award partial credit when a concept is substantially correct.",
        "Do not invent project facts or product requirements. Keep feedback practical, respectful, and concise.",
        "Return only valid JSON with exactly these fields: score (integer 0-100), feedback (string), improvedAnswer (string)."
      ].join(" "),
      input: JSON.stringify({
        question,
        learnerResponse,
        minimumWords,
        requiredConcepts: concepts,
        referenceAnswer: modelAnswer,
        scoringGuidance: {
          conceptCoveragePercent: 80,
          clarityAndApplicationPercent: 20,
          passingScore: 85
        }
      })
    });

    const parsed = parseModelJson(result.output_text);
    if (
      !parsed ||
      !Number.isFinite(parsed.score) ||
      typeof parsed.feedback !== "string" ||
      typeof parsed.improvedAnswer !== "string"
    ) {
      throw new Error("The model returned an invalid grading payload.");
    }

    return response.status(200).json({
      score: Math.max(0, Math.min(100, Math.round(parsed.score))),
      feedback: parsed.feedback.slice(0, 2500),
      improvedAnswer: parsed.improvedAnswer.slice(0, 5000)
    });
  } catch (error) {
    console.error("Open-response grading failed", error);
    return response.status(502).json({
      error: "AI grading was temporarily unavailable.",
      fallback: true
    });
  }
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function cleanString(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function parseModelJson(value) {
  if (typeof value !== "string") return null;
  const cleaned = value.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

  try {
    return JSON.parse(cleaned);
  } catch {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace <= firstBrace) return null;

    try {
      return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
    } catch {
      return null;
    }
  }
}
