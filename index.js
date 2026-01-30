
import * as d3 from 'd3';

// --- CONFIG & CONSTANTS ---
const INITIAL_BALANCE = 1000;
const SLOT_SYMBOLS = ['🍒', '🍋', '🍇', '🔔', '💎', '7️⃣'];
const CARD_SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
const CARD_VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const ROULETTE_NUMBERS = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];

const SHOP_ITEMS = [
    { id: 'theme_default', name: 'Royal Gold', price: 0, type: 'THEME', value: '', icon: 'fa-crown' },
    { id: 'theme_pink', name: 'Cyber Pink', price: 2500, type: 'THEME', value: 'theme-pink', icon: 'fa-ghost' },
    { id: 'theme_emerald', name: 'Deep Emerald', price: 5000, type: 'THEME', value: 'theme-emerald', icon: 'fa-gem' },
    { id: 'acc_crown', name: 'King\'s Crown', price: 1000, type: 'ACCESSORY', value: '👑', icon: 'fa-chess-king' },
    { id: 'acc_dice', name: 'Lucky Dice', price: 500, type: 'ACCESSORY', value: '🎲', icon: 'fa-dice' },
];

// --- STATE MANAGEMENT ---
let state = {
    balance: INITIAL_BALANCE,
    bet: 10,
    activeGame: 'LOBBY',
    history: [],
    lastEvent: 'Welcome to Neon Royal.',
    ownedItems: ['theme_default'],
    activeTheme: 'theme_default',
    activeAccessory: '',
    lastRewardClaimed: 0
};

// Load initial state
const saved = localStorage.getItem('neon_royal_vanilla_state');
if (saved) state = { ...state, ...JSON.parse(saved) };

function saveState() {
    localStorage.setItem('neon_royal_vanilla_state', JSON.stringify(state));
    render();
}

// --- UTILS ---
const formatMoney = (val) => `$${Math.ceil(val).toLocaleString()}`;

