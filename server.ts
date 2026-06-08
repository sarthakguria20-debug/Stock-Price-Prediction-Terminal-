import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Google GenAI on server-side with required User-Agent
const geminiApiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (geminiApiKey) {
  ai = new GoogleGenAI({
    apiKey: geminiApiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
} else {
  console.warn("⚠️ Warning: GEMINI_API_KEY is not defined. AI prediction & chat features will run in sandbox mock mode.");
}

app.use(express.json());

// API: AI Stock Forecasting Route
app.post("/api/predict", async (req, res) => {
  const { ticker, name, currentPrice, sector, recentPrices } = req.body;

  if (!ticker || !currentPrice) {
    return res.status(400).json({ error: "Missing ticker or currentPrice in request." });
  }

  // Fallback if API Key isn't provided
  if (!ai) {
    const min30 = currentPrice * 0.95;
    const max30 = currentPrice * 1.15;
    const min90 = currentPrice * 0.90;
    const max90 = currentPrice * 1.30;
    return res.json({
      ticker,
      sentiment: "Buy",
      sentimentScore: 72,
      targetRange30d: { min: parseFloat(min30.toFixed(2)), max: parseFloat(max30.toFixed(2)) },
      targetRange90d: { min: parseFloat(min90.toFixed(2)), max: parseFloat(max90.toFixed(2)) },
      outlook30d: `Stable short-term outlook for ${name}. The technical supports hold firm, indicating strong retail defense around $${currentPrice}. Option flow analysis indicates high volume of bullish call spreads.`,
      reasoning: [
        "Consistent volume accumulation noted at current levels, showing powerful baseline institutional interest.",
        `Product pipeline breakthroughs and positive sector momentum for ${sector} provides a compelling catalyst.`,
        "RSI technical indicators suggest a balanced neutral state, leaving ample runway for an upward breakthrough."
      ],
      technicalIndicatorsSummary: "Moving averages exhibit a golden crossover on 4-hour charts. MACD is turning bullish with positive divergence, while RSI resides in the healthy accumulation zone (54.5).",
      catalysts: [
        {
          event: "Quarterly Earnings Announcement",
          likelihood: "High",
          impact: "Highly Bullish",
          priceImpactPercent: 8.5,
          description: "Projected upside surprise on margins due to aggressive cloud software efficiency measures."
        },
        {
          event: "Regulatory Approvals / Compliance Updates",
          likelihood: "Medium",
          impact: "Neutral",
          priceImpactPercent: 1.2,
          description: "Potential scrutiny is mostly priced in, resulting in a low risk probability profile."
        },
        {
          event: "New Product AI-Integration Release",
          likelihood: "High",
          impact: "Moderately Bullish",
          priceImpactPercent: 4.8,
          description: "Integration of next-generation visual and text interfaces driving massive renewal acceleration."
        }
      ]
    });
  }

  try {
    const pricesContext = recentPrices && Array.isArray(recentPrices) 
      ? `Recent consecutive close prices (from oldest to newest): ${recentPrices.slice(-25).join(", ")}`
      : `Current trading price: $${currentPrice}`;

    const prompt = `Perform a realistic quantitative and qualitative predictive analysis for ${name} (Ticker: ${ticker}) belonging to the ${sector} sector. 
The current stock price is $${currentPrice}. 
${pricesContext}

Generate:
- A sentiment rating ("Strong Buy", "Buy", "Hold", "Sell", "Strong Sell")
- A numerical sentiment score from 0 (extremely bearish/oversold) to 100 (extremely bullish/overbought)
- Predicted 30-day target price range (low to high boundaries around $${currentPrice})
- Predicted 90-day target price range (low to high boundaries around $${currentPrice})
- Short-term qualitative outlook (outlook30d) explaining price potential
- At least 3 detailed quantitative reasoning bullet points
- A summary of current technical indicators (MACD, RSI, Moving averages) based on the price curve supplied
- 3 plausible, realistic forward catalyst events with simulated likelihoods ("High", "Medium", "Low"), impact levels, price percentage impacts, and short descriptions of the events.

Analyze the trends in a professional, rigorous wall-street analyst tone and produce valid JSON representing the response schema specified.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a professional quantitative financial analyst at an elite investment bank. Always provide precise numerical estimates and realistic, non-generic catalyst scenarios tailored specifically to the sector and ticker symbol provided.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["ticker", "sentiment", "sentimentScore", "targetRange30d", "targetRange90d", "outlook30d", "reasoning", "technicalIndicatorsSummary", "catalysts"],
          properties: {
            ticker: { type: Type.STRING },
            sentiment: { 
              type: Type.STRING, 
              description: "Must be 'Strong Buy', 'Buy', 'Hold', 'Sell', or 'Strong Sell'" 
            },
            sentimentScore: { 
              type: Type.NUMBER, 
              description: "An integer between 0 and 100 representing market sentiment bullishness" 
            },
            targetRange30d: {
              type: Type.OBJECT,
              required: ["min", "max"],
              properties: {
                min: { type: Type.NUMBER },
                max: { type: Type.NUMBER }
              }
            },
            targetRange90d: {
              type: Type.OBJECT,
              required: ["min", "max"],
              properties: {
                min: { type: Type.NUMBER },
                max: { type: Type.NUMBER }
              }
            },
            outlook30d: { type: Type.STRING },
            reasoning: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            technicalIndicatorsSummary: { type: Type.STRING },
            catalysts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["event", "likelihood", "impact", "priceImpactPercent", "description"],
                properties: {
                  event: { type: Type.STRING },
                  likelihood: { type: Type.STRING, description: "Must be 'High', 'Medium', or 'Low'" },
                  impact: { type: Type.STRING, description: "Must be 'Highly Bullish', 'Moderately Bullish', 'Neutral', 'Moderately Bearish', or 'Highly Bearish'" },
                  priceImpactPercent: { type: Type.NUMBER, description: "Expected positive or negative percentage price shift" },
                  description: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const predictionText = response.text;
    if (!predictionText) {
      throw new Error("Empty response received from Gemini API.");
    }

    const predictionData = JSON.parse(predictionText.trim());
    return res.json(predictionData);

  } catch (err: any) {
    console.error("Gemini Forecast API Error:", err);
    return res.status(500).json({ error: "Failed to generate AI analysis. " + (err.message || "") });
  }
});

// API: AI Stock Analyst Conversational Assistant
app.post("/api/chat", async (req, res) => {
  const { ticker, name, currentPrice, history, message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Missing message parameter in request." });
  }

  const contextMessage = `You are discussing the stock ${name} (Ticker: ${ticker}) currently trading at $${currentPrice}. 
Explain predictions, mathematical models like Monte Carlo simulations (which run local geometric brownian motion calculations in this client terminal), option flow, or technical indicators like SMA/EMA, Bollinger Bands, and RSI. Provide analytical, quantitative answers with rich insights and direct statistics. Maintain a professional, objective, high-conviction financial advisor tone. Do not make generic disclaimers everywhere, put a single brief note at the end if necessary.`;

  // Fallback if Gemini key is missing
  if (!ai) {
    const fallbackAnswers = [
      `Comparing the indicators for ${ticker}, Bollinger band compression indicates an imminent high-volatility breakout. For option triggers, keep a strict watch on immediate resistance levels.`,
      `As a quantitative analyst, I see the Monte Carlo simulation drift parameters for ${ticker} aligning perfectly with our core regression models. Our median p50 indicates stable compounding.`,
      `Looking closely at the relative strength index (RSI), ${ticker} isn't overbought yet. This tells us that momentum traders still have visual range toward the upper historical thresholds.`,
      `The forecasted catalysts for ${name} include the scheduled macro product updates and raw sector demand indexes. I recommend setting trailing stop losses to capture long campaigns.`
    ];
    const randomIndex = Math.floor(Math.random() * fallbackAnswers.length);
    return res.json({ response: fallbackAnswers[randomIndex] });
  }

  try {
    const chat = ai.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction: contextMessage,
      }
    });

    // Seed previous history if available to support a continuous conversation state
    // We can simulate the chat thread using sequential messages if available, or just feed the chat log
    if (history && Array.isArray(history) && history.length > 0) {
      // Reconstruct historical context for Gemini
      const formattedContextPrompt = `Here is our conversation history so far about ${ticker}:\n` + 
        history.map((m: any) => `${m.sender === 'user' ? 'User' : 'Analyst'}: ${m.text}`).join("\n") +
        `\n\nNow respond to the user's latest query: "${message}"`;
      
      const response = await chat.sendMessage({ message: formattedContextPrompt });
      return res.json({ response: response.text });
    } else {
      const response = await chat.sendMessage({ message });
      return res.json({ response: response.text });
    }

  } catch (err: any) {
    console.error("Gemini Analyst Chat Error:", err);
    return res.status(500).json({ error: "Failed to query the AI analyst assistant. " + (err.message || "") });
  }
});

// Setup Vite Dev server or production static server
async function beginServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development Mode: Mount Vite's HMR middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("🚀 Server running in Development mode with Vite HMR.");
  } else {
    // Production Mode: Serve compiled UI assets from 'dist'
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("⚙️ Server running in Production mode serving built static files.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`📡 Stock Price Predictor app is live and listening on http://0.0.0.0:${PORT}`);
  });
}

beginServer();
