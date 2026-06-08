import React, { useState } from "react";
import { ScenarioPreset } from "../types";
import { Sliders, Zap, Award, Target, TrendingUp, Compass } from "lucide-react";

interface PredictionFormProps {
  stockPrice: number;
  onRunSimulation: (preset: ScenarioPreset) => void;
}

const PRESETS: ScenarioPreset[] = [
  {
    name: "Blue Chip Steady Growth",
    id: "steady_blue",
    description: "Low-volatility, reliable compounding upward drift (e.g. MSFT style)",
    drift: 0.0008,
    volatility: 0.012,
    trendBias: 0.0002,
    simCount: 45,
    days: 30
  },
  {
    name: "Bullish Sector Breakthrough",
    id: "bullish_breakout",
    description: "Accelerating upward bias with moderate volatility (e.g. AI boom momentum)",
    drift: 0.002,
    volatility: 0.022,
    trendBias: 0.0015,
    simCount: 45,
    days: 30
  },
  {
    name: "High Volatility Speculation",
    id: "high_risk_meme",
    description: "Extreme volatility, massive spread bounds, rapid erratic price actions",
    drift: 0.001,
    volatility: 0.055,
    trendBias: 0.001,
    simCount: 45,
    days: 20
  },
  {
    name: "Sideways Crab consolidation",
    id: "flat_sideways",
    description: "Zero trend bias with tight bounds. Prices stay within narrow range",
    drift: 0,
    volatility: 0.015,
    trendBias: 0,
    simCount: 45,
    days: 30
  },
  {
    name: "Bearish Market Correction",
    id: "bearish_drop",
    description: "Negative drifting bias with heightened fear-induced correction volatility",
    drift: -0.0015,
    volatility: 0.025,
    trendBias: -0.001,
    simCount: 45,
    days: 30
  }
];

