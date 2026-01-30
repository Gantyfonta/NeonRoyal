
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
  ownedItems: string[];
  activeTheme: string;
  activeAccessory: string;
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

const INITIAL_BALANCE = 1000;

// --- COMPONENTS ---

const BalanceDisplay: React.FC<{ balance: number; bet: number; setBet: (v: number) => void }> = ({ balance, bet, setBet }) => {
  const betOptions = [1, 5, 10, 25, 100, 500];
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-slate-900/60 backdrop-blur-lg rounded-2xl neon-border">
      <div className="flex flex-col">
        <span className="text-slate-500 text-[10px] uppercase font-black tracking-widest">Available Credit</span>
        <span className="text-4xl font-black text-accent gold-glow tabular-nums tracking-tighter">${Math.ceil(balance).toLocaleString()}</span>
      </div>
      <div className="flex flex-col items-center md:items-end gap-2">
        <span className="text-slate-500 text-[10px] uppercase font-black tracking-widest">Active Stake</span>
        <div className="flex flex-wrap justify-center gap-2">
          {betOptions.map(opt => (
            <button key={opt} onClick={() => setBet(opt)} disabled={opt > balance} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all border ${bet === opt ? 'bg-accent border-accent text-black shadow-lg shadow-yellow-500/20 scale-105' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'} disabled:opacity-20`}>${opt}</button>
          ))}
        </div>
      </div>
    </div>
  );
};

const DealerLog: React.FC<{ lastEvent: string }> = ({ lastEvent }) => (
  <div className="flex items-start gap-4 p-6 bg-slate-900/60 rounded-2xl border border-slate-700/50 relative overflow-hidden group">
    <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 shadow-lg group-hover:border-accent/50 transition-colors">
      <i className="fas fa-user-tie text-accent text-xl"></i>
    </div>
    <div className="flex flex-col gap-1 w-full">
      <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Floor Manager</span>
      <div className="min-h-[2.5rem] flex items-center animate-in fade-in slide-in-from-left-2 duration-300">
        <p className="text-slate-200 text-sm italic font-medium">"{lastEvent || "Good evening. Step up to any table to begin your run."}"</p>
      </div>
    </div>
  </div>
);

const SlotMachine: React.FC<{ balance: number; bet: number; onResult: (a: number, r: string) => void }> = ({ balance, bet, onResult }) => {
  const [reels, setReels] = useState(['7️⃣', '7️⃣', '7️⃣']);
  const [spinning, setSpinning] = useState(false);
  const spin = () => {
    if (balance < bet || spinning) return;
    setSpinning(true);
    onResult(-bet, "Feeling lucky? Reels are rolling.");
    const spinInterval = setInterval(() => {
      setReels([
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)].char,
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)].char,
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)].char
      ]);
    }, 80);
    setTimeout(() => {
      clearInterval(spinInterval);
      const final = [
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)].char,
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)].char,
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)].char
      ];
      setReels(final);
      setSpinning(false);
      if (final[0] === final[1] && final[1] === final[2]) {
        const win = bet * (SLOT_SYMBOLS.find(s => s.char === final[0])?.multiplier || 1);
        onResult(win, `TRIPLE! You hit the jackpot for $${win}!`);
      } else if (final[0] === final[1] || final[1] === final[2] || final[0] === final[2]) {
        const win = Math.ceil(bet * 1.5);
        onResult(win, `Double match! A cool $${win} back in the bank.`);
      } else onResult(0, "Close, but the house takes this one.");
    }, 1200);
  };
  return (
    <div className="flex flex-col items-center gap-10 py-8">
      <div className="flex gap-4 p-6 bg-black/40 rounded-[2rem] border-4 border-slate-800 shadow-2xl">
        {reels.map((s, i) => (
          <div key={i} className={`w-24 h-36 md:w-32 md:h-48 bg-gradient-to-b from-slate-900 to-slate-800 rounded-2xl border-2 border-slate-700 flex items-center justify-center text-4xl md:text-6xl shadow-inner shadow-black transition-all ${spinning ? 'animate-pulse' : ''}`}>{s}</div>
        ))}
      </div>
      <button onClick={spin} disabled={spinning || balance < bet} className="px-16 py-5 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full font-black text-black text-2xl uppercase tracking-widest transition-all hover:scale-110 active:scale-95 disabled:opacity-30 shadow-2xl shadow-yellow-500/20">Spin</button>
    </div>
  );
};

