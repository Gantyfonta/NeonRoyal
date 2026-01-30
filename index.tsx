
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import * as d3 from 'd3';

// --- TYPES ---
enum GameType {
  SLOTS = 'SLOTS',
  BLACKJACK = 'BLACKJACK',
  ROULETTE = 'ROULETTE',
  HI_LO = 'HI_LO',
  COIN_FLIP = 'COIN_FLIP',
  TEXAS_HOLDEM = 'TEXAS_HOLDEM',
  PLINKO = 'PLINKO',
  REWARDS = 'REWARDS',
  LOBBY = 'LOBBY'
}

interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  value: string;
  rank: number;
}

interface ShopItem {
  id: string;
  name: string;
  price: number;
  type: 'THEME' | 'ACCESSORY';
  value: string;
  icon: string;
}

interface GameHistoryItem {
  id: string;
  game: GameType;
  amount: number;
  result: 'WIN' | 'LOSS' | 'PUSH';
  timestamp: number;
}

interface GameState {
  balance: number;
  bet: number;
  history: GameHistoryItem[];
  lastRewardClaimed?: number;
  lastFridayFortuneClaimed?: number;
  ownedItems: string[];
  activeTheme: string;
  activeAccessory: string;
}

interface TimeContext {
  day: string;
  hour: number;
  isGoldenHour: boolean;
  isGraveyard: boolean;
  activeDailyBonus: string;
}

// --- CONSTANTS ---
const SLOT_SYMBOLS = [
  { char: '🍒', multiplier: 2 },
  { char: '🍋', multiplier: 5 },
  { char: '🍇', multiplier: 10 },
  { char: '🔔', multiplier: 20 },
  { char: '💎', multiplier: 50 },
  { char: '7️⃣', multiplier: 100 }
];

const ROULETTE_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

const CARD_SUITS = ['hearts', 'diamonds', 'clubs', 'spades'] as const;
const CARD_VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const INITIAL_BALANCE = 1000;

const SHOP_ITEMS: ShopItem[] = [
  { id: 'theme_default', name: 'Royal Gold', price: 0, type: 'THEME', value: '', icon: 'fa-crown' },
  { id: 'theme_pink', name: 'Cyber Pink', price: 2500, type: 'THEME', value: 'theme-pink', icon: 'fa-ghost' },
  { id: 'theme_emerald', name: 'Deep Emerald', price: 5000, type: 'THEME', value: 'theme-emerald', icon: 'fa-gem' },
  { id: 'theme_solar', name: 'Solar Flare', price: 10000, type: 'THEME', value: 'theme-solar', icon: 'fa-sun' },
  { id: 'acc_crown', name: 'King\'s Crown', price: 1000, type: 'ACCESSORY', value: '👑', icon: 'fa-chess-king' },
  { id: 'acc_dice', name: 'Lucky Dice', price: 500, type: 'ACCESSORY', value: '🎲', icon: 'fa-dice' },
  { id: 'acc_clover', name: 'Four Leaf Clover', price: 750, type: 'ACCESSORY', value: '🍀', icon: 'fa-leaf' },
  { id: 'acc_fire', name: 'High Roller', price: 2000, type: 'ACCESSORY', value: '🔥', icon: 'fa-fire' },
];

// --- COMPONENTS ---

const BalanceDisplay: React.FC<{ balance: number; bet: number; setBet: (v: number) => void }> = ({ balance, bet, setBet }) => {
  const betOptions = [1, 5, 10, 25, 100, 500];
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-slate-900/60 backdrop-blur-lg rounded-2xl neon-border">
      <div className="flex flex-col">
        <span className="text-slate-500 text-[10px] uppercase font-black tracking-widest">Bankroll</span>
        <span className="text-3xl font-bold text-accent gold-glow tabular-nums">${Math.ceil(balance).toLocaleString()}</span>
      </div>
      <div className="flex flex-col items-center md:items-end gap-2">
        <span className="text-slate-500 text-[10px] uppercase font-black tracking-widest">Select Stakes</span>
        <div className="flex flex-wrap justify-center gap-2">
          {betOptions.map(opt => (
            <button key={opt} onClick={() => setBet(opt)} disabled={opt > balance} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all border ${bet === opt ? 'bg-accent border-accent text-black shadow-lg shadow-yellow-500/20' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'} disabled:opacity-20`}>${opt}</button>
          ))}
        </div>
      </div>
    </div>
  );
};

