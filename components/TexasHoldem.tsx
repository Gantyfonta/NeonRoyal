
import React, { useState, useCallback } from 'react';
import { CARD_SUITS, CARD_VALUES } from '../constants';
import { Card } from '../types';

interface TexasHoldemProps {
  balance: number;
  bet: number;
  onResult: (amount: number, resultText: string) => void;
}

const TexasHoldem: React.FC<TexasHoldemProps> = ({ balance, bet, onResult }) => {
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [community, setCommunity] = useState<Card[]>([]);
  const [gameState, setGameState] = useState<'IDLE' | 'HOLE' | 'FLOP' | 'TURN' | 'RIVER' | 'SHOWDOWN'>('IDLE');

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

  const deal = () => {
    if (balance < bet) return;
    onResult(-bet, "Dealing Texas Hold'em hands...");
    setPlayerHand([drawCard(), drawCard()]);
    setDealerHand([drawCard(), drawCard()]);
    setCommunity([]);
    setGameState('HOLE');
  };

  const nextStage = () => {
    if (gameState === 'HOLE') {
      setCommunity([drawCard(), drawCard(), drawCard()]);
      setGameState('FLOP');
    } else if (gameState === 'FLOP') {
      setCommunity(prev => [...prev, drawCard()]);
      setGameState('TURN');
    } else if (gameState === 'TURN') {
      setCommunity(prev => [...prev, drawCard()]);
      setGameState('RIVER');
    } else if (gameState === 'RIVER') {
      evaluateWinner();
    }
  };

  const evaluateWinner = () => {
    setGameState('SHOWDOWN');
    // Simplified poker logic: Highest card in full hand wins
    const playerFull = [...playerHand, ...community];
    const dealerFull = [...dealerHand, ...community];
    const playerMax = Math.max(...playerFull.map(c => c.rank));
    const dealerMax = Math.max(...dealerFull.map(c => c.rank));

    if (playerMax > dealerMax) {
      const win = Math.ceil(bet * 3);
      onResult(win, `Player wins with High Card ${playerMax}! Payout: $${win}`);
    } else if (playerMax < dealerMax) {
      onResult(0, `Dealer wins with High Card ${dealerMax}. Better luck next time.`);
    } else {
      onResult(bet, "It's a push! Tie on high card.");
    }
  };

  const renderCard = (card: Card, hidden = false) => {
    const color = (card.suit === 'hearts' || card.suit === 'diamonds') ? 'text-red-500' : 'text-slate-900';
    if (hidden) return <div className="w-12 h-18 md:w-16 md:h-24 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center shadow-lg"><i className="fas fa-crown text-slate-700 opacity-20"></i></div>;
    return (
      <div className="w-12 h-18 md:w-16 md:h-24 bg-white rounded-lg flex flex-col p-1 justify-between shadow-md relative animate-in zoom-in duration-300">
        <div className={`text-xs font-bold leading-none ${color}`}>{card.value}</div>
        <div className={`text-xl self-center ${color}`}>
          {card.suit === 'hearts' ? '♥' : card.suit === 'diamonds' ? '♦' : card.suit === 'clubs' ? '♣' : '♠'}
        </div>
        <div className={`text-xs font-bold leading-none self-end rotate-180 ${color}`}>{card.value}</div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-8 py-4 w-full">
      <div className="flex flex-col items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Dealer's Hand</span>
        <div className="flex gap-2">
          {dealerHand.length > 0 ? dealerHand.map((c, i) => renderCard(c, gameState !== 'SHOWDOWN')) : <div className="flex gap-2"><div className="w-16 h-24 bg-slate-800/20 border border-dashed border-slate-700 rounded-lg"></div><div className="w-16 h-24 bg-slate-800/20 border border-dashed border-slate-700 rounded-lg"></div></div>}
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">The Board</span>
        <div className="flex gap-2 h-24">
          {community.map(c => renderCard(c))}
          {Array.from({ length: 5 - community.length }).map((_, i) => (
            <div key={i} className="w-12 h-18 md:w-16 md:h-24 bg-slate-800/10 border border-dashed border-slate-700/50 rounded-lg"></div>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="flex gap-2">
          {playerHand.length > 0 ? playerHand.map(c => renderCard(c)) : <div className="flex gap-2"><div className="w-16 h-24 bg-slate-800/20 border border-dashed border-slate-700 rounded-lg"></div><div className="w-16 h-24 bg-slate-800/20 border border-dashed border-slate-700 rounded-lg"></div></div>}
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Your Hand</span>
      </div>

      <div className="flex gap-4">
        {gameState === 'IDLE' || gameState === 'SHOWDOWN' ? (
          <button onClick={deal} disabled={balance < bet} className="px-10 py-3 bg-accent text-black font-black rounded-full uppercase tracking-widest shadow-lg shadow-yellow-500/20 hover:scale-105 active:scale-95 transition-all">
            Deal
          </button>
        ) : (
          <button onClick={nextStage} className="px-10 py-3 bg-slate-800 text-white font-black rounded-full uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all border border-slate-700">
            {gameState === 'RIVER' ? 'Showdown' : 'Next Card'}
          </button>
        )}
      </div>
    </div>
  );
};

export default TexasHoldem;
