import { GoogleGenAI, Type } from "@google/genai";
import { Employee, PaymentExtractionResult } from "../types";

// @google/genai guidelines: Use process.env.API_KEY exclusively.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const parsePaymentNotification = async (
  rawText: string,
  employees: Employee[]
): Promise<PaymentExtractionResult> => {
  // @google/genai guidelines: Assume API_KEY is pre-configured and valid.

  const employeeListString = employees.map(e => `${e.id}: ${e.name}`).join("\n");

  const prompt = `
    Bạn là một trợ lý tài chính thông minh.
    Nhiệm vụ: Phân tích nội dung tin nhắn thông báo từ ngân hàng hoặc tin nhắn văn bản về việc chuyển tiền.
    
    Danh sách nhân viên (ID: Tên):
    ${employeeListString}

    Văn bản cần phân tích:
    "${rawText}"

    Yêu cầu:
    1. Tìm số tiền được chuyển (amount).
    2. Dựa vào nội dung tin nhắn (tên người chuyển, nội dung chuyển khoản), hãy tìm nhân viên phù hợp nhất trong danh sách trên.
    3. Nếu tìm thấy tên gần đúng hoặc khớp, trả về ID của nhân viên đó. Nếu không chắc chắn, trả về null.

    Trả về định dạng JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchedEmployeeId: { type: Type.STRING, nullable: true },
            amount: { type: Type.NUMBER },
            confidence: { type: Type.STRING, description: "Lý do ngắn gọn tại sao chọn nhân viên này" }
          },
          required: ["amount"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("Không nhận được phản hồi từ AI");

    const parsed = JSON.parse(resultText) as PaymentExtractionResult;
    return parsed;

  } catch (error) {
    console.error("Gemini Parse Error:", error);
    throw new Error("Không thể phân tích tin nhắn. Vui lòng thử lại.");
  }
};