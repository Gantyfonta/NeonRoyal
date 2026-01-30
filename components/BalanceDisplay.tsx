
import React from 'react';

interface BalanceDisplayProps {
  balance: number;
  bet: number;
  setBet: (val: number) => void;
}

const BalanceDisplay: React.FC<BalanceDisplayProps> = ({ balance, bet, setBet }) => {
  const betOptions = [1, 5, 10, 25, 100, 500];

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-slate-900/60 backdrop-blur-lg rounded-2xl neon-border">
      <div className="flex flex-col">
        <span className="text-slate-500 text-[10px] uppercase font-black tracking-widest">Bankroll</span>
        <span className="text-3xl font-bold text-accent gold-glow tabular-nums">
          ${Math.ceil(balance).toLocaleString()}
        </span>
      </div>

      <div className="flex flex-col items-center md:items-end gap-2">
        <span className="text-slate-500 text-[10px] uppercase font-black tracking-widest">Select Stakes</span>
        <div className="flex flex-wrap justify-center gap-2">
          {betOptions.map((opt) => (
            <button
              key={opt}
              onClick={() => setBet(opt)}
              disabled={opt > balance}
              className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all border ${
                bet === opt 
                  ? 'bg-accent border-accent text-black shadow-lg shadow-yellow-500/20' 
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
              } disabled:opacity-20 disabled:cursor-not-allowed`}
            >
              ${opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BalanceDisplay;