const DealerLog: React.FC<{ lastEvent: string }> = ({ lastEvent }) => (
  <div className="flex items-start gap-4 p-6 bg-slate-900/60 rounded-2xl border border-slate-700/50 relative overflow-hidden">
    <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 shadow-lg">
      <i className="fas fa-clipboard-list text-yellow-500 text-xl"></i>
    </div>
    <div className="flex flex-col gap-1 w-full">
      <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Dealer's Desk</span>
      <div className="min-h-[2.5rem] flex items-center"><p className="text-slate-200 text-sm italic">{lastEvent || "Welcome to the table. Place your bets to begin."}</p></div>
    </div>
  </div>
);

const SlotMachine: React.FC<{ balance: number; bet: number; onResult: (a: number, r: string) => void; bonusMultiplier?: number }> = ({ balance, bet, onResult, bonusMultiplier = 1 }) => {
  const [reels, setReels] = useState(['7️⃣', '7️⃣', '7️⃣']);
  const [spinning, setSpinning] = useState(false);
  const spin = () => {
    if (balance < bet || spinning) return;
    setSpinning(true);
    onResult(-bet, "Spinning the reels...");
    const spinInterval = setInterval(() => {
      setReels([SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)].char, SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)].char, SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)].char]);
    }, 100);
    setTimeout(() => {
      clearInterval(spinInterval);
      const finalReels = [SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)].char, SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)].char, SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)].char];
      setReels(finalReels);
      setSpinning(false);
      if (finalReels[0] === finalReels[1] && finalReels[1] === finalReels[2]) {
        const symbol = SLOT_SYMBOLS.find(s => s.char === finalReels[0]);
        const winAmount = Math.ceil(bet * (symbol?.multiplier || 1) * bonusMultiplier);
        onResult(winAmount, `JACKPOT! Three ${finalReels[0]} in a row for $${winAmount}!`);
      } else if (finalReels[0] === finalReels[1] || finalReels[1] === finalReels[2] || finalReels[0] === finalReels[2]) {
        const winAmount = Math.ceil(bet * 1.5 * bonusMultiplier);
        onResult(winAmount, `Matched two! Won $${winAmount}.`);
      } else onResult(0, "No luck this time.");
    }, 1200);
  };
  return (
    <div className="flex flex-col items-center gap-8 py-8">
      {bonusMultiplier > 1 && <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 px-4 py-1 rounded-full text-[10px] font-black uppercase animate-bounce">{bonusMultiplier}x Multiplier Active</div>}
      <div className="flex gap-4">{reels.map((symbol, i) => (<div key={i} className={`w-24 h-32 md:w-32 md:h-48 bg-slate-800 rounded-xl border-2 border-yellow-500/30 flex items-center justify-center text-4xl md:text-6xl shadow-inner shadow-black transition-all ${spinning ? 'scale-95 opacity-80' : 'scale-100 opacity-100'}`}>{symbol}</div>))}</div>
      <button onClick={spin} disabled={spinning || balance < bet} className="px-12 py-4 bg-yellow-500 rounded-full font-black text-black text-xl uppercase transition-all hover:scale-105 active:scale-95 disabled:opacity-50">{spinning ? '...' : 'Spin'}</button>
    </div>
  );
};

