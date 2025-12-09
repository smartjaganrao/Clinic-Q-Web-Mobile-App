
import { GoogleGenAI } from "@google/genai";

// Initialize the client safely for browser environments where 'process' might not be defined.
const apiKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : '';
const ai = new GoogleGenAI({ apiKey: apiKey || '' });

export const generatePatientSummary = async (rawNotes: string, patientName: string, age: string = 'unknown'): Promise<string> => {
  if (!apiKey) {
    return "AI Service Unavailable (Missing API Key).";
  }

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

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Could not generate summary.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating summary. Please try again.";
  }
};

export const predictWaitTime = async (queueLength: number, avgConsultTime: number): Promise<string> => {
    // A playful example of using AI for something simple, though a formula is better.
    // Demonstrating tool usage potential.
    if (!apiKey) return `${queueLength * avgConsultTime} minutes`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Estimate the wait time for a clinic queue with ${queueLength} patients, assuming average consult is ${avgConsultTime} mins. Return ONLY the number of minutes as an integer.`,
        });
        const minutes = parseInt(response.text?.trim() || '0');
        return isNaN(minutes) ? `${queueLength * avgConsultTime}` : `${minutes}`;
    } catch (e) {
        return `${queueLength * avgConsultTime}`;
    }
}
