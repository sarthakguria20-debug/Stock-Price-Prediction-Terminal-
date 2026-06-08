import React, { useState } from "react";
import { StockQuote, PaperPortfolio } from "../types";
import { Landmark, TrendingUp, DollarSign, ListOrdered, ReceiptText, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface PaperTradingProps {
  stock: StockQuote;
  portfolio: PaperPortfolio;
  onExecuteTrade: (type: 'BUY' | 'SELL', shares: number) => void;
}

export default function PaperTrading({ stock, portfolio, onExecuteTrade }: PaperTradingProps) {
  const [tradeShares, setTradeShares] = useState("10");

  const currentPrice = stock.currentPrice;
  const sharesVal = parseFloat(tradeShares) || 0;
  const estimatedCost = sharesVal * currentPrice;

  // Compute portfolio statistics
  const positionsArray = Object.values(portfolio.positions);
  const positionValueSum = positionsArray.reduce((acc, pos) => {
    return acc + pos.shares * currentPrice; // Note: to simplify, we use the active selected stock price for active stats evaluation or its default price
  }, 0);

  const netPortfolioValue = portfolio.cash + positionValueSum;
  const baseInvestment = 100000;
  const totalGainPct = ((netPortfolioValue - baseInvestment) / baseInvestment) * 100;
  const totalGainAbsolute = netPortfolioValue - baseInvestment;
  const totalGainIsPositive = totalGainAbsolute >= 0;

  // Active position details for ONLY the currently selected stock ticker
  const activePosition = portfolio.positions[stock.ticker];

  const handleBuy = (e: React.FormEvent) => {
    e.preventDefault();
    if (sharesVal <= 0) return;
    if (estimatedCost > portfolio.cash) {
      alert("Insufficient cash balance to complete this purchase.");
      return;
    }
    onExecuteTrade('BUY', sharesVal);
    setTradeShares("10");
  };

  const handleSell = (e: React.FormEvent) => {
    e.preventDefault();
    if (sharesVal <= 0) return;
    if (!activePosition || activePosition.shares < sharesVal) {
      alert("Invalid request. You cannot sell more shares than you hold.");
      return;
    }
    onExecuteTrade('SELL', sharesVal);
    setTradeShares("10");
  };

  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-5 mb-5 flex flex-col" id="papertrade-panel">
      
      {/* Panel Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-sm font-display font-medium text-white flex items-center gap-2 uppercase tracking-wide">
            <Landmark className="h-4 w-4 text-emerald-500" />
            Paper Portfolio Simulator
          </h2>
          <p className="text-xs text-white/40 mt-0.5 text-left">
            Trade with $100,000 starting virtual cash. Track real-time performance.
          </p>
        </div>

        {/* Global Net Value Display */}
        <div className="text-left md:text-right bg-[#141414] border border-white/5 px-4 py-2 rounded-xl">
          <span className="text-[9px] uppercase font-bold text-white/40 font-sans block tracking-wider">Net Asset Value (Equity + Cash)</span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-base font-mono font-bold text-white">${netPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className={`text-[11px] font-mono font-bold flex items-center gap-0.5 ${totalGainIsPositive ? "text-emerald-500" : "text-rose-500"}`}>
              {totalGainIsPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              {totalGainIsPositive ? "+" : ""}{totalGainPct.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left column: Buy/Sell Trade form (takes 5 cols) */}
        <div className="md:col-span-4 space-y-4">
          <div className="bg-[#141414] border border-white/5 p-4 rounded-xl space-y-3.5">
            <div className="text-left">
              <span className="text-[9px] uppercase font-bold text-white/40 font-sans block tracking-wider font-semibold">Order Entry</span>
              <h3 className="text-xs font-bold text-white mt-1 flex items-center gap-1 uppercase tracking-wide">
                <span className="font-mono bg-[#0d0d0d] border border-white/10 px-1.5 py-0.5 rounded text-[10px] text-gray-300 mr-1 font-semibold">
                  {stock.ticker}
                </span>
                {stock.name}
              </h3>
            </div>

            {/* Trading quote summary */}
            <div className="grid grid-cols-2 gap-2 text-xs border-y border-white/10 py-2.5">
              <div className="text-left space-y-0.5">
                <span className="text-[9px] text-white/40 block font-semibold uppercase tracking-wider">Quote Price:</span>
                <span className="font-mono font-bold text-white block">${currentPrice.toFixed(2)}</span>
              </div>
              <div className="text-left space-y-0.5">
                <span className="text-[9px] text-white/40 block font-semibold uppercase tracking-wider">Available Cash:</span>
                <span className="font-mono font-bold text-emerald-500 block">${portfolio.cash.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Shares input form */}
            <form className="space-y-3.5 pt-1">
              <div className="text-left">
                <label className="block text-[10px] font-semibold text-white/40 mb-1 uppercase tracking-wider">Quantity of Shares</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={tradeShares}
                    onChange={(e) => setTradeShares(e.target.value)}
                    className="w-full bg-[#0d0d0d] border border-white/10 rounded-lg p-2.5 text-xs text-white font-mono focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition"
                    id="trade-quantity-input"
                  />
                  <span className="absolute right-3 top-2.5 text-[10px] text-white/30 font-mono select-none uppercase font-bold">shares</span>
                </div>
              </div>

              {/* Estimate */}
              <div className="flex justify-between items-center text-xs font-medium border-t border-white/5 pt-2.5">
                <span className="text-white/40 font-sans font-semibold uppercase text-[9px] tracking-wider">Estimated Cost:</span>
                <span className="font-mono font-bold text-white">${estimatedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>

              {/* Action buttons buy / sell */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleBuy}
                  disabled={estimatedCost > portfolio.cash || sharesVal <= 0}
                  className="flex-1 bg-white hover:bg-white/95 disabled:bg-white/10 text-black disabled:text-white/30 font-bold text-[10.5px] py-2.5 rounded-lg transition uppercase tracking-wider cursor-pointer"
                  id="btn-buy-order"
                >
                  Buy Asset
                </button>
                <button
                  type="button"
                  onClick={handleSell}
                  disabled={!activePosition || activePosition.shares < sharesVal || sharesVal <= 0}
                  className="flex-1 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-950/20 disabled:text-white/20 font-bold text-[10.5px] py-2.5 rounded-lg transition text-white uppercase tracking-wider cursor-pointer"
                  id="btn-sell-order"
                >
                  Sell Asset
                </button>
              </div>
            </form>
          </div>

          {/* Holdings details helper */}
          {activePosition ? (
            <div className="bg-[#141414] p-3.5 border border-dashed border-white/10 rounded-xl text-xs text-left space-y-1.5 leading-relaxed font-sans font-medium">
              <div className="flex justify-between font-semibold text-[11px]">
                <span className="text-white/50">Position Held:</span>
                <span className="text-white font-mono">{activePosition.shares} Shares</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-white/40 font-semibold">Average Buy Price:</span>
                <span className="text-white/80 font-mono">${activePosition.avgBuyPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-white/40 font-semibold">Current Value:</span>
                <span className="text-white/80 font-mono">${(activePosition.shares * currentPrice).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-white/5 pt-1.5 text-[11px] font-bold">
                <span className="text-white/55">Unrealized profit:</span>
                <span className={`font-mono font-bold ${currentPrice >= activePosition.avgBuyPrice ? "text-emerald-500" : "text-rose-500"}`}>
                  ${((currentPrice - activePosition.avgBuyPrice) * activePosition.shares).toFixed(2)} (
                  {(((currentPrice - activePosition.avgBuyPrice) / activePosition.avgBuyPrice) * 100).toFixed(2)}%)
                </span>
              </div>
            </div>
          ) : (
            <div className="text-[10.5px] text-white/30 text-center py-4 bg-white/5 border border-dashed border-white/5 rounded-xl font-medium">
              No holdings in <strong className="text-white/50">{stock.ticker}</strong> currently.
            </div>
          )}
        </div>

        {/* Right Column: Positions and History List (takes 8 cols) */}
        <div className="md:col-span-8 space-y-6 text-left">
          
          {/* Active Positions Table Grid */}
          <div className="bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden shadow-xs">
            <span className="bg-[#141414] border-b border-white/10 px-4 py-2.5 text-[10px] uppercase font-bold text-white/40 tracking-widest flex items-center gap-1.5 font-sans">
              <ListOrdered className="h-4 w-4 text-emerald-500" />
              Active Positions Ledger
            </span>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 text-white/30 uppercase text-[9.5px] font-bold border-b border-white/10">
                    <th className="py-2.5 px-4 font-semibold">TICKER</th>
                    <th className="py-2.5 px-4 font-semibold text-right">QUANTITY</th>
                    <th className="py-2.5 px-4 font-semibold text-right">AVG BUY</th>
                    <th className="py-2.5 px-4 font-semibold text-right">CURRENT</th>
                    <th className="py-2.5 px-4 font-semibold text-right">VALUE</th>
                    <th className="py-2.5 px-4 font-semibold text-right max-w-16">P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-[#e0e0e0]" id="positions-table-body">
                  {positionsArray.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 px-4 text-center text-white/30 text-xs">
                        Your virtual positions chest is empty. Initiate a trade order.
                      </td>
                    </tr>
                  ) : (
                    positionsArray.map((pos) => {
                      const isCurrentStock = pos.ticker === stock.ticker;
                      const activeCurrentPrice = isCurrentStock ? currentPrice : pos.avgBuyPrice;
                      const marketValue = pos.shares * activeCurrentPrice;
                      const profitChange = (activeCurrentPrice - pos.avgBuyPrice) * pos.shares;
                      const profitPct = ((activeCurrentPrice - pos.avgBuyPrice) / pos.avgBuyPrice) * 100;
                      const profitIsPositive = profitChange >= 0;

                      return (
                        <tr
                          key={pos.ticker}
                          className="hover:bg-white/5 transition duration-100"
                        >
                          <td className="py-3 px-4">
                            <span className="font-mono bg-[#141414] px-1.5 py-0.5 rounded border border-white/10 text-white font-semibold">
                              {pos.ticker}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold text-right text-white/90">
                            {pos.shares}
                          </td>
                          <td className="py-3 px-4 font-mono text-right text-white/80">
                            ${pos.avgBuyPrice.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 font-mono text-right text-white/80">
                            ${activeCurrentPrice.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 font-mono text-right text-white font-bold">
                            ${marketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className={`py-3 px-4 font-mono font-bold text-right ${profitIsPositive ? "text-emerald-500" : "text-rose-500"}`}>
                            <span>{profitIsPositive ? "+" : ""}{profitChange.toFixed(2)}</span>
                            <span className="block text-[9.5px] font-semibold opacity-70">
                              ({profitIsPositive ? "+" : ""}{profitPct.toFixed(2)}%)
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Transaction History Ledger */}
          <div className="bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden shadow-xs">
            <span className="bg-[#141414] border-b border-white/10 px-4 py-2.5 text-[10px] uppercase font-bold text-white/40 tracking-widest flex items-center gap-1.5 font-sans">
              <ReceiptText className="h-4 w-4 text-emerald-500" />
              Order Execution Audit Ledger
            </span>
            <div className="max-h-[140px] overflow-y-auto">
              <table className="w-full text-[10.5px] border-collapse text-left">
                <thead>
                  <tr className="bg-white/5 text-white/30 uppercase text-[9px] font-bold border-b border-white/10">
                    <th className="py-2 px-4 font-semibold">TIMESTAMP</th>
                    <th className="py-2 px-4 font-semibold">TICKER</th>
                    <th className="py-2 px-4 font-semibold">DIRECTION</th>
                    <th className="py-2 px-4 font-semibold text-right">QUANTITY</th>
                    <th className="py-2 px-4 font-semibold text-right">PRICE</th>
                    <th className="py-2 px-4 font-semibold text-right">TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-[#e0e0e0]" id="history-table-body">
                  {portfolio.history.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-white/30 font-mono text-[10px]">
                        No completed audit entries.
                      </td>
                    </tr>
                  ) : (
                    [...portfolio.history].reverse().map((tx) => {
                      const isBuy = tx.type === 'BUY';
                      return (
                        <tr key={tx.id} className="hover:bg-white/5 transition">
                          <td className="py-2 px-4 text-white/35 font-mono text-[10px]">
                            {tx.timestamp}
                          </td>
                          <td className="py-2 px-4 font-mono font-bold text-white">
                            {tx.ticker}
                          </td>
                          <td className="py-2 px-4 font-bold">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wider ${isBuy ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-500" : "bg-rose-500/10 border border-rose-500/20 text-rose-500"}`}>
                              {tx.type}
                            </span>
                          </td>
                          <td className="py-2 px-4 font-mono text-right text-semibold">
                            {tx.shares}
                          </td>
                          <td className="py-2 px-4 font-mono text-right text-white/80">
                            ${tx.price.toFixed(2)}
                          </td>
                          <td className="py-2 px-4 font-mono text-right text-white font-bold">
                            ${tx.totalCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