const Blackjack: React.FC<{ balance: number; bet: number; onResult: (a: number, r: string) => void; bonusPayout?: number }> = ({ balance, bet, onResult, bonusPayout = 2 }) => {
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [gameStatus, setGameStatus] = useState<'IDLE' | 'PLAYING' | 'OVER'>('IDLE');
  const [msg, setMsg] = useState('');

  const calculateScore = (hand: Card[]) => {
    let score = hand.reduce((acc, card) => acc + card.rank, 0);
    let aces = hand.filter(c => c.value === 'A').length;
    while (score > 21 && aces > 0) { score -= 10; aces--; }
    return score;
  };

  const startNewGame = () => {
    if (balance < bet) return;
    const newDeck: Card[] = [];
    CARD_SUITS.forEach(suit => CARD_VALUES.forEach(val => {
      let rank = parseInt(val);
      if (val === 'A') rank = 11;
      else if (['J', 'Q', 'K', '10'].includes(val)) rank = 10;
      newDeck.push({ suit, value: val, rank });
    }));
    newDeck.sort(() => Math.random() - 0.5);
    const p1 = newDeck.pop()!, d1 = newDeck.pop()!, p2 = newDeck.pop()!, d2 = newDeck.pop()!;
    setPlayerHand([p1, p2]); setDealerHand([d1, d2]); setDeck(newDeck); setGameStatus('PLAYING'); setMsg('Hit or Stand?');
    onResult(-bet, "New deal at Blackjack.");
  };

  const hit = () => {
    const newDeck = [...deck]; const newCard = newDeck.pop()!;
    const newHand = [...playerHand, newCard]; setPlayerHand(newHand); setDeck(newDeck);
    if (calculateScore(newHand) > 21) endGame('LOSS', 'Bust! Dealer takes the pot.');
  };

  const stand = () => {
    let cH = [...dealerHand], cD = [...deck];
    while (calculateScore(cH) < 17) cH.push(cD.pop()!);
    setDealerHand(cH); setDeck(cD);
    const pS = calculateScore(playerHand), dS = calculateScore(cH);
    if (dS > 21) endGame('WIN', 'Dealer busts! You win.');
    else if (pS > dS) endGame('WIN', `Win! ${pS} beats ${dS}.`);
    else if (pS < dS) endGame('LOSS', `Dealer wins with ${dS}.`);
    else endGame('PUSH', "Draw. Bet returned.");
  };

  const endGame = (result: 'WIN' | 'LOSS' | 'PUSH', text: string) => {
    setGameStatus('OVER'); setMsg(text);
    if (result === 'WIN') onResult(Math.ceil(bet * bonusPayout), text);
    else if (result === 'PUSH') onResult(bet, text);
    else onResult(0, text);
  };

  const renderCard = (card: Card, hidden = false) => {
    const color = (card.suit === 'hearts' || card.suit === 'diamonds') ? 'text-red-500' : 'text-slate-900';
    if (hidden) return <div className="w-16 h-24 md:w-24 md:h-36 bg-blue-900 rounded-lg border-2 border-white/20 shadow-lg"></div>;
    return (
      <div className="w-16 h-24 md:w-24 md:h-36 bg-white rounded-lg flex flex-col p-2 justify-between shadow-xl relative animate-in zoom-in duration-300">
        <div className={`text-xl font-bold ${color}`}>{card.value}</div>
        <div className={`text-4xl self-center ${color}`}>{card.suit === 'hearts' ? '♥' : card.suit === 'diamonds' ? '♦' : card.suit === 'clubs' ? '♣' : '♠'}</div>
        <div className={`text-xl font-bold self-end rotate-180 ${color}`}>{card.value}</div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-8 py-4">
      <div className="flex flex-col items-center gap-4">
        <span className="text-[10px] font-black uppercase text-slate-500">Dealer ({gameStatus === 'PLAYING' ? '?' : calculateScore(dealerHand)})</span>
        <div className="flex gap-2">{dealerHand.map((card, i) => renderCard(card, gameStatus === 'PLAYING' && i === 1))}</div>
      </div>
      <div className="h-8 text-xl font-bold text-yellow-500">{msg}</div>
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-2">{playerHand.map(card => renderCard(card))}</div>
        <span className="text-[10px] font-black uppercase text-slate-500">You ({calculateScore(playerHand)})</span>
      </div>
      <div className="flex gap-4">
        {gameStatus === 'PLAYING' ? (
          <><button onClick={hit} className="px-8 py-3 bg-white text-black font-bold rounded-full">Hit</button><button onClick={stand} className="px-8 py-3 bg-slate-800 text-white font-bold rounded-full">Stand</button></>
        ) : (<button onClick={startNewGame} disabled={balance < bet} className="px-8 py-3 bg-yellow-500 text-black font-bold rounded-full">New Game</button>)}
      </div>
    </div>
  );
};

const Roulette: React.FC<{ balance: number; bet: number; onResult: (a: number, r: string) => void; straightUpMultiplier?: number }> = ({ balance, bet, onResult, straightUpMultiplier = 35 }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [spinning, setSpinning] = useState(false);
  const [selectedNum, setSelectedNum] = useState<number | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const w = 300, h = 300, radius = 150;
    const svg = d3.select(svgRef.current).attr('viewBox', `0 0 ${w} ${h}`);
    svg.selectAll('*').remove();
    const g = svg.append('g').attr('transform', `translate(${w/2},${h/2})`).attr('class', 'wheel-group');
    const arc = d3.arc<any>().innerRadius(radius * 0.6).outerRadius(radius);
    const pie = d3.pie<number>().value(1).sort(null);
    const arcs = g.selectAll('.arc').data(pie(ROULETTE_NUMBERS)).enter().append('g');
    arcs.append('path').attr('d', arc).attr('fill', d => d.data === 0 ? '#10b981' : ([32, 19, 21, 25, 34, 27, 36, 30, 23, 5, 16, 1, 14, 9, 18, 7, 12, 3].includes(d.data) ? '#ef4444' : '#1e293b')).attr('stroke', '#334155');
    arcs.append('text').attr('transform', d => `translate(${arc.centroid(d)}) rotate(${(d.startAngle + d.endAngle) / 2 * (180 / Math.PI) + (d.startAngle + d.endAngle > Math.PI ? 90 : -90)})`).attr('dy', '0.35em').attr('text-anchor', 'middle').attr('fill', 'white').attr('font-size', '8px').text(d => d.data);
    g.append('circle').attr('r', radius * 0.55).attr('fill', '#0f172a');
  }, []);

  const spin = () => {
    if (selectedNum === null || balance < bet || spinning) return;
    setSpinning(true); onResult(-bet, `Placing $${bet} on number ${selectedNum}.`);
    const resultIdx = Math.floor(Math.random() * ROULETTE_NUMBERS.length);
    const winNum = ROULETTE_NUMBERS[resultIdx];
    const rotation = 360 * 5 + (360 - (resultIdx * (360 / ROULETTE_NUMBERS.length)));
    d3.select('.wheel-group').transition().duration(4000).ease(d3.easeCubicOut).attr('transform', `translate(150,150) rotate(${rotation})`).on('end', () => {
      setSpinning(false);
      if (winNum === selectedNum) onResult(bet * straightUpMultiplier, `UNBELIEVABLE! Number ${winNum} hit! You won $${bet * straightUpMultiplier}!`);
      else onResult(0, `The ball landed on ${winNum}. Hard luck.`);
    });
  };

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-4 text-yellow-500 z-10 text-2xl"><i className="fas fa-caret-down"></i></div>
        <svg ref={svgRef} className="w-64 h-64 md:w-80 md:h-80 shadow-2xl rounded-full border-4 border-slate-800"></svg>
      </div>
      <div className="grid grid-cols-6 gap-1 md:grid-cols-10">
        {ROULETTE_NUMBERS.slice().sort((a,b) => a-b).map(num => (
          <button key={num} onClick={() => setSelectedNum(num)} disabled={spinning} className={`w-10 py-2 text-xs font-bold rounded ${selectedNum === num ? 'bg-yellow-500 text-black' : (num === 0 ? 'bg-green-700 text-white' : 'bg-slate-800 text-slate-300')}`}>{num}</button>
        ))}
      </div>
      <button onClick={spin} disabled={spinning || selectedNum === null || balance < bet} className="px-12 py-3 bg-indigo-600 text-white font-bold rounded-full">{spinning ? '...' : 'Spin Wheel'}</button>
    </div>
  );
};

