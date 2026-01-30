
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { GameType, GameState, GameHistoryItem, TimeContext, ShopItem } from './types';
import { INITIAL_BALANCE, SHOP_ITEMS } from './constants';
import BalanceDisplay from './components/BalanceDisplay';
import DealerLog from './components/DealerLog';
import SlotMachine from './components/SlotMachine';
import Blackjack from './components/Blackjack';
import Roulette from './components/Roulette';
import HiLo from './components/HiLo';
import CoinFlip from './components/CoinFlip';
import TexasHoldem from './components/TexasHoldem';
import Plinko from './components/Plinko';
import Rewards from './components/Rewards';
import PitBoss from './components/PitBoss';

// Main application component that coordinates state and views
const App: React.FC = () => {
  const [activeGame, setActiveGame] = useState<GameType>(GameType.LOBBY);
  const [lastEvent, setLastEvent] = useState<string>('');
  const [state, setState] = useState<GameState>(() => {
    const saved = localStorage.getItem('neon_royal_state');
    if (saved) return JSON.parse(saved);
    return {
      balance: INITIAL_BALANCE,
      bet: 10,
      history: [],
      ownedItems: ['theme_default'],
      activeTheme: 'theme_default',
      activeAccessory: '',
    };
  });

  const [timeContext] = useState<TimeContext>({
    day: new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date()),
    hour: new Date().getHours(),
    isGoldenHour: false,
    isGraveyard: false,
    activeDailyBonus: 'NONE',
  });

  useEffect(() => {
    localStorage.setItem('neon_royal_state', JSON.stringify(state));
  }, [state]);

  const setBet = (val: number) => setState(s => ({ ...s, bet: val }));

  const handleResult = useCallback((amount: number, resultText: string) => {
    setLastEvent(resultText);
    setState(s => {
      const result: 'WIN' | 'LOSS' | 'PUSH' = amount > 0 ? 'WIN' : (amount < 0 ? 'LOSS' : 'PUSH');
      const historyItem: GameHistoryItem = {
        id: Math.random().toString(36).substr(2, 9),
        game: activeGame,
        amount: Math.abs(amount),
        result,
        timestamp: Date.now(),
      };
      return {
        ...s,
        balance: s.balance + amount,
        history: [historyItem, ...s.history].slice(0, 50),
      };
    });
  }, [activeGame]);

  const handleClaimReward = (amount: number, message: string, type: 'DAILY' | 'FRIDAY') => {
    setLastEvent(message);
    setState(s => ({
      ...s,
      balance: s.balance + amount,
      lastRewardClaimed: type === 'DAILY' ? Date.now() : s.lastRewardClaimed,
      lastFridayFortuneClaimed: type === 'FRIDAY' ? Date.now() : s.lastFridayFortuneClaimed,
    }));
  };

  const handlePurchase = (item: ShopItem) => {
    if (state.balance < item.price) return;
    setState(s => ({
      ...s,
      balance: s.balance - item.price,
      ownedItems: [...s.ownedItems, item.id],
    }));
    setLastEvent(`You purchased the ${item.name}!`);
  };

  const handleEquip = (item: ShopItem) => {
    setState(s => ({
      ...s,
      activeTheme: item.type === 'THEME' ? item.id : s.activeTheme,
      activeAccessory: item.type === 'ACCESSORY' ? item.id : s.activeAccessory,
    }));
    setLastEvent(`Equipped ${item.name}.`);
  };

  const activeThemeObj = useMemo(() => 
    SHOP_ITEMS.find(i => i.id === state.activeTheme), 
  [state.activeTheme]);

  const activeAccObj = useMemo(() => 
    SHOP_ITEMS.find(i => i.id === state.activeAccessory), 
  [state.activeAccessory]);

  const renderGame = () => {
    switch (activeGame) {
      case GameType.SLOTS:
        return <SlotMachine balance={state.balance} bet={state.bet} onResult={handleResult} bonusMultiplier={timeContext.day === 'Thursday' ? 1.5 : 1} />;
      case GameType.BLACKJACK:
        return <Blackjack balance={state.balance} bet={state.bet} onResult={handleResult} bonusPayout={timeContext.day === 'Tuesday' ? 2.5 : 2} />;
      case GameType.ROULETTE:
        return <Roulette balance={state.balance} bet={state.bet} onResult={handleResult} straightUpMultiplier={timeContext.day === 'Wednesday' ? 45 : 35} />;
      case GameType.HI_LO:
        return <HiLo balance={state.balance} bet={state.bet} onResult={handleResult} winMultiplier={timeContext.day === 'Sunday' ? 2.5 : 1.85} />;
      case GameType.COIN_FLIP:
        return <CoinFlip balance={state.balance} bet={state.bet} onResult={handleResult} winMultiplier={timeContext.day === 'Sunday' ? 2.5 : 2} />;
      case GameType.TEXAS_HOLDEM:
        return <TexasHoldem balance={state.balance} bet={state.bet} onResult={handleResult} />;
      case GameType.PLINKO:
        return <Plinko balance={state.balance} bet={state.bet} onResult={handleResult} />;
      case GameType.REWARDS:
        return (
          <Rewards 
            balance={state.balance} 
            lastClaimed={state.lastRewardClaimed || 0} 
            lastFridayClaimed={state.lastFridayFortuneClaimed || 0}
            ownedItems={state.ownedItems}
            activeTheme={state.activeTheme}
            activeAccessory={state.activeAccessory}
            onClaim={handleClaimReward}
            onPurchase={handlePurchase}
            onEquip={handleEquip}
            timeContext={timeContext}
          />
        );
      default:
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-4xl py-8">
            {Object.values(GameType).filter(t => t !== GameType.LOBBY && t !== GameType.REWARDS).map(type => (
              <button 
                key={type} 
                onClick={() => setActiveGame(type)}
                className="bg-slate-800/40 hover:bg-slate-700/60 border border-slate-700 p-8 rounded-3xl flex flex-col items-center gap-4 transition-all hover:scale-105 group"
              >
                <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center text-3xl group-hover:text-accent transition-colors">
                  <i className={`fas ${
                    type === GameType.SLOTS ? 'fa-republican' : 
                    type === GameType.BLACKJACK ? 'fa-suit-spades' : 
                    type === GameType.ROULETTE ? 'fa-circle-dot' : 
                    type === GameType.HI_LO ? 'fa-arrows-up-down' : 
                    type === GameType.COIN_FLIP ? 'fa-coins' : 
                    type === GameType.TEXAS_HOLDEM ? 'fa-hat-cowboy' : 
                    'fa-braille'
                  }`}></i>
                </div>
                <span className="font-black text-xs uppercase tracking-[0.2em]">{type.replace('_', ' ')}</span>
              </button>
            ))}
          </div>
        );
    }
  };

  return (
    <div className={`min-h-screen bg-slate-950 text-white font-sans selection:bg-accent selection:text-black ${activeThemeObj?.value || ''}`}>
      <nav className="border-b border-white/5 bg-slate-900/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveGame(GameType.LOBBY)}>
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-black font-black text-lg shadow-[0_0_15px_rgba(251,191,36,0.3)]">
              {activeAccObj?.value || 'N'}
            </div>
            <span className="font-black uppercase tracking-tighter text-xl">Neon<span className="text-accent">Royal</span></span>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setActiveGame(GameType.REWARDS)}
              className="p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-700 text-accent transition-all relative"
            >
              <i className="fas fa-gift"></i>
              {(Date.now() - (state.lastRewardClaimed || 0) > 24 * 60 * 60 * 1000) && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-900"></span>
              )}
            </button>
            <div className="h-8 w-px bg-white/10 hidden md:block"></div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest leading-none">Status</span>
              <span className="text-xs font-bold text-accent">VIP Member</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <BalanceDisplay balance={state.balance} bet={state.bet} setBet={setBet} />
            
            <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-8 min-h-[500px] flex items-center justify-center shadow-2xl relative overflow-hidden">
               {activeGame !== GameType.LOBBY && (
                 <button 
                  onClick={() => setActiveGame(GameType.LOBBY)}
                  className="absolute top-6 left-6 text-slate-500 hover:text-white transition-colors"
                 >
                   <i className="fas fa-arrow-left mr-2"></i> Lobby
                 </button>
               )}
               {renderGame()}
            </div>
          </div>

          <div className="space-y-8">
            <PitBoss balance={state.balance} history={state.history} />
            <DealerLog lastEvent={lastEvent} />
            
            <div className="bg-slate-900/60 rounded-3xl p-6 border border-white/5 space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Floor History</h4>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {state.history.length === 0 ? (
                  <p className="text-xs text-slate-600 italic">No action yet today...</p>
                ) : (
                  state.history.map((h) => (
                    <div key={h.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white uppercase tracking-wider">{h.game}</span>
                        <span className="text-[9px] text-slate-500">{new Date(h.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <span className={`text-xs font-black ${h.result === 'WIN' ? 'text-emerald-500' : h.result === 'LOSS' ? 'text-rose-500' : 'text-slate-400'}`}>
                        {h.result === 'WIN' ? '+' : h.result === 'LOSS' ? '-' : ''}${h.amount}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-2xl border-t border-white/5 px-6 py-4 lg:hidden z-50">
        <div className="flex justify-around items-center max-w-md mx-auto">
          <button onClick={() => setActiveGame(GameType.LOBBY)} className={`flex flex-col items-center gap-1 ${activeGame === GameType.LOBBY ? 'text-accent' : 'text-slate-500'}`}>
            <i className="fas fa-house"></i>
            <span className="text-[8px] font-bold uppercase">Home</span>
          </button>
          <button onClick={() => setActiveGame(GameType.REWARDS)} className={`flex flex-col items-center gap-1 ${activeGame === GameType.REWARDS ? 'text-accent' : 'text-slate-500'}`}>
            <i className="fas fa-shop"></i>
            <span className="text-[8px] font-bold uppercase">Store</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
