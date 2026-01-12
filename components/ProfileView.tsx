
import React, { useEffect, useRef } from 'react';
import { UserStats, Category } from '../types';
import Button from './Button';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface ProfileViewProps {
  userName: string;
  stats: UserStats;
  onBack: () => void;
  onReset: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ userName, stats, onBack, onReset }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  // Calcular desempenho por categoria
  const categoryData: Record<string, { correct: number; total: number }> = {};
  Object.values(Category).forEach(cat => {
    categoryData[cat] = { correct: 0, total: 0 };
  });

  stats.history.forEach(run => {
    // Fix: Cast 'score' to the expected object type to avoid 'unknown' property access errors
    Object.entries(run.categoryScores).forEach(([cat, score]) => {
      const typedScore = score as { correct: number; total: number };
      if (categoryData[cat]) {
        categoryData[cat].correct += typedScore.correct;
        categoryData[cat].total += typedScore.total;
      }
    });
  });

  useEffect(() => {
    if (chartRef.current && stats.history.length > 0) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const labels = Object.keys(categoryData);
      const data = labels.map(l => {
        const item = categoryData[l];
        return item.total > 0 ? Math.round((item.correct / item.total) * 100) : 0;
      });

      chartInstance.current = new Chart(chartRef.current, {
        type: 'bar',
        data: {
          labels: labels.map(l => l.split(' ')[0]), // Encurtar nomes longos
          datasets: [{
            label: 'Aproveitamento (%)',
            data: data,
            backgroundColor: 'rgba(37, 99, 235, 0.6)',
            borderColor: 'rgb(37, 99, 235)',
            borderWidth: 1,
            borderRadius: 8,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              grid: { display: false }
            },
            x: {
              grid: { display: false }
            }
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) => ` ${context.parsed.y}% de acerto`
              }
            }
          }
        }
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [stats]);

  const getRank = () => {
    if (stats.totalSimulations === 0) return "Grumete";
    if (stats.averagePercentage >= 90) return "Almirante";
    if (stats.averagePercentage >= 75) return "Capitão de Mar e Guerra";
    if (stats.averagePercentage >= 50) return "Primeiro-Tenente";
    return "Marinheiro";
  };

  return (
    <div className="max-w-4xl w-full animate-fade-in">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border-t-8 border-blue-900">
        {/* Header Perfil */}
        <div className="bg-blue-900 p-8 text-white relative">
          <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center border-4 border-white/30 text-4xl shadow-lg">
              <i className="fas fa-user-tie"></i>
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-3xl font-bold">{userName}</h2>
              <p className="text-blue-200 font-medium flex items-center justify-center md:justify-start gap-2">
                <i className="fas fa-award"></i> Patente: {getRank()}
              </p>
            </div>
          </div>
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <i className="fas fa-ship text-9xl"></i>
          </div>
        </div>

        <div className="p-8">
          {/* Grid de Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Simulados</p>
              <p className="text-3xl font-black text-blue-900">{stats.totalSimulations}</p>
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Média Acertos</p>
              <p className="text-3xl font-black text-blue-900">{stats.averagePercentage}%</p>
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Melhor Nota</p>
              <p className="text-3xl font-black text-green-600">{stats.bestScore}%</p>
            </div>
          </div>

          {/* Gráfico */}
          <div className="mb-10">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <i className="fas fa-chart-line text-blue-600"></i> Desempenho por Categoria
            </h3>
            <div className="h-64 w-full bg-slate-50 p-4 rounded-2xl border border-slate-100">
              {stats.history.length > 0 ? (
                <canvas ref={chartRef}></canvas>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 italic">
                  <i className="fas fa-chart-bar text-4xl mb-2 opacity-20"></i>
                  Nenhum dado para exibir. Faça seu primeiro simulado!
                </div>
              )}
            </div>
          </div>

          {/* Histórico Recente */}
          {stats.history.length > 0 && (
            <div className="mb-10">
               <h3 className="text-xl font-bold text-gray-800 mb-4">Últimas Navegações</h3>
               <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {stats.history.slice().reverse().map((run, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-xl text-sm">
                      <span className="text-gray-500 font-medium">
                        {new Date(run.date).toLocaleDateString()} {new Date(run.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                      <span className={`font-bold ${run.score/run.total >= 0.7 ? 'text-green-600' : 'text-red-600'}`}>
                        {run.score}/{run.total} ({Math.round((run.score/run.total)*100)}%)
                      </span>
                    </div>
                  ))}
               </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-100">
            <Button variant="outline" fullWidth onClick={onBack}>
              <i className="fas fa-arrow-left mr-2"></i> Voltar ao Painel
            </Button>
            <Button variant="danger" fullWidth onClick={() => { if(confirm("Deseja apagar todo o seu histórico?")) onReset(); }}>
              <i className="fas fa-trash-alt mr-2"></i> Resetar Progresso
            </Button>
          </div>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
};

export default ProfileView;