const HiLo: React.FC<{ balance: number; bet: number; onResult: (a: number, r: string) => void; winMultiplier?: number }> = ({ balance, bet, onResult, winMultiplier = 1.85 }) => {
  const [cCard, setCCard] = useState<Card | null>(null);
  const [nCard, setNCard] = useState<Card | null>(null);
  const [state, setState] = useState<'IDLE' | 'PLAYING'>('IDLE');
  const draw = () => {
    const s = CARD_SUITS[Math.floor(Math.random() * CARD_SUITS.length)], v = CARD_VALUES[Math.floor(Math.random() * CARD_VALUES.length)];
    let r = parseInt(v); if (v === 'A') r = 14; else if (v === 'K') r = 13; else if (v === 'Q') r = 12; else if (v === 'J') r = 11;
    return { suit: s, value: v, rank: r } as Card;
  };
  const start = () => { if (balance < bet) return; onResult(-bet, "Staking..."); setCCard(draw()); setNCard(null); setState('PLAYING'); };
  const guess = (dir: 'HI' | 'LO') => {
    const next = draw(); setNCard(next); setState('IDLE');
    if ((dir === 'HI' && next.rank >= cCard!.rank) || (dir === 'LO' && next.rank <= cCard!.rank)) {
      const win = Math.ceil(bet * winMultiplier); onResult(win, `Correct! ${next.value} was ${dir}. Won $${win}!`);
    } else onResult(0, `Wrong! It was ${next.value}.`);
  };
  const renderCard = (c: Card | null, l: string) => (
    <div className="flex flex-col items-center gap-2">
      <span className="text-[10px] uppercase text-slate-500">{l}</span>
      <div className={`w-20 h-32 bg-white rounded-xl flex flex-col p-3 justify-between shadow-xl ${!c ? 'bg-slate-800 border-2 border-dashed' : ''}`}>
        {c && (<><div className="text-xl font-bold">{c.value}</div><div className="text-4xl self-center">{c.suit === 'hearts' ? '♥' : '♣'}</div></>)}
      </div>
    </div>
  );
  return (
    <div className="flex flex-col items-center gap-10">
      <div className="flex gap-8 items-center">{renderCard(cCard, "Base")}{renderCard(nCard, "Next")}</div>
      <div className="flex gap-4">
        {state === 'IDLE' ? <button onClick={start} disabled={balance < bet} className="px-10 py-4 bg-yellow-500 text-black font-black rounded-full uppercase">Draw Card</button> : <><button onClick={() => guess('HI')} className="px-8 py-4 bg-emerald-500 text-white rounded-full uppercase">Higher</button><button onClick={() => guess('LO')} className="px-8 py-4 bg-rose-500 text-white rounded-full uppercase">Lower</button></>}
      </div>
    </div>
  );
};

