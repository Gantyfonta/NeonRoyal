
import React, { useState, useEffect, useCallback } from 'react';
import { CARD_SUITS, CARD_VALUES } from '../constants';
import { Card } from '../types';

interface BlackjackProps {
  balance: number;
  bet: number;
  onResult: (amount: number, resultText: string) => void;
  bonusPayout?: number; // e.g. 2.5 instead of 2
}

const Blackjack: React.FC<BlackjackProps> = ({ balance, bet, onResult, bonusPayout = 2 }) => {
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [gameStatus, setGameStatus] = useState<'IDLE' | 'PLAYING' | 'OVER'>('IDLE');
  const [msg, setMsg] = useState('');

  const createDeck = useCallback(() => {
    const newDeck: Card[] = [];
    CARD_SUITS.forEach(suit => {
      CARD_VALUES.forEach(val => {
        let rank = parseInt(val);
        if (val === 'A') rank = 11;
        else if (['J', 'Q', 'K', '10'].includes(val)) rank = 10;
        newDeck.push({ suit, value: val, rank });
      });
    });
    return newDeck.sort(() => Math.random() - 0.5);
  }, []);

  const calculateScore = (hand: Card[]) => {
    let score = hand.reduce((acc, card) => acc + card.rank, 0);
    let aces = hand.filter(c => c.value === 'A').length;
    while (score > 21 && aces > 0) {
      score -= 10;
      aces--;
    }
    return score;
  };

  const startNewGame = () => {
    if (balance < bet) return;
    const newDeck = createDeck();
    const p1 = newDeck.pop()!;
    const d1 = newDeck.pop()!;
    const p2 = newDeck.pop()!;
    const d2 = newDeck.pop()!;

    setPlayerHand([p1, p2]);
    setDealerHand([d1, d2]);
    setDeck(newDeck);
    setGameStatus('PLAYING');
    setMsg('Hit or Stand?');
    onResult(-bet, "New deal at Blackjack.");
  };

  const hit = () => {
    const newDeck = [...deck];
    const newCard = newDeck.pop()!;
    const newHand = [...playerHand, newCard];
    setPlayerHand(newHand);
    setDeck(newDeck);

    if (calculateScore(newHand) > 21) {
      endGame('LOSS', 'Bust! Dealer takes the pot.');
    }
  };

  const stand = async () => {
    let currentDealerHand = [...dealerHand];
    let currentDeck = [...deck];
    while (calculateScore(currentDealerHand) < 17) {
      const nextCard = currentDeck.pop()!;
      currentDealerHand.push(nextCard);
    }
    setDealerHand(currentDealerHand);
    const pScore = calculateScore(playerHand);
    const dScore = calculateScore(currentDealerHand);

    if (dScore > 21) endGame('WIN', 'Dealer busts! You win.');
    else if (pScore > dScore) endGame('WIN', `Win! ${pScore} beats ${dScore}.`);
    else if (pScore < dScore) endGame('LOSS', `Dealer wins with ${dScore}.`);
    else endGame('PUSH', "Draw. Bet returned.");
  };

  const endGame = (result: 'WIN' | 'LOSS' | 'PUSH', text: string) => {
    setGameStatus('OVER');
    setMsg(text);
    if (result === 'WIN') onResult(Math.floor(bet * bonusPayout), text);
    else if (result === 'PUSH') onResult(bet, text);
    else onResult(0, text);
  };

  const renderCard = (card: Card, hidden = false) => {
    const color = (card.suit === 'hearts' || card.suit === 'diamonds') ? 'text-red-500' : 'text-slate-900';
    if (hidden) return <div className="w-16 h-24 md:w-24 md:h-36 bg-blue-900 rounded-lg border-2 border-white/20 flex items-center justify-center shadow-lg"></div>;
    return (
      <div className="w-16 h-24 md:w-24 md:h-36 bg-white rounded-lg flex flex-col p-2 justify-between shadow-xl relative animate-in zoom-in duration-300">
        <div className={`text-xl font-bold leading-none ${color}`}>{card.value}</div>
        <div className={`text-4xl self-center ${color}`}>
          {card.suit === 'hearts' ? '♥' : card.suit === 'diamonds' ? '♦' : card.suit === 'clubs' ? '♣' : '♠'}
        </div>
        <div className={`text-xl font-bold leading-none self-end rotate-180 ${color}`}>{card.value}</div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-8 py-4">
      {bonusPayout > 2 && (
        <div className="bg-blue-500/10 border border-blue-500/30 text-blue-500 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
          Tuesday Bonus: {bonusPayout}:1 Payouts
        </div>
      )}
      <div className="flex flex-col items-center gap-4">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Dealer ({gameStatus === 'PLAYING' ? '?' : calculateScore(dealerHand)})</span>
        <div className="flex gap-2">{dealerHand.map((card, i) => renderCard(card, gameStatus === 'PLAYING' && i === 1))}</div>
      </div>
      <div className="h-8 text-xl font-bold text-yellow-500">{msg}</div>
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-2">{playerHand.map(card => renderCard(card))}</div>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">You ({calculateScore(playerHand)})</span>
      </div>
      <div className="flex gap-4">
        {gameStatus === 'PLAYING' ? (
          <><button onClick={hit} className="px-8 py-3 bg-white text-black font-bold rounded-full">Hit</button><button onClick={stand} className="px-8 py-3 bg-slate-800 text-white font-bold rounded-full border border-slate-600">Stand</button></>
        ) : (
          <button onClick={startNewGame} disabled={balance < bet} className="px-8 py-3 bg-yellow-500 text-black font-bold rounded-full">New Game</button>
        )}
      </div>
    </div>
  );
};

export default Blackjack;
