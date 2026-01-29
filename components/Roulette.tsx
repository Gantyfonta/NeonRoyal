
import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { ROULETTE_NUMBERS } from '../constants';

interface RouletteProps {
  balance: number;
  bet: number;
  onResult: (amount: number, resultText: string) => void;
}

const Roulette: React.FC<RouletteProps> = ({ balance, bet, onResult }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [spinning, setSpinning] = useState(false);
  const [selectedNum, setSelectedNum] = useState<number | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const width = 300;
    const height = 300;
    const radius = Math.min(width, height) / 2;
    const svg = d3.select(svgRef.current).attr('viewBox', `0 0 ${width} ${height}`);
    svg.selectAll('*').remove();

    const g = svg.append('g').attr('transform', `translate(${width/2},${height/2})`).attr('class', 'wheel-group');

    const arc = d3.arc<any>().innerRadius(radius * 0.6).outerRadius(radius);
    const pie = d3.pie<number>().value(1).sort(null);

    const arcs = g.selectAll('.arc')
      .data(pie(ROULETTE_NUMBERS))
      .enter()
      .append('g')
      .attr('class', 'arc');

    arcs.append('path')
      .attr('d', arc)
      .attr('fill', d => {
        const val = d.data;
        if (val === 0) return '#10b981'; // Green
        const redNums = [32, 19, 21, 25, 34, 27, 36, 30, 23, 5, 16, 1, 14, 9, 18, 7, 12, 3];
        return redNums.includes(val) ? '#ef4444' : '#1e293b';
      })
      .attr('stroke', '#334155')
      .attr('stroke-width', '1');

    arcs.append('text')
      .attr('transform', d => `translate(${arc.centroid(d)}) rotate(${(d.startAngle + d.endAngle) / 2 * (180 / Math.PI) + (d.startAngle + d.endAngle > Math.PI ? 90 : -90)})`)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('font-size', '8px')
      .attr('font-weight', 'bold')
      .text(d => d.data);

    // Center decor
    g.append('circle').attr('r', radius * 0.55).attr('fill', '#0f172a').attr('stroke', '#475569').attr('stroke-width', '4');
    g.append('text').attr('text-anchor', 'middle').attr('dy', '0.35em').attr('fill', '#fbbf24').attr('font-size', '14px').attr('font-weight', 'bold').text('NEON ROYAL');
  }, []);

  const spin = () => {
    if (selectedNum === null || balance < bet || spinning) return;

    setSpinning(true);
    onResult(-bet, `Placing $${bet} on number ${selectedNum}.`);

    const resultIndex = Math.floor(Math.random() * ROULETTE_NUMBERS.length);
    const winningNumber = ROULETTE_NUMBERS[resultIndex];
    
    // Animate rotation
    const totalRotation = 360 * 5 + (360 - (resultIndex * (360 / ROULETTE_NUMBERS.length)));
    d3.select('.wheel-group')
      .transition()
      .duration(4000)
      .ease(d3.easeCubicOut)
      .attr('transform', `translate(150,150) rotate(${totalRotation})`)
      .on('end', () => {
        setSpinning(false);
        if (winningNumber === selectedNum) {
          const winAmount = bet * 35;
          onResult(winAmount, `UNBELIEVABLE! Number ${winningNumber} hit! You won $${winAmount}!`);
        } else {
          onResult(0, `The ball landed on ${winningNumber}. Hard luck.`);
        }
      });
  };

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-4 text-yellow-500 z-10 text-2xl">
          <i className="fas fa-caret-down"></i>
        </div>
        <svg ref={svgRef} className="w-64 h-64 md:w-80 md:h-80 shadow-2xl rounded-full border-4 border-slate-800"></svg>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-md">
        <span className="text-xs font-black uppercase text-center tracking-widest text-slate-500">Select your lucky number</span>
        <div className="grid grid-cols-6 gap-1 md:grid-cols-10">
          {ROULETTE_NUMBERS.slice().sort((a,b) => a-b).map(num => (
            <button
              key={num}
              onClick={() => setSelectedNum(num)}
              disabled={spinning}
              className={`w-full py-2 text-xs font-bold rounded transition-colors ${
                selectedNum === num 
                  ? 'bg-yellow-500 text-black' 
                  : num === 0 ? 'bg-green-700 text-white hover:bg-green-600' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={spin}
        disabled={spinning || selectedNum === null || balance < bet}
        className="px-12 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-full transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
      >
        {spinning ? 'Rien ne va plus...' : 'Spin Wheel'}
      </button>
    </div>
  );
};

export default Roulette;
