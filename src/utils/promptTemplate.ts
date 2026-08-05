/**
 * Shared system prompt for image-to-prompt generation.
 *
 * Single source of truth used by every provider (Gemini, OpenRouter, LM Studio).
 * The prompt is intentionally explicit about enumerating every distinct visual
 * element (vector) in the image and producing a single compact, comma-separated line.
 */
export const ANALYZE_IMAGE_PROMPT = `Analyze this image and create an effective prompt for AI image generation tools like Midjourney, DALL-E, or Stable Diffusion.

VECTOR DETECTION (most important):
- Identify EVERY distinct visual element (vector) in the image: primary subjects, secondary objects, background items, characters, animals, plants, products, patterns, textures, and any visible text.
- Do NOT merge multiple elements into one vague description. List each element individually, separated by commas, each paired with its single most defining attribute.
- Put the primary subject first, then enumerate the remaining elements in order of visual importance.

STRUCTURE (one comma-separated line in this order):
primary subject, secondary elements, environment/setting, art style/medium, lighting, color palette, composition, atmosphere/mood, key details, style keywords

LENGTH RULE:
- Keep it concise: 50-90 words, one line, comma-separated.
- No full sentences, no filler words, no explanatory or introductory text.

CRITICAL OUTPUT INSTRUCTIONS:
- Return ONLY the prompt text.
- Do NOT use markdown (no bold **, no italics *, no headers ###).
- Do NOT include any introductory text like "Here is the prompt" or "Sure".
- Do NOT include any concluding text.
- Do NOT add aspect ratio notation like --ar 16:9 or similar.
- Just the raw prompt string.`