const Blackjack: React.FC<{ balance: number; bet: number; onResult: (a: number, r: string) => void }> = ({ balance, bet, onResult }) => {
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [status, setStatus] = useState<'IDLE' | 'PLAYING' | 'OVER'>('IDLE');
  const [msg, setMsg] = useState('');

  const calc = (h: Card[]) => {
    let s = h.reduce((a, c) => a + c.rank, 0);
    let aces = h.filter(c => c.value === 'A').length;
    while (s > 21 && aces > 0) { s -= 10; aces--; }
    return s;
  };

  const start = () => {
    if (balance < bet) return;
    const d: Card[] = [];
    CARD_SUITS.forEach(s => CARD_VALUES.forEach(v => {
      let r = parseInt(v); if (v === 'A') r = 11; else if (['J', 'Q', 'K', '10'].includes(v)) r = 10;
      d.push({ suit: s, value: v, rank: r });
    }));
    d.sort(() => Math.random() - 0.5);
    const p1 = d.pop()!, d1 = d.pop()!, p2 = d.pop()!, d2 = d.pop()!;
    setPlayerHand([p1, p2]); setDealerHand([d1, d2]); setDeck(d); setStatus('PLAYING'); setMsg('Your move, high roller.');
    onResult(-bet, "Ante up. Cards are on the table.");
  };

  const hit = () => {
    const nd = [...deck], nc = nd.pop()!, nh = [...playerHand, nc];
    setPlayerHand(nh); setDeck(nd);
    if (calc(nh) > 21) end(0, "Bust. The house cleaned you out.");
  };

  const stand = () => {
    let dh = [...dealerHand], nd = [...deck];
    while (calc(dh) < 17) dh.push(nd.pop()!);
    setDealerHand(dh); setDeck(nd);
    const ps = calc(playerHand), ds = calc(dh);
    if (ds > 21) end(bet * 2, "Dealer bust! Excellent strategy.");
    else if (ps > ds) end(bet * 2, `Winner! ${ps} takes the pot.`);
    else if (ps < ds) end(0, `Dealer wins with ${ds}. Better luck next shuffle.`);
    else end(bet, "A standoff. Bet returned.");
  };

  const end = (w: number, m: string) => { setStatus('OVER'); setMsg(m); onResult(w, m); };

  const renderCard = (c: Card, h = false) => {
    const isRed = c.suit === 'hearts' || c.suit === 'diamonds';
    if (h) return <div className="w-16 h-24 md:w-24 md:h-36 bg-slate-900 border-2 border-slate-700 rounded-xl shadow-2xl flex items-center justify-center"><i className="fas fa-crown text-slate-800 text-3xl opacity-20"></i></div>;
    return (
      <div className="w-16 h-24 md:w-24 md:h-36 bg-white rounded-xl flex flex-col p-2 justify-between shadow-2xl animate-in zoom-in-50 duration-300">
        <div className={`text-xl font-black ${isRed ? 'text-rose-600' : 'text-slate-900'}`}>{c.value}</div>
        <div className={`text-4xl self-center ${isRed ? 'text-rose-600' : 'text-slate-900'}`}>{c.suit === 'hearts' ? '♥' : c.suit === 'diamonds' ? '♦' : c.suit === 'clubs' ? '♣' : '♠'}</div>
        <div className={`text-xl font-black self-end rotate-180 ${isRed ? 'text-rose-600' : 'text-slate-900'}`}>{c.value}</div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="flex flex-col items-center gap-3">
        <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">House Hand ({status === 'PLAYING' ? '?' : calc(dealerHand)})</span>
        <div className="flex gap-3">{dealerHand.map((c, i) => <div key={i}>{renderCard(c, status === 'PLAYING' && i === 1)}</div>)}</div>
      </div>
      <div className="h-10 text-xl font-black text-accent text-center gold-glow uppercase tracking-widest">{msg}</div>
      <div className="flex flex-col items-center gap-3">
        <div className="flex gap-3">{playerHand.map((c, i) => <div key={i}>{renderCard(c)}</div>)}</div>
        <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Your Hand ({calc(playerHand)})</span>
      </div>
      <div className="flex gap-4 mt-4">
        {status === 'PLAYING' ? (
          <><button onClick={hit} className="px-10 py-3 bg-white text-black font-black rounded-full uppercase transition-all hover:scale-110">Hit</button><button onClick={stand} className="px-10 py-3 bg-slate-800 text-white font-black rounded-full uppercase border border-slate-700 hover:bg-slate-700">Stand</button></>
        ) : (<button onClick={start} disabled={balance < bet} className="px-12 py-4 bg-yellow-500 text-black font-black rounded-full uppercase tracking-widest shadow-2xl shadow-yellow-500/10">Deal Hand</button>)}
      </div>
    </div>
  );
};

const Roulette: React.FC<{ balance: number; bet: number; onResult: (a: number, r: string) => void }> = ({ balance, bet, onResult }) => {
  const ref = useRef<SVGSVGElement>(null);
  const [spinning, setSpinning] = useState(false);
  const [pick, setPick] = useState<number | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const d = 300, r = 150;
    const s = d3.select(ref.current).attr('viewBox', `0 0 ${d} ${d}`);
    s.selectAll('*').remove();
    const g = s.append('g').attr('transform', `translate(${r},${r})`).attr('class', 'wheel-group');
    const arc = d3.arc<any>().innerRadius(r * 0.6).outerRadius(r);
    const pie = d3.pie<number>().value(1).sort(null);
    const arcs = g.selectAll('.arc').data(pie(ROULETTE_NUMBERS)).enter().append('g');
    arcs.append('path').attr('d', arc).attr('fill', d => d.data === 0 ? '#10b981' : ([32, 19, 21, 25, 34, 27, 36, 30, 23, 5, 16, 1, 14, 9, 18, 7, 12, 3].includes(d.data) ? '#ef4444' : '#1e293b')).attr('stroke', '#334155');
    arcs.append('text').attr('transform', d => `translate(${arc.centroid(d)}) rotate(${(d.startAngle + d.endAngle) / 2 * (180 / Math.PI) + (d.startAngle + d.endAngle > Math.PI ? 90 : -90)})`).attr('dy', '0.35em').attr('text-anchor', 'middle').attr('fill', 'white').attr('font-size', '8px').attr('font-weight', '900').text(d => d.data);
    g.append('circle').attr('r', r * 0.55).attr('fill', '#0f172a').attr('stroke', '#475569');
  }, []);

  const spin = () => {
    if (pick === null || balance < bet || spinning) return;
    setSpinning(true); onResult(-bet, `Rien ne va plus. $${bet} on ${pick}.`);
    const ri = Math.floor(Math.random() * ROULETTE_NUMBERS.length), win = ROULETTE_NUMBERS[ri];
    const rot = 360 * 5 + (360 - (ri * (360 / ROULETTE_NUMBERS.length)));
    d3.select('.wheel-group').transition().duration(4000).ease(d3.easeCubicOut).attr('transform', `translate(150,150) rotate(${rot})`).on('end', () => {
      setSpinning(false);
      if (win === pick) onResult(bet * 36, `JACKPOT! Number ${win} hit! You're a natural.`);
      else onResult(0, `The ball settled on ${win}. Better luck next spin.`);
    });
  };

  return (
    <div className="flex flex-col items-center gap-8 py-4">
      <div className="relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-4 text-accent z-10 text-3xl animate-bounce"><i className="fas fa-caret-down"></i></div>
        <svg ref={ref} className="w-64 h-64 md:w-80 md:h-80 shadow-2xl rounded-full border-8 border-slate-900"></svg>
      </div>
      <div className="grid grid-cols-6 gap-1 md:grid-cols-10">
        {ROULETTE_NUMBERS.slice().sort((a,b)=>a-b).map(n => (
          <button key={n} onClick={() => setPick(n)} disabled={spinning} className={`w-10 py-2 text-[10px] font-black rounded-lg transition-all ${pick === n ? 'bg-accent text-black scale-110' : (n === 0 ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400')}`}>{n}</button>
        ))}
      </div>
      <button onClick={spin} disabled={spinning || pick === null || balance < bet} className="px-16 py-4 bg-indigo-600 text-white font-black rounded-full uppercase tracking-widest transition-all hover:scale-105 disabled:opacity-30">{spinning ? '...' : 'Spin Wheel'}</button>
    </div>
  );
};

