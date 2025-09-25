import axios from "axios";

/**
 * Sends the OCR text to a Gemini or other LLM endpoint to extract contact fields.
 * This function expects the LLM to return a JSON object like:
 * { firstName, lastName, phoneNumber, email, company, title, address }
 *
 * Adapt the request format to your LLM (Gemini HTTP API, Anthropic, OpenAI, etc).
 */

export async function parseContactWithGemini(ocrText: string) {
  const endpoint = process.env.GEMINI_API_URL;
  const key = process.env.GEMINI_API_KEY;
  if (!endpoint || !key) {
    throw new Error("GEMINI_API_URL or GEMINI_API_KEY not configured");
  }

  // Example: a generic POST with prompt and return json. Adjust to LLM's required schema.
  const prompt = `
Extract the contact information from the following OCR text. Return valid JSON ONLY.

Fields: firstName, lastName, phoneNumber, email, company, title, address

OCR_TEXT:
${ocrText}
  `;

  const resp = await axios.post(
    endpoint,
    {
      prompt,
      max_tokens: 400,
      temperature: 0.0,
      format: "json"
    },
    {
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
      },
    }
  );

  // Adapt to the response format
  // If the LLM returns `resp.data.text` containing JSON, parse it:
  let candidate = resp.data;
  // Try to extract JSON string if necessary
  if (typeof candidate === "string") {
    try {
      candidate = JSON.parse(candidate);
    } catch (e) {
      // attempt to locate JSON substring
      const m = candidate.match(/\{[\s\S]*\}/);
      if (m) candidate = JSON.parse(m[0]);
    }
  } else if (candidate?.choices?.[0]?.text) {
    try {
      candidate = JSON.parse(candidate.choices[0].text);
    } catch {
      const m = candidate.choices[0].text.match(/\{[\s\S]*\}/);
      if (m) candidate = JSON.parse(m[0]);
    }
  }

  return candidate;
}
