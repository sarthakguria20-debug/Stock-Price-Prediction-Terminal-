import { useState, useEffect, useMemo } from "react";
import { StockQuote, ScenarioPreset, MonteCarloResult, AIPrediction, PaperPortfolio, ChatMessage } from "./types";
import { getInitialStocks, runMonteCarlo, generateStockHistory } from "./data/stocks";
import StockSearch from "./components/StockSearch";
import TechnicalChart from "./components/TechnicalChart";
import PredictionForm from "./components/PredictionForm";
import MonteCarloChart from "./components/MonteCarloChart";
import AIForecastPanel from "./components/AIForecastPanel";
import PaperTrading from "./components/PaperTrading";
import AnalystChat from "./components/AnalystChat";
import { LineChart, Sparkles, LayoutDashboard, BrainCircuit, Landmark, BarChart3, HelpCircle, Activity, Clock } from "lucide-react";

const STARTING_PORTFOLIO: PaperPortfolio = {
  cash: 100000,
  positions: {},
  history: []
};

type TabType = 'technical' | 'simulation' | 'ai_forecast' | 'paper_portfolio';

export default function App() {
  // Stock Database states
  const [stocks, setStocks] = useState<StockQuote[]>([]);
  const [selectedStock, setSelectedStock] = useState<StockQuote | null>(null);

  // App Layout States
  const [activeTab, setActiveTab] = useState<TabType>('technical');
  const [liveUtcTime, setLiveUtcTime] = useState("");

  // Monte Carlo simulation state
  const [simResult, setSimResult] = useState<MonteCarloResult | null>(null);

  // Server side AI predictions state (dictionary mapped of symbol to prediction result)
  const [aiPredictions, setAiPredictions] = useState<{ [ticker: string]: AIPrediction }>({});
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Paper portfolio trading states (persisted via localStorage)
  const [portfolio, setPortfolio] = useState<PaperPortfolio>(STARTING_PORTFOLIO);

  // Conversational chat state mapping symbol ticker to chat messages
  const [chatHistories, setChatHistories] = useState<{ [ticker: string]: ChatMessage[] }>({});
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Initialize stock data & load local storage portfolio
  useEffect(() => {
    const list = getInitialStocks();
    setStocks(list);
    setSelectedStock(list[0]); // default to Apple (first entry)

    // Run custom Monte Carlo on default selection
    const defaultPreset: ScenarioPreset = {
      name: "Default Startup Drift Model",
      id: "steady_blue",
      description: "Low-volatility, reliable compounding",
      drift: 0.0008,
      volatility: 0.015,
      trendBias: 0.0002,
      simCount: 45,
      days: 30
    };
    const initialSim = runMonteCarlo(list[0].currentPrice, defaultPreset);
    
    // Format stats values
    const startingPrice = list[0].currentPrice;
    const finalPrices = initialSim.paths.map(p => p.prices[p.prices.length - 1]).sort((a,b) => a - b);
    const median = initialSim.medianPercentiles[initialSim.medianPercentiles.length - 1].p50;
    const p90 = initialSim.medianPercentiles[initialSim.medianPercentiles.length - 1].p90;
    const p10 = initialSim.medianPercentiles[initialSim.medianPercentiles.length - 1].p10;
    const upwardClosePaths = initialSim.paths.filter(p => p.prices[p.prices.length - 1] > startingPrice).length;
    const expectedReturn = ((median - startingPrice)/startingPrice) * 100;

    setSimResult({
      ...initialSim,
      summary: {
        startingPrice,
        finalMedian: median,
        finalP90: p90,
        finalP10: p10,
        expectedReturn,
        confidenceInterval: "90%",
        upsideProbability: upwardClosePaths / initialSim.paths.length
      }
    });

    // Populate persistent portfolio if present
    const savedPortfolio = localStorage.getItem("paper_portfolio_kv");
    if (savedPortfolio) {
      try {
        setPortfolio(JSON.parse(savedPortfolio));
      } catch (err) {
        console.error("Local storage parsing failed:", err);
      }
    }

    // Interval to refresh live active clock
    const updateTime = () => {
      const now = new Date();
      setLiveUtcTime(now.toUTCString());
    };
    updateTime();
    const intervalId = setInterval(updateTime, 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Sync portfolio state changes to local storage
  const savePortfolio = (updatedPf: PaperPortfolio) => {
    setPortfolio(updatedPf);
    localStorage.setItem("paper_portfolio_kv", JSON.stringify(updatedPf));
  };

  // Run a brand new simulation calculation in-browser when triggered
  const handleRunSimulation = (preset: ScenarioPreset) => {
    if (!selectedStock) return;
    const res = runMonteCarlo(selectedStock.currentPrice, preset);
    
    const startingPrice = selectedStock.currentPrice;
    const median = res.medianPercentiles[res.medianPercentiles.length - 1].p50;
    const p90 = res.medianPercentiles[res.medianPercentiles.length - 1].p90;
    const p10 = res.medianPercentiles[res.medianPercentiles.length - 1].p10;
    const upwardClosePaths = res.paths.filter(p => p.prices[p.prices.length - 1] > startingPrice).length;
    const expectedReturn = ((median - startingPrice)/startingPrice) * 100;

    setSimResult({
      ...res,
      summary: {
        startingPrice,
        finalMedian: median,
        finalP90: p90,
        finalP10: p10,
        expectedReturn,
        confidenceInterval: "90%",
        upsideProbability: upwardClosePaths / res.paths.length
      }
    });
  };

  // Run a server-side AI-forecast query to Gemini
  const handleGeneratePrediction = async () => {
    if (!selectedStock) return;
    const ticker = selectedStock.ticker;

    setIsAiLoading(true);
    setAiError(null);

    // Extract raw price arrays to provide curves visual insight to model
    const pricesList = selectedStock.historicalData.map(d => d.close);

    try {
      const response = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker,
          name: selectedStock.name,
          currentPrice: selectedStock.currentPrice,
          sector: selectedStock.sector,
          recentPrices: pricesList
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed server response status: ${response.status}`);
      }

      const predictionData = await response.json();
      setAiPredictions(prev => ({
        ...prev,
        [ticker]: predictionData
      }));

    } catch (err: any) {
      console.error("Failed obtaining AI prediction:", err);
      setAiError(err.message || "Failed parsing prediction response.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Paper trade order placement executor
  const handleExecuteTrade = (type: 'BUY' | 'SELL', shares: number) => {
    if (!selectedStock) return;
    const ticker = selectedStock.ticker;
    const tradePrice = selectedStock.currentPrice;
    const totalCost = shares * tradePrice;

    const timestamp = new Date().toLocaleTimeString("en-US", { hour12: false }) + " UTC";
    const newTransaction = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp,
      ticker,
      type,
      shares,
      price: tradePrice,
      totalCost
    };

    const currentPositions = { ...portfolio.positions };
    let finalCash = portfolio.cash;

    if (type === 'BUY') {
      finalCash -= totalCost;
      const existingPos = currentPositions[ticker];
      if (existingPos) {
        const totalShares = existingPos.shares + shares;
        const totalCostBasis = existingPos.totalCost + totalCost;
        const avgPrice = totalCostBasis / totalShares;
        
        currentPositions[ticker] = {
          ticker,
          name: selectedStock.name,
          shares: totalShares,
          avgBuyPrice: parseFloat(avgPrice.toFixed(2)),
          totalCost: totalCostBasis
        };
      } else {
        currentPositions[ticker] = {
          ticker,
          name: selectedStock.name,
          shares,
          avgBuyPrice: tradePrice,
          totalCost
        };
      }
    } else {
      // Sell Order execution
      const existingPos = currentPositions[ticker];
      if (!existingPos || existingPos.shares < shares) {
        return; // safeguard check
      }
      
      finalCash += totalCost;
      const remainingShares = existingPos.shares - shares;
      if (remainingShares === 0) {
        delete currentPositions[ticker];
      } else {
        const revisedCostBasis = existingPos.avgBuyPrice * remainingShares;
        currentPositions[ticker] = {
          ...existingPos,
          shares: remainingShares,
          totalCost: revisedCostBasis
        };
      }
    }

    const revisedPortfolio = {
      cash: finalCash,
      positions: currentPositions,
      history: [...portfolio.history, newTransaction]
    };

    savePortfolio(revisedPortfolio);
  };

  // Chat message submit dispatcher (server-side Gemini)
  const handleSendChatMessage = async (msgText: string) => {
    if (!selectedStock) return;
    const ticker = selectedStock.ticker;
    const activeHistory = chatHistories[ticker] || [];

    const now = new Date();
    const userTimestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Append consumer query
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: msgText,
      timestamp: userTimestamp
    };

    const updatedHistory = [...activeHistory, userMsg];
    setChatHistories(prev => ({ ...prev, [ticker]: updatedHistory }));
    setIsChatLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker,
          name: selectedStock.name,
          currentPrice: selectedStock.currentPrice,
          history: updatedHistory.slice(-8), // feed active dialogue context window
          message: msgText
        }),
      });

      if (!response.ok) {
        throw new Error("Analyst API network issue.");
      }

      const responseData = await response.json();
      const analystTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      const analystMsg: ChatMessage = {
        id: `analyst-${Date.now()}`,
        sender: 'analyst',
        text: responseData.response || "Server responded with an empty answer.",
        timestamp: analystTimestamp
      };

      setChatHistories(prev => ({
        ...prev,
        [ticker]: [...updatedHistory, analystMsg]
      }));

    } catch (err) {
      console.error(err);
      const errTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'analyst',
        text: "Error synchronizing connection with Gemini Analyst at the moment. Please verify server endpoints.",
        timestamp: errTimestamp
      };
      setChatHistories(prev => ({
        ...prev,
        [ticker]: [...updatedHistory, errMsg]
      }));
    } finally {
      setIsChatLoading(false);
    }
  };

  // Add custom stock ticker dynamically
  const handleAddCustomStock = (ticker: string, companyName: string, price: number) => {
    // Generate realistic background history based on standard volatility metrics
    const mockHist = generateStockHistory(ticker, companyName, price, 0.02, 0.0005);
    const latestClose = mockHist[mockHist.length - 1].close;
    const prevClose = mockHist[mockHist.length - 2].close;
    const change = latestClose - prevClose;
    const changePct = (change / prevClose) * 100;

    const newStock: StockQuote = {
      ticker,
      name: companyName,
      currentPrice: latestClose,
      openPrice: mockHist[mockHist.length - 1].open,
      highPrice: mockHist[mockHist.length - 1].high,
      lowPrice: mockHist[mockHist.length - 1].low,
      prevClose,
      dailyChange: change,
      changePercent: changePct,
      marketCap: "N/A",
      volume: "1,500,000",
      sector: "Simulated Custom Sector",
      description: "Custom user configured asset. Full mathematical historical bounds back-calculated.",
      historicalData: mockHist
    };

    setStocks(prev => [newStock, ...prev]);
    setSelectedStock(newStock);
    
    // Auto calculate initial sim for new asset
    const revisedPreset: ScenarioPreset = {
      name: "Default Startup Drift Model",
      id: "steady_blue",
      description: "Low-volatility, reliable compounding",
      drift: 0.0008,
      volatility: 0.015,
      trendBias: 0.0002,
      simCount: 45,
      days: 30
    };
    const newSim = runMonteCarlo(latestClose, revisedPreset);
    
    setSimResult({
      ...newSim,
      summary: {
        startingPrice: latestClose,
        finalMedian: newSim.medianPercentiles[newSim.medianPercentiles.length - 1].p50,
        finalP90: newSim.medianPercentiles[newSim.medianPercentiles.length - 1].p90,
        finalP10: newSim.medianPercentiles[newSim.medianPercentiles.length - 1].p10,
        expectedReturn: ((newSim.medianPercentiles[newSim.medianPercentiles.length - 1].p50 - latestClose)/latestClose) * 100,
        confidenceInterval: "90%",
        upsideProbability: newSim.paths.filter(p => p.prices[p.prices.length - 1] > latestClose).length / newSim.paths.length
      }
    });
  };

  // Keep simulated active price ticks (triggers small realistic price ticks to make the terminal feel real-time and fluid!)
  useEffect(() => {
    if (stocks.length === 0) return;
    
    const interval = setInterval(() => {
      // Trigger a light price drift update on the SELECTED stock to simulate live feeds
      setStocks(prevList => {
        return prevList.map(item => {
          if (selectedStock && item.ticker === selectedStock.ticker) {
            const seedSum = item.ticker.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const deltaPct = (Math.sin(Date.now() + seedSum) * 0.0008); // micro tiny tick
            const newClose = parseFloat((item.currentPrice * (1 + deltaPct)).toFixed(4));
            const change = newClose - item.prevClose;
            const changePct = (change / item.prevClose) * 100;
            
            // Adjust historical data last point
            const revisedHist = [...item.historicalData];
            if (revisedHist.length > 0) {
              revisedHist[revisedHist.length - 1] = {
                ...revisedHist[revisedHist.length - 1],
                price: parseFloat(newClose.toFixed(2)),
                close: parseFloat(newClose.toFixed(2)),
                high: Math.max(revisedHist[revisedHist.length - 1].high, newClose),
                low: Math.min(revisedHist[revisedHist.length - 1].low, newClose)
              };
            }

            const updatedSelected = {
              ...item,
              currentPrice: parseFloat(newClose.toFixed(2)),
              dailyChange: change,
              changePercent: changePct,
              historicalData: revisedHist
            };

            // Keep selectedStock dynamic state in sync
            setSelectedStock(updatedSelected);
            return updatedSelected;
          }
          return item;
        });
      });
    }, 4500); // lightweight refresh

    return () => clearInterval(interval);
  }, [selectedStock, stocks.length]);

  const activePrediction = selectedStock ? aiPredictions[selectedStock.ticker] || null : null;
  const activeChat = selectedStock ? chatHistories[selectedStock.ticker] || [] : [];

  return (
    <div className="min-h-screen bg-[#050505] text-[#e0e0e0] font-sans antialiased pb-12">
      
      {/* Top Banner Status Bar */}
      <header className="bg-[#0a0a0a] border-b border-white/10 py-4.5 px-6 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Logo Brand Brand */}
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-500 rounded text-black shadow-md shadow-emerald-500/10">
              <BrainCircuit className="h-5 w-5 stroke-[2]" />
            </div>
            <div className="text-left">
              <span className="font-display font-extrabold text-white text-xl tracking-tight flex items-center gap-1.5 uppercase">
                QUANTA.AI
                <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono font-bold px-1.5 py-0.5 rounded tracking-normal normal-case align-middle">
                  TERMINAL-v3.0
                </span>
              </span>
              <p className="text-[10.5px] text-white/40 font-sans tracking-wide">
                Geometric random walks & full-stack predictive neural layers.
              </p>
            </div>
          </div>

          {/* Right Clock & Active connection indicators */}
          <div className="flex items-center gap-4.5 text-xs text-white/40 font-mono self-start md:self-auto leading-none">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] text-emerald-500 uppercase font-semibold select-none">Market Open</span>
            </div>
            <span className="text-white/10">|</span>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-[10.5px] select-all bg-[#0d0d0d] px-2 py-1 rounded border border-white/10 text-white/80">{liveUtcTime || "SYS SYNC TIME..."}</span>
            </div>
          </div>

        </div>
      </header>

      {/* Main Container Dashboard */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 mt-6 font-sans">
        
        {/* Selected Quote Banner */}
        {selectedStock && (
          <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4.5 mb-5 flex flex-wrap md:flex-nowrap justify-between items-center gap-4">
            
            {/* Asset Quote brief */}
            <div className="flex items-center gap-4 text-left">
              <div className="font-mono bg-[#141414] border border-white/10 font-bold px-3.5 py-2 rounded-xl text-lg text-white shadow-xs">
                {selectedStock.ticker}
              </div>
              <div>
                <span className="text-white/40 text-xs block font-sans">Active Asset Asset</span>
                <span className="font-display font-bold text-white text-md block leading-tight">{selectedStock.name}</span>
              </div>
            </div>

            {/* Price block */}
            <div className="flex gap-6 font-mono text-left">
              <div>
                <span className="text-[9px] uppercase font-bold text-white/40 tracking-widest font-sans block">Current price</span>
                <span className="text-xl font-extrabold text-white block">${selectedStock.currentPrice.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-white/40 tracking-widest font-sans block">24h Gain</span>
                <span className={`text-sm font-bold block ${selectedStock.dailyChange >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                  {selectedStock.dailyChange >= 0 ? "+" : ""}{selectedStock.dailyChange.toFixed(2)} ({selectedStock.changePercent.toFixed(2)}%)
                </span>
              </div>
              <div className="hidden sm:block">
                <span className="text-[9px] uppercase font-bold text-white/40 tracking-widest font-sans block">Daily Range (H/L)</span>
                <span className="text-sm font-bold text-white/80 block">${selectedStock.lowPrice.toFixed(2)} - ${selectedStock.highPrice.toFixed(2)}</span>
              </div>
              <div className="hidden md:block">
                <span className="text-[9px] uppercase font-bold text-white/40 tracking-widest font-sans block">Simulated volume</span>
                <span className="text-sm font-bold text-white/60 block">{selectedStock.volume}</span>
              </div>
            </div>

          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5.5">
          
          {/* LEFT COLUMN: NAVIGATION & ORDER CONTROLS (cols 4) */}
          <div className="md:col-span-4 space-y-5.5">
            
            {/* Asset Lookup Sidebar list */}
            {selectedStock && (
              <StockSearch
                stocks={stocks}
                selectedStock={selectedStock}
                onSelectStock={(st) => setSelectedStock(st)}
                onAddCustomStock={handleAddCustomStock}
              />
            )}

            {/* Analyst Real-time Chat companion dock (fully integrated in the dashboard) */}
            {selectedStock && (
              <AnalystChat
                stock={selectedStock}
                chatHistory={activeChat}
                onSendMessage={handleSendChatMessage}
                isChatLoading={isChatLoading}
              />
            )}

          </div>

          {/* RIGHT COLUMN: CORE CHARTS & PREDICTION ENGINES (cols 8) */}
          <div className="md:col-span-8 space-y-5.5">
            
            {/* Upper Tab row navigation */}
            <div className="flex bg-[#0a0a0a] border border-white/10 p-1.5 rounded-xl justify-start items-center gap-1">
              
              {/* Tab 1: Technical Charts */}
              <button
                onClick={() => setActiveTab('technical')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-150 flex items-center gap-2 cursor-pointer ${
                  activeTab === 'technical'
                    ? "bg-white text-black font-bold"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
                id="btn-tab-technical"
              >
                <LineChart className="h-4 w-4" />
                <span>Indicators Chart</span>
              </button>

              {/* Tab 2: Monte Carlo simulation */}
              <button
                onClick={() => setActiveTab('simulation')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-150 flex items-center gap-2 cursor-pointer ${
                  activeTab === 'simulation'
                    ? "bg-white text-black font-bold"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
                id="btn-tab-simulation"
              >
                <BarChart3 className="h-4 w-4" />
                <span>Scenario Simulator</span>
              </button>

              {/* Tab 3: Gemini Prediction Panel */}
              <button
                onClick={() => setActiveTab('ai_forecast')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-150 flex items-center gap-2 relative cursor-pointer ${
                  activeTab === 'ai_forecast'
                    ? "bg-white text-black font-bold"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
                id="btn-tab-ai-forecast"
              >
                <Sparkles className="h-4 w-4" />
                <span>Gemini deep AI Call</span>
                {!activePrediction && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
                )}
              </button>

              {/* Tab 4: Paper Trading Portfolio */}
              <button
                onClick={() => setActiveTab('paper_portfolio')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-150 flex items-center gap-2 cursor-pointer ${
                  activeTab === 'paper_portfolio'
                    ? "bg-white text-black font-bold"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
                id="btn-tab-portfolio"
              >
                <Landmark className="h-4 w-4" />
                <span>Paper Portfolio</span>
              </button>

            </div>

            {/* TAB CONTENT BLOCK WINDOW */}
            <div className="transition duration-150" id="tab-viewport">
              {selectedStock && activeTab === 'technical' && (
                <TechnicalChart stock={selectedStock} />
              )}

              {selectedStock && activeTab === 'simulation' && simResult && (
                <div className="space-y-5.5">
                  <PredictionForm
                    stockPrice={selectedStock.currentPrice}
                    onRunSimulation={handleRunSimulation}
                  />
                  <MonteCarloChart
                    ticker={selectedStock.ticker}
                    simResult={simResult}
                  />
                </div>
              )}

              {selectedStock && activeTab === 'ai_forecast' && (
                <AIForecastPanel
                  stock={selectedStock}
                  activePrediction={activePrediction}
                  onGeneratePrediction={handleGeneratePrediction}
                  isLoading={isAiLoading}
                  error={aiError}
                />
              )}

              {selectedStock && activeTab === 'paper_portfolio' && (
                <PaperTrading
                  stock={selectedStock}
                  portfolio={portfolio}
                  onExecuteTrade={handleExecuteTrade}
                />
              )}
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
