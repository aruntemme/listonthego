import { LLMProvider } from '../types';
import { invoke } from '@tauri-apps/api/core';

export class LLMService {
  private provider: LLMProvider;

  constructor(provider: LLMProvider) {
    this.provider = provider;
  }

  async extractTodos(text: string): Promise<string[]> {
    const prompt = `Extract action items from the text below. Return ONLY a valid JSON array of strings.
  
  RULES:
  - Find tasks, commitments, assignments, follow-ups
  - Look for: "will do", "need to", "should", "must", "assign", "due", "deadline"
  - Each item must be actionable and clear
  - Return simple task descriptions as strings
  
  JSON FORMAT:
  [
    "Call client about project update",
    "Schedule team meeting for next week",
    "Review and approve budget proposal"
  ]
  
  TEXT:
  ${text}
  
  JSON:`;
  
    try {
      const response = await this.makeRequest(prompt);
      const content = response.choices[0]?.message?.content?.trim() || '[]';
      console.log(content);
      // Clean the response - remove any markdown formatting or extra text
      const cleanContent = this.cleanJsonResponse(content);
      
      try {
        const parsed = JSON.parse(cleanContent);
        if (Array.isArray(parsed)) {
          // Ensure all items are strings
          return parsed.map(item => {
            if (typeof item === 'string') {
              return item;
            } else if (typeof item === 'object' && item.task) {
              // Handle legacy object format
              return item.task;
            } else {
              return String(item);
            }
          }).filter(item => item.trim().length > 0);
        }
        return [];
      } catch (parseError) {
        console.warn('JSON parsing failed, attempting extraction:', parseError);
        return this.fallbackExtraction(content);
      }
    } catch (error) {
      console.error('Failed to extract todos:', error);
      throw new Error('Failed to extract action items. Please check your LLM connection.');
    }
  }
  
  private cleanJsonResponse(content: string): string {
    // Remove markdown code blocks
    content = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
    
    // Remove any text before the first '[' or '{'
    const jsonStart = Math.min(
      content.indexOf('[') >= 0 ? content.indexOf('[') : Infinity,
      content.indexOf('{') >= 0 ? content.indexOf('{') : Infinity
    );
    
    if (jsonStart !== Infinity) {
      content = content.substring(jsonStart);
    }
    
    // Remove any text after the last ']' or '}'
    const jsonEnd = Math.max(content.lastIndexOf(']'), content.lastIndexOf('}'));
    if (jsonEnd >= 0) {
      content = content.substring(0, jsonEnd + 1);
    }
    
    return content.trim();
  }
  
  private fallbackExtraction(content: string): string[] {
    const items: string[] = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Try to extract from JSON-like strings
      const taskMatch = trimmed.match(/"task":\s*"([^"]+)"/);
      if (taskMatch) {
        items.push(taskMatch[1]);
        continue;
      }
      
      // Try to extract from quoted strings
      const quotedMatch = trimmed.match(/"([^"]+)"/);
      if (quotedMatch && quotedMatch[1].length > 5) {
        items.push(quotedMatch[1]);
        continue;
      }
      
      // Try to extract from bullet points
      const bulletMatch = trimmed.match(/^[-•*]\s*(.+)/);
      if (bulletMatch && bulletMatch[1].length > 5) {
        items.push(bulletMatch[1]);
        continue;
      }
      
      // Try to extract from numbered lists
      const numberMatch = trimmed.match(/^\d+\.\s*(.+)/);
      if (numberMatch && numberMatch[1].length > 5) {
        items.push(numberMatch[1]);
      }
    }
    
    return items.filter(item => item.trim().length > 0);
  }

  async generateTLDR(content: string): Promise<string> {
    const prompt = `
Summarize the following note in 1-2 sentences. Focus on the key points and main takeaways.

Note content: "${content}"

Return only the summary, no additional formatting or explanations.
`;

    try {
      const response = await this.makeRequest(prompt);
      return response.choices[0]?.message?.content?.trim() || 'No summary available';
    } catch (error) {
      console.error('Failed to generate TLDR:', error);
      throw new Error('Failed to generate summary. Please check your LLM connection.');
    }
  }

  async extractActionPoints(content: string): Promise<string[]> {
    const prompt = `
Extract action points and next steps from the following note content. Return only the action points as a JSON array of strings. Each item should be a clear, actionable task. If no action points are found, return an empty array.

Note content: "${content}"

Return format: ["action point 1", "action point 2", ...]
`;

    try {
      const response = await this.makeRequest(prompt);
      const responseContent = response.choices[0]?.message?.content || '[]';
      
      // Clean the response
      const cleanContent = this.cleanJsonResponse(responseContent);
      
      try {
        const parsed = JSON.parse(cleanContent);
        if (Array.isArray(parsed)) {
          return parsed.map(item => String(item)).filter(item => item.trim().length > 0);
        }
        return [];
      } catch {
        // Fallback: extract items manually if JSON parsing fails
        const lines = responseContent.split('\n').filter((line: string) => line.trim());
        return lines
          .filter((line: string) => line.includes('-') || line.includes('•') || line.includes('*'))
          .map((line: string) => line.replace(/^[-•*]\s*/, '').trim())
          .filter((item: string) => item.length > 0);
      }
    } catch (error) {
      console.error('Failed to extract action points:', error);
      throw new Error('Failed to extract action points. Please check your LLM connection.');
    }
  }

  private async makeRequest(prompt: string): Promise<any> {
    try {
      const response = await invoke('call_llm_api', {
        request: {
          base_url: this.provider.baseUrl,
          api_key: this.provider.apiKey || null,
          model: this.provider.model || 'gpt-3.5-turbo',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        }
      }) as any;

      return response;
    } catch (error) {
      throw new Error(`LLM API request failed: ${error}`);
    }
  }

  updateProvider(provider: LLMProvider) {
    this.provider = provider;
  }
} 