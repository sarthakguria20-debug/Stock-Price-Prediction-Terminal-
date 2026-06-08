import { useState } from "react";
import { StockQuote, AIPrediction } from "../types";
import { Brain, Star, Clock, AlertTriangle, RefreshCw, Zap, TrendingUp, Sparkles, TrendingDown } from "lucide-react";

interface AIForecastPanelProps {
  stock: StockQuote;
  activePrediction: AIPrediction | null;
  onGeneratePrediction: () => void;
  isLoading: boolean;
  error: string | null;
}

export default function AIForecastPanel({
  stock,
  activePrediction,
  onGeneratePrediction,
  isLoading,
  error
}: AIForecastPanelProps) {
  
  // Custom helper to choose styling based on sentiment value
  const getSentimentColors = (sentimentStr = "") => {
    switch (sentimentStr) {
      case "Strong Buy":
        return {
          bg: "bg-emerald-500/15 border-emerald-500/40 text-emerald-400",
          glow: "shadow-[0_0_15px_rgba(16,185,129,0.25)]",
          icon: <Sparkles className="h-4 w-4 text-emerald-400" />
        };
      case "Buy":
        return {
          bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
          glow: "",
          icon: <TrendingUp className="h-4 w-4 text-emerald-400" />
        };
      case "Hold":
        return {
          bg: "bg-amber-500/10 border-amber-500/20 text-amber-400",
          glow: "",
          icon: <Clock className="h-4 w-4 text-amber-400" />
        };
      case "Sell":
        return {
          bg: "bg-rose-500/10 border-rose-500/20 text-rose-400",
          glow: "",
          icon: <TrendingDown className="h-4 w-4 text-rose-400" />
        };
      case "Strong Sell":
        return {
          bg: "bg-rose-500/20 border-rose-500/40 text-rose-400",
          glow: "shadow-[0_0_15px_rgba(239,68,68,0.25)]",
          icon: <AlertTriangle className="h-4 w-4 text-rose-400" />
        };
      default:
        return {
          bg: "bg-gray-500/10 border-gray-500/20 text-gray-400",
          glow: "",
          icon: <Clock className="h-4 w-4 text-gray-400" />
        };
    }
  };

  const getImpactColor = (impact = "") => {
    if (impact.includes("Highly Bullish")) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (impact.includes("Moderately Bullish")) return "text-emerald-300 bg-emerald-500/5 border-emerald-500/10";
    if (impact.includes("Highly Bearish")) return "text-rose-400 bg-rose-500/10 border-rose-500/20";
    if (impact.includes("Moderately Bearish")) return "text-rose-300 bg-rose-500/5 border-rose-500/10";
    return "text-gray-400 bg-gray-500/10 border-gray-500/20";
  };

  const sentimentStyle = getSentimentColors(activePrediction?.sentiment);

  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-5 mb-5 flex flex-col" id="ai-panel">
      
      {/* Panel Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-sm font-display font-medium text-white flex items-center gap-2 uppercase tracking-wide">
            <Brain className="h-4 w-4 text-emerald-500" />
            Gemini Analytical Forecast
          </h2>
          <p className="text-xs text-white/40 mt-0.5 text-left">
            AI-driven sentiment scores, technical indicators synthesis, and forward catalyst analysis.
          </p>
        </div>

        {/* Generate / Consult Button */}
        <button
          onClick={onGeneratePrediction}
          disabled={isLoading}
          className="bg-white hover:bg-white/90 disabled:bg-white/10 disabled:text-white/30 text-black font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-lg transition duration-200 shadow-sm flex items-center justify-center gap-2 self-start md:self-auto cursor-pointer"
          id="btn-trigger-ai-api"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>{isLoading ? "Analyzing..." : "Sync Gemini Intelligence"}</span>
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3 text-xs text-rose-400 mb-4 text-left">
          <strong>Initialization Error:</strong> {error}
        </div>
      )}

      {/* Loading state with informative text */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-center select-none" id="ai-loading-screen">
          <div className="relative mb-4 animate-pulse">
            <div className="w-12 h-12 rounded-full border-2 border-emerald-500/10 border-t-emerald-400 animate-spin"></div>
            <Brain className="h-6 w-6 text-emerald-400 absolute inset-0 m-auto" />
          </div>
          <p className="text-xs text-white/80 uppercase font-bold tracking-widest font-display">Crunching Market Variables</p>
          <div className="text-[11px] text-white/40 max-w-sm mt-1.5 leading-relaxed space-y-1">
            <p className="font-mono text-emerald-500 animate-pulse">Running parameter proxy validation...</p>
            <p>Compiling technical triggers and forward earnings forecasts.</p>
          </div>
        </div>
      ) : activePrediction ? (
        /* Prediction Render block */
        <div className="space-y-6 text-left" id="ai-prediction-outputs">
          
          {/* Top Row: Sentiment Rating Badge and Numerical Meter */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Recommendation badge */}
            <div className={`p-4 rounded-xl border flex flex-col justify-between ${sentimentStyle.bg} ${sentimentStyle.glow}`}>
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">
                Gemini Advisory Call
              </span>
              <div className="flex items-center gap-2 mt-2">
                {sentimentStyle.icon}
                <span className="text-lg font-display font-bold">
                  {activePrediction.sentiment}
                </span>
              </div>
              <span className="text-[9px] text-white/30 mt-2 font-mono">
                Evaluated against 180-day trendlines.
              </span>
            </div>

            {/* Bullishness Score gauge */}
            <div className="bg-[#141414] border border-white/5 p-4 rounded-xl flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-bold uppercase tracking-widest text-white/40 font-sans">
                  Bullishness Score
                </span>
                <span className="font-mono text-xs font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  {activePrediction.sentimentScore}/100
                </span>
              </div>
              
              {/* Visual linear gauge bar */}
              <div className="w-full bg-white/5 h-1.5 rounded-full mt-3 overflow-hidden border border-white/10">
                <div
                  className="bg-gradient-to-r from-rose-500 via-amber-405 to-emerald-500 h-full transition-all duration-1000"
                  style={{ width: `${activePrediction.sentimentScore}%` }}
                ></div>
              </div>

              <div className="flex justify-between text-[8px] text-white/30 mt-1.5 font-mono uppercase tracking-wider">
                <span>Bearish</span>
                <span>Neutral</span>
                <span>Bullish</span>
              </div>
            </div>

            {/* Price Target Ranges */}
            <div className="bg-[#141414] border border-white/5 p-4 rounded-xl flex flex-col justify-between">
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/40 block font-sans">
                Theoretical Targets (Gemini)
              </span>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="border-r border-white/5 pr-2 text-left">
                  <span className="text-[8.5px] uppercase font-bold text-white/30 block font-sans">30-Day Range</span>
                  <span className="text-xs font-mono font-bold text-white block mt-0.5">
                    ${activePrediction.targetRange30d.min.toFixed(2)} - ${activePrediction.targetRange30d.max.toFixed(2)}
                  </span>
                </div>
                <div className="text-left pl-1">
                  <span className="text-[8.5px] uppercase font-bold text-white/30 block font-sans">90-Day Range</span>
                  <span className="text-xs font-mono font-bold text-emerald-500 block mt-0.5">
                    ${activePrediction.targetRange90d.min.toFixed(2)} - ${activePrediction.targetRange90d.max.toFixed(2)}
                  </span>
                </div>
              </div>
              <span className="text-[9px] text-white/30 block mt-2">
                Baseline close price: ${stock.currentPrice.toFixed(2)}
              </span>
            </div>

          </div>

          {/* Qualitative Short outlook */}
          <div className="bg-white/5 p-4 border border-white/10 rounded-xl">
            <h4 className="text-[9px] uppercase font-bold tracking-widest text-white/40 mb-1.5 flex items-center gap-1 font-sans">
              <Zap className="h-3.5 w-3.5 text-emerald-500" />
              Strategic Catalyst Horizon
            </h4>
            <p className="text-xs text-white/95 leading-relaxed font-sans font-medium">
              {activePrediction.outlook30d}
            </p>
          </div>

          {/* Reasoning Bullet Checklist */}
          <div>
            <h4 className="text-[9px] uppercase font-bold tracking-widest text-white/40 mb-2.5 font-sans">
              Key Quantitative Findings & Logic
            </h4>
            <div className="space-y-2">
              {activePrediction.reasoning.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-3 rounded-lg bg-white/5 border border-white/10 text-xs text-white/80 leading-snug"
                >
                  <span className="font-mono bg-white text-black font-extrabold w-5 h-5 rounded flex items-center justify-center shrink-0 text-[10px]">
                    {idx + 1}
                  </span>
                  <p className="font-sans font-medium">{item}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Technical Synthesiser */}
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-xs text-white/80 leading-relaxed font-sans">
            <h4 className="text-[9px] font-bold text-white/40 uppercase mb-1.5 tracking-widest font-sans">Technical Indicators Synthesis</h4>
            <p className="font-medium text-white/80">{activePrediction.technicalIndicatorsSummary}</p>
          </div>

          {/* Mapped plausible catalyst events list */}
          <div>
            <span className="text-[9px] uppercase font-bold tracking-widest text-white/40 block mb-3 font-sans">
              Potential Catalyst Event Simulations
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              {activePrediction.catalysts.map((event, idx) => (
                <div
                  key={idx}
                  className="bg-[#141414] border border-white/5 p-4 rounded-xl flex flex-col justify-between space-y-3 hover:border-white/10 transition duration-150"
                >
                  {/* Event Title */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-[8px] uppercase font-bold text-white/30 font-mono tracking-wider">EVENT {idx + 1}</span>
                      <div className="flex gap-1">
                        <span className="text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-white/50">
                          {event.likelihood} Likelihood
                        </span>
                      </div>
                    </div>
                    <h5 className="text-xs font-bold leading-tight text-white font-display pt-0.5 uppercase tracking-wide">
                      {event.event}
                    </h5>
                  </div>

                  {/* Description */}
                  <p className="text-[11px] leading-relaxed text-white/55 flex-1 font-sans">
                    {event.description}
                  </p>

                  {/* Impact Rating Badges & Percent metrics */}
                  <div className="border-t border-white/5 pt-2 flex items-center justify-between text-[10px] uppercase font-mono">
                    <span className={`px-2 py-0.5 rounded border text-[8px] font-bold tracking-wider ${getImpactColor(event.impact)}`}>
                      {event.impact}
                    </span>
                    <span className={`font-mono font-bold ${event.priceImpactPercent >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                      {event.priceImpactPercent >= 0 ? "+" : ""}{event.priceImpactPercent}% Impact
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Legal Notice */}
          <p className="text-[9px] text-white/20 border-t border-white/10 pt-4 text-center select-none uppercase tracking-wide leading-relaxed font-mono">
            * Disclaimer: AI-generated projections represent theoretical scenario weights constructed via simulated parameters and structural trends. Do not use as financial advisory directives.
          </p>

        </div>
      ) : (
        /* Uninitialized panel state */
        <div className="flex flex-col items-center justify-center py-16 text-center select-none" id="ai-blankmode">
          <div className="p-4 bg-white/5 rounded-full mb-3.5 border border-white/10 shadow-[0_0_12px_rgba(255,255,255,0.02)]">
            <Brain className="h-8 w-8 text-white/85" />
          </div>
          <h3 className="text-sm font-semibold text-white/90 font-display">Deep AI Predictive Insight</h3>
          <p className="text-xs text-white/40 max-w-sm mt-1 leading-relaxed font-sans">
            Sync Gemini intelligence to evaluate <strong className="text-white">{stock.name} ({stock.ticker})</strong> against consecutive trends, evaluate moving averages, and predict forward catalysts.
          </p>
          <button
            onClick={onGeneratePrediction}
            className="mt-4 bg-white hover:bg-white/90 text-black font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-lg transition cursor-pointer"
            id="btn-trigger-ai-blank"
          >
            Consult Gemini Intelligence
          </button>
        </div>
      )}

    </div>
  );
}
