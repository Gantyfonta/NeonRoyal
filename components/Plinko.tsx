
import React, { useState, useRef, useEffect } from 'react';

interface PlinkoProps {
  balance: number;
  bet: number;
  onResult: (amount: number, resultText: string) => void;
}

const ROWS = 8;
const MULTIPLIERS = [5, 2, 0.5, 0.2, 0.2, 0.5, 2, 5];

const Plinko: React.FC<PlinkoProps> = ({ balance, bet, onResult }) => {
  const [isDropping, setIsDropping] = useState(false);
  const [ballPos, setBallPos] = useState({ x: 50, y: 0 });
  const [trail, setTrail] = useState<{ x: number, y: number }[]>([]);

  const dropBall = () => {
    if (balance < bet || isDropping) return;

    setIsDropping(true);
    onResult(-bet, "Dropping Plinko ball...");
    setTrail([]);
    
    let currentX = 50;
    let path: { x: number, y: number }[] = [];

    for (let row = 0; row <= ROWS; row++) {
      const step = row * (100 / (ROWS + 1));
      path.push({ x: currentX, y: step });
      if (row < ROWS) {
        // Randomly go left or right at each peg
        currentX += (Math.random() > 0.5 ? 5 : -5);
      }
    }

    // Animate
    let frame = 0;
    const interval = setInterval(() => {
      if (frame >= path.length) {
        clearInterval(interval);
        finishDrop(currentX);
        return;
      }
      setBallPos(path[frame]);
      setTrail(prev => [...prev, path[frame]]);
      frame++;
    }, 150);
  };

  const finishDrop = (finalX: number) => {
    setIsDropping(false);
    // Map finalX to multiplier index
    // finalX will be roughly centered around 50, range is roughly 30-70
    const normalized = (finalX - 30) / 40; // 0 to 1
    const index = Math.max(0, Math.min(MULTIPLIERS.length - 1, Math.floor(normalized * MULTIPLIERS.length)));
    const mult = MULTIPLIERS[index];
    const win = Math.floor(bet * mult);
    onResult(win, `Ball landed in ${mult}x slot! Won $${win}.`);
  };

  return (
    <div className="flex flex-col items-center gap-6 py-4 w-full max-w-sm">
      <div className="relative w-full aspect-square bg-slate-900/60 rounded-3xl border border-slate-800 p-4 shadow-inner">
        {/* Pegs */}
        {Array.from({ length: ROWS }).map((_, row) => (
          <div key={row} className="flex justify-center gap-6" style={{ marginTop: '10%' }}>
            {Array.from({ length: row + 1 }).map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 bg-slate-700 rounded-full shadow-[0_0_5px_rgba(255,255,255,0.2)]"></div>
            ))}
          </div>
        ))}

        {/* Path Trail */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {trail.map((p, i) => i > 0 && (
            <line 
              key={i} 
              x1={`${trail[i-1].x}%`} y1={`${trail[i-1].y}%`} 
              x2={`${p.x}%`} y2={`${p.y}%`} 
              stroke="rgba(234, 179, 8, 0.2)" 
              strokeWidth="2"
            />
          ))}
        </svg>

        {/* Ball */}
        {isDropping && (
          <div 
            className="absolute w-4 h-4 bg-accent rounded-full shadow-lg shadow-yellow-500/50 transition-all duration-150 ease-linear"
            style={{ left: `${ballPos.x}%`, top: `${ballPos.y}%`, transform: 'translate(-50%, -50%)' }}
          ></div>
        )}

        {/* Slots */}
        <div className="absolute bottom-4 left-4 right-4 flex gap-1">
          {MULTIPLIERS.map((m, i) => (
            <div key={i} className="flex-1 bg-slate-800 border border-slate-700 rounded-lg py-1 flex flex-col items-center justify-center">
               <span className="text-[10px] font-black text-slate-500">{m}x</span>
            </div>
          ))}
        </div>
      </div>

      <button 
        onClick={dropBall} 
        disabled={isDropping || balance < bet}
        className="px-12 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-full uppercase tracking-widest shadow-lg shadow-cyan-600/20 disabled:opacity-50 transition-all"
      >
        {isDropping ? 'Dropping...' : 'Drop Ball'}
      </button>
    </div>
  );
};

export default Plinko;