const CoinFlip: React.FC<{ balance: number; bet: number; onResult: (a: number, r: string) => void; winMultiplier?: number }> = ({ balance, bet, onResult, winMultiplier = 2 }) => {
  const [flipping, setFlipping] = useState(false);
  const [side, setSide] = useState<'HEADS' | 'TAILS'>('HEADS');
  const [pick, setPick] = useState<'HEADS' | 'TAILS' | null>(null);
  const flip = () => {
    if (!pick || balance < bet || flipping) return;
    setFlipping(true); onResult(-bet, `Flipping for ${pick}...`);
    setTimeout(() => {
      const res = Math.random() > 0.5 ? 'HEADS' : 'TAILS'; setSide(res); setFlipping(false);
      if (res === pick) { const w = Math.ceil(bet * winMultiplier); onResult(w, `It's ${res}! Won $${w}!`); }
      else onResult(0, `Landed on ${res}. Hard luck.`);
    }, 1000);
  };
  return (
    <div className="flex flex-col items-center gap-10">
      <div className={`w-40 h-40 rounded-full bg-yellow-500 flex items-center justify-center border-4 border-yellow-700 transition-all ${flipping ? 'animate-bounce rotate-[720deg]' : ''}`}><span className="text-3xl font-black">{side[0]}</span></div>
      <div className="flex gap-4">
        <button onClick={() => setPick('HEADS')} disabled={flipping} className={`px-8 py-3 rounded-xl font-bold ${pick === 'HEADS' ? 'bg-yellow-500 text-black' : 'bg-slate-800'}`}>Heads</button>
        <button onClick={() => setPick('TAILS')} disabled={flipping} className={`px-8 py-3 rounded-xl font-bold ${pick === 'TAILS' ? 'bg-yellow-500 text-black' : 'bg-slate-800'}`}>Tails</button>
      </div>
      <button onClick={flip} disabled={flipping || !pick || balance < bet} className="px-12 py-4 bg-indigo-600 text-white font-black rounded-full uppercase">Flip</button>
    </div>
  );
};

