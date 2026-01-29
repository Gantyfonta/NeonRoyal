
import React, { useState } from 'react';

interface CoinFlipProps {
  balance: number;
  bet: number;
  onResult: (amount: number, resultText: string) => void;
}

const CoinFlip: React.FC<CoinFlipProps> = ({ balance, bet, onResult }) => {
  const [flipping, setFlipping] = useState(false);
  const [side, setSide] = useState<'HEADS' | 'TAILS'>('HEADS');
  const [selection, setSelection] = useState<'HEADS' | 'TAILS' | null>(null);

  const flip = () => {
    if (!selection || balance < bet || flipping) return;

    setFlipping(true);
    onResult(-bet, `Flipping coin for selection: ${selection}`);

    setTimeout(() => {
      const result = Math.random() > 0.5 ? 'HEADS' : 'TAILS';
      setSide(result);
      setFlipping(false);

      if (result === selection) {
        const winAmount = bet * 2;
        onResult(winAmount, `It's ${result}! You doubled your bet to $${winAmount}!`);
      } else {
        onResult(0, `Hard luck. It landed on ${result}.`);
      }
    }, 1000);
  };

  return (
    <div className="flex flex-col items-center gap-10">
      <div className={`w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-600 flex items-center justify-center border-4 border-yellow-700/50 shadow-2xl relative transition-all duration-500 ${flipping ? 'animate-bounce scale-110 rotate-[720deg]' : ''}`}>
        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-2 border-yellow-400/30 flex items-center justify-center">
           <span className="text-2xl md:text-3xl font-black text-yellow-900 drop-shadow-md">
             {side === 'HEADS' ? 'H' : 'T'}
           </span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Pick a Side</span>
        <div className="flex gap-4">
          <button 
            onClick={() => setSelection('HEADS')}
            disabled={flipping}
            className={`px-8 py-3 rounded-xl font-bold transition-all ${selection === 'HEADS' ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'bg-slate-800 text-slate-400'}`}
          >
            Heads
          </button>
          <button 
            onClick={() => setSelection('TAILS')}
            disabled={flipping}
            className={`px-8 py-3 rounded-xl font-bold transition-all ${selection === 'TAILS' ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'bg-slate-800 text-slate-400'}`}
          >
            Tails
          </button>
        </div>
      </div>

      <button
        onClick={flip}
        disabled={flipping || !selection || balance < bet}
        className="px-12 py-4 bg-indigo-600 text-white font-black rounded-full uppercase tracking-widest shadow-lg shadow-indigo-600/20 disabled:opacity-50 hover:scale-105 active:scale-95 transition-all"
      >
        {flipping ? 'Flipping...' : 'Flip Coin'}
      </button>
    </div>
  );
};

export default CoinFlip;
