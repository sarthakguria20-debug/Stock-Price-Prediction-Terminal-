import { useState, useMemo } from "react";
import { StockQuote, ChartDataPoint } from "../types";
import { calculateIndicators } from "../data/stocks";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Bar,
  ReferenceLine
} from "recharts";
import { Eye, EyeOff, Calendar, LineChart, TrendingUp } from "lucide-react";

interface TechnicalChartProps {
  stock: StockQuote;
}

export default function TechnicalChart({ stock }: TechnicalChartProps) {
  // Config states
  const [timeframe, setTimeframe] = useState<30 | 90 | 180>(90);
  const [showSMA20, setShowSMA20] = useState(false);
  const [showSMA50, setShowSMA50] = useState(false);
  const [showEMA20, setShowEMA20] = useState(false);
  const [showBB, setShowBB] = useState(false);
  const [showRSI, setShowRSI] = useState(false);

  // Compute indicators dynamically from historical arrays
  const enrichedData = useMemo(() => {
    const fullPoints = calculateIndicators(stock.historicalData);
    // Slice according to timeframe requested
    return fullPoints.slice(-timeframe);
  }, [stock.historicalData, timeframe]);

  const latestPoint = enrichedData[enrichedData.length - 1] || {};

  // Find min/max values to prevent charts from smashing into bounds
  const priceMinMax = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    enrichedData.forEach((d) => {
      const vals = [d.close, d.high, d.low];
      if (showSMA20 && d.sma20) vals.push(d.sma20);
      if (showSMA50 && d.sma50) vals.push(d.sma50);
      if (showEMA20 && d.ema20) vals.push(d.ema20);
      if (showBB && d.upperBB) vals.push(d.upperBB);
      if (showBB && d.lowerBB) vals.push(d.lowerBB);

      vals.forEach((v) => {
        if (v < min) min = v;
        if (v > max) max = v;
      });
    });
    const padding = (max - min) * 0.08 || 5;
    return {
      min: Math.max(0, Math.floor(min - padding)),
      max: Math.ceil(max + padding)
    };
  }, [enrichedData, showSMA20, showSMA50, showEMA20, showBB]);

  // Format Tooltip contents cleanly
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as ChartDataPoint;
      return (
        <div className="bg-[#0a0a0a] border border-white/10 p-3 rounded-lg shadow-xl font-mono text-xs text-left">
          <p className="text-white/40 font-semibold mb-1.5">{data.date}</p>
          <div className="space-y-1 text-[#e0e0e0]">
            <div className="flex justify-between gap-6">
              <span className="text-white/40">Close:</span>
              <span className="text-white font-bold">${data.close.toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-white/40">Open:</span>
              <span className="text-white/80">${data.open.toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-white/40">High:</span>
              <span className="text-emerald-500">${data.high.toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-white/40">Low:</span>
              <span className="text-rose-500">${data.low.toFixed(2)}</span>
            </div>
            
            {showSMA20 && data.sma20 && (
              <div className="flex justify-between gap-6 border-t border-white/5 pt-1 mt-1">
                <span className="text-amber-500 font-medium">SMA(20):</span>
                <span>${data.sma20.toFixed(2)}</span>
              </div>
            )}
            {showSMA50 && data.sma50 && (
              <div className="flex justify-between gap-6">
                <span className="text-indigo-400 font-medium">SMA(50):</span>
                <span>${data.sma50.toFixed(2)}</span>
              </div>
            )}
            {showEMA20 && data.ema20 && (
              <div className="flex justify-between gap-6">
                <span className="text-pink-400 font-medium">EMA(20):</span>
                <span>${data.ema20.toFixed(2)}</span>
              </div>
            )}
            {showBB && data.upperBB && (
              <div className="flex justify-between gap-6 border-t border-white/5 pt-1 mt-1">
                <span className="text-cyan-400 font-medium">BB Upper:</span>
                <span>${data.upperBB.toFixed(2)}</span>
              </div>
            )}
            {showBB && data.lowerBB && (
              <div className="flex justify-between gap-6">
                <span className="text-cyan-400 font-medium">BB Lower:</span>
                <span>${data.lowerBB.toFixed(2)}</span>
              </div>
            )}
            {showRSI && data.rsi && (
              <div className="flex justify-between gap-6 border-t border-white/5 pt-1 mt-1">
                <span className="text-purple-400 font-medium">RSI(14):</span>
                <span>{data.rsi.toFixed(1)}</span>
              </div>
            )}
            <div className="flex justify-between gap-6 border-t border-white/5 pt-1 mt-1 text-[10px]">
              <span className="text-white/30">Vol:</span>
              <span className="text-white/50">{data.volume.toLocaleString()}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-5 mb-5 flex flex-col" id="technical-panel">
      {/* Chart Control Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-display font-bold text-white tracking-tight uppercase">
              {stock.name}
            </h1>
            <span className="font-mono bg-[#141414] border border-white/10 font-semibold text-xs px-2.5 py-0.5 rounded text-gray-300">
              {stock.ticker}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-white/40">
            <span>Sector: <strong className="text-white/70">{stock.sector}</strong></span>
            <span>•</span>
            <span>Market Cap: <strong className="text-white/70">{stock.marketCap}</strong></span>
          </div>
        </div>

        {/* Timeframe Selectors */}
        <div className="flex items-center gap-1.5 self-start md:self-auto bg-white/5 p-1 rounded-lg border border-white/10">
          {([30, 90, 180] as const).map((days) => (
            <button
              key={days}
              onClick={() => setTimeframe(days)}
              className={`px-3 py-1 text-xs rounded-md font-semibold transition cursor-pointer ${
                timeframe === days
                  ? "bg-white text-black shadow-xs"
                  : "text-white/50 hover:text-white"
              }`}
              id={`btn-timeframe-${days}`}
            >
              <Calendar className="inline-block h-3.5 w-3.5 mr-1 align-text-top" />
              {days}D
            </button>
          ))}
        </div>
      </div>

      {/* Main Stock Composite Chart */}
      <div className="w-full h-[320px]" id="composed-price-chart">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={enrichedData}
            margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
          >
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              {showBB && (
                <linearGradient id="bbBandGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.05} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.01} />
                </linearGradient>
              )}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="rgba(255, 255, 255, 0.3)"
              fontSize={10}
              tickLine={false}
              dy={10}
            />
            <YAxis
              domain={[priceMinMax.min, priceMinMax.max]}
              stroke="rgba(255, 255, 255, 0.3)"
              fontSize={10}
              tickLine={false}
              dx={-5}
              orientation="left"
              tickFormatter={(v) => `$${v}`}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Volume Bar Overlay */}
            <Bar
              dataKey="volume"
              yAxisId="volume"
              fill="rgba(255, 255, 255, 0.15)"
              opacity={0.35}
              maxBarSize={50}
            />
            {/* Volume axis hidden */}
            <YAxis yAxisId="volume" hide />

            {/* Area under historical price line */}
            <Area
              type="monotone"
              dataKey="close"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#priceGradient)"
            />

            {/* Bollinger Bands Shading Channel */}
            {showBB && (
              <Area
                type="monotone"
                dataKey="upperBB"
                stroke="transparent"
                fill="url(#bbBandGradient)"
              />
            )}
            {showBB && (
              <Line
                type="monotone"
                dataKey="upperBB"
                stroke="#06b6d4"
                strokeWidth={1}
                strokeDasharray="4 4"
                dot={false}
              />
            )}
            {showBB && (
              <Line
                type="monotone"
                dataKey="lowerBB"
                stroke="#06b6d4"
                strokeWidth={1}
                strokeDasharray="4 4"
                dot={false}
              />
            )}

            {/* Indicator overlays */}
            {showSMA20 && (
              <Line
                type="monotone"
                dataKey="sma20"
                stroke="#f59e0b"
                strokeWidth={1.5}
                dot={false}
              />
            )}
            {showSMA50 && (
              <Line
                type="monotone"
                dataKey="sma50"
                stroke="#6366f1"
                strokeWidth={1.5}
                dot={false}
              />
            )}
            {showEMA20 && (
              <Line
                type="monotone"
                dataKey="ema20"
                stroke="#ec4899"
                strokeWidth={1.5}
                dot={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Auxiliary RSI Chart Pane */}
      {showRSI && (
        <div className="w-full h-[120px] mt-4 pt-4 border-t border-white/10" id="rsi-chart-pane">
          <div className="flex justify-between items-center mb-1 text-xs px-2">
            <span className="text-purple-400 font-semibold uppercase tracking-wider text-[10px]">Relative Strength Index (RSI 14)</span>
            <span className="font-mono text-white/40 text-[10px]">Latest: {latestPoint.rsi ? latestPoint.rsi.toFixed(1) : "N/A"}</span>
          </div>
          <ResponsiveContainer width="100%" height="90%">
            <ComposedChart data={enrichedData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
              <XAxis dataKey="date" hide />
              <YAxis domain={[0, 100]} stroke="rgba(255, 255, 255, 0.3)" fontSize={8} tickCount={3} />
              
              {/* Overbought line at 70 */}
              <ReferenceLine y={70} stroke="#f43f5e" strokeWidth={1} strokeDasharray="3 3" label={{ value: 'Overbought', position: 'insideRight', fill: '#f43f5e', fontSize: 8 }} />
              {/* Oversold line at 30 */}
              <ReferenceLine y={30} stroke="#10b981" strokeWidth={1} strokeDasharray="3 3" label={{ value: 'Oversold', position: 'insideRight', fill: '#10b981', fontSize: 8 }} />
              
              <Line type="monotone" dataKey="rsi" stroke="#a855f7" strokeWidth={1.5} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Quantitative Indicators Toolbar Controls */}
      <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-white/10 justify-start">
        <span className="text-xs text-white/50 font-medium mr-2 flex items-center gap-1">
          <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
          Technical Overlays:
        </span>

        {/* SMA 20 */}
        <button
          onClick={() => setShowSMA20(!showSMA20)}
          className={`px-3 py-1.5 text-xs font-mono rounded-lg border transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
            showSMA20
              ? "bg-[#fab005]/10 border-amber-500/30 text-amber-500 font-semibold"
              : "bg-white/5 border-white/5 text-white/40 hover:text-white hover:bg-white/12"
          }`}
          id="btn-toggle-sma20"
        >
          {showSMA20 ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          SMA 20
        </button>

        {/* SMA 50 */}
        <button
          onClick={() => setShowSMA50(!showSMA50)}
          className={`px-3 py-1.5 text-xs font-mono rounded-lg border transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
            showSMA50
              ? "bg-[#4e73df]/10 border-indigo-500/30 text-indigo-500 font-semibold"
              : "bg-white/5 border-white/5 text-white/40 hover:text-white hover:bg-white/12"
          }`}
          id="btn-toggle-sma50"
        >
          {showSMA50 ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          SMA 50
        </button>

        {/* EMA 20 */}
        <button
          onClick={() => setShowEMA20(!showEMA20)}
          className={`px-3 py-1.5 text-xs font-mono rounded-lg border transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
            showEMA20
              ? "bg-pink-500/10 border-pink-505/30 text-pink-400 font-semibold"
              : "bg-white/5 border-white/5 text-white/40 hover:text-white hover:bg-white/12"
          }`}
          id="btn-toggle-ema20"
        >
          {showEMA20 ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          EMA 20
        </button>

        {/* Bollinger Bands */}
        <button
          onClick={() => setShowBB(!showBB)}
          className={`px-3 py-1.5 text-xs font-mono rounded-lg border transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
            showBB
              ? "bg-cyan-500/10 border-cyan-505/30 text-cyan-400 font-semibold"
              : "bg-white/5 border-white/5 text-white/40 hover:text-white hover:bg-white/12"
          }`}
          id="btn-toggle-bb"
        >
          {showBB ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          Bollinger Bands
        </button>

        {/* RSI 14 (Aux Row) */}
        <button
          onClick={() => setShowRSI(!showRSI)}
          className={`px-3 py-1.5 text-xs font-mono rounded-lg border transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
            showRSI
              ? "bg-purple-500/10 border-purple-505/30 text-purple-400 font-semibold"
              : "bg-white/5 border-white/5 text-white/40 hover:text-white hover:bg-white/12"
          }`}
          id="btn-toggle-rsi"
        >
          {showRSI ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          RSI Oscillator
        </button>
      </div>
    </div>
  );
}
