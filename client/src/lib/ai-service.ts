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
  const response = await fetch('/api/ai/generate-prediction', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userInput }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate prediction');
  }

  const data = await response.json();
  
  return {
    ...data,
    suggestedEndDate: new Date(data.suggestedEndDate)
  };
}
