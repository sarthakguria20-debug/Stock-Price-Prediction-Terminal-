import { useState, useMemo } from "react";
import { MonteCarloResult } from "../types";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from "recharts";
import { Eye, EyeOff, BarChart2, TrendingUp, ShieldAlert, CheckCircle2 } from "lucide-react";

interface MonteCarloChartProps {
  ticker: string;
  simResult: MonteCarloResult;
}

export default function MonteCarloChart({ ticker, simResult }: MonteCarloChartProps) {
  const [showIndividualPaths, setShowIndividualPaths] = useState(true);

  const { medianPercentiles, paths, summary } = simResult;

  // Format Recharts data model. Recharts wants a single array representing each step.
  // We combine the date, percentiles, and individual paths.
  const chartData = useMemo(() => {
    return medianPercentiles.map((pt, dayIdx) => {
      const dataItem: any = {
        date: pt.date,
        day: dayIdx,
        p50: pt.p50,
        p10: pt.p10,
        p90: pt.p90,
      };

      // Add prices of the first 10 paths for random walk line overlay
      if (showIndividualPaths) {
        for (let pathIdx = 0; pathIdx < Math.min(10, paths.length); pathIdx++) {
          dataItem[`path_${pathIdx}`] = paths[pathIdx].prices[dayIdx];
        }
      }

      return dataItem;
    });
  }, [medianPercentiles, paths, showIndividualPaths]);

  // Find min/max boundaries
  const domainMinMax = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    medianPercentiles.forEach((pt) => {
      if (pt.p10 < min) min = pt.p10;
      if (pt.p90 > max) max = pt.p90;
    });
    const padding = (max - min) * 0.05 || 5;
    return {
      min: Math.max(0, Math.floor(min - padding)),
      max: Math.ceil(max + padding)
    };
  }, [medianPercentiles]);

  const isUpExpected = summary.finalMedian >= summary.startingPrice;
  const expectedChangePct = ((summary.finalMedian - summary.startingPrice) / summary.startingPrice) * 100;

  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-5 mb-5 flex flex-col" id="montecarlo-panel">
      
      {/* Title block with metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-sm font-display font-medium text-white flex items-center gap-2 uppercase tracking-wide">
            <BarChart2 className="h-4 w-4 text-emerald-500" />
            Monte Carlo Mathematical Projections
          </h2>
          <p className="text-xs text-white/40 mt-0.5 text-left">
            Statistical projection distributions over {medianPercentiles.length - 1} trading days.
          </p>
        </div>

        {/* Path toggle */}
        <button
          onClick={() => setShowIndividualPaths(!showIndividualPaths)}
          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold font-mono transition-all duration-150 flex items-center gap-1.5 self-start md:self-auto cursor-pointer ${
            showIndividualPaths
              ? "bg-white text-black border-white"
              : "bg-white/5 border-white/5 text-white/50 hover:bg-white/10 hover:text-white"
          }`}
          id="btn-toggle-paths"
        >
          {showIndividualPaths ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          Show Indiv. Walk Paths
        </button>
      </div>

      {/* Quantitative Summary Bento Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-[#141414] border border-white/5 mb-5 text-left">
        
        {/* Median Expected Target */}
        <div className="space-y-1">
          <span className="text-[9px] uppercase font-bold tracking-widest text-white/40 font-sans block">Median Target (P50)</span>
          <span className="text-lg font-mono font-bold text-white block">
            ${summary.finalMedian.toFixed(2)}
          </span>
          <span className={`text-xs ml-0.5 font-mono font-bold inline-block ${isUpExpected ? "text-emerald-500" : "text-rose-500"}`}>
            {isUpExpected ? "+" : ""}{expectedChangePct.toFixed(2)}%
          </span>
        </div>

        {/* Upside Probability */}
        <div className="space-y-1">
          <span className="text-[9px] uppercase font-bold tracking-widest text-white/40 font-sans block">Upside Probability</span>
          <span className="text-lg font-mono font-bold text-emerald-500 block">
            {(summary.upsideProbability * 100).toFixed(0)}%
          </span>
          <span className="text-[10px] font-medium text-white/30 block">
            Paths closing above start
          </span>
        </div>

        {/* Optimistic P90 */}
        <div className="space-y-1">
          <span className="text-[9px] uppercase font-bold tracking-widest text-white/40 font-sans block">Optimistic Cap (P90)</span>
          <span className="text-lg font-mono font-bold text-white/90 block">
            ${summary.finalP90.toFixed(2)}
          </span>
          <span className="text-[10px] font-medium text-white/35 block">
            10% chance of exceeding
          </span>
        </div>

        {/* Pessimistic P10 */}
        <div className="space-y-1">
          <span className="text-[9px] uppercase font-bold tracking-widest text-white/40 font-sans block">Pessimistic Floor (P10)</span>
          <span className="text-lg font-mono font-bold text-rose-500 block">
            ${summary.finalP10.toFixed(2)}
          </span>
          <span className="text-[10px] font-medium text-white/35 block">
            10% chance of dipping below
          </span>
        </div>

      </div>

      {/* Main Fan Chart */}
      <div className="w-full h-[280px]" id="monte-carlo-visual-chart">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
          >
            <defs>
              <linearGradient id="fanGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
            <XAxis dataKey="date" stroke="rgba(255, 255, 255, 0.3)" fontSize={9} tickLine={false} dy={5} />
            <YAxis
              domain={[domainMinMax.min, domainMinMax.max]}
              stroke="rgba(255, 255, 255, 0.3)"
              fontSize={9}
              tickLine={false}
              dx={-5}
              tickFormatter={(v) => `$${v}`}
            />
            
            <Tooltip
              contentStyle={{ backgroundColor: "#0a0a0a", borderColor: "rgba(255, 255, 255, 0.1)" }}
              itemStyle={{ fontSize: "11px", color: "#ffffff", fontFamily: "monospace" }}
              labelStyle={{ fontSize: "10px", color: "rgba(255, 255, 255, 0.4)", fontFamily: "monospace" }}
            />

            {/* Shaded area between p10 and p90 boundaries */}
            <Area
              type="monotone"
              dataKey="p90"
              stroke="transparent"
              fill="url(#fanGradient)"
            />
            
            {/* Shaded floor reference to make space empty */}
            {/* We can just render bounds lines */}
            <Line
              type="monotone"
              dataKey="p90"
              stroke="#06b6d4"
              strokeWidth={1}
              strokeDasharray="3 3"
              name="P90 Optimistic Limit"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="p10"
              stroke="#ef4444"
              strokeWidth={1}
              strokeDasharray="3 3"
              name="P10 Pessimistic Floor"
              dot={false}
            />

            {/* Individual Walk lines overlay */}
            {showIndividualPaths &&
              Array.from({ length: Math.min(10, paths.length) }).map((_, idx) => (
                <Line
                  key={idx}
                  type="monotone"
                  dataKey={`path_${idx}`}
                  stroke="#374151"
                  strokeWidth={0.8}
                  opacity={0.4}
                  dot={false}
                  activeDot={false}
                />
              ))}

            {/* Median target trajectory */}
            <Line
              type="monotone"
              dataKey="p50"
              stroke="#6366f1"
              strokeWidth={2}
              name="Median P50 Drift"
              dot={false}
            />

          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex items-start gap-2 bg-white/5 p-3 rounded-lg border border-white/10 text-left">
        <ShieldAlert className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
        <div id="stat-interpretation-text">
          <p className="text-xs font-semibold text-white/90 uppercase tracking-widest text-[9.5px]">Simulation Insights</p>
          <p className="text-[11px] text-white/55 mt-1 leading-relaxed">
            Based on {paths.length} independent Geometric Brownian Motion runs starting from <strong className="text-white">${summary.startingPrice.toFixed(2)}</strong>, 
            the mathematical expectation yields a 30-day projection centering at <strong className="text-white">${summary.finalMedian.toFixed(2)}</strong>. 
            There is a 90% theoretical probability that prices settle above the baseline safety margin of <strong className="text-rose-500">${summary.finalP10.toFixed(2)}</strong>.
          </p>
        </div>
      </div>

    </div>
  );
}
