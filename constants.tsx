
import { ShopItem } from './types';

export const SLOT_SYMBOLS = [
  { char: '🍒', multiplier: 2 },
  { char: '🍋', multiplier: 5 },
  { char: '🍇', multiplier: 10 },
  { char: '🔔', multiplier: 20 },
  { char: '💎', multiplier: 50 },
  { char: '7️⃣', multiplier: 100 }
];

export const ROULETTE_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

export const CARD_SUITS = ['hearts', 'diamonds', 'clubs', 'spades'] as const;
export const CARD_VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const INITIAL_BALANCE = 1000;

export const SHOP_ITEMS: ShopItem[] = [
  // Themes
  { id: 'theme_default', name: 'Royal Gold', price: 0, type: 'THEME', value: '', icon: 'fa-crown' },
  { id: 'theme_pink', name: 'Cyber Pink', price: 2500, type: 'THEME', value: 'theme-pink', icon: 'fa-ghost' },
  { id: 'theme_emerald', name: 'Deep Emerald', price: 5000, type: 'THEME', value: 'theme-emerald', icon: 'fa-gem' },
  { id: 'theme_solar', name: 'Solar Flare', price: 10000, type: 'THEME', value: 'theme-solar', icon: 'fa-sun' },
  // Accessories
  { id: 'acc_crown', name: 'King\'s Crown', price: 1000, type: 'ACCESSORY', value: '👑', icon: 'fa-chess-king' },
  { id: 'acc_dice', name: 'Lucky Dice', price: 500, type: 'ACCESSORY', value: '🎲', icon: 'fa-dice' },
  { id: 'acc_clover', name: 'Four Leaf Clover', price: 750, type: 'ACCESSORY', value: '🍀', icon: 'fa-leaf' },
  { id: 'acc_fire', name: 'High Roller', price: 2000, type: 'ACCESSORY', value: '🔥', icon: 'fa-fire' },
];
