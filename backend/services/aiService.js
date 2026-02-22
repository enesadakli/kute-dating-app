import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key_for_testing');

export const analyzeChatSentiment = async (messages) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const formattedMessages = messages.map(m => `${m.senderName}: ${m.content}`).join('\n');

        const prompt = `
    Sen bir ilişki danışmanı ve flört koçusun. Aşağıdaki konuşmaları analiz et. Bana JSON formatında bir duygu durumu özeti çıkar.
    İçermesi gereken anahtarlar:
    - "sentimentScore" (0'dan 100'e kadar flört uyumu skoru)
    - "vibe" (Konuşmanın genel enerjisi - örn: Neşeli, Gergin, Flörtöz, Samimi)
    - "advice" (Taraflara verebileceğin kısa ve yaratıcı bir tavsiye)
    
    Sadece JSON dön, başka yazı ekleme.
    
    Konuşma:
    ${formattedMessages}
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Basit bir JSON parse kurtarma
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);

    } catch (error) {
        console.error("AI Analysis Error:", error);
        return {
            sentimentScore: 50,
            vibe: "Bilinmiyor",
            advice: "AI Analizi şu an yapılamıyor, konuşmaya devam edin."
        };
    }
};
