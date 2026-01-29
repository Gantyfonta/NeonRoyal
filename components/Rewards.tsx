
import React, { useState } from 'react';
import { TimeContext, ShopItem } from '../types';
import { SHOP_ITEMS } from '../constants';

interface RewardsProps {
  balance: number;
  lastClaimed: number;
  lastFridayClaimed: number;
  ownedItems: string[];
  activeTheme: string;
  activeAccessory: string;
  onClaim: (amount: number, message: string, type: 'DAILY' | 'FRIDAY') => void;
  onPurchase: (item: ShopItem) => void;
  onEquip: (item: ShopItem) => void;
  timeContext: TimeContext;
}

const Rewards: React.FC<RewardsProps> = ({ 
  balance, 
  lastClaimed, 
  lastFridayClaimed, 
  ownedItems,
  activeTheme,
  activeAccessory,
  onClaim, 
  onPurchase,
  onEquip,
  timeContext 
}) => {
  const [tab, setTab] = useState<'BONUSES' | 'SHOP'>('BONUSES');

  const isDailyAvailable = Date.now() - lastClaimed > 24 * 60 * 60 * 1000;
  const isFridayFortuneAvailable = timeContext.day === 'Friday' && (Date.now() - lastFridayClaimed > 7 * 24 * 60 * 60 * 1000);
  
  const dailyAmount = timeContext.day === 'Monday' ? 300 : 100;
  const timeRemaining = 24 * 60 * 60 * 1000 - (Date.now() - lastClaimed);
  const hoursRemaining = Math.max(0, Math.floor(timeRemaining / (60 * 60 * 1000)));

  return (
    <div className="w-full max-w-2xl py-8 space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-black text-white">Rewards & Boutique</h2>
        
        <div className="flex justify-center p-1 bg-slate-800/50 rounded-xl w-fit mx-auto border border-slate-700">
          <button 
            onClick={() => setTab('BONUSES')}
            className={`px-6 py-2 rounded-lg text-sm font-bold uppercase tracking-widest transition-all ${tab === 'BONUSES' ? 'bg-accent text-black shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Bonuses
          </button>
          <button 
            onClick={() => setTab('SHOP')}
            className={`px-6 py-2 rounded-lg text-sm font-bold uppercase tracking-widest transition-all ${tab === 'SHOP' ? 'bg-accent text-black shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
          >
            The Shop
          </button>
        </div>
      </div>

      {tab === 'BONUSES' ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Daily Bonus */}
            <div className={`bg-slate-800/50 border ${timeContext.day === 'Monday' ? 'border-accent/50' : 'border-slate-700'} p-6 rounded-3xl flex flex-col items-center text-center gap-4 relative overflow-hidden`}>
              {timeContext.day === 'Monday' && (
                 <div className="absolute top-0 right-0 bg-accent text-black text-[9px] font-black px-3 py-1 rounded-bl-lg uppercase">3x Multiplier</div>
              )}
              <div className="w-16 h-16 bg-accent/10 text-accent rounded-full flex items-center justify-center text-2xl">
                <i className="fas fa-calendar-check"></i>
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-lg text-white">Daily Check-in</h4>
                <p className="text-slate-400 text-xs">Base $100. Monday pays $300.</p>
              </div>
              <button
                onClick={() => onClaim(dailyAmount, `${timeContext.day} reward claimed! $${dailyAmount} added to balance.`, 'DAILY')}
                disabled={!isDailyAvailable}
                className={`w-full py-3 rounded-xl font-bold transition-all ${isDailyAvailable ? 'bg-accent text-black hover:scale-105' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
              >
                {isDailyAvailable ? `Claim $${dailyAmount}` : `Next in ${hoursRemaining}h`}
              </button>
            </div>

            {/* Friday Fortune */}
            <div className={`bg-slate-800/50 border ${timeContext.day === 'Friday' ? 'border-blue-500/50' : 'border-slate-700'} p-6 rounded-3xl flex flex-col items-center text-center gap-4 relative`}>
              <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center text-2xl">
                <i className="fas fa-sack-dollar"></i>
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-lg text-white">Friday Fortune</h4>
                <p className="text-slate-400 text-xs">Special $500 bonus for Friday players.</p>
              </div>
              <button
                onClick={() => onClaim(500, "Fortune Friday! $500 added to your account.", 'FRIDAY')}
                disabled={!isFridayFortuneAvailable}
                className={`w-full py-3 rounded-xl font-bold transition-all ${isFridayFortuneAvailable ? 'bg-blue-600 text-white hover:scale-105' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
              >
                {isFridayFortuneAvailable ? 'Claim $500' : timeContext.day === 'Friday' ? 'Already Claimed' : 'Only on Fridays'}
              </button>
            </div>
          </div>

          <div className="bg-slate-800/30 border border-slate-700 p-8 rounded-3xl">
            <h3 className="text-xl font-bold text-white mb-4">Weekly Schedule</h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-accent"></span> <span className="text-slate-300 font-bold min-w-[3rem]">Mon:</span> <span className="text-slate-400">3x Daily Bonus ($300)</span></li>
              <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-accent"></span> <span className="text-slate-300 font-bold min-w-[3rem]">Tue:</span> <span className="text-slate-400">Blackjack Wins 2.5:1</span></li>
              <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-accent"></span> <span className="text-slate-300 font-bold min-w-[3rem]">Wed:</span> <span className="text-slate-400">Roulette Numbers 45:1</span></li>
              <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-accent"></span> <span className="text-slate-300 font-bold min-w-[3rem]">Thu:</span> <span className="text-slate-400">1.5x Slots Multiplier</span></li>
              <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-accent"></span> <span className="text-slate-300 font-bold min-w-[3rem]">Fri:</span> <span className="text-slate-400">$500 Friday Fortune</span></li>
              <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-accent"></span> <span className="text-slate-300 font-bold min-w-[3rem]">Sat:</span> <span className="text-slate-400">1.2x All Winnings</span></li>
              <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-accent"></span> <span className="text-slate-300 font-bold min-w-[3rem]">Sun:</span> <span className="text-slate-400">2.5x Mini-game Wins</span></li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-10">
          {SHOP_ITEMS.map((item) => {
            const isOwned = ownedItems.includes(item.id);
            const isActive = activeTheme === item.id || activeAccessory === item.id;
            const canAfford = balance >= item.price;

            return (
              <div key={item.id} className={`p-4 bg-slate-800/50 border rounded-2xl flex flex-col items-center gap-3 transition-all ${isActive ? 'border-accent ring-1 ring-accent' : 'border-slate-700'}`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${isActive ? 'bg-accent text-black' : 'bg-slate-700 text-slate-400'}`}>
                  {item.type === 'ACCESSORY' ? (
                    <span className="text-2xl">{item.value}</span>
                  ) : (
                    <i className={`fas ${item.icon}`}></i>
                  )}
                </div>
                
                <div className="text-center">
                  <h4 className="font-bold text-white text-sm">{item.name}</h4>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">{item.type}</p>
                </div>

                {isOwned ? (
                  <button 
                    onClick={() => onEquip(item)}
                    disabled={isActive}
                    className={`w-full py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${isActive ? 'bg-slate-700 text-accent cursor-default' : 'bg-slate-700 text-white hover:bg-slate-600'}`}
                  >
                    {isActive ? 'Equipped' : 'Equip'}
                  </button>
                ) : (
                  <button 
                    onClick={() => onPurchase(item)}
                    disabled={!canAfford}
                    className={`w-full py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${canAfford ? 'bg-accent text-black hover:scale-105' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
                  >
                    Buy ${item.price.toLocaleString()}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Rewards;
