
export enum GameType {
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

export interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  value: string;
  rank: number;
}

export interface ShopItem {
  id: string;
  name: string;
  price: number;
  type: 'THEME' | 'ACCESSORY';
  value: string; // The class name or the emoji
  icon: string;
}

export interface GameState {
  balance: number;
  bet: number;
  history: GameHistoryItem[];
  lastRewardClaimed?: number;
  lastFridayFortuneClaimed?: number;
  ownedItems: string[]; // List of item IDs
  activeTheme: string;  // Item ID
  activeAccessory: string; // Item ID
}

export interface GameHistoryItem {
  id: string;
  game: GameType;
  amount: number;
  result: 'WIN' | 'LOSS' | 'PUSH';
  timestamp: number;
}

export interface TimeContext {
  day: string;
  hour: number;
  isGoldenHour: boolean;
  isGraveyard: boolean;
  activeDailyBonus: string;
}