const HiLo: React.FC<{ balance: number; bet: number; onResult: (a: number, r: string) => void }> = ({ balance, bet, onResult }) => {
  const [curr, setCurr] = useState<Card | null>(null);
  const [next, setNext] = useState<Card | null>(null);
  const [state, setState] = useState<'IDLE' | 'PLAYING'>('IDLE');
  const draw = () => {
    const s = CARD_SUITS[Math.floor(Math.random()*4)], v = CARD_VALUES[Math.floor(Math.random()*13)];
    let r = parseInt(v); if (v === 'A') r = 14; else if (v === 'K') r = 13; else if (v === 'Q') r = 12; else if (v === 'J') r = 11;
    return { suit: s, value: v, rank: r } as Card;
  };
  const start = () => { if (balance < bet) return; onResult(-bet, "Analyzing the deck..."); setCurr(draw()); setNext(null); setState('PLAYING'); };
  const guess = (dir: 'HI' | 'LO') => {
    const n = draw(); setNext(n); setState('IDLE');
    if ((dir === 'HI' && n.rank >= curr!.rank) || (dir === 'LO' && n.rank <= curr!.rank)) {
      onResult(Math.ceil(bet * 1.8), `Superb! ${n.value} was ${dir}. Pocketed $${Math.ceil(bet * 1.8)}.`);
    } else onResult(0, `Wrong call. It was the ${n.value}.`);
  };
  const cardDiv = (c: Card | null, l: string) => (
    <div className="flex flex-col items-center gap-2">
      <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{l}</span>
      <div className={`w-24 h-36 md:w-32 md:h-48 rounded-2xl flex flex-col p-4 justify-between shadow-2xl transition-all ${c ? 'bg-white' : 'bg-slate-800 border-2 border-dashed border-slate-700'}`}>
        {c && (<><div className={`text-2xl font-black ${c.suit==='hearts'||c.suit==='diamonds'?'text-rose-600':'text-slate-900'}`}>{c.value}</div><div className={`text-6xl self-center ${c.suit==='hearts'||c.suit==='diamonds'?'text-rose-600':'text-slate-900'}`}>{c.suit==='hearts'?'♥':'♣'}</div></>)}
      </div>
    </div>
  );
  return (
    <div className="flex flex-col items-center gap-12">
      <div className="flex gap-10 items-center">{cardDiv(curr, "Base")}{cardDiv(next, "Next")}</div>
      <div className="flex gap-4">
        {state === 'IDLE' ? <button onClick={start} disabled={balance < bet} className="px-12 py-4 bg-accent text-black font-black rounded-full uppercase tracking-widest">Draw Base</button> : <><button onClick={() => guess('HI')} className="px-10 py-4 bg-emerald-500 text-white font-black rounded-full uppercase">Higher</button><button onClick={() => guess('LO')} className="px-10 py-4 bg-rose-500 text-white font-black rounded-full uppercase">Lower</button></>}
      </div>
    </div>
  );
};

