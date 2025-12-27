
import { GoogleGenAI } from "@google/genai";

export const generatePatientSummary = async (rawNotes: string, patientName: string, age: string = 'unknown'): Promise<string> => {
  // Fix: Initializing GoogleGenAI right before the call to use the most up-to-date API key as per guidelines.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const prompt = `
      You are a medical assistant. Create a professional, concise medical consultation summary for a patient named ${patientName} (Age: ${age}).
      
      Raw notes from doctor: "${rawNotes}"
      
      Output format:
      1. Chief Complaint
      2. Observations
      3. Plan/Prescription Advice
      
      Keep it professional and brief.
    `;

    // Fix: Using gemini-3-flash-preview for basic text tasks.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    // Fix: Accessing response.text as a property, not a method.
    return response.text || "Could not generate summary.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating summary. Please try again.";
  }
};

export const predictWaitTime = async (queueLength: number, avgConsultTime: number): Promise<string> => {
    // Fix: Initializing GoogleGenAI right before the call as per guidelines.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        // Fix: Using gemini-3-flash-preview for basic estimation task.
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Estimate the wait time for a clinic queue with ${queueLength} patients, assuming average consult is ${avgConsultTime} mins. Return ONLY the number of minutes as an integer.`,
        });
        // Fix: Accessing .text as a property.
        const minutes = parseInt(response.text?.trim() || '0');
        return isNaN(minutes) ? `${queueLength * avgConsultTime}` : `${minutes}`;
    } catch (e) {
        return `${queueLength * avgConsultTime}`;
    }
}
