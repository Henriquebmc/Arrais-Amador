
import { GoogleGenAI, Type } from "@google/genai";
import { Category, Question } from "../types";

// Note: API key management is handled externally via process.env.API_KEY.
// We strictly follow the guideline to use process.env.API_KEY directly during initialization.

export const getGeminiExplanation = async (
  question: Question, 
  userAnswerIndex: number, 
  userDoubt?: string
) => {
  try {
    // Initializing with the process.env.API_KEY directly as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const correctAnswerText = question.options[question.correctAnswer];
    const userChoiceText = userAnswerIndex !== null ? question.options[userAnswerIndex] : "Nenhuma";
    
    let prompt = `Você é um instrutor náutico especialista. 
    Contexto da Questão:
    Enunciado: ${question.text}
    Categoria: ${question.category}
    Alternativas: ${question.options.join(", ")}
    Resposta Correta: ${correctAnswerText}
    O aluno escolheu: ${userChoiceText}.`;

    if (userDoubt) {
      prompt += `\n\nO aluno tem a seguinte dúvida específica: "${userDoubt}". 
      Responda de forma pedagógica e direta, focando em sanar essa dúvida específica dentro das normas da Marinha (RIPEAM/NORMAM).`;
    } else {
      prompt += `\n\nExplique de forma breve e didática por que a resposta correta é "${correctAnswerText}" e por que a escolha do aluno ("${userChoiceText}") está incorreta ou é menos adequada.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.7,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return response.text || "Sem explicação disponível.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Erro ao obter resposta da IA.";
  }
};

export const getSubjectReview = async (question: Question) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Você é um professor de escola náutica. 
    O aluno quer revisar a matéria relacionada a esta questão: "${question.text}".
    A categoria é: ${question.category}.
    
    Por favor, forneça uma "Aula Curta" sobre este tópico específico para a prova de Arrais Amador.
    Estruture sua resposta assim:
    1. Título do Tema
    2. Conceitos Fundamentais (explicando a teoria por trás da categoria)
    3. Regras de Ouro (o que nunca esquecer para a prova)
    4. Exemplo Prático de aplicação.
    
    Seja técnico mas use linguagem clara. Use Markdown para negritos e listas.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.7,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return response.text || "Não foi possível gerar a revisão teórica.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Erro ao gerar aula teórica.";
  }
};

export const getStudyMaterial = async (category: Category | 'Geral', level: 'beginner' | 'notion') => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const levelDesc = level === 'beginner' 
      ? 'não sabe absolutamente nada sobre o assunto (começar do zero absoluto)' 
      : 'já tem alguma noção mas quer aprofundar e focar no que cai na prova';
    
    const prompt = `Você é um instrutor de Arrais Amador de elite. 
    O aluno escolheu estudar o tema: "${category}".
    O nível de conhecimento do aluno é: ${levelDesc}.
    
    Crie um material de estudo estruturado em Markdown:
    1. Introdução ao tema (linguagem adequada ao nível).
    2. Glossário de Termos Essenciais.
    3. Tópicos principais para a prova (explicando de forma clara).
    4. 2 Mini-questões de fixação ao final (com respostas ocultas em spoiler se possível ou apenas listadas).
    
    Use negrito para termos técnicos e emojis náuticos para tornar a leitura agradável.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.7,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return response.text || "Não foi possível gerar o material de estudo.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Erro ao gerar material de estudo.";
  }
};

export const generateAiQuestions = async (count: number = 5, excludeTexts: string[] = []): Promise<Question[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const categoriesStr = Object.values(Category).join(", ");
  
  // Adiciona instruções de exclusão para evitar repetição
  const exclusionPrompt = excludeTexts.length > 0 
    ? `\n\nCRÍTICO: Não repita ou gere questões similares às seguintes (Histórico de questões já vistas): \n- ${excludeTexts.slice(-20).join('\n- ')}`
    : "";

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Gere ${count} questões de múltipla escolha INÉDITAS para o exame de Arrais Amador da Marinha do Brasil. 
    As categorias permitidas são: ${categoriesStr}. 
    As questões devem ser técnicas e precisas, seguindo o RIPEAM e as NORMAMs.${exclusionPrompt}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            category: { type: Type.STRING },
            text: { type: Type.STRING },
            options: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              minItems: 4,
              maxItems: 4
            },
            correctAnswer: { type: Type.INTEGER },
          },
          required: ["id", "category", "text", "options", "correctAnswer"]
        }
      }
    }
  });

  try {
    const text = response.text;
    const questions = text ? JSON.parse(text) : [];
    return questions.map((q: any) => ({
      ...q,
      category: Object.values(Category).includes(q.category as Category) 
        ? q.category 
        : Category.RIPEAM
    }));
  } catch (e) {
    console.error("Erro ao processar JSON da IA:", e);
    return [];
  }
};