const CoinFlip: React.FC<{ balance: number; bet: number; onResult: (a: number, r: string) => void }> = ({ balance, bet, onResult }) => {
  const [flipping, setFlipping] = useState(false);
  const [side, setSide] = useState<'HEADS' | 'TAILS'>('HEADS');
  const [sel, setSel] = useState<'HEADS' | 'TAILS' | null>(null);
  const flip = () => {
    if (!sel || balance < bet || flipping) return;
    setFlipping(true); onResult(-bet, `Tossing the coin for ${sel}...`);
    setTimeout(() => {
      const res = Math.random() > 0.5 ? 'HEADS' : 'TAILS'; setSide(res); setFlipping(false);
      if (res === sel) onResult(bet * 2, `Heads or Tails... It's ${res}! Doubled your bet.`);
      else onResult(0, `Bad bounce. Landed on ${res}.`);
    }, 1000);
  };
  return (
    <div className="flex flex-col items-center gap-12">
      <div className={`w-48 h-48 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center border-8 border-yellow-700 shadow-2xl transition-all duration-700 ${flipping ? 'animate-bounce rotate-[1080deg]' : ''}`}>
        <span className="text-5xl font-black text-yellow-900 drop-shadow-lg">{side[0]}</span>
      </div>
      <div className="flex gap-4">
        <button onClick={() => setSel('HEADS')} disabled={flipping} className={`px-10 py-4 rounded-2xl font-black uppercase tracking-widest transition-all ${sel === 'HEADS' ? 'bg-accent text-black scale-110 shadow-lg shadow-yellow-500/20' : 'bg-slate-800 text-slate-400'}`}>Heads</button>
        <button onClick={() => setSel('TAILS')} disabled={flipping} className={`px-10 py-4 rounded-2xl font-black uppercase tracking-widest transition-all ${sel === 'TAILS' ? 'bg-accent text-black scale-110 shadow-lg shadow-yellow-500/20' : 'bg-slate-800 text-slate-400'}`}>Tails</button>
      </div>
      <button onClick={flip} disabled={flipping || !sel || balance < bet} className="px-16 py-5 bg-indigo-600 text-white font-black rounded-full uppercase tracking-widest transition-all hover:scale-105 shadow-2xl shadow-indigo-500/20">Flip Coin</button>
    </div>
  );
};

