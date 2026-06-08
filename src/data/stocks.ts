import { StockQuote, ChartDataPoint, HistoricalDataPoint, ScenarioPreset } from "../types";

// Seed data configuration
export const POPULAR_STOCKS_METADATA = [
  {
    ticker: "AAPL",
    name: "Apple Inc.",
    currentPrice: 184.25,
    sector: "Technology",
    volume: "52,430,900",
    marketCap: "2.89T",
    description: "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide. Its flagship product is the iPhone, alongside services like Apple Music, iCloud, and Apple Pay.",
    baseVolatility: 0.015, // 1.5% daily variation
    baseDrift: 0.0006, // Slight positive drift
  },
  {
    ticker: "GOOG",
    name: "Alphabet Inc.",
    currentPrice: 173.50,
    sector: "Technology / Communication",
    volume: "21,840,400",
    marketCap: "2.16T",
    description: "Alphabet Inc. offers search, online advertising, cloud computing, hardware products, maps, software applications, and mobile operating systems through Google. It is a pioneering player in deep learning and AI.",
    baseVolatility: 0.018,
    baseDrift: 0.0008,
  },
  {
    ticker: "NVDA",
    name: "NVIDIA Corporation",
    currentPrice: 120.40,
    sector: "Technology / Semiconductors",
    volume: "184,120,500",
    marketCap: "2.96T",
    description: "NVIDIA Corporation designs graphics processing units (GPUs) for the gaming and professional markets, as well as system on a chip units (SoCs) for the mobile computing and automotive market. It dominates the artificial intelligence hardware landscape.",
    baseVolatility: 0.032, // Very volatile
    baseDrift: 0.0025, // Strong upward trend
  },
  {
    ticker: "TSLA",
    name: "Tesla, Inc.",
    currentPrice: 177.90,
    sector: "Automotive / Clean Energy",
    volume: "88,290,000",
    marketCap: "565.4B",
    description: "Tesla, Inc. designs, develops, manufactures, sells, and leases fully electric vehicles, energy generation, and storage systems. Known for extreme retail trading momentum and volatile structural trends.",
    baseVolatility: 0.035, // High volatility
    baseDrift: -0.0004, // Erratic/slight downward bias recently
  },
  {
    ticker: "MSFT",
    name: "Microsoft Corporation",
    currentPrice: 421.90,
    sector: "Technology / Software",
    volume: "19,500,600",
    marketCap: "3.13T",
    description: "Microsoft Corporation is a dominant global developer of software, services, devices, and solutions. Key pillars include the Windows OS, Office suits, Azure Cloud platforms, and deep generative AI integrations with OpenAI.",
    baseVolatility: 0.012, // Low volatility
    baseDrift: 0.0007, // Stably positive
  },
  {
    ticker: "COIN",
    name: "Coinbase Global, Inc.",
    currentPrice: 242.15,
    sector: "Financial Technology",
    volume: "11,240,000",
    marketCap: "59.2B",
    description: "Coinbase Global, Inc. provides financial infrastructure and technology for the crypto-economy. Operates as a proxy for cryptocurrency market volatility and sentiment fluctuations.",
    baseVolatility: 0.055, // Super high volatility
    baseDrift: 0.0015, // High reward potential
  }
];

// Generates 180 days of realistic history based on a deterministic seed or pseudo-random walk backing down from the currentPrice
export function generateStockHistory(
  ticker: string,
  name: string,
  currentPrice: number,
  baseVolatility: number,
  baseDrift: number,
  daysCount = 180
): HistoricalDataPoint[] {
  const history: HistoricalDataPoint[] = [];
  const today = new Date();
  
  // Deterministic seed generation based on ticker letters so values stay consistent on reloads
  const tickerSum = ticker.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  let seedState = tickerSum / 1000;

  function seededRandom() {
    const x = Math.sin(seedState++) * 10000;
    return x - Math.floor(x);
  }

  let runningPrice = currentPrice;
  
  // Create dates backwards
  const tempHistory: { date: string; price: number }[] = [];
  for (let i = 0; i < daysCount; i++) {
    tempHistory.push({
      date: "",
      price: runningPrice
    });

    // Random walk factors
    const percentChange = (seededRandom() - 0.5) * baseVolatility * 2 + baseDrift;
    runningPrice = runningPrice / (1 + percentChange);
  }

  // Format and add open/high/low/close spreads
  tempHistory.reverse().forEach((item, index) => {
    const currentDate = new Date();
    // Offset backwards excluding weekends
    let daysOffset = daysCount - index;
    currentDate.setDate(today.getDate() - daysOffset);
    
    // Check and skip weekends (move further back to make it look continuous on mock trading days)
    const dayName = currentDate.toLocaleDateString("en-US", { weekday: "short" });
    const formattedDate = currentDate.toISOString().split("T")[0];

    const c = item.price;
    const volatilityOffset = c * baseVolatility * 0.4;
    const r1 = seededRandom();
    const r2 = seededRandom();
    
    const o = c * (1 + (seededRandom() - 0.5) * baseVolatility * 0.4);
    const h = Math.max(o, c) + volatilityOffset * r1;
    const l = Math.min(o, c) - volatilityOffset * r2;
    const vol = Math.floor(1000000 + seededRandom() * 50000000);

    history.push({
      date: formattedDate,
      price: parseFloat(c.toFixed(2)),
      open: parseFloat(o.toFixed(2)),
      high: parseFloat(h.toFixed(2)),
      low: parseFloat(l.toFixed(2)),
      close: parseFloat(c.toFixed(2)),
      volume: vol
    });
  });

  return history;
}

