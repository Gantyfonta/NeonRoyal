
import React, { useState, useCallback } from 'react';
import { CARD_SUITS, CARD_VALUES } from '../constants';
import { Card } from '../types';

interface HiLoProps {
  balance: number;
  bet: number;
  onResult: (amount: number, resultText: string) => void;
}

const HiLo: React.FC<HiLoProps> = ({ balance, bet, onResult }) => {
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [nextCard, setNextCard] = useState<Card | null>(null);
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING'>('IDLE');

  const drawCard = useCallback(() => {
    const suit = CARD_SUITS[Math.floor(Math.random() * CARD_SUITS.length)];
    const val = CARD_VALUES[Math.floor(Math.random() * CARD_VALUES.length)];
    let rank = parseInt(val);
    if (val === 'A') rank = 14;
    else if (val === 'K') rank = 13;
    else if (val === 'Q') rank = 12;
    else if (val === 'J') rank = 11;
    return { suit, value: val, rank } as Card;
  }, []);

  const startGame = () => {
    if (balance < bet) return;
    onResult(-bet, "Staking on the next card...");
    setCurrentCard(drawCard());
    setNextCard(null);
    setGameState('PLAYING');
  };

  const makeGuess = (guess: 'HI' | 'LO') => {
    const next = drawCard();
    setNextCard(next);
    setGameState('IDLE');

    const isWin = guess === 'HI' ? next.rank >= currentCard!.rank : next.rank <= currentCard!.rank;

    if (isWin) {
      const winAmount = Math.floor(bet * 1.85);
      onResult(winAmount, `Correct! The ${next.value} of ${next.suit} was ${guess}. You won $${winAmount}!`);
    } else {
      onResult(0, `Wrong! The ${next.value} of ${next.suit} wasn't ${guess}.`);
    }
  };

  const renderCard = (card: Card | null, label: string) => (
    <div className="flex flex-col items-center gap-2">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</span>
      <div className={`w-20 h-32 md:w-28 md:h-40 ${card ? 'bg-white' : 'bg-slate-800 border-2 border-dashed border-slate-700'} rounded-xl flex flex-col p-3 justify-between shadow-xl relative transition-all duration-500`}>
        {card && (
          <>
            <div className={`text-xl font-bold leading-none ${card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-500' : 'text-slate-900'}`}>{card.value}</div>
            <div className={`text-4xl self-center ${card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-500' : 'text-slate-900'}`}>
              {card.suit === 'hearts' ? '♥' : card.suit === 'diamonds' ? '♦' : card.suit === 'clubs' ? '♣' : '♠'}
            </div>
            <div className={`text-xl font-bold leading-none self-end rotate-180 ${card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-500' : 'text-slate-900'}`}>{card.value}</div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-10">
      <div className="flex gap-8 items-center">
        {renderCard(currentCard, "Base Card")}
        <div className="text-slate-700 text-2xl font-black">VS</div>
        {renderCard(nextCard, "Next Card")}
      </div>

      <div className="flex gap-4">
        {gameState === 'IDLE' ? (
          <button onClick={startGame} disabled={balance < bet} className="px-10 py-4 bg-yellow-500 text-black font-black rounded-full uppercase tracking-widest shadow-lg shadow-yellow-500/20 hover:scale-105 active:scale-95 transition-all">
            Draw Card
          </button>
        ) : (
          <>
            <button onClick={() => makeGuess('HI')} className="px-8 py-4 bg-emerald-500 text-white font-black rounded-full uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
              <i className="fas fa-arrow-up"></i> Higher
            </button>
            <button onClick={() => makeGuess('LO')} className="px-8 py-4 bg-rose-500 text-white font-black rounded-full uppercase tracking-widest shadow-lg shadow-rose-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
              <i className="fas fa-arrow-down"></i> Lower
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default HiLo;
