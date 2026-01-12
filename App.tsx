
import React, { useState, useEffect } from 'react';
import { QuizState, Question, FeedbackMode, Category, UserStats, QuizRun } from './types';
import { QUESTIONS_POOL } from './constants';
import { getGeminiExplanation, generateAiQuestions, getSubjectReview, getStudyMaterial } from './services/geminiService';
import QuizCard from './components/QuizCard';
import StatsCard from './components/StatsCard';
import ProfileView from './components/ProfileView';
import Button from './components/Button';

interface AiModalState {
  question: Question;
  userAns: number;
  text: string;
  loading: boolean;
  mode: 'explanation' | 'study';
}

type MainFlow = 'choice' | 'simulado_setup' | 'estudo_setup' | 'studying' | 'name_entry';
type StudyLevel = 'beginner' | 'notion';

const INITIAL_STATS: UserStats = {
  totalSimulations: 0,
  bestScore: 0,
  averagePercentage: 0,
  history: []
};

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'quiz' | 'stats' | 'loading' | 'study_page' | 'profile'>('home');
  const [flow, setFlow] = useState<MainFlow>('choice');
  const [userName, setUserName] = useState<string>('');
  const [tempName, setTempName] = useState<string>('');
  
  // Perfil e Estatísticas
  const [userStats, setUserStats] = useState<UserStats>(INITIAL_STATS);

  // Histórico de questões para evitar repetição
  const [questionHistory, setQuestionHistory] = useState<string[]>([]);
  
  // Simulation States
  const [feedbackMode, setFeedbackMode] = useState<FeedbackMode>('delayed');
  const [questionCount, setQuestionCount] = useState<number>(10);
  
  // Study States
  const [studyLevel, setStudyLevel] = useState<StudyLevel>('beginner');
  const [studyCategory, setStudyCategory] = useState<Category | 'Geral'>('Geral');
  const [studyContent, setStudyContent] = useState<string>('');

  const [quizState, setQuizState] = useState<QuizState>({
    questions: [],
    currentQuestionIndex: 0,
    userAnswers: [],
    isFinished: false,
    score: 0,
    feedbackMode: 'delayed',
  });

  const [aiExplanation, setAiExplanation] = useState<AiModalState | null>(null);
  const [userDoubt, setUserDoubt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Load state on mount
  useEffect(() => {
    const savedName = localStorage.getItem('arrais_user_name');
    if (savedName) setUserName(savedName);
    else setFlow('name_entry');

    const savedStats = localStorage.getItem('arrais_user_stats');
    if (savedStats) setUserStats(JSON.parse(savedStats));
  }, []);

  // Save stats whenever they change
  useEffect(() => {
    if (userStats.totalSimulations > 0 || userStats.history.length > 0) {
      localStorage.setItem('arrais_user_stats', JSON.stringify(userStats));
    }
  }, [userStats]);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim()) {
      setUserName(tempName.trim());
      localStorage.setItem('arrais_user_name', tempName.trim());
      setFlow('choice');
    }
  };

  const handleChangeName = () => {
    setTempName(userName);
    setFlow('name_entry');
  };

  const handleResetStats = () => {
    setUserStats(INITIAL_STATS);
    localStorage.removeItem('arrais_user_stats');
  };

  const handleShareApp = async () => {
    const shareData = {
      title: 'Arrais Amador Master',
      text: 'Estou estudando para minha habilitação náutica com o Arrais Amador Master! Venha testar seus conhecimentos.',
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copiado para a área de transferência!');
      }
    } catch (err) {
      console.error('Erro ao compartilhar:', err);
    }
  };

  const startQuiz = () => {
    const shuffled = [...QUESTIONS_POOL].sort(() => 0.5 - Math.random());
    const count = Math.min(questionCount, QUESTIONS_POOL.length);
    const selected = shuffled.slice(0, count);
    
    setQuizState({
      questions: selected,
      currentQuestionIndex: 0,
      userAnswers: new Array(selected.length).fill(null),
      isFinished: false,
      score: 0,
      feedbackMode: feedbackMode,
    });
    setView('quiz');
  };

  const startAiQuiz = async () => {
    setIsGenerating(true);
    setView('loading');
    try {
      const questions = await generateAiQuestions(questionCount, questionHistory);
      if (questions && questions.length > 0) {
        const newTexts = questions.map(q => q.text);
        setQuestionHistory(prev => [...prev, ...newTexts].slice(-50));

        setQuizState({
          questions: questions,
          currentQuestionIndex: 0,
          userAnswers: new Array(questions.length).fill(null),
          isFinished: false,
          score: 0,
          feedbackMode: feedbackMode,
        });
        setView('quiz');
      } else {
        alert("Não foi possível gerar questões. Tente o banco local.");
        setView('home');
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao conectar com a IA.");
      setView('home');
    } finally {
      setIsGenerating(false);
    }
  };

  const startStudying = async () => {
    setView('loading');
    try {
      const material = await getStudyMaterial(studyCategory, studyLevel);
      setStudyContent(material);
      setView('study_page');
    } catch (error) {
      alert("Erro ao gerar material de estudo.");
      setView('home');
      setFlow('choice');
    }
  };

  const handleSelectAnswer = (index: number) => {
    setQuizState(prev => {
      const newAnswers = [...prev.userAnswers];
      newAnswers[prev.currentQuestionIndex] = index;
      return { ...prev, userAnswers: newAnswers };
    });
  };

  const handleNext = () => {
    if (quizState.currentQuestionIndex < quizState.questions.length - 1) {
      setQuizState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1
      }));
    } else {
      finishQuiz();
    }
  };

  const handlePrevious = () => {
    if (quizState.currentQuestionIndex > 0) {
      setQuizState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex - 1
      }));
    }
  };

  const finishQuiz = () => {
    let finalScore = 0;
    const catScores: Record<string, { correct: number; total: number }> = {};

    quizState.questions.forEach((q, idx) => {
      if (!catScores[q.category]) catScores[q.category] = { correct: 0, total: 0 };
      catScores[q.category].total++;
      
      if (quizState.userAnswers[idx] === q.correctAnswer) {
        finalScore++;
        catScores[q.category].correct++;
      }
    });

    const percentage = Math.round((finalScore / quizState.questions.length) * 100);

    const newRun: QuizRun = {
      date: new Date().toISOString(),
      score: finalScore,
      total: quizState.questions.length,
      categoryScores: catScores
    };

    setUserStats(prev => {
      const newHistory = [...prev.history, newRun];
      const totalSims = newHistory.length;
      const avgPerc = Math.round(newHistory.reduce((acc, run) => acc + (run.score/run.total), 0) / totalSims * 100);
      return {
        totalSimulations: totalSims,
        bestScore: Math.max(prev.bestScore, percentage),
        averagePercentage: avgPerc,
        history: newHistory
      };
    });

    setQuizState(prev => ({
      ...prev,
      isFinished: true,
      score: finalScore
    }));
    setView('stats');
  };

  const handleAiExplain = async (question: Question, userAns: number, doubt?: string) => {
    if (!doubt) {
      setAiExplanation({ question, userAns, text: '', loading: true, mode: 'explanation' });
    } else {
      setAiExplanation(prev => prev ? { ...prev, loading: true } : null);
    }

    const explanation = await getGeminiExplanation(question, userAns, doubt);
    
    setAiExplanation(prev => prev ? {
      ...prev,
      text: explanation,
      loading: false
    } : null);

    if (doubt) setUserDoubt("");
  };

  const handleReviewSubject = async (question: Question) => {
    setAiExplanation({ question, userAns: -1, text: '', loading: true, mode: 'study' });
    const studyContent = await getSubjectReview(question);
    setAiExplanation(prev => prev ? {
      ...prev,
      text: studyContent,
      loading: false
    } : null);
  };

  const renderHomeContent = () => {
    if (flow === 'name_entry') {
      return (
        <div className="animate-fade-in py-10 max-w-md mx-auto">
          <div className="bg-blue-50 p-3 rounded-full inline-block mb-6">
            <i className="fas fa-user-circle text-4xl text-blue-600"></i>
          </div>
          <h2 className="text-2xl font-bold text-blue-900 mb-2">Bem-vindo a bordo!</h2>
          <p className="text-gray-600 mb-8">Como devemos chamar você, comandante?</p>
          <form onSubmit={handleSaveName} className="space-y-4">
            <input 
              type="text" 
              placeholder="Digite seu nome ou apelido"
              className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-all text-center text-lg font-medium"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              autoFocus
            />
            <Button size="lg" fullWidth type="submit" disabled={!tempName.trim()}>
              Começar Navegação <i className="fas fa-anchor ml-2"></i>
            </Button>
          </form>
        </div>
      );
    }

    if (flow === 'choice') {
      return (
        <div className="animate-fade-in py-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <h2 className="text-3xl font-extrabold text-blue-900">
              {userName}: Bem-vindo a bordo!
            </h2>
            <button 
              onClick={handleChangeName}
              className="text-gray-400 hover:text-blue-500 transition-colors"
              title="Alterar nome"
            >
              <i className="fas fa-pen text-sm"></i>
            </button>
          </div>
          <p className="text-gray-600 mb-10">O que vamos fazer hoje para conquistar sua habilitação Arrais Amador?</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl mx-auto">
            <button 
              onClick={() => setFlow('simulado_setup')}
              className="bg-blue-600 text-white p-8 rounded-3xl shadow-xl hover:scale-105 transition-all text-center group"
            >
              <i className="fas fa-list-check text-4xl mb-4 group-hover:animate-bounce"></i>
              <h3 className="text-xl font-bold">Fazer Simulado</h3>
              <p className="text-blue-100 text-sm mt-2 opacity-80">Teste seus conhecimentos com tempo e correção.</p>
            </button>
            <button 
              onClick={() => setFlow('estudo_setup')}
              className="bg-cyan-600 text-white p-8 rounded-3xl shadow-xl hover:scale-105 transition-all text-center group"
            >
              <i className="fas fa-book-open text-4xl mb-4 group-hover:rotate-12 transition-transform"></i>
              <h3 className="text-xl font-bold">Estudar Matéria</h3>
              <p className="text-cyan-100 text-sm mt-2 opacity-80">Aprenda a teoria com auxílio de IA personalizada.</p>
            </button>
          </div>
          
          <div className="mt-12 flex justify-center">
            <button 
              onClick={() => setView('profile')}
              className="flex items-center gap-2 text-blue-900 font-bold bg-blue-50 px-6 py-3 rounded-full hover:bg-blue-100 transition-colors border border-blue-200"
            >
              <i className="fas fa-chart-pie"></i> Ver Meu Perfil e Desempenho
            </button>
          </div>
        </div>
      );
    }

    if (flow === 'simulado_setup') {
      return (
        <div className="animate-fade-in">
          <button onClick={() => setFlow('choice')} className="text-blue-600 mb-6 flex items-center gap-2 font-semibold">
            <i className="fas fa-arrow-left"></i> Voltar
          </button>
          <h2 className="text-2xl font-bold text-blue-900 mb-8">Configure seu Simulado</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 text-left">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Modo de Correção</p>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => setFeedbackMode('immediate')}
                  className={`flex items-center px-4 py-3 rounded-xl border-2 transition-all ${
                    feedbackMode === 'immediate' ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm' : 'border-transparent bg-white text-gray-500 hover:border-gray-200'
                  }`}
                >
                  <i className="fas fa-bolt mr-3 w-5"></i>
                  <span className="font-bold text-sm">Na Hora</span>
                </button>
                <button 
                  onClick={() => setFeedbackMode('delayed')}
                  className={`flex items-center px-4 py-3 rounded-xl border-2 transition-all ${
                    feedbackMode === 'delayed' ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm' : 'border-transparent bg-white text-gray-500 hover:border-gray-200'
                  }`}
                >
                  <i className="fas fa-list-check mr-3 w-5"></i>
                  <span className="font-bold text-sm">No Final</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Número de Questões</p>
              <div className="grid grid-cols-2 gap-2">
                {[8, 10, 20, 40].map((num) => (
                  <button 
                    key={num}
                    onClick={() => setQuestionCount(num)}
                    className={`px-4 py-3 rounded-xl border-2 transition-all font-bold text-sm ${
                      questionCount === num ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm' : 'border-transparent bg-white text-gray-500 hover:border-gray-200'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={startQuiz} className="text-lg">
              Banco Local <i className="fas fa-database ml-2"></i>
            </Button>
            <Button size="lg" variant="secondary" onClick={startAiQuiz} className="text-lg">
              Gerar com IA <i className="fas fa-robot ml-2"></i>
            </Button>
          </div>
        </div>
      );
    }

    if (flow === 'estudo_setup') {
      return (
        <div className="animate-fade-in">
          <button onClick={() => setFlow('choice')} className="text-blue-600 mb-6 flex items-center gap-2 font-semibold">
            <i className="fas fa-arrow-left"></i> Voltar
          </button>
          <h2 className="text-2xl font-bold text-blue-900 mb-8">Personalize seu Estudo</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 text-left">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Seu nível atual</p>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => setStudyLevel('beginner')}
                  className={`flex items-center px-4 py-3 rounded-xl border-2 transition-all ${
                    studyLevel === 'beginner' ? 'border-cyan-600 bg-cyan-50 text-cyan-700 shadow-sm' : 'border-transparent bg-white text-gray-500 hover:border-gray-200'
                  }`}
                >
                  <i className="fas fa-seedling mr-3 w-5"></i>
                  <span className="font-bold text-sm">Não sei nada a respeito</span>
                </button>
                <button 
                  onClick={() => setStudyLevel('notion')}
                  className={`flex items-center px-4 py-3 rounded-xl border-2 transition-all ${
                    studyLevel === 'notion' ? 'border-cyan-600 bg-cyan-50 text-cyan-700 shadow-sm' : 'border-transparent bg-white text-gray-500 hover:border-gray-200'
                  }`}
                >
                  <i className="fas fa-compass mr-3 w-5"></i>
                  <span className="font-bold text-sm">Já tenho alguma noção</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">O que quer aprender?</p>
              <select 
                className="w-full bg-white border-2 border-gray-100 rounded-xl p-3 focus:outline-none focus:border-cyan-500 font-medium text-gray-700"
                value={studyCategory}
                onChange={(e) => setStudyCategory(e.target.value as any)}
              >
                <option value="Geral">Visão Geral (Tudo)</option>
                {Object.values(Category).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex justify-center">
            <Button size="lg" variant="secondary" onClick={startStudying} className="text-lg w-full sm:w-auto">
              Iniciar Aula com IA <i className="fas fa-graduation-cap ml-2"></i>
            </Button>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-blue-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => { setView('home'); setFlow('choice'); }}>
            <div className="bg-white p-2 rounded-lg text-blue-900">
              <i className="fas fa-anchor text-xl"></i>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
               Arrais Master
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleShareApp}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Compartilhar App"
            >
              <i className="fas fa-share-nodes text-xl"></i>
            </button>
            {userName && (
              <button 
                onClick={() => setView('profile')}
                className="flex items-center gap-2 hover:bg-white/10 px-4 py-2 rounded-lg transition-colors"
              >
                <i className="fas fa-user-circle text-2xl"></i>
                <span className="hidden sm:inline font-medium">{userName}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center p-4 md:p-8">
        {view === 'home' && (
          <div className="max-w-4xl w-full text-center animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 overflow-hidden relative border-t-8 border-blue-600">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <i className="fas fa-compass text-9xl"></i>
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-blue-900 mb-6 leading-tight">
                {userName || 'Comandante'} <span className="block text-2xl md:text-3xl text-cyan-600 mt-2">Simulado & Instrutor IA</span>
              </h2>
              {renderHomeContent()}
            </div>
          </div>
        )}

        {view === 'profile' && (
          <ProfileView 
            userName={userName} 
            stats={userStats} 
            onBack={() => setView('home')} 
            onReset={handleResetStats}
          />
        )}

        {view === 'loading' && (
          <div className="text-center animate-pulse">
            <i className="fas fa-anchor text-7xl text-blue-600 mb-6 animate-bounce"></i>
            <h2 className="text-2xl font-bold text-gray-800">Preparando conteúdo com IA...</h2>
          </div>
        )}

        {view === 'study_page' && (
          <div className="max-w-4xl w-full animate-fade-in">
            <div className="bg-white rounded-3xl shadow-xl p-8 border-t-8 border-cyan-500">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-cyan-900 flex items-center gap-2">
                  <i className="fas fa-graduation-cap"></i> Aula: {studyCategory}
                </h2>
                <button 
                  onClick={() => { setView('home'); setFlow('choice'); }}
                  className="text-gray-400 hover:text-gray-600 font-semibold"
                >
                  <i className="fas fa-times"></i> Sair
                </button>
              </div>
              
              <div className="prose prose-cyan max-w-none bg-cyan-50/30 p-8 rounded-2xl border border-cyan-100 shadow-inner overflow-y-auto max-h-[60vh]">
                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed text-lg">
                  {studyContent}
                </div>
              </div>

              <div className="mt-10 flex flex-wrap gap-4 justify-center">
                <Button variant="secondary" onClick={() => setFlow('simulado_setup')}>
                  Testar com Simulado <i className="fas fa-list-check ml-2"></i>
                </Button>
                <Button variant="outline" onClick={() => { setView('home'); setFlow('estudo_setup'); }}>
                  Outro Tema <i className="fas fa-book ml-2"></i>
                </Button>
              </div>
            </div>
          </div>
        )}

        {view === 'quiz' && (
          <QuizCard 
            question={quizState.questions[quizState.currentQuestionIndex]}
            selectedAnswer={quizState.userAnswers[quizState.currentQuestionIndex]}
            onSelectAnswer={handleSelectAnswer}
            feedbackMode={quizState.feedbackMode}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onExplain={handleAiExplain}
            onReviewSubject={handleReviewSubject}
            isFirst={quizState.currentQuestionIndex === 0}
            isLast={quizState.currentQuestionIndex === quizState.questions.length - 1}
            totalQuestions={quizState.questions.length}
            currentIndex={quizState.currentQuestionIndex}
          />
        )}

        {view === 'stats' && (
          <StatsCard 
            state={quizState} 
            onRestart={startQuiz}
            onGenerateNew={startAiQuiz}
            onExplain={(q, ans) => handleAiExplain(q, ans)}
            onReviewSubject={handleReviewSubject}
            isGenerating={isGenerating}
          />
        )}
      </main>

      {/* AI Explanation & Study Modal */}
      {aiExplanation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className={`p-4 border-b flex justify-between items-center ${
              aiExplanation.mode === 'study' ? 'bg-cyan-50' : 'bg-blue-50'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`${aiExplanation.mode === 'study' ? 'bg-cyan-600' : 'bg-blue-600'} p-2 rounded-lg text-white`}>
                  <i className={`fas ${aiExplanation.mode === 'study' ? 'fa-book-open' : 'fa-robot'}`}></i>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">
                    {aiExplanation.mode === 'study' ? 'Mestre IA: Revisão de Matéria' : 'Mestre IA: Explicação'}
                  </h3>
                  <p className={`text-xs ${aiExplanation.mode === 'study' ? 'text-cyan-700' : 'text-blue-700'}`}>
                    {aiExplanation.question.category}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => { setAiExplanation(null); setUserDoubt(""); }}
                className="text-gray-400 hover:text-gray-600 p-2"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-6 space-y-6">
              {aiExplanation.mode === 'explanation' && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-2">Questão Contexto</p>
                  <p className="text-gray-800 font-medium mb-3">{aiExplanation.question.text}</p>
                </div>
              )}

              <div className="relative">
                {aiExplanation.loading ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-3">
                    <div className={`w-12 h-12 border-4 ${
                      aiExplanation.mode === 'study' ? 'border-cyan-600' : 'border-blue-600'
                    } border-t-transparent rounded-full animate-spin`}></div>
                    <p className="text-sm text-gray-500 font-medium italic">
                      {aiExplanation.mode === 'study' ? 'Preparando aula teórica...' : 'Analisando as normas...'}
                    </p>
                  </div>
                ) : (
                  <div className={`prose prose-sm max-w-none ${
                    aiExplanation.mode === 'study' ? 'prose-cyan' : 'prose-blue'
                  }`}>
                    <div className={`${
                      aiExplanation.mode === 'study' ? 'bg-cyan-50/50 border-cyan-500' : 'bg-blue-50/50 border-blue-500'
                    } border-l-4 p-5 rounded-r-xl shadow-sm`}>
                      <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {aiExplanation.text}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-white border-t border-gray-100">
              <div className="relative group">
                <textarea
                  placeholder={
                    aiExplanation.mode === 'study' 
                      ? "Ficou alguma dúvida sobre esta teoria? Pergunte aqui..." 
                      : "Ainda com dúvida? Pergunte algo específico..."
                  }
                  className={`w-full p-4 pr-16 border-2 border-gray-200 rounded-2xl focus:outline-none transition-all resize-none h-24 ${
                    aiExplanation.mode === 'study' ? 'focus:border-cyan-500' : 'focus:border-blue-500'
                  }`}
                  value={userDoubt}
                  onChange={(e) => setUserDoubt(e.target.value)}
                  disabled={aiExplanation.loading}
                />
                <button
                  onClick={() => handleAiExplain(aiExplanation.question, aiExplanation.userAns, userDoubt)}
                  disabled={!userDoubt.trim() || aiExplanation.loading}
                  className={`absolute bottom-4 right-4 ${
                    aiExplanation.mode === 'study' ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-blue-600 hover:bg-blue-700'
                  } text-white p-3 rounded-xl disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-lg`}
                >
                  {aiExplanation.loading ? (
                    <i className="fas fa-circle-notch fa-spin"></i>
                  ) : (
                    <i className="fas fa-paper-plane"></i>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="bg-gray-100 py-6 border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-xs flex flex-col items-center gap-1">
          <span>Navegue com consciência. Prepare-se com o Arrais Amador Master. © 2026.</span>
          <span className="font-semibold text-blue-900/60">Desenvolvido por HenriqueBMC</span>
        </div>
      </footer>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default App;