export default function PredictionForm({ stockPrice, onRunSimulation }: PredictionFormProps) {
  // Config state
  const [selectedPresetId, setSelectedPresetId] = useState("steady_blue");
  const [drift, setDrift] = useState(0.0008);
  const [volatility, setVolatility] = useState(0.015);
  const [trendBias, setTrendBias] = useState(0.0002);
  const [simCount, setSimCount] = useState(45);
  const [days, setDays] = useState(30);

  const applyPreset = (preset: ScenarioPreset) => {
    setSelectedPresetId(preset.id);
    setDrift(preset.drift);
    setVolatility(preset.volatility);
    setTrendBias(preset.trendBias);
    setSimCount(preset.simCount);
    setDays(preset.days);
    
    // Auto-execute
    onRunSimulation(preset);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRunSimulation({
      name: "Custom Simulated Scenario",
      id: "custom_scenario",
      description: "User defined quantitative parameters.",
      drift,
      volatility,
      trendBias,
      simCount,
      days
    });
    setSelectedPresetId("custom_scenario");
  };

  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-5 mb-5 flex flex-col" id="scenario-panel">
      <h2 className="text-sm font-display font-medium text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
        <Compass className="h-4 w-4 text-emerald-500" />
        Forecasting Simulator
      </h2>

      {/* Preset Badges Grid */}
      <div className="mb-6">
        <label className="block text-[10.5px] font-semibold text-white/40 uppercase tracking-widest mb-2.5 flex items-center gap-1.5 select-none">
          <Zap className="h-3.5 w-3.5 text-emerald-500" />
          Quick Outlook Presets
        </label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset)}
              className={`p-2 rounded-lg text-xs font-semibold border text-left flex flex-col justify-between transition-all duration-150 h-20 cursor-pointer ${
                selectedPresetId === preset.id
                  ? "bg-white text-black border-white font-bold"
                  : "bg-white/5 border-white/5 text-white/50 hover:bg-white/10 hover:border-white/10 hover:text-white"
              }`}
              id={`btn-preset-${preset.id}`}
            >
              <span className="block truncate font-display font-bold text-[10.5px]">{preset.name}</span>
              <span className={`block text-[9px] line-clamp-2 mt-1 font-sans leading-tight ${selectedPresetId === preset.id ? "text-black/60" : "text-white/30"}`}>
                {preset.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Manual parameter fine-tuning */}
      <form onSubmit={handleCustomSubmit} className="space-y-4 border-t border-white/10 pt-5 text-left">
        <div className="flex items-center justify-between">
          <span className="text-[10.5px] font-semibold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
            <Sliders className="h-3.5 w-3.5 text-emerald-500" />
            Parameter Fine-Tuning
          </span>
          <span className="text-[10.5px] text-white/40">Current Share Base: <strong className="text-white">${stockPrice.toFixed(2)}</strong></span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Drift Slider */}
          <div className="space-y-1.5 bg-[#141414] p-3 rounded-lg border border-white/5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-white/50 font-semibold text-[11px] uppercase">Daily Drift (Trend)</span>
              <span className="font-mono font-bold text-white bg-[#0d0d0d] px-1.5 py-0.5 rounded border border-white/10 text-[10.5px]">
                {(drift * 100).toFixed(2)}%
              </span>
            </div>
            <input
              type="range"
              min="-0.005"
              max="0.005"
              step="0.0001"
              value={drift}
              onChange={(e) => setDrift(parseFloat(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
              id="slider-drift"
            />
            <div className="flex justify-between text-[9px] text-white/30 font-mono">
              <span>-0.5% (Bearish)</span>
              <span>+0.5% (Bullish)</span>
            </div>
          </div>

          {/* Volatility Slider */}
          <div className="space-y-1.5 bg-[#141414] p-3 rounded-lg border border-white/5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-white/50 font-semibold text-[11px] uppercase">Daily Volatility (Risk)</span>
              <span className="font-mono font-bold text-white bg-[#0d0d0d] px-1.5 py-0.5 rounded border border-white/10 text-[10.5px]">
                {(volatility * 100).toFixed(1)}%
              </span>
            </div>
            <input
              type="range"
              min="0.005"
              max="0.08"
              step="0.001"
              value={volatility}
              onChange={(e) => setVolatility(parseFloat(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
              id="slider-volatility"
            />
            <div className="flex justify-between text-[9px] text-white/30 font-mono">
              <span>0.5% (Stable)</span>
              <span>8.0% (Erratic)</span>
            </div>
          </div>

          {/* Trend Bias Slider */}
          <div className="space-y-1.5 bg-[#141414] p-3 rounded-lg border border-white/5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-white/50 font-semibold text-[11px] uppercase">Trend Bias Weight</span>
              <span className="font-mono font-bold text-white bg-[#0d0d0d] px-1.5 py-0.5 rounded border border-[#303030] text-[10.5px]">
                {(trendBias * 100).toFixed(2)}%
              </span>
            </div>
            <input
              type="range"
              min="-0.003"
              max="0.003"
              step="0.0001"
              value={trendBias}
              onChange={(e) => setTrendBias(parseFloat(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
              id="slider-trendbias"
            />
            <div className="flex justify-between text-[9px] text-white/30 font-mono">
              <span>Market Drag Off</span>
              <span>Market Push On</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
          {/* Simulation iteration Days */}
          <div className="space-y-1.5 bg-[#141414] p-3 rounded-lg border border-white/5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-white/50 font-semibold text-[11px] uppercase">Projection Duration</span>
              <span className="font-mono font-bold text-white bg-[#0d0d0d] px-1.5 py-0.5 rounded border border-white/10 text-[10.5px]">
                {days} days
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="60"
              step="1"
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
              id="slider-days"
            />
            <div className="flex justify-between text-[9px] text-white/30 font-mono">
              <span>1 Week</span>
              <span>3 Months</span>
            </div>
          </div>

          {/* Denser paths */}
          <div className="space-y-1.5 bg-[#141414] p-3 rounded-lg border border-white/5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-white/50 font-semibold text-[11px] uppercase">Quantity of Paths</span>
              <span className="font-mono font-bold text-white bg-[#0d0d0d] px-1.5 py-0.5 rounded border border-white/10 text-[10.5px]">
                {simCount} paths
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={simCount}
              onChange={(e) => setSimCount(parseInt(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
              id="slider-simcount"
            />
            <div className="flex justify-between text-[9px] text-white/30 font-mono">
              <span>10 (Fast)</span>
              <span>100 (Dense / Stat)</span>
            </div>
          </div>
        </div>

        {/* Trigger Button */}
        <div className="flex justify-end pt-3">
          <button
            type="submit"
            className="w-full md:w-auto bg-white hover:bg-white/90 text-black font-bold text-xs uppercase tracking-wide px-6 py-3 rounded-lg transition duration-200 shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            id="btn-run-simulation"
          >
            <Target className="h-4 w-4" />
            <span>Generate Simulation Paths</span>
          </button>
        </div>
      </form>
    </div>
  );
}
