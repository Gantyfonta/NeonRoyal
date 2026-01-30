
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { GameType, GameState, GameHistoryItem, TimeContext, ShopItem } from './types';
import { INITIAL_BALANCE, SHOP_ITEMS } from './constants';
import BalanceDisplay from './components/BalanceDisplay';
import DealerLog from './components/DealerLog';
import SlotMachine from './components/SlotMachine';
import Blackjack from './components/Blackjack';
import Roulette from './components/Roulette';
import HiLo from './components/HiLo';
import CoinFlip from './components/CoinFlip';
import Rewards from './components/Rewards';
import TexasHoldem from './components/TexasHoldem';
import Plinko from './components/Plinko';

const STORAGE_KEY = 'neon_royal_casino_state_v3';

const App: React.FC = () => {
  const [now, setNow] = useState(new Date());
  const cheatSequence = useRef<string[]>([]);
  const KONAMI_CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'a', 'b', 'Enter'];

  const [state, setState] = useState<GameState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved state", e);
      }
    }
    return {
      balance: INITIAL_BALANCE,
      bet: 10,
      history: [],
      lastRewardClaimed: 0,
      lastFridayFortuneClaimed: 0,
      ownedItems: ['theme_default'],
      activeTheme: 'theme_default',
      activeAccessory: ''
    };
  });

  const [activeGame, setActiveGame] = useState<GameType>(GameType.LOBBY);
  const [lastEvent, setLastEvent] = useState<string>('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      cheatSequence.current = [...cheatSequence.current, e.key].slice(-KONAMI_CODE.length);
      if (JSON.stringify(cheatSequence.current) === JSON.stringify(KONAMI_CODE)) {
        setState(prev => ({ ...prev, balance: prev.balance + 100 }));
        setLastEvent("Dealer whispers: 'A little gift for a friend...' (Cheat activated)");
        cheatSequence.current = [];
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const themeItem = SHOP_ITEMS.find(i => i.id === state.activeTheme);
    const themeClass = themeItem?.value || '';
    document.body.className = ''; 
    if (themeClass) document.body.classList.add(themeClass);
  }, [state.activeTheme]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeContext: TimeContext = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[now.getDay()];
    const hour = now.getHours();
    const bonuses: Record<string, string> = {
      'Monday': 'Big Money Monday (3x Daily Reward)',
      'Tuesday': 'Blackjack Tuesday (2.5:1 Payouts)',
      'Wednesday': 'Wheelie Wednesday (45:1 Roulette)',
      'Thursday': 'Turbo Thursday (1.5x Slots)',
      'Friday': 'Fortune Friday ($500 Bonus)',
      'Saturday': 'Super Saturday (1.2x All Wins)',
      'Sunday': 'Sunday Funday (2.5x Mini-games)'
    };
    return {
      day: dayName,
      hour: hour,
      isGoldenHour: hour === 17, 
      isGraveyard: hour >= 0 && hour < 3,
      activeDailyBonus: bonuses[dayName]
    };
  }, [now]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const handleGameResult = useCallback((payout: number, context: string) => {
    let finalPayout = payout;
    if (payout > 0) {
      if (timeContext.isGoldenHour) finalPayout = Math.ceil(finalPayout * 1.5);
      if (timeContext.day === 'Saturday') finalPayout = Math.ceil(finalPayout * 1.2);
    }

    setState(prev => {
      const newBalance = Math.ceil(prev.balance + finalPayout);
      let newHistory = prev.history;
      if (payout !== 0) {
        const historyItem: GameHistoryItem = {
          id: Math.random().toString(36).substr(2, 9),
          game: activeGame,
          amount: Math.ceil(Math.abs(finalPayout)),
          result: finalPayout > 0 ? 'WIN' : (finalPayout === 0 && context.toLowerCase().includes('push')) ? 'PUSH' : 'LOSS',
          timestamp: Date.now()
        };
        newHistory = [historyItem, ...prev.history].slice(0, 10);
      }
      return { ...prev, balance: newBalance, history: newHistory };
    });
    setLastEvent(context);
  }, [activeGame, state.bet, timeContext]);

  const activeAccEmoji = useMemo(() => {
    return SHOP_ITEMS.find(i => i.id === state.activeAccessory)?.value || '';
  }, [state.activeAccessory]);

  const renderGame = () => {
    const props = { balance: state.balance, bet: state.bet, onResult: handleGameResult };
    switch (activeGame) {
      case GameType.SLOTS: return <SlotMachine {...props} bonusMultiplier={timeContext.day === 'Thursday' ? 1.5 : 1} />;
      case GameType.BLACKJACK: return <Blackjack {...props} bonusPayout={timeContext.day === 'Tuesday' ? 2.5 : 2} />;
      case GameType.ROULETTE: return <Roulette {...props} straightUpMultiplier={timeContext.day === 'Wednesday' ? 45 : 35} />;
      case GameType.HI_LO: return <HiLo {...props} winMultiplier={timeContext.day === 'Sunday' ? 2.5 : 1.85} />;
      case GameType.COIN_FLIP: return <CoinFlip {...props} winMultiplier={timeContext.day === 'Sunday' ? 2.5 : 2} />;
      case GameType.TEXAS_HOLDEM: return <TexasHoldem {...props} />;
      case GameType.PLINKO: return <Plinko {...props} />;
      case GameType.REWARDS: return <Rewards 
        balance={state.balance} 
        lastClaimed={state.lastRewardClaimed || 0} 
        lastFridayClaimed={state.lastFridayFortuneClaimed || 0}
        ownedItems={state.ownedItems}
        activeTheme={state.activeTheme}
        activeAccessory={state.activeAccessory}
        // Fix: Changed arrow function body to a block to avoid testing void (return value of setState) for truthiness.
        onClaim={(amt, msg, type) => {
          setState(p => ({
            ...p, 
            balance: p.balance + amt, 
            lastRewardClaimed: type === 'DAILY' ? Date.now() : p.lastRewardClaimed,
            lastFridayFortuneClaimed: type === 'FRIDAY' ? Date.now() : p.lastFridayFortuneClaimed
          }));
          setLastEvent(msg);
        }}
        // Fix: Changed arrow function body to a block to avoid testing void (return value of setState) for truthiness.
        onPurchase={(item) => {
          if (state.balance >= item.price) {
            setState(p => ({
              ...p, 
              balance: p.balance - item.price, 
              ownedItems: [...p.ownedItems, item.id],
              ...(item.type === 'THEME' ? { activeTheme: item.id } : { activeAccessory: item.id })
            }));
          }
        }}
        onEquip={(item) => setState(p => ({ ...p, ...(item.type === 'THEME' ? { activeTheme: item.id } : { activeAccessory: item.id }) }))}
        timeContext={timeContext}
      />;
      default: return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-12 w-full">
          {[
            { type: GameType.SLOTS, title: 'Neon Slots', icon: 'fa-gem', desc: 'Lucky 7s and Gems.', color: 'bg-emerald-500' },
            { type: GameType.BLACKJACK, title: 'Blackjack', icon: 'fa-diamond', desc: 'Reach 21.', color: 'bg-blue-600' },
            { type: GameType.ROULETTE, title: 'Roulette', icon: 'fa-circle-dot', desc: 'Straight Up 35:1.', color: 'bg-rose-600' },
            { type: GameType.TEXAS_HOLDEM, title: 'Hold\'em', icon: 'fa-spade', desc: 'Heads-up Poker.', color: 'bg-amber-600' },
            { type: GameType.PLINKO, title: 'Plinko', icon: 'fa-braille', desc: 'Gravity wins.', color: 'bg-cyan-500' },
            { type: GameType.REWARDS, title: 'The Boutique', icon: 'fa-gift', desc: 'Daily Bonus & Shop.', color: 'bg-purple-600' }
          ].map(game => (
            <button key={game.type} onClick={() => setActiveGame(game.type)} className="group relative flex flex-col items-center p-8 bg-slate-800/40 rounded-3xl border border-slate-700 hover:border-accent transition-all hover:scale-[1.02] active:scale-[0.98]">
              <div className={`w-14 h-14 ${game.color} rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:rotate-12 transition-transform`}>
                <i className={`fas ${game.icon} text-xl text-white`}></i>
              </div>
              <h3 className="text-xl font-bold text-white">{game.title}</h3>
              <p className="text-slate-400 text-xs text-center mt-2">{game.desc}</p>
            </button>
          ))}
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen casino-gradient flex flex-col">
      <header className="px-6 py-4 flex flex-col border-b border-slate-800/50 bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveGame(GameType.LOBBY)}>
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center shadow-lg shadow-yellow-500/20">
              <i className="fas fa-crown text-black text-xs"></i>
            </div>
            <h1 className="text-lg font-black tracking-tighter text-white">NEON<span className="text-accent">ROYAL</span> {activeAccEmoji}</h1>
          </div>
          <div className="flex items-center gap-4 md:gap-8">
             <div className="text-right">
                <p className="text-[10px] font-black uppercase text-slate-500">Bonus</p>
                <p className="text-xs font-bold text-accent">{timeContext.day} Boost</p>
             </div>
             <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black uppercase text-slate-500">Session</p>
                <p className="text-xs font-bold text-white tabular-nums">{now.toLocaleTimeString([], { hour12: false })}</p>
             </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 pt-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <BalanceDisplay balance={state.balance} bet={state.bet} setBet={(b) => setState(s => ({...s, bet: b}))} />
            <div className="bg-slate-900/40 rounded-3xl p-6 md:p-12 border border-slate-800/50 min-h-[500px] flex items-center justify-center relative">
               {activeGame !== GameType.LOBBY && (
                 <button onClick={() => setActiveGame(GameType.LOBBY)} className="absolute top-6 left-6 text-slate-400 hover:text-white flex items-center gap-2 text-xs font-black uppercase tracking-widest z-20">
                   <i className="fas fa-arrow-left"></i> Lobby
                 </button>
               )}
               {renderGame()}
            </div>
          </div>
          <aside className="space-y-6">
            <DealerLog lastEvent={lastEvent} />
            <div className="bg-slate-900/30 rounded-2xl p-5 border border-slate-800/50">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Recent Plays</h4>
              <div className="space-y-3">
                {state.history.length === 0 ? <p className="text-slate-600 text-xs italic">Awaiting your first bet...</p> : 
                  state.history.map(item => (
                    <div key={item.id} className="flex items-center justify-between text-xs py-2 border-b border-slate-800/50 last:border-0">
                      <span className="font-bold text-slate-400">{item.game}</span>
                      <span className={item.result === 'WIN' ? 'text-green-500' : 'text-rose-500'}>
                        {item.result === 'WIN' ? '+' : '-'}${item.amount}
                      </span>
                    </div>
                  ))
                }
              </div>
            </div>
          </aside>
        </div>
      </main>

      <footer className="mt-8 px-6 py-6 border-t border-slate-800/50 bg-black/40 text-center">
        <p className="text-slate-600 text-[9px] uppercase tracking-[0.2em]">Neon Royal Systems | Non-commercial Virtual Credits | Play Responsibly</p>
      </footer>
    </div>
  );
};

export default App;
