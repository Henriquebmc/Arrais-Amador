
import React, { useState, useEffect } from 'react';
import { Question, FeedbackMode } from '../types';
import Button from './Button';

interface QuizCardProps {
  question: Question;
  selectedAnswer: number | null;
  onSelectAnswer: (index: number) => void;
  feedbackMode: FeedbackMode;
  onNext: () => void;
  onPrevious: () => void;
  onExplain?: (question: Question, userAns: number) => void;
  onReviewSubject?: (question: Question) => void;
  isFirst: boolean;
  isLast: boolean;
  totalQuestions: number;
  currentIndex: number;
}

const QuizCard: React.FC<QuizCardProps> = ({
  question,
  selectedAnswer,
  onSelectAnswer,
  feedbackMode,
  onNext,
  onPrevious,
  onExplain,
  onReviewSubject,
  isFirst,
  isLast,
  totalQuestions,
  currentIndex
}) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const isImmediate = feedbackMode === 'immediate';

  // Reseta o estado de submissão ao mudar de questão
  useEffect(() => {
    setIsSubmitted(false);
  }, [question.id]);

  const handleAction = () => {
    if (isImmediate && !isSubmitted) {
      setIsSubmitted(true);
    } else {
      onNext();
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 max-w-2xl w-full mx-auto animate-fade-in border-t-4 border-blue-500">
      {/* Progress Header */}
      <div className="flex justify-between items-center mb-6">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
          {question.category}
        </span>
        <span className="text-sm font-medium text-gray-500">
          Questão {currentIndex + 1} de {totalQuestions}
        </span>
      </div>

      <div className="h-2 w-full bg-gray-100 rounded-full mb-8 overflow-hidden">
        <div 
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
        ></div>
      </div>

      {/* Question Text */}
      <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-8 leading-tight">
        {question.text}
      </h2>

      {/* Options */}
      <div className="space-y-3 mb-8">
        {question.options.map((option, index) => {
          let optionStyles = "flex items-center p-4 rounded-xl border-2 transition-all ";
          const isCorrect = index === question.correctAnswer;
          const isSelected = selectedAnswer === index;

          const showFeedback = isImmediate && isSubmitted;

          if (showFeedback) {
            if (isCorrect) {
              optionStyles += "border-green-500 bg-green-50 text-green-800 shadow-sm";
            } else if (isSelected && !isCorrect) {
              optionStyles += "border-red-500 bg-red-50 text-red-800 shadow-sm";
            } else {
              optionStyles += "border-gray-100 opacity-60 text-gray-500";
            }
          } else {
            if (isSelected) {
              optionStyles += "border-blue-500 bg-blue-50 text-blue-800 shadow-md cursor-pointer";
            } else {
              optionStyles += "border-gray-100 hover:border-blue-200 hover:bg-gray-50 text-gray-700 cursor-pointer";
            }
          }

          return (
            <div 
              key={index} 
              onClick={() => !showFeedback && onSelectAnswer(index)}
              className={optionStyles}
            >
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 transition-colors ${
                isSelected 
                  ? (showFeedback && !isCorrect ? 'border-red-500 bg-red-500' : 'border-blue-500 bg-blue-500') 
                  : (showFeedback && isCorrect ? 'border-green-500 bg-green-500' : 'border-gray-300')
              }`}>
                {(isSelected || (showFeedback && isCorrect)) && (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
              </div>
              <span className="flex-1 font-medium">{option}</span>
              {showFeedback && (
                <div className="ml-2">
                  {isCorrect && <i className="fas fa-check text-green-600"></i>}
                  {isSelected && !isCorrect && <i className="fas fa-times text-red-600"></i>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Learn More Button (Visible before selection or submission) */}
      {!isSubmitted && onReviewSubject && (
        <div className="mb-6 flex justify-center">
          <button 
            onClick={() => onReviewSubject(question)}
            className="flex items-center gap-2 text-cyan-600 hover:text-cyan-700 font-bold text-sm bg-cyan-50 px-4 py-2 rounded-full transition-colors border border-cyan-100"
          >
            <i className="fas fa-lightbulb"></i> Não sabe a resposta? Aprender este tema
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center pt-6 border-t border-gray-100">
        <Button 
          variant="outline" 
          onClick={onPrevious} 
          disabled={isFirst || (isImmediate && isSubmitted)}
          className="flex items-center"
        >
          <i className="fas fa-arrow-left mr-2"></i> Anterior
        </Button>
        
        <Button 
          variant={isImmediate && !isSubmitted ? "secondary" : "primary"}
          onClick={handleAction}
          disabled={selectedAnswer === null}
          className="flex items-center"
        >
          {isImmediate && !isSubmitted ? (
            <>Verificar <i className="fas fa-check-double ml-2"></i></>
          ) : (
            <>{isLast ? 'Finalizar' : 'Próxima'} <i className="fas fa-arrow-right ml-2"></i></>
          )}
        </Button>
      </div>
      
      {isImmediate && isSubmitted && (
        <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200 animate-fade-in space-y-4">
          <div className="text-center">
            <p className={`font-bold text-lg mb-1 ${selectedAnswer === question.correctAnswer ? 'text-green-600' : 'text-red-600'}`}>
              {selectedAnswer === question.correctAnswer ? 'Correto!' : 'Incorreto.'}
            </p>
            <p className="text-sm text-gray-600">
              A resposta correta é: <span className="font-semibold text-gray-800">{question.options[question.correctAnswer]}</span>
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3 justify-center pt-2 border-t border-slate-200">
            {onExplain && (
              <button 
                onClick={() => onExplain(question, selectedAnswer!)}
                className="bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-2"
              >
                <i className="fas fa-robot"></i> Discutir questão
              </button>
            )}
            {onReviewSubject && (
              <button 
                onClick={() => onReviewSubject(question)}
                className="bg-white border border-cyan-200 text-cyan-600 hover:bg-cyan-50 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-2"
              >
                <i className="fas fa-book-open"></i> Estudar Matéria
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizCard;
