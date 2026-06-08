export interface HistoricalDataPoint {
  date: string;
  price: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockQuote {
  ticker: string;
  name: string;
  currentPrice: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  prevClose: number;
  dailyChange: number;
  changePercent: number;
  marketCap: string;
  volume: string;
  sector: string;
  description: string;
  historicalData: HistoricalDataPoint[];
}

export interface ChartDataPoint extends HistoricalDataPoint {
  sma20?: number;
  sma50?: number;
  ema20?: number;
  upperBB?: number;
  lowerBB?: number;
  rsi?: number;
}

export interface ScenarioPreset {
  name: string;
  id: string;
  description: string;
  drift: number;       // average price change trend
  volatility: number;  // dispersion of returns 
  trendBias: number;   // extra push (e.g. +ve for bullish, -ve for bearish)
  simCount: number;    // number of paths simulated
  days: number;        // days ahead to forecast
}

export interface MonteCarloPath {
  id: number;
  prices: number[];
}

export interface MonteCarloResult {
  paths: MonteCarloPath[];
  dates: string[];
  medianPercentiles: {
    date: string;
    p10: number;   // pessimistic lower bound
    p50: number;   // median / neutral model
    p90: number;   // optimistic upper bound
  }[];
  summary: {
    startingPrice: number;
    finalMedian: number;
    finalP90: number;
    finalP10: number;
    expectedReturn: number;
    confidenceInterval: string;
    upsideProbability: number;
  };
}

export interface CatalystEvent {
  event: string;
  likelihood: "High" | "Medium" | "Low";
  impact: "Highly Bullish" | "Moderately Bullish" | "Neutral" | "Moderately Bearish" | "Highly Bearish";
  priceImpactPercent: number;
  description: string;
}

export interface AIPrediction {
  ticker: string;
  sentiment: "Strong Buy" | "Buy" | "Hold" | "Sell" | "Strong Sell";
  sentimentScore: number; // 0 (Bearish) to 100 (Bullish)
  targetRange30d: { min: number; max: number };
  targetRange90d: { min: number; max: number };
  outlook30d: string;
  reasoning: string[];
  technicalIndicatorsSummary: string;
  catalysts: CatalystEvent[];
}

export interface PortfolioPosition {
  ticker: string;
  name: string;
  shares: number;
  avgBuyPrice: number;
  totalCost: number;
}

export interface Transaction {
  id: string;
  timestamp: string;
  ticker: string;
  type: 'BUY' | 'SELL';
  shares: number;
  price: number;
  totalCost: number;
}

export interface PaperPortfolio {
  cash: number;
  positions: { [ticker: string]: PortfolioPosition };
  history: Transaction[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'analyst';
  text: string;
  timestamp: string;
}