const Rewards: React.FC<{ balance: number; lastClaimed: number; ownedItems: string[]; activeTheme: string; activeAccessory: string; onClaim: (a: number, m: string) => void; onPurchase: (i: ShopItem) => void; onEquip: (i: ShopItem) => void }> = ({ balance, lastClaimed, ownedItems, activeTheme, activeAccessory, onClaim, onPurchase, onEquip }) => {
  const [tab, setTab] = useState<'BONUSES' | 'SHOP'>('BONUSES');
  const isAvail = Date.now() - lastClaimed > 86400000;
  return (
    <div className="w-full max-w-2xl py-8 space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div className="flex justify-center p-1.5 bg-slate-900/80 rounded-2xl w-fit mx-auto border border-slate-800 shadow-2xl">
        <button onClick={() => setTab('BONUSES')} className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${tab === 'BONUSES' ? 'bg-accent text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}>Vault</button>
        <button onClick={() => setTab('SHOP')} className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${tab === 'SHOP' ? 'bg-accent text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}>Boutique</button>
      </div>
      {tab === 'BONUSES' ? (
        <div className="bg-slate-900/40 p-10 rounded-[2.5rem] border border-slate-800 flex flex-col items-center gap-6 shadow-2xl">
          <div className="w-24 h-24 bg-accent/10 rounded-full flex items-center justify-center text-5xl text-accent border border-accent/20 shadow-inner"><i className="fas fa-vault"></i></div>
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-black">Daily Allowance</h3>
            <p className="text-slate-500 text-sm">Every high roller needs a fresh stack. Claim yours daily.</p>
          </div>
          <button onClick={() => onClaim(100, "Refilled your bankroll. Good luck on the floor.")} disabled={!isAvail} className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all ${isAvail ? 'bg-accent text-black hover:scale-105' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}>
            {isAvail ? "Claim $100" : "Come back in 24 hours"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {SHOP_ITEMS.map(i => {
            const owned = ownedItems.includes(i.id), active = activeTheme === i.id || activeAccessory === i.id;
            return (
              <div key={i.id} className={`p-6 bg-slate-900/40 border-2 rounded-[2rem] flex flex-col items-center gap-4 transition-all ${active ? 'border-accent ring-1 ring-accent/30' : 'border-slate-800 hover:border-slate-700'}`}>
                <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-slate-700">{i.type === 'ACCESSORY' ? i.value : <i className={`fas ${i.icon} text-accent`}></i>}</div>
                <div className="text-center">
                  <h4 className="font-black text-sm uppercase tracking-wider">{i.name}</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">{i.type}</p>
                </div>
                <button onClick={() => owned ? onEquip(i) : onPurchase(i)} disabled={active || (!owned && balance < i.price)} className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-slate-800 text-slate-500 cursor-default' : 'bg-accent text-black hover:scale-105 active:scale-95 disabled:opacity-20'}`}>
                  {active ? 'Equipped' : (owned ? 'Equip' : `$${i.price.toLocaleString()}`)}
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
  const [game, setGame] = useState<GameType>(GameType.LOBBY);
  const [event, setEvent] = useState<string>('');
  const [state, setState] = useState<GameState>(() => {
    const s = localStorage.getItem('neon_royal_state');
    return s ? JSON.parse(s) : { balance: INITIAL_BALANCE, bet: 10, history: [], ownedItems: ['theme_default'], activeTheme: 'theme_default', activeAccessory: '' };
  });

  useEffect(() => localStorage.setItem('neon_royal_state', JSON.stringify(state)), [state]);

  const result = useCallback((a: number, m: string) => {
    setEvent(m);
    setState(s => ({
      ...s, balance: s.balance + a,
      history: [{ id: Math.random().toString(36).substr(2,9), game: game, amount: Math.abs(a), result: a > 0 ? 'WIN' : (a < 0 ? 'LOSS' : 'PUSH'), timestamp: Date.now() }, ...s.history].slice(0, 50)
    }));
  }, [game]);

  const curTheme = SHOP_ITEMS.find(i => i.id === state.activeTheme);
  const curAcc = SHOP_ITEMS.find(i => i.id === state.activeAccessory);

  const render = () => {
    const p = { balance: state.balance, bet: state.bet, onResult: result };
    switch (game) {
      case GameType.SLOTS: return <SlotMachine {...p} />;
      case GameType.BLACKJACK: return <Blackjack {...p} />;
      case GameType.ROULETTE: return <Roulette {...p} />;
      case GameType.HI_LO: return <HiLo {...p} />;
      case GameType.COIN_FLIP: return <CoinFlip {...p} />;
      case GameType.REWARDS: return <Rewards {...state} lastClaimed={state.lastRewardClaimed || 0} onClaim={(a,m) => { setEvent(m); setState(s => ({ ...s, balance: s.balance + a, lastRewardClaimed: Date.now() })); }} onPurchase={i => { if (state.balance >= i.price) setState(s => ({ ...s, balance: s.balance - i.price, ownedItems: [...s.ownedItems, i.id] })); }} onEquip={i => setState(s => ({ ...s, [i.type === 'THEME' ? 'activeTheme' : 'activeAccessory']: i.id }))} />;
      default: return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 py-10 w-full max-w-4xl">
          {[GameType.SLOTS, GameType.BLACKJACK, GameType.ROULETTE, GameType.HI_LO, GameType.COIN_FLIP].map(t => (
            <button key={t} onClick={() => setGame(t)} className="bg-slate-900/40 p-10 rounded-[3rem] flex flex-col items-center gap-6 transition-all hover:scale-105 hover:bg-slate-900/60 border border-slate-800 shadow-2xl group">
              <div className="w-20 h-20 rounded-3xl bg-slate-950 flex items-center justify-center text-4xl group-hover:text-accent transition-colors border border-slate-800 group-hover:border-accent/30"><i className={`fas ${t===GameType.SLOTS?'fa-gem':t===GameType.BLACKJACK?'fa-suit-spades':t===GameType.ROULETTE?'fa-circle-dot':t===GameType.HI_LO?'fa-arrows-up-down':'fa-coins'}`}></i></div>
              <span className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-500 group-hover:text-white">{t}</span>
            </button>
          ))}
        </div>
      );
    }
  };

  return (
    <div className={`min-h-screen bg-slate-950 text-white font-sans selection:bg-accent selection:text-black ${curTheme?.value || ''}`}>
      <nav className="border-b border-white/5 bg-slate-950/80 backdrop-blur-3xl sticky top-0 z-50 px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => setGame(GameType.LOBBY)}>
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-black font-black text-xl shadow-[0_0_20px_rgba(251,191,36,0.2)]">{curAcc?.value || 'N'}</div>
          <span className="font-black uppercase tracking-tighter text-2xl hidden sm:block">Neon<span className="text-accent">Royal</span></span>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => setGame(GameType.REWARDS)} className="p-3 rounded-2xl bg-slate-900 text-accent transition-all hover:scale-110 relative"><i className="fas fa-gift text-lg"></i>{(Date.now() - (state.lastRewardClaimed || 0) > 86400000) && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-950"></span>}</button>
          <div className="h-10 w-px bg-white/10"></div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest leading-none">Status</span>
            <span className="text-sm font-black text-accent tracking-tighter uppercase leading-tight">High Roller</span>
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-8 py-10 space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            <BalanceDisplay balance={state.balance} bet={state.bet} setBet={v => setState(s => ({ ...s, bet: v }))} />
            <div className="bg-slate-900/40 border border-white/5 rounded-[3.5rem] p-10 min-h-[550px] flex items-center justify-center shadow-2xl relative overflow-hidden">
               {game !== GameType.LOBBY && <button onClick={() => setGame(GameType.LOBBY)} className="absolute top-8 left-10 text-slate-500 hover:text-white font-black text-xs uppercase tracking-widest flex items-center gap-2"><i className="fas fa-arrow-left"></i> Exit to Lobby</button>}
               {render()}
            </div>
          </div>
          <div className="space-y-10">
            <DealerLog lastEvent={event} />
            <div className="bg-slate-900/60 rounded-[2.5rem] p-8 border border-white/5 space-y-6 shadow-2xl">
              <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] flex items-center gap-2"><i className="fas fa-chart-line text-accent"></i> Floor Activity</h4>
              <div className="space-y-4 max-h-[450px] overflow-y-auto pr-3 custom-scrollbar">
                {state.history.length === 0 ? <p className="text-xs text-slate-600 italic">The floor is quiet... place your bets.</p> : state.history.map(h => (
                  <div key={h.id} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0 group">
                    <div className="flex flex-col"><span className="text-xs font-black text-white uppercase tracking-wider group-hover:text-accent transition-colors">{h.game}</span><span className="text-[9px] text-slate-500 font-bold">{new Date(h.timestamp).toLocaleTimeString()}</span></div>
                    <span className={`text-xs font-black tabular-nums ${h.result === 'WIN' ? 'text-emerald-400' : 'text-rose-500'}`}>{h.result === 'WIN' ? '+' : '-'}${h.amount}</span>
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
root.render(<App />);
