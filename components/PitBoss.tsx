
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { GameHistoryItem } from '../types';

interface PitBossProps {
  balance: number;
  history: GameHistoryItem[];
}

const PitBoss: React.FC<PitBossProps> = ({ balance, history }) => {
  const [advice, setAdvice] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const getAdvice = async () => {
    setLoading(true);
    try {
      // Fix: Initialize GoogleGenAI with named parameter apiKey using process.env.API_KEY directly
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const recentAction = history.slice(0, 5).map(h => `${h.game}: ${h.result} ($${h.amount})`).join(', ');
      
      const prompt = `You are the sophisticated Pit Boss at the "Neon Royal Casino". 
      Current Player Balance: $${balance}. 
      Recent History: ${recentAction || "Just arrived at the floor"}.
      
      Tasks:
      1. Provide a witty, 1-2 sentence luck reading using high-class casino lingo.
      2. If balance is low, be encouraging. If high, be respectful but keep them playing.
      3. Use terminology like 'the house', 'whale', 'hot hand', 'cold deck', 'pocket rockets'.`;

      // Fix: Use gemini-3-flash-preview for basic text tasks
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      // Fix: Access response.text as a property, not a method
      setAdvice(response.text?.trim() || "The cards are silent for now, whale. Keep the action moving.");
    } catch (err) {
      console.error(err);
      setAdvice("The house always has its secrets. Come back after the next shuffle.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/50 rounded-3xl p-6 border border-accent/20 relative overflow-hidden group shadow-2xl backdrop-blur-md">
      <div className="absolute -right-6 -top-6 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
        <i className="fas fa-user-tie text-9xl text-accent"></i>
      </div>
      
      <div className="flex flex-col gap-4 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accent pulse-accent"></div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">Floor Manager Insight</h4>
          </div>
          <i className="fas fa-microchip text-[10px] text-slate-700"></i>
        </div>

        <div className="min-h-[70px] flex items-center bg-black/20 rounded-xl p-3 border border-white/5">
          {advice ? (
            <p className="text-sm text-slate-200 italic leading-relaxed animate-in fade-in slide-in-from-right-2 duration-500">
              "{advice}"
            </p>
          ) : (
            <p className="text-xs text-slate-500 italic">
              Want to know how the floor is leaning? Ask for a reading.
            </p>
          )}
        </div>

        <button 
          onClick={getAdvice}
          disabled={loading}
          className="w-full py-3 bg-accent text-black text-[10px] font-black uppercase tracking-widest rounded-xl transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-yellow-500/10"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <i className="fas fa-dna animate-spin"></i> Reading the Deck...
            </span>
          ) : (
            "Consult the Pit Boss"
          )}
        </button>
      </div>
    </div>
  );
};

export default PitBoss;
