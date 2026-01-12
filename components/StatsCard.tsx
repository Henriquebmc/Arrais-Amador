
import React from 'react';
import { QuizState, Question } from '../types';
import Button from './Button';

interface StatsCardProps {
  state: QuizState;
  onRestart: () => void;
  onGenerateNew: () => void;
  onExplain?: (question: Question, userAns: number) => void;
  onReviewSubject?: (question: Question) => void;
  isGenerating?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  state, 
  onRestart, 
  onGenerateNew, 
  onExplain, 
  onReviewSubject,
  isGenerating 
}) => {
  const percentage = Math.round((state.score / state.questions.length) * 100);
  const isPassed = percentage >= 70;

  const handleShareResult = async () => {
    const text = `⚓ Acabei de completar um simulado de Arrais Amador!\n\n📊 Resultado: ${state.score}/${state.questions.length} (${percentage}%)\n✅ Status: ${isPassed ? 'Aprovado! Capitão!' : 'Quase lá!'}\n\nEstude você também com o Arrais Amador Master!`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Meu Desempenho no Arrais Master',
          text: text,
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(text);
        alert('Resultado copiado para a área de transferência!');
      }
    } catch (err) {
      console.error('Erro ao compartilhar:', err);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl w-full mx-auto animate-fade-in">
      <div className="text-center mb-10">
        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
          isPassed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
        }`}>
          <i className={`fas ${isPassed ? 'fa-check-circle' : 'fa-times-circle'} text-4xl`}></i>
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          {isPassed ? 'Aprovado! Capitão!' : 'Quase lá, marujo!'}
        </h2>
        <p className="text-gray-500 text-lg">
          Você acertou {state.score} de {state.questions.length} questões.
        </p>
        
        <button 
          onClick={handleShareResult}
          className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-bold text-sm bg-blue-50 px-4 py-2 rounded-full transition-all"
        >
          <i className="fas fa-share-alt"></i> Compartilhar Resultado
        </button>
      </div>

      <div className="flex justify-center mb-12">
        <div className="relative w-48 h-48">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              className="text-gray-200"
              strokeWidth="10"
              stroke="currentColor"
              fill="transparent"
              r="70"
              cx="96"
              cy="96"
            />
            <circle
              className={isPassed ? "text-green-500" : "text-blue-500"}
              strokeWidth="10"
              strokeDasharray={440}
              strokeDashoffset={440 - (percentage / 100) * 440}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="70"
              cx="96"
              cy="96"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-gray-800">{percentage}%</span>
            <span className="text-gray-400 text-sm font-semibold uppercase tracking-widest">Score</span>
          </div>
        </div>
      </div>

      <div className="space-y-4 mb-10">
        <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Revisão das Questões</h3>
        {state.questions.map((q, idx) => {
          const userAns = state.userAnswers[idx];
          const isCorrect = userAns === q.correctAnswer;

          return (
            <div key={q.id} className={`p-4 rounded-xl border-l-4 ${
              isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
            }`}>
              <div className="flex justify-between items-start">
                <p className="font-semibold text-gray-800 mb-1">
                  {idx + 1}. {q.text}
                </p>
                <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${
                  isCorrect ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                }`}>
                  {isCorrect ? 'Acerto' : 'Erro'}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Sua resposta: <span className="font-medium">{q.options[userAns!] || 'Não respondida'}</span>
              </p>
              
              <div className="mt-3 flex flex-wrap gap-4 items-center border-t border-gray-200/50 pt-2">
                {!isCorrect && (
                   <p className="text-green-700 text-sm font-medium">Resposta Correta: {q.options[q.correctAnswer]}</p>
                )}
                
                <div className="flex gap-3 ml-auto">
                  {onExplain && (
                    <button 
                      onClick={() => onExplain(q, userAns!)}
                      className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1 font-bold transition-colors"
                    >
                      <i className="fas fa-comments"></i> Discutir questão
                    </button>
                  )}
                  {onReviewSubject && (
                    <button 
                      onClick={() => onReviewSubject(q)}
                      className="text-cyan-600 hover:text-cyan-800 text-xs flex items-center gap-1 font-bold transition-colors"
                    >
                      <i className="fas fa-book"></i> Estudar Matéria
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button variant="outline" fullWidth size="lg" onClick={onRestart}>
          Refazer Banco Local
        </Button>
        <Button 
          variant="primary" 
          fullWidth 
          size="lg" 
          onClick={onGenerateNew}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <><i className="fas fa-spinner fa-spin mr-2"></i> Gerando...</>
          ) : (
            <><i className="fas fa-robot mr-2"></i> Gerar Questões Inéditas (IA)</>
          )}
        </Button>
      </div>
    </div>
  );
};

export default StatsCard;
