import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key_for_testing');

export const analyzeChatSentiment = async (messages) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const formattedMessages = messages.map(m => `${m.senderName}: ${m.content}`).join('\n');

        const prompt = `
Sen bir ilişki danışmanı ve duygu analiz uzmanısın. Aşağıdaki konuşmayı analiz et ve SADECE aşağıdaki JSON formatında yanıt ver, başka hiçbir şey ekleme:

{
  "sentimentScore": <0-100 arası flört uyum skoru>,
  "compatibilityScore": <0-100 arası uzun vadeli uyumluluk skoru>,
  "toxicityScore": <0-100 arası toksisite skoru, düşük iyidir>,
  "vibe": "<konuşmanın genel enerjisi, Türkçe, örn: Flörtöz, Samimi, Gergin, Neşeli, Romantik>",
  "advice": "<taraflara kısa ve yaratıcı Türkçe tavsiye, max 2 cümle>",
  "emotions": {
    "joy": <0-1 arası mutluluk>,
    "sadness": <0-1 arası üzüntü>,
    "anger": <0-1 arası öfke>,
    "fear": <0-1 arası korku>,
    "surprise": <0-1 arası şaşkınlık>
  }
}

Konuşma:
${formattedMessages}
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(jsonStr);

        return {
            sentimentScore: parsed.sentimentScore ?? 50,
            compatibilityScore: parsed.compatibilityScore ?? 50,
            toxicityScore: parsed.toxicityScore ?? 20,
            vibe: parsed.vibe ?? 'Belirsiz',
            advice: parsed.advice ?? 'Konuşmaya devam edin.',
            emotions: {
                joy: parsed.emotions?.joy ?? 0.5,
                sadness: parsed.emotions?.sadness ?? 0.1,
                anger: parsed.emotions?.anger ?? 0.1,
                fear: parsed.emotions?.fear ?? 0.1,
                surprise: parsed.emotions?.surprise ?? 0.2,
            },
        };
    } catch (error) {
        console.error("AI Analysis Error:", error);
        return {
            sentimentScore: 50,
            compatibilityScore: 50,
            toxicityScore: 20,
            vibe: "Bilinmiyor",
            advice: "AI Analizi şu an yapılamıyor, konuşmaya devam edin.",
            emotions: { joy: 0.5, sadness: 0.1, anger: 0.1, fear: 0.1, surprise: 0.2 },
        };
    }
};
