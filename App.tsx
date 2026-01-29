
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

  // Initialize state from LocalStorage or defaults
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

  // Konami Code Cheat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      cheatSequence.current = [...cheatSequence.current, e.key].slice(-KONAMI_CODE.length);
      if (JSON.stringify(cheatSequence.current) === JSON.stringify(KONAMI_CODE)) {
        setState(prev => ({ ...prev, balance: prev.balance + 100 }));
        setLastEvent("Cheat activated! $100 added to balance.");
        cheatSequence.current = [];
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Apply Theme to Body
  useEffect(() => {
    const themeItem = SHOP_ITEMS.find(i => i.id === state.activeTheme);
    const themeClass = themeItem?.value || '';
    
    document.body.classList.remove('theme-pink', 'theme-emerald', 'theme-solar');
    if (themeClass) {
      document.body.classList.add(themeClass);
    }
  }, [state.activeTheme]);

  // Clock Update
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
      'Tuesday': 'Blackjack Tuesday (Higher Payouts)',
      'Wednesday': 'Wheelie Wednesday (Roulette Boost)',
      'Thursday': 'Turbo Thursday (Boosted Slots)',
      'Friday': 'Fortune Friday ($500 Extra Bonus)',
      'Saturday': 'Super Saturday (1.2x All Wins)',
      'Sunday': 'Sunday Funday (Mini-game Boost)'
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

  const handleBetChange = (newBet: number) => {
    setState(prev => ({ ...prev, bet: newBet }));
  };

  const handlePurchase = (item: ShopItem) => {
    if (state.ownedItems.includes(item.id)) return;
    if (state.balance < item.price) {
      setLastEvent(`Not enough balance to buy ${item.name}!`);
      return;
    }

    setState(prev => ({
      ...prev,
      balance: prev.balance - item.price,
      ownedItems: [...prev.ownedItems, item.id],
      ...(item.type === 'THEME' ? { activeTheme: item.id } : { activeAccessory: item.id })
    }));
    setLastEvent(`Purchased and equipped ${item.name}!`);
  };

  const handleEquip = (item: ShopItem) => {
    if (!state.ownedItems.includes(item.id)) return;
    setState(prev => ({
      ...prev,
      ...(item.type === 'THEME' ? { activeTheme: item.id } : { activeAccessory: item.id })
    }));
    setLastEvent(`Equipped ${item.name}.`);
  };

  const handleGameResult = useCallback((payout: number, context: string) => {
    let finalPayout = payout;
    if (payout > state.bet) {
      if (timeContext.isGoldenHour) finalPayout = Math.floor(finalPayout * 1.5);
      if (timeContext.day === 'Saturday') finalPayout = Math.floor(finalPayout * 1.2);
    }

    setState(prev => {
      const newBalance = prev.balance + finalPayout;
      let newHistory = prev.history;
      if (payout >= 0) {
        const historyItem: GameHistoryItem = {
          id: Math.random().toString(36).substr(2, 9),
          game: activeGame,
          amount: finalPayout,
          result: finalPayout > prev.bet ? 'WIN' : finalPayout === prev.bet ? 'PUSH' : 'LOSS',
          timestamp: Date.now()
        };
        newHistory = [historyItem, ...prev.history].slice(0, 10);
      }
      return { ...prev, balance: newBalance, history: newHistory };
    });
    setLastEvent(context);
  }, [activeGame, state.bet, timeContext]);

  const claimReward = (amount: number, message: string, type: 'DAILY' | 'FRIDAY') => {
    setState(prev => ({
      ...prev,
      balance: prev.balance + amount,
      lastRewardClaimed: type === 'DAILY' ? Date.now() : prev.lastRewardClaimed,
      lastFridayFortuneClaimed: type === 'FRIDAY' ? Date.now() : prev.lastFridayFortuneClaimed
    }));
    setLastEvent(message);
  };

  const activeAccEmoji = useMemo(() => {
    return SHOP_ITEMS.find(i => i.id === state.activeAccessory)?.value || '';
  }, [state.activeAccessory]);

  const renderGame = () => {
    switch (activeGame) {
      case GameType.SLOTS:
        return <SlotMachine balance={state.balance} bet={state.bet} onResult={handleGameResult} bonusMultiplier={timeContext.day === 'Thursday' ? 1.5 : 1} />;
      case GameType.BLACKJACK:
        return <Blackjack balance={state.balance} bet={state.bet} onResult={handleGameResult} bonusPayout={timeContext.day === 'Tuesday' ? 2.5 : 2} />;
      case GameType.ROULETTE:
        return <Roulette balance={state.balance} bet={state.bet} onResult={handleGameResult} straightUpMultiplier={timeContext.day === 'Wednesday' ? 45 : 35} />;
      case GameType.HI_LO:
        return <HiLo balance={state.balance} bet={state.bet} onResult={handleGameResult} winMultiplier={timeContext.day === 'Sunday' ? 2.5 : 1.85} />;
      case GameType.COIN_FLIP:
        return <CoinFlip balance={state.balance} bet={state.bet} onResult={handleGameResult} winMultiplier={timeContext.day === 'Sunday' ? 2.5 : 2} />;
      case GameType.TEXAS_HOLDEM:
        return <TexasHoldem balance={state.balance} bet={state.bet} onResult={handleGameResult} />;
      case GameType.PLINKO:
        return <Plinko balance={state.balance} bet={state.bet} onResult={handleGameResult} />;
      case GameType.REWARDS:
        return <Rewards 
                  balance={state.balance} 
                  lastClaimed={state.lastRewardClaimed || 0} 
                  lastFridayClaimed={state.lastFridayFortuneClaimed || 0}
                  ownedItems={state.ownedItems}
                  activeTheme={state.activeTheme}
                  activeAccessory={state.activeAccessory}
                  onClaim={claimReward} 
                  onPurchase={handlePurchase}
                  onEquip={handleEquip}
                  timeContext={timeContext}
                />;
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-12 w-full">
            {[
              { type: GameType.SLOTS, title: 'Slots', icon: 'fa-gem', desc: 'Classic 3-reel action.', color: 'bg-emerald-500' },
              { type: GameType.BLACKJACK, title: 'Blackjack', icon: 'fa-diamond', desc: 'Beat the dealer.', color: 'bg-blue-600' },
              { type: GameType.ROULETTE, title: 'Roulette', icon: 'fa-circle-dot', desc: 'Spin the wheel.', color: 'bg-rose-600' },
              { type: GameType.TEXAS_HOLDEM, title: 'Hold\'em', icon: 'fa-spade', desc: 'Beat the dealer\'s hand.', color: 'bg-amber-600' },
              { type: GameType.PLINKO, title: 'Plinko', icon: 'fa-braille', desc: 'Drop balls, win big.', color: 'bg-cyan-500' },
              { type: GameType.HI_LO, title: 'Hi-Lo', icon: 'fa-up-down', desc: 'Guess higher or lower.', color: 'bg-amber-500' },
              { type: GameType.COIN_FLIP, title: 'Coin Flip', icon: 'fa-coins', desc: '50/50 double-up.', color: 'bg-indigo-500' },
              { type: GameType.REWARDS, title: 'Rewards & Shop', icon: 'fa-gift', desc: 'Customization & Perks.', color: 'bg-purple-600' }
            ].map(game => (
              <button
                key={game.type}
                onClick={() => setActiveGame(game.type)}
                className="group relative flex flex-col items-center p-8 bg-slate-800/40 rounded-3xl border border-slate-700 hover:border-accent transition-all hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
              >
                <div className={`w-16 h-16 ${game.color} rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:rotate-12 transition-transform`}>
                  <i className={`fas ${game.icon} text-2xl text-white`}></i>
                </div>
                <h3 className="text-2xl font-bold mb-2 text-white">{game.title}</h3>
                <p className="text-slate-400 text-sm text-center">{game.desc}</p>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-t from-yellow-500 to-transparent transition-opacity"></div>
              </button>
            ))}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen casino-gradient flex flex-col pb-20">
      <header className="px-6 py-4 flex flex-col border-b border-slate-800/50 bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveGame(GameType.LOBBY)}>
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center shadow-lg shadow-yellow-500/20">
              <i className="fas fa-crown text-black text-sm"></i>
            </div>
            <h1 className="text-xl font-black tracking-tighter text-white">
              NEON<span className="text-accent">ROYAL</span> {activeAccEmoji}
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Local Time</span>
              <span className="text-sm font-bold text-white tabular-nums">
                {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Active Bonus</span>
              <span className="text-xs font-bold text-accent animate-pulse">{timeContext.activeDailyBonus}</span>
            </div>
          </div>
        </div>
        
        {timeContext.isGoldenHour && (
          <div className="w-full bg-accent text-black text-[10px] font-black text-center py-0.5 uppercase tracking-widest rounded">
            ✨ Golden Hour Active: 1.5x Multiplier On All Wins ✨
          </div>
        )}
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 pt-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <BalanceDisplay balance={state.balance} bet={state.bet} setBet={handleBetChange} />
            <div className="bg-slate-900/40 rounded-3xl p-8 border border-slate-800/50 min-h-[550px] flex items-center justify-center relative overflow-hidden">
               {activeGame !== GameType.LOBBY && (
                 <button onClick={() => setActiveGame(GameType.LOBBY)} className="absolute top-6 left-6 text-slate-400 hover:text-white flex items-center gap-2 text-xs font-black uppercase tracking-widest z-20">
                   <i className="fas fa-arrow-left"></i> Back to Lobby
                 </button>
               )}
               {renderGame()}
            </div>
          </div>

          <aside className="space-y-6">
            <DealerLog lastEvent={lastEvent} />
            <div className="bg-slate-900/30 rounded-2xl p-6 border border-slate-800/50">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Live History</h4>
              <div className="space-y-3">
                {state.history.length === 0 ? (
                  <p className="text-slate-600 text-sm italic">Place your first bet...</p>
                ) : (
                  state.history.map(item => (
                    <div key={item.id} className="flex items-center justify-between py-2 border-b border-slate-800/50 last:border-0">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-300 uppercase">{item.game}</span>
                        <span className="text-[9px] text-slate-500">{new Date(item.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <span className={`text-sm font-bold ${item.amount >= state.bet ? 'text-green-500' : 'text-rose-500'}`}>
                        {item.amount > 0 ? `+$${item.amount}` : `-$${state.bet}`}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>

      <footer className="mt-auto px-6 py-8 border-t border-slate-800/50 bg-black/40 text-center">
        <p className="text-slate-500 text-[10px] uppercase tracking-widest">Local Session: {now.toLocaleDateString()} | Neon Royal Casino Systems Operational</p>
      </footer>
    </div>
  );
};

export default App;