// Generate the fully expanded baseline stock dataset
export function getInitialStocks(): StockQuote[] {
  return POPULAR_STOCKS_METADATA.map((meta) => {
    const hist = generateStockHistory(
      meta.ticker,
      meta.name,
      meta.currentPrice,
      meta.baseVolatility,
      meta.baseDrift
    );
    
    // Last point holds the latest live stats
    const latest = hist[hist.length - 1];
    const prev = hist[hist.length - 2];
    const change = latest.close - prev.close;
    const changePct = (change / prev.close) * 100;

    return {
      ticker: meta.ticker,
      name: meta.name,
      currentPrice: latest.close,
      openPrice: latest.open,
      highPrice: latest.high,
      lowPrice: latest.low,
      prevClose: prev.close,
      dailyChange: change,
      changePercent: changePct,
      marketCap: meta.marketCap,
      volume: meta.volume,
      sector: meta.sector,
      description: meta.description,
      historicalData: hist
    };
  });
}

// Calculate technical indicators directly on a dataset
export function calculateIndicators(data: HistoricalDataPoint[]): ChartDataPoint[] {
  const chartPoints: ChartDataPoint[] = data.map(d => ({ ...d }));

  // --- 1. SMA (Simple Moving Average) ---
  function computeSMA(period: number, key: 'sma20' | 'sma50') {
    for (let i = 0; i < chartPoints.length; i++) {
      if (i >= period - 1) {
        let sum = 0;
        for (let j = 0; j < period; j++) {
          sum += chartPoints[i - j].close;
        }
        chartPoints[i][key] = parseFloat((sum / period).toFixed(2));
      }
    }
  }

  // --- 2. EMA (Exponential Moving Average) ---
  function computeEMA(period: number, key: 'ema20') {
    if (chartPoints.length === 0) return;
    const k = 2 / (period + 1);
    
    // Starting point is the SMA of the first period duration
    let smaSum = 0;
    for (let i = 0; i < Math.min(period, chartPoints.length); i++) {
      smaSum += chartPoints[i].close;
    }
    let prevEMA = smaSum / Math.min(period, chartPoints.length);
    chartPoints[Math.min(period - 1, chartPoints.length - 1)][key] = parseFloat(prevEMA.toFixed(2));

    for (let i = period; i < chartPoints.length; i++) {
      const currentEMA = chartPoints[i].close * k + prevEMA * (1 - k);
      chartPoints[i][key] = parseFloat(currentEMA.toFixed(2));
      prevEMA = currentEMA;
    }
  }

  // --- 3. Bollinger Bands ---
  // Mid Line is SMA20. Top/Bottom is Mid +/- 2 Standard Deviations over the 20 days.
  function computeBollingerBands() {
    const period = 20;
    for (let i = 0; i < chartPoints.length; i++) {
      if (i >= period - 1) {
        // mid
        let sum = 0;
        for (let j = 0; j < period; j++) {
          sum += chartPoints[i - j].close;
        }
        const mid = sum / period;
        
        // standard dev
        let sumSqDiff = 0;
        for (let j = 0; j < period; j++) {
          sumSqDiff += Math.pow(chartPoints[i - j].close - mid, 2);
        }
        const stdDev = Math.sqrt(sumSqDiff / period);
        
        chartPoints[i].upperBB = parseFloat((mid + 2 * stdDev).toFixed(2));
        chartPoints[i].lowerBB = parseFloat((mid - 2 * stdDev).toFixed(2));
      }
    }
  }

  // --- 4. RSI (Relative Strength Index) ---
  // Default RSI N = 14
  function computeRSI(period = 14) {
    if (chartPoints.length <= period) return;

    let avgGain = 0;
    let avgLoss = 0;

    // First RSI calculation: average first 14 point differences
    for (let i = 1; i <= period; i++) {
      const difference = chartPoints[i].close - chartPoints[i - 1].close;
      if (difference > 0) {
        avgGain += difference;
      } else {
        avgLoss += Math.abs(difference);
      }
    }

    avgGain = avgGain / period;
    avgLoss = avgLoss / period;

    let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    chartPoints[period].rsi = parseFloat((100 - 100 / (1 + rs)).toFixed(2));

    // Smooth subsequent points
    for (let i = period + 1; i < chartPoints.length; i++) {
      const difference = chartPoints[i].close - chartPoints[i - 1].close;
      const gain = difference > 0 ? difference : 0;
      const loss = difference < 0 ? Math.abs(difference) : 0;

      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;

      rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      chartPoints[i].rsi = parseFloat((100 - 100 / (1 + rs)).toFixed(2));
    }
  }

  computeSMA(20, 'sma20');
  computeSMA(50, 'sma50');
  computeEMA(20, 'ema20');
  computeBollingerBands();
  computeRSI(14);

  return chartPoints;
}