// --- RENDER ENGINE ---
function render() {
    const root = document.getElementById('app-root');
    const themeClass = SHOP_ITEMS.find(i => i.id === state.activeTheme)?.value || '';
    const accessory = SHOP_ITEMS.find(i => i.id === state.activeAccessory)?.value || 'N';

    root.className = `min-h-screen ${themeClass} text-white font-sans selection:bg-yellow-500 selection:text-black`;
    
    root.innerHTML = `
        <nav class="border-b border-white/5 bg-slate-950/80 backdrop-blur-3xl sticky top-0 z-50 px-8 h-20 flex items-center justify-between">
            <div class="flex items-center gap-4 cursor-pointer" onclick="navigate('LOBBY')">
                <div class="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center text-black font-black text-xl shadow-[0_0_20px_rgba(251,191,36,0.2)]">${accessory}</div>
                <span class="font-black uppercase tracking-tighter text-2xl hidden sm:block">Neon<span class="text-yellow-500">Royal</span></span>
            </div>
            <div class="flex items-center gap-6">
                <button onclick="navigate('REWARDS')" class="p-3 rounded-2xl bg-slate-900 text-yellow-500 transition-all hover:scale-110 relative">
                    <i class="fas fa-gift text-lg"></i>
                    ${Date.now() - state.lastRewardClaimed > 86400000 ? '<span class="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-950"></span>' : ''}
                </button>
                <div class="h-10 w-px bg-white/10"></div>
                <div class="flex flex-col items-end">
                    <span class="text-[10px] font-black uppercase text-slate-500 tracking-widest leading-none">Bankroll</span>
                    <span class="text-sm font-black text-yellow-500 tracking-tighter uppercase leading-tight tabular-nums">${formatMoney(state.balance)}</span>
                </div>
            </div>
        </nav>

        <main class="max-w-6xl mx-auto px-8 py-10 space-y-10">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div class="lg:col-span-2 space-y-8">
                    <!-- Betting Bar -->
                    <div class="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-slate-900/60 backdrop-blur-lg rounded-2xl neon-border">
                        <div class="flex flex-col">
                            <span class="text-slate-500 text-[10px] uppercase font-black tracking-widest">Active Stake</span>
                            <span class="text-3xl font-black text-yellow-500 gold-glow tabular-nums tracking-tighter">${formatMoney(state.bet)}</span>
                        </div>
                        <div class="flex flex-wrap justify-center gap-2">
                            ${[1, 5, 10, 50, 100, 500].map(val => `
                                <button onclick="setBet(${val})" class="px-4 py-1.5 rounded-lg text-xs font-black transition-all border ${state.bet === val ? 'bg-yellow-500 border-yellow-500 text-black shadow-lg shadow-yellow-500/20 scale-105' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}">${val}</button>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Main Game Area -->
                    <div id="game-container" class="bg-slate-900/40 border border-white/5 rounded-[3.5rem] p-10 min-h-[550px] flex items-center justify-center shadow-2xl relative overflow-hidden">
                        ${renderActiveGame()}
                    </div>
                </div>

                <div class="space-y-10">
                    <!-- Floor Manager -->
                    <div class="flex items-start gap-4 p-6 bg-slate-900/60 rounded-2xl border border-slate-700/50 relative overflow-hidden group">
                        <div class="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 shadow-lg group-hover:border-yellow-500/50 transition-colors">
                            <i class="fas fa-user-tie text-yellow-500 text-xl"></i>
                        </div>
                        <div class="flex flex-col gap-1 w-full">
                            <span class="text-[10px] uppercase font-black text-slate-500 tracking-widest">Floor Manager</span>
                            <p class="text-slate-200 text-sm italic font-medium leading-relaxed">"${state.lastEvent}"</p>
                        </div>
                    </div>

                    <!-- History -->
                    <div class="bg-slate-900/60 rounded-[2.5rem] p-8 border border-white/5 space-y-6 shadow-2xl">
                        <h4 class="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] flex items-center gap-2"><i class="fas fa-chart-line text-yellow-500"></i> Recent Action</h4>
                        <div class="space-y-4 max-h-[450px] overflow-y-auto pr-3 custom-scrollbar">
                            ${state.history.length === 0 ? '<p class="text-xs text-slate-600 italic">No action yet today...</p>' : 
                            state.history.map(h => `
                                <div class="flex justify-between items-center py-3 border-b border-white/5 last:border-0 group">
                                    <div class="flex flex-col">
                                        <span class="text-xs font-black text-white uppercase tracking-wider group-hover:text-yellow-500 transition-colors">${h.game}</span>
                                        <span class="text-[9px] text-slate-500 font-bold">${new Date(h.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                    <span class="text-xs font-black tabular-nums ${h.result === 'WIN' ? 'text-emerald-400' : 'text-rose-500'}">${h.result === 'WIN' ? '+' : '-'}${formatMoney(h.amount)}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    `;

    // Special initialization for D3 elements if Roulette is active
    if (state.activeGame === 'ROULETTE') initRouletteWheel();
}

function renderActiveGame() {
    switch (state.activeGame) {
        case 'LOBBY':
            return `
                <div class="grid grid-cols-2 md:grid-cols-3 gap-6 py-10 w-full max-w-4xl">
                    ${['SLOTS', 'BLACKJACK', 'ROULETTE', 'HI_LO', 'COIN_FLIP'].map(game => `
                        <button onclick="navigate('${game}')" class="bg-slate-900/40 p-10 rounded-[3rem] flex flex-col items-center gap-6 transition-all hover:scale-105 hover:bg-slate-900/60 border border-slate-800 shadow-2xl group">
                            <div class="w-20 h-20 rounded-3xl bg-slate-950 flex items-center justify-center text-4xl group-hover:text-yellow-500 transition-colors border border-slate-800 group-hover:border-yellow-500/30">
                                <i class="fas ${getGameIcon(game)}"></i>
                            </div>
                            <span class="font-black text-[10px] uppercase tracking-[0.3em] text-slate-500 group-hover:text-white">${game.replace('_', ' ')}</span>
                        </button>
                    `).join('')}
                </div>
            `;
        case 'SLOTS':
            return `
                <div class="flex flex-col items-center gap-10">
                    <button onclick="navigate('LOBBY')" class="absolute top-8 left-10 text-slate-500 hover:text-white font-black text-xs uppercase tracking-widest flex items-center gap-2"><i class="fas fa-arrow-left"></i> Exit</button>
                    <div id="slots-reel-container" class="flex gap-4 p-6 bg-black/40 rounded-[2rem] border-4 border-slate-800 shadow-2xl">
                        <div class="reel w-24 h-36 md:w-32 md:h-48 bg-slate-900 rounded-2xl flex items-center justify-center text-5xl">🎰</div>
                        <div class="reel w-24 h-36 md:w-32 md:h-48 bg-slate-900 rounded-2xl flex items-center justify-center text-5xl">🎰</div>
                        <div class="reel w-24 h-36 md:w-32 md:h-48 bg-slate-900 rounded-2xl flex items-center justify-center text-5xl">🎰</div>
                    </div>
                    <button onclick="playSlots()" id="slots-btn" class="px-16 py-5 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full font-black text-black text-2xl uppercase tracking-widest transition-all hover:scale-110 shadow-2xl shadow-yellow-500/20">Spin</button>
                </div>
            `;
        case 'BLACKJACK':
            return `
                <div class="flex flex-col items-center gap-8 w-full">
                    <button onclick="navigate('LOBBY')" class="absolute top-8 left-10 text-slate-500 hover:text-white font-black text-xs uppercase tracking-widest flex items-center gap-2"><i class="fas fa-arrow-left"></i> Exit</button>
                    <div id="blackjack-game" class="w-full flex flex-col items-center gap-10">
                        <div class="flex flex-col items-center gap-4">
                            <span class="text-[10px] font-black uppercase text-slate-500">Dealer</span>
                            <div id="dealer-hand" class="flex gap-3 min-h-[144px]"></div>
                        </div>
                        <div id="bj-msg" class="text-xl font-black text-yellow-500 uppercase tracking-widest text-center">Place your bet and deal.</div>
                        <div class="flex flex-col items-center gap-4">
                            <div id="player-hand" class="flex gap-3 min-h-[144px]"></div>
                            <span class="text-[10px] font-black uppercase text-slate-500">You</span>
                        </div>
                        <div id="bj-controls" class="flex gap-4">
                            <button onclick="startBlackjack()" class="px-12 py-4 bg-yellow-500 text-black font-black rounded-full uppercase tracking-widest">Deal Cards</button>
                        </div>
                    </div>
                </div>
            `;
        case 'ROULETTE':
            return `
                <div class="flex flex-col items-center gap-8 w-full">
                    <button onclick="navigate('LOBBY')" class="absolute top-8 left-10 text-slate-500 hover:text-white font-black text-xs uppercase tracking-widest flex items-center gap-2"><i class="fas fa-arrow-left"></i> Exit</button>
                    <div class="relative">
                        <div class="absolute top-0 left-1/2 -translate-x-1/2 -mt-4 text-yellow-500 z-10 text-3xl animate-bounce"><i class="fas fa-caret-down"></i></div>
                        <svg id="roulette-svg" width="300" height="300" class="shadow-2xl rounded-full border-8 border-slate-900"></svg>
                    </div>
                    <div class="grid grid-cols-6 gap-1 md:grid-cols-10">
                        ${ROULETTE_NUMBERS.slice().sort((a,b)=>a-b).map(n => `
                            <button onclick="selectRoulette(${n})" id="r-num-${n}" class="w-10 py-2 text-[10px] font-black rounded-lg transition-all ${n === 0 ? 'bg-emerald-600' : 'bg-slate-800'} text-white">${n}</button>
                        `).join('')}
                    </div>
                    <button onclick="spinRoulette()" id="r-spin-btn" class="px-16 py-4 bg-indigo-600 text-white font-black rounded-full uppercase tracking-widest transition-all">Spin Wheel</button>
                </div>
            `;
        case 'REWARDS':
            return `
                <div class="w-full max-w-2xl py-8 space-y-10 animate-in fade-in slide-in-from-bottom-5">
                    <div class="flex justify-center p-1.5 bg-slate-900/80 rounded-2xl w-fit mx-auto border border-slate-800 shadow-2xl">
                        <button onclick="navigate('REWARDS')" class="px-8 py-2.5 rounded-xl text-xs font-black bg-yellow-500 text-black uppercase tracking-widest">Rewards</button>
                    </div>
                    <div class="bg-slate-900/40 p-10 rounded-[2.5rem] border border-slate-800 flex flex-col items-center gap-6 shadow-2xl text-center">
                        <i class="fas fa-vault text-6xl text-yellow-500"></i>
                        <h3 class="text-2xl font-black">Daily Allowance</h3>
                        <p class="text-slate-500 text-sm">Refresh your stack every 24 hours.</p>
                        <button onclick="claimReward()" class="w-full py-4 rounded-2xl font-black uppercase tracking-widest bg-yellow-500 text-black">Claim $100</button>
                    </div>
                </div>
            `;
        default: return `<div>Game coming soon...</div>`;
    }
}

// --- LOGIC ---
window.navigate = (game) => {
    state.activeGame = game;
    saveState();
};

window.setBet = (val) => {
    state.bet = val;
    saveState();
};

function getGameIcon(game) {
    const icons = { 'SLOTS': 'fa-gem', 'BLACKJACK': 'fa-suit-spades', 'ROULETTE': 'fa-circle-dot', 'HI_LO': 'fa-arrows-up-down', 'COIN_FLIP': 'fa-coins' };
    return icons[game] || 'fa-gamepad';
}

// --- SLOTS LOGIC ---
window.playSlots = () => {
    if (state.balance < state.bet) return;
    state.balance -= state.bet;
    state.lastEvent = "Spinning...";
    saveState();
    
    const reels = document.querySelectorAll('.reel');
    reels.forEach(r => r.classList.add('spin-animation'));
    
    setTimeout(() => {
        const results = [
            SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
            SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
            SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]
        ];
        
        reels.forEach((r, i) => {
            r.classList.remove('spin-animation');
            r.innerText = results[i];
        });

        let win = 0;
        if (results[0] === results[1] && results[1] === results[2]) win = state.bet * 10;
        else if (results[0] === results[1] || results[1] === results[2]) win = state.bet * 2;

        if (win > 0) {
            state.balance += win;
            state.lastEvent = `JACKPOT! Won ${formatMoney(win)}!`;
            state.history.unshift({ id: Date.now(), game: 'SLOTS', amount: win, result: 'WIN', timestamp: Date.now() });
        } else {
            state.lastEvent = "Better luck next spin.";
            state.history.unshift({ id: Date.now(), game: 'SLOTS', amount: state.bet, result: 'LOSS', timestamp: Date.now() });
        }
        saveState();
    }, 1500);
};

// --- ROULETTE LOGIC ---
let selectedRNum = null;
window.selectRoulette = (n) => {
    selectedRNum = n;
    document.querySelectorAll('[id^="r-num-"]').forEach(el => el.classList.replace('bg-yellow-500', 'bg-slate-800'));
    document.getElementById(`r-num-${n}`).classList.replace('bg-slate-800', 'bg-yellow-500');
};

function initRouletteWheel() {
    const svg = d3.select('#roulette-svg');
    const radius = 150;
    const g = svg.append('g').attr('transform', `translate(150,150)`).attr('id', 'wheel-group');
    const arc = d3.arc().innerRadius(radius * 0.6).outerRadius(radius);
    const pie = d3.pie().value(1).sort(null);

    const arcs = g.selectAll('.arc').data(pie(ROULETTE_NUMBERS)).enter().append('g');
    arcs.append('path').attr('d', arc).attr('fill', d => d.data === 0 ? '#10b981' : ([32, 19, 21, 25, 34, 27, 36, 30, 23, 5, 16, 1, 14, 9, 18, 7, 12, 3].includes(d.data) ? '#ef4444' : '#1e293b')).attr('stroke', '#334155');
    arcs.append('text').attr('transform', d => `translate(${arc.centroid(d)}) rotate(${(d.startAngle + d.endAngle) / 2 * (180 / Math.PI) + (d.startAngle + d.endAngle > Math.PI ? 90 : -90)})`).attr('dy', '0.35em').attr('text-anchor', 'middle').attr('fill', 'white').attr('font-size', '8px').attr('font-weight', '900').text(d => d.data);
    g.append('circle').attr('r', radius * 0.55).attr('fill', '#0f172a').attr('stroke', '#475569');
}

window.spinRoulette = () => {
    if (selectedRNum === null || state.balance < state.bet) return;
    state.balance -= state.bet;
    state.lastEvent = "No more bets!";
    saveState();

    const resultIdx = Math.floor(Math.random() * ROULETTE_NUMBERS.length);
    const winningNum = ROULETTE_NUMBERS[resultIdx];
    const rotation = 360 * 5 + (360 - (resultIdx * (360 / ROULETTE_NUMBERS.length)));

    d3.select('#wheel-group').transition().duration(4000).ease(d3.easeCubicOut).attr('transform', `translate(150,150) rotate(${rotation})`).on('end', () => {
        if (winningNum === selectedRNum) {
            const win = state.bet * 35;
            state.balance += win;
            state.lastEvent = `Number ${winningNum} hit! Won ${formatMoney(win)}!`;
            state.history.unshift({ id: Date.now(), game: 'ROULETTE', amount: win, result: 'WIN', timestamp: Date.now() });
        } else {
            state.lastEvent = `Ball landed on ${winningNum}. Hard luck.`;
            state.history.unshift({ id: Date.now(), game: 'ROULETTE', amount: state.bet, result: 'LOSS', timestamp: Date.now() });
        }
        saveState();
    });
};

// --- BLACKJACK LOGIC ---
let playerHand = [], dealerHand = [], deck = [];
function createCardEl(card, hidden = false) {
    if (hidden) return `<div class="w-16 h-24 md:w-24 md:h-36 bg-slate-900 border-2 border-slate-700 rounded-xl flex items-center justify-center"><i class="fas fa-crown opacity-10"></i></div>`;
    const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
    const suitIcon = card.suit === 'hearts' ? '♥' : card.suit === 'diamonds' ? '♦' : card.suit === 'clubs' ? '♣' : '♠';
    return `
        <div class="w-16 h-24 md:w-24 md:h-36 bg-white rounded-xl flex flex-col p-2 justify-between shadow-xl card-enter">
            <div class="text-xl font-black ${isRed ? 'text-rose-600' : 'text-slate-900'}">${card.value}</div>
            <div class="text-4xl self-center ${isRed ? 'text-rose-600' : 'text-slate-900'}">${suitIcon}</div>
            <div class="text-xl font-black self-end rotate-180 ${isRed ? 'text-rose-600' : 'text-slate-900'}">${card.value}</div>
        </div>
    `;
}

window.startBlackjack = () => {
    if (state.balance < state.bet) return;
    state.balance -= state.bet;
    deck = [];
    CARD_SUITS.forEach(s => CARD_VALUES.forEach(v => {
        let r = parseInt(v) || 10; if (v === 'A') r = 11;
        deck.push({ suit: s, value: v, rank: r });
    }));
    deck.sort(() => Math.random() - 0.5);
    playerHand = [deck.pop(), deck.pop()];
    dealerHand = [deck.pop(), deck.pop()];
    
    renderBJ();
    document.getElementById('bj-controls').innerHTML = `
        <button onclick="bjHit()" class="px-8 py-3 bg-white text-black font-black rounded-full uppercase">Hit</button>
        <button onclick="bjStand()" class="px-8 py-3 bg-slate-800 text-white font-black rounded-full uppercase">Stand</button>
    `;
    state.lastEvent = "Cards are on the table.";
    saveState();
};

function renderBJ(showAll = false) {
    document.getElementById('player-hand').innerHTML = playerHand.map(c => createCardEl(c)).join('');
    document.getElementById('dealer-hand').innerHTML = dealerHand.map((c, i) => createCardEl(c, !showAll && i === 1)).join('');
}

function calcScore(h) {
    let s = h.reduce((a, c) => a + c.rank, 0);
    let aces = h.filter(c => c.value === 'A').length;
    while (s > 21 && aces > 0) { s -= 10; aces--; }
    return s;
}

window.bjHit = () => {
    playerHand.push(deck.pop());
    renderBJ();
    if (calcScore(playerHand) > 21) endBJ('LOSS', "Bust! House takes it.");
};

window.bjStand = () => {
    while (calcScore(dealerHand) < 17) dealerHand.push(deck.pop());
    renderBJ(true);
    const p = calcScore(playerHand), d = calcScore(dealerHand);
    if (d > 21 || p > d) endBJ('WIN', "You take the hand!");
    else if (p < d) endBJ('LOSS', "Dealer wins.");
    else endBJ('PUSH', "Stand-off.");
};

function endBJ(res, msg) {
    if (res === 'WIN') state.balance += state.bet * 2;
    if (res === 'PUSH') state.balance += state.bet;
    state.lastEvent = msg;
    state.history.unshift({ id: Date.now(), game: 'BLACKJACK', amount: state.bet, result: res, timestamp: Date.now() });
    renderBJ(true);
    document.getElementById('bj-msg').innerText = msg;
    document.getElementById('bj-controls').innerHTML = `<button onclick="startBlackjack()" class="px-12 py-4 bg-yellow-500 text-black font-black rounded-full uppercase tracking-widest">Deal Hand</button>`;
    saveState();
}

// Initial render
render();
