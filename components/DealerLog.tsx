
import React from 'react';

interface DealerLogProps {
  lastEvent: string;
}

const DealerLog: React.FC<DealerLogProps> = ({ lastEvent }) => {
  return (
    <div className="flex items-start gap-4 p-6 bg-slate-900/60 rounded-2xl border border-slate-700/50 relative overflow-hidden">
      <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 shadow-lg">
        <i className="fas fa-clipboard-list text-yellow-500 text-xl"></i>
      </div>

      <div className="flex flex-col gap-1 w-full">
        <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Dealer's Desk</span>
        <div className="min-h-[2.5rem] flex items-center">
          <p className="text-slate-200 text-sm leading-relaxed italic">
            {lastEvent || "Welcome to the table. Place your bets to begin."}
          </p>
        </div>
      </div>
      
      <div className="absolute top-0 right-0 p-2 opacity-20">
        <i className="fas fa-shield-halved text-xs"></i>
      </div>
    </div>
  );
};

export default DealerLog;
