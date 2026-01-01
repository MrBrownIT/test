
import { Injectable } from '@angular/core';
import { GoogleGenAI, Type, SchemaType } from '@google/genai';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async analyzeAndWriteStory(imageBase64: string): Promise<any> {
    const model = 'gemini-2.5-flash';
    
    const prompt = `
      You are a master storyteller and visual analyst. 
      1. Analyze the mood, lighting, and scene details of the provided image.
      2. Based on this analysis, ghostwrite a compelling, atmospheric opening paragraph (approx 100-150 words) to a story set in this world.
      3. Provide a title for the story.
    `;

    const response = await this.ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data: imageBase64 } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            mood: { type: Type.STRING, description: "2-3 words describing the mood (e.g., 'Ethereal Melancholy')" },
            sceneAnalysis: { type: Type.STRING, description: "A brief analysis of the visual elements." },
            storyOpening: { type: Type.STRING, description: "The creative story paragraph." }
          },
          required: ["title", "mood", "sceneAnalysis", "storyOpening"]
        }
      }
    });

    try {
      return JSON.parse(response.text || '{}');
    } catch (e) {
      console.error("Failed to parse JSON", e);
      throw new Error("Could not parse AI response");
    }
  }

  async chatWithImage(imageBase64: string, history: any[], userMessage: string): Promise<string> {
    // Construct a chat-like history for the single-turn generateContent (since we need to pass the image each time or maintain a session)
    // For simplicity and robustness with images in 'flash', we will use generateContent with the image + history context.
    
    // Simple chat implementation: Just send image + context + new message
    const model = 'gemini-2.5-flash';
    
    // Construct the prompt with history context
    let contextStr = "Previous conversation:\n";
    history.forEach(h => {
      contextStr += `${h.role === 'user' ? 'User' : 'AI'}: ${h.text}\n`;
    });

    const fullPrompt = `
      ${contextStr}
      
      User's new question: ${userMessage}
      
      Answer the user's question acting as the storyteller of the world depicted in the image. Keep it immersive.
    `;

    const response = await this.ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data: imageBase64 } },
          { text: fullPrompt }
        ]
      }
    });

    return response.text || "The spirits are silent...";
  }
}