// Monte Carlo Simulation Engine
// Price_{t} = Price_{t-1} * exp( (drift - 0.5 * Vol^2) * dt + Vol * dW) 
// plus a trendBias to reflect different macro-scenarios
export function runMonteCarlo(
  startingPrice: number,
  preset: ScenarioPreset
): {
  paths: { id: number; prices: number[] }[];
  dates: string[];
  medianPercentiles: { date: string; p10: number; p50: number; p90: number }[];
} {
  const { drift, volatility, trendBias, simCount, days } = preset;
  const paths: { id: number; prices: number[] }[] = [];
  const dt = 1; // daily interval

  // Generate date strings for next 'days' omitting weekends
  const dates: string[] = [];
  const today = new Date();
  let nextDate = new Date(today);

  for (let d = 0; d < days; d++) {
    nextDate.setDate(nextDate.getDate() + 1);
    // Ignore weekends for dates to align with trading sessions
    const day = nextDate.getDay();
    if (day === 0 || day === 6) {
      // If weekend, skip date index adjustments but advance time
      d--; 
      continue;
    }
    dates.push(nextDate.toISOString().split("T")[0]);
  }

  // Set up simCount paths
  for (let p = 0; p < simCount; p++) {
    const prices = [startingPrice];
    let currentPrice = startingPrice;

    for (let d = 0; d < days; d++) {
      // Standard normal distribution via Box-Muller transform
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

      // Incorporate drift, volatility, and direct structural trendBias
      const exponent = (drift + trendBias - 0.5 * Math.pow(volatility, 2)) * dt + volatility * Math.sqrt(dt) * z;
      currentPrice = currentPrice * Math.exp(exponent);
      
      // Prevent stock going negatively bankrupt (realistic lower limit floor)
      if (currentPrice < 0.01) currentPrice = 0.01;

      prices.push(parseFloat(currentPrice.toFixed(2)));
    }
    paths.push({ id: p, prices });
  }

  // Calculate median percentiles for each day
  const medianPercentiles: { date: string; p10: number; p50: number; p90: number }[] = [];
  
  // Starting point (day 0)
  medianPercentiles.push({
    date: today.toISOString().split("T")[0],
    p10: startingPrice,
    p50: startingPrice,
    p90: startingPrice
  });

  for (let d = 1; d <= days; d++) {
    // Collect price at day 'd' for all simulated paths
    const dayPrices = paths.map((p) => p.prices[d]).sort((a, b) => a - b);
    
    // Extract percentile indices
    const p10Index = Math.floor(simCount * 0.1);
    const p50Index = Math.floor(simCount * 0.5);
    const p90Index = Math.floor(simCount * 0.9);

    medianPercentiles.push({
      date: dates[d - 1] || "Future Date",
      p10: dayPrices[p10Index],
      p50: dayPrices[p50Index],
      p90: dayPrices[p90Index]
    });
  }

  return {
    paths,
    dates,
    medianPercentiles
  };
}