const Rewards: React.FC<{ balance: number; lastClaimed: number; ownedItems: string[]; activeTheme: string; activeAccessory: string; onClaim: (a: number, m: string, t: 'DAILY' | 'FRIDAY') => void; onPurchase: (i: ShopItem) => void; onEquip: (i: ShopItem) => void; timeContext: TimeContext }> = ({ balance, lastClaimed, ownedItems, activeTheme, activeAccessory, onClaim, onPurchase, onEquip, timeContext }) => {
  const [tab, setTab] = useState<'BONUSES' | 'SHOP'>('BONUSES');
  const isAvailable = Date.now() - lastClaimed > 86400000;
  return (
    <div className="w-full max-w-2xl py-8 space-y-8">
      <div className="flex justify-center p-1 bg-slate-800 rounded-xl w-fit mx-auto">
        <button onClick={() => setTab('BONUSES')} className={`px-6 py-2 rounded-lg text-xs font-bold uppercase ${tab === 'BONUSES' ? 'bg-accent text-black' : 'text-slate-400'}`}>Bonuses</button>
        <button onClick={() => setTab('SHOP')} className={`px-6 py-2 rounded-lg text-xs font-bold uppercase ${tab === 'SHOP' ? 'bg-accent text-black' : 'text-slate-400'}`}>Shop</button>
      </div>
      {tab === 'BONUSES' ? (
        <div className="bg-slate-800 p-6 rounded-3xl flex flex-col items-center gap-4">
          <h4 className="font-bold text-white">Daily Bonus</h4>
          <button onClick={() => onClaim(100, "Claimed daily $100!", 'DAILY')} disabled={!isAvailable} className={`w-full py-3 rounded-xl font-bold ${isAvailable ? 'bg-accent text-black' : 'bg-slate-700 text-slate-500'}`}>
            {isAvailable ? "Claim $100" : "Come back tomorrow"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {SHOP_ITEMS.map(i => {
            const owned = ownedItems.includes(i.id), active = activeTheme === i.id || activeAccessory === i.id;
            return (
              <div key={i.id} className={`p-4 bg-slate-800 border rounded-2xl flex flex-col items-center gap-3 ${active ? 'border-accent' : 'border-slate-700'}`}>
                <span className="text-2xl">{i.type === 'ACCESSORY' ? i.value : <i className={`fas ${i.icon}`}></i>}</span>
                <span className="text-xs font-bold">{i.name}</span>
                <button onClick={() => owned ? onEquip(i) : onPurchase(i)} disabled={active || (!owned && balance < i.price)} className={`w-full py-2 rounded-lg text-[10px] font-black uppercase ${active ? 'bg-slate-700' : 'bg-accent text-black'}`}>
                  {active ? 'Equipped' : (owned ? 'Equip' : `$${i.price}`)}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// --- MAIN APP ---
const App: React.FC = () => {
  const [activeGame, setActiveGame] = useState<GameType>(GameType.LOBBY);
  const [lastEvent, setLastEvent] = useState<string>('');
  const [state, setState] = useState<GameState>(() => {
    const saved = localStorage.getItem('neon_royal_state');
    return saved ? JSON.parse(saved) : { balance: INITIAL_BALANCE, bet: 10, history: [], ownedItems: ['theme_default'], activeTheme: 'theme_default', activeAccessory: '' };
  });

  const timeContext: TimeContext = { day: new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date()), hour: new Date().getHours(), isGoldenHour: false, isGraveyard: false, activeDailyBonus: 'NONE' };

  useEffect(() => localStorage.setItem('neon_royal_state', JSON.stringify(state)), [state]);

  const handleResult = useCallback((amount: number, resultText: string) => {
    setLastEvent(resultText);
    setState(s => ({
      ...s, balance: s.balance + amount,
      history: [{ id: Math.random().toString(36).substr(2,9), game: activeGame, amount: Math.abs(amount), result: amount > 0 ? 'WIN' : (amount < 0 ? 'LOSS' : 'PUSH'), timestamp: Date.now() }, ...s.history].slice(0, 50)
    }));
  }, [activeGame]);

  const activeThemeObj = SHOP_ITEMS.find(i => i.id === state.activeTheme);
  const activeAccObj = SHOP_ITEMS.find(i => i.id === state.activeAccessory);

  const renderGame = () => {
    const props = { balance: state.balance, bet: state.bet, onResult: handleResult };
    switch (activeGame) {
      case GameType.SLOTS: return <SlotMachine {...props} />;
      case GameType.BLACKJACK: return <Blackjack {...props} />;
      case GameType.ROULETTE: return <Roulette {...props} />;
      case GameType.HI_LO: return <HiLo {...props} />;
      case GameType.COIN_FLIP: return <CoinFlip {...props} />;
      case GameType.REWARDS: return <Rewards {...state} lastClaimed={state.lastRewardClaimed || 0} onClaim={(a,m,t) => { setLastEvent(m); setState(s => ({ ...s, balance: s.balance + a, lastRewardClaimed: Date.now() })); }} onPurchase={i => { if (state.balance >= i.price) setState(s => ({ ...s, balance: s.balance - i.price, ownedItems: [...s.ownedItems, i.id] })); }} onEquip={i => setState(s => ({ ...s, [i.type === 'THEME' ? 'activeTheme' : 'activeAccessory']: i.id }))} timeContext={timeContext} />;
      default: return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-8">
          {[GameType.SLOTS, GameType.BLACKJACK, GameType.ROULETTE, GameType.HI_LO, GameType.COIN_FLIP].map(type => (
            <button key={type} onClick={() => setActiveGame(type)} className="bg-slate-800/40 p-8 rounded-3xl flex flex-col items-center gap-4 transition-all hover:scale-105 group border border-slate-700">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center text-3xl group-hover:text-accent"><i className={`fas ${type === GameType.SLOTS ? 'fa-gem' : type === GameType.BLACKJACK ? 'fa-suit-spades' : type === GameType.ROULETTE ? 'fa-circle-dot' : type === GameType.HI_LO ? 'fa-arrows-up-down' : 'fa-coins'}`}></i></div>
              <span className="font-black text-[10px] uppercase tracking-widest">{type}</span>
            </button>
          ))}
        </div>
      );
    }
  };

  return (
    <div className={`min-h-screen bg-slate-950 text-white selection:bg-accent selection:text-black ${activeThemeObj?.value || ''}`}>
      <nav className="border-b border-white/5 bg-slate-900/40 backdrop-blur-xl sticky top-0 z-50 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveGame(GameType.LOBBY)}>
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-black font-black">{activeAccObj?.value || 'N'}</div>
          <span className="font-black uppercase tracking-tighter text-xl">Neon<span className="text-accent">Royal</span></span>
        </div>
        <button onClick={() => setActiveGame(GameType.REWARDS)} className="p-2.5 rounded-xl bg-slate-800/50 text-accent transition-all"><i className="fas fa-gift"></i></button>
      </nav>
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <BalanceDisplay balance={state.balance} bet={state.bet} setBet={v => setState(s => ({ ...s, bet: v }))} />
            <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-8 min-h-[500px] flex items-center justify-center shadow-2xl relative overflow-hidden">
               {activeGame !== GameType.LOBBY && <button onClick={() => setActiveGame(GameType.LOBBY)} className="absolute top-6 left-6 text-slate-500 hover:text-white"><i className="fas fa-arrow-left mr-2"></i> Lobby</button>}
               {renderGame()}
            </div>
          </div>
          <div className="space-y-8">
            <DealerLog lastEvent={lastEvent} />
            <div className="bg-slate-900/60 rounded-3xl p-6 border border-white/5 space-y-4">
              <h4 className="text-[10px] font-black uppercase text-slate-500">Floor History</h4>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {state.history.map(h => (
                  <div key={h.id} className="flex justify-between py-2 border-b border-white/5 last:border-0">
                    <div className="flex flex-col"><span className="text-xs font-bold text-white uppercase">{h.game}</span><span className="text-[9px] text-slate-500">{new Date(h.timestamp).toLocaleTimeString()}</span></div>
                    <span className={`text-xs font-black ${h.result === 'WIN' ? 'text-emerald-500' : 'text-rose-500'}`}>{h.result === 'WIN' ? '+' : '-'}${h.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<React.StrictMode><App /></React.StrictMode>);
