
import React, { useState } from 'react';
import { SLOT_SYMBOLS } from '../constants';

interface SlotMachineProps {
  balance: number;
  bet: number;
  onResult: (amount: number, resultText: string) => void;
  bonusMultiplier?: number;
}

const SlotMachine: React.FC<SlotMachineProps> = ({ balance, bet, onResult, bonusMultiplier = 1 }) => {
  const [reels, setReels] = useState(['7️⃣', '7️⃣', '7️⃣']);
  const [spinning, setSpinning] = useState(false);

  const spin = () => {
    if (balance < bet || spinning) return;

    setSpinning(true);
    onResult(-bet, "Spinning the reels...");

    const spinInterval = setInterval(() => {
      setReels([
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)].char,
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)].char,
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)].char,
      ]);
    }, 100);

    setTimeout(() => {
      clearInterval(spinInterval);
      const finalReels = [
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)].char,
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)].char,
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)].char,
      ];
      setReels(finalReels);
      setSpinning(false);

      if (finalReels[0] === finalReels[1] && finalReels[1] === finalReels[2]) {
        const symbol = SLOT_SYMBOLS.find(s => s.char === finalReels[0]);
        const winAmount = Math.floor(bet * (symbol?.multiplier || 1) * bonusMultiplier);
        onResult(winAmount, `JACKPOT! Three ${finalReels[0]} in a row for $${winAmount}!`);
      } else if (finalReels[0] === finalReels[1] || finalReels[1] === finalReels[2] || finalReels[0] === finalReels[2]) {
        const winAmount = Math.floor(bet * 1.5 * bonusMultiplier);
        onResult(winAmount, `Matched two! Won $${winAmount}.`);
      } else {
        onResult(0, "No luck this time.");
      }
    }, 1200);
  };

  return (
    <div className="flex flex-col items-center gap-8 py-8">
      {bonusMultiplier > 1 && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest animate-bounce">
          {bonusMultiplier}x Multiplier Active
        </div>
      )}
      <div className="flex gap-4">
        {reels.map((symbol, i) => (
          <div key={i} className={`w-24 h-32 md:w-32 md:h-48 bg-slate-800 rounded-xl border-2 border-yellow-500/30 flex items-center justify-center text-4xl md:text-6xl shadow-inner shadow-black transition-all ${spinning ? 'scale-95 opacity-80' : 'scale-100 opacity-100'}`}>
            {symbol}
          </div>
        ))}
      </div>
      <button onClick={spin} disabled={spinning || balance < bet} className="px-12 py-4 bg-yellow-500 rounded-full font-black text-black text-xl uppercase tracking-widest transition-all hover:scale-105 active:scale-95 disabled:opacity-50">
        {spinning ? '...' : 'Spin'}
      </button>
    </div>
  );
};

export default SlotMachine;
