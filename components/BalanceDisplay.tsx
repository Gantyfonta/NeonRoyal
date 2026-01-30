
import React from 'react';

interface BalanceDisplayProps {
  balance: number;
  bet: number;
  setBet: (val: number) => void;
}

const BalanceDisplay: React.FC<BalanceDisplayProps> = ({ balance, bet, setBet }) => {
  const betOptions = [1, 10, 25, 50, 100, 500];

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 bg-slate-900/50 backdrop-blur-md rounded-2xl neon-border">
      <div className="flex flex-col">
        <span className="text-slate-400 text-xs uppercase tracking-widest font-bold">Total Balance</span>
        <span className="text-3xl font-bold text-accent gold-glow">
          ${Math.ceil(balance).toLocaleString()}
        </span>
      </div>

      <div className="flex flex-col items-center md:items-end gap-2">
        <span className="text-slate-400 text-xs uppercase tracking-widest font-bold">Current Bet: ${bet}</span>
        <div className="flex flex-wrap justify-center gap-2">
          {betOptions.map((opt) => (
            <button
              key={opt}
              onClick={() => setBet(opt)}
              disabled={opt > balance}
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                bet === opt 
                  ? 'bg-accent text-black shadow-lg shadow-yellow-500/20' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              } disabled:opacity-30 disabled:cursor-not-allowed`}
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
