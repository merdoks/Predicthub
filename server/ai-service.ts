import OpenAI from "openai";

// Using Replit AI Integrations for OpenAI access (no personal API key needed)
let openai: OpenAI | null = null;

try {
  if (process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
    openai = new OpenAI({
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    });
    console.log('OpenAI initialized with Replit AI Integrations');
  } else {
    console.warn('OpenAI not initialized - Replit AI Integrations not configured');
  }
} catch (error) {
  console.warn('OpenAI initialization error:', error);
}

const VALID_CATEGORIES = ['Sports', 'Politics', 'Entertainment', 'Tech', 'Technology', 'Finance', 'Crypto', 'Community', 'Personal', 'Science', 'Other'] as const;

function validateCategory(category: string): string {
  const normalized = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
  // Accept both "Tech" and "Technology" 
  if (normalized === 'Tech' || normalized === 'Technology') return 'Technology';
  return VALID_CATEGORIES.includes(normalized as any) ? normalized : 'Community';
}

export interface AIPrediction {
  title: string;
  description: string;
  category: string;
  tags: string[];
  suggestedEndDate: Date;
  resolutionMethod: string;
  options: string[];
}

export async function generatePrediction(userInput: string): Promise<AIPrediction> {
  // If OpenAI not initialized, return fallback
  if (!openai) {
    console.log('Using fallback prediction generation (no API key)');
    return generateFallbackPrediction(userInput);
  }

  // Get current date for context
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
  
  // Calculate default end date (7 days from now)
  const defaultEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const defaultEndDateStr = defaultEndDate.toISOString();

  const systemPrompt = `You are an AI assistant that reformulates casual event ideas into clear, verifiable prediction market questions. 

IMPORTANT: Today's date is ${todayStr}. All suggested end dates MUST be in the future (after ${todayStr}).

Your task:
1. Convert the user's casual idea into a specific, verifiable question
2. Suggest a realistic end date (default: ${defaultEndDateStr}, but adjust based on context - could be hours, days, weeks, or months)
3. Categorize the prediction (Politics, Tech, Sports, Crypto, Community, Personal, Entertainment)
4. Generate 2-4 relevant tags
5. Suggest a resolution method (Community Vote, Verified News Source, Chainlink Oracle, Social Media Post, etc.)
6. Provide 2-4 clear outcome options (usually Yes/No, but can be multiple choice)

Return only valid JSON matching this exact structure:
{
  "title": "Will...",
  "description": "Clear description of what constitutes each outcome",
  "category": "one of: Politics, Tech, Sports, Crypto, Community, Personal, Entertainment",
  "tags": ["tag1", "tag2", "tag3"],
  "suggestedEndDate": "ISO date string (MUST be after ${todayStr})",
  "resolutionMethod": "How this will be resolved",
  "options": ["Option 1", "Option 2"]
}`;

  const userPrompt = `User's event idea: "${userInput}"

Transform this into a prediction market. Be specific and verifiable.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    const parsed = JSON.parse(content) as AIPrediction;
    
    // Validate suggested end date is in the future
    let endDate: Date;
    if (parsed.suggestedEndDate) {
      const suggestedDate = new Date(parsed.suggestedEndDate);
      const now = new Date();
      
      // If AI suggested a date in the past, use default (7 days from now)
      if (suggestedDate <= now) {
        console.warn(`AI suggested past date (${suggestedDate.toISOString()}), using default`);
        endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      } else {
        endDate = suggestedDate;
      }
    } else {
      endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
    
    // Validate and set defaults
    return {
      title: parsed.title || "Prediction Market",
      description: parsed.description || userInput,
      category: validateCategory(parsed.category || "Community"),
      tags: parsed.tags || [],
      suggestedEndDate: endDate,
      resolutionMethod: parsed.resolutionMethod || "Community Vote",
      options: parsed.options || ["Yes", "No"]
    };
  } catch (error) {
    console.error("AI generation error:", error);
    return generateFallbackPrediction(userInput);
  }
}

function generateFallbackPrediction(userInput: string): AIPrediction {
  // Simple fallback: create a basic Yes/No prediction
  const title = userInput.toLowerCase().startsWith('will ') 
    ? userInput.charAt(0).toUpperCase() + userInput.slice(1)
    : `Will ${userInput}?`;
    
  return {
    title,
    description: `This market resolves based on whether the following event occurs: ${userInput}`,
    category: "Community",
    tags: ["community", "prediction"],
    suggestedEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    resolutionMethod: "Community Vote",
    options: ["Yes", "No"]
  };
}
