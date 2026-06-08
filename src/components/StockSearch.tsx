import React, { useState } from "react";
import { StockQuote } from "../types";
import { Search, Plus, TrendingUp, TrendingDown, Layers, Landmark } from "lucide-react";

interface StockSearchProps {
  stocks: StockQuote[];
  selectedStock: StockQuote;
  onSelectStock: (stock: StockQuote) => void;
  onAddCustomStock: (ticker: string, companyName: string, price: number) => void;
}

export default function StockSearch({
  stocks,
  selectedStock,
  onSelectStock,
  onAddCustomStock,
}: StockSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Custom stock inputs
  const [newTicker, setNewTicker] = useState("");
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("100");

  const filteredStocks = stocks.filter(
    (s) =>
      s.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicker || !newName || !newPrice) return;
    const priceVal = parseFloat(newPrice);
    if (isNaN(priceVal) || priceVal <= 0) return;
    
    onAddCustomStock(newTicker.toUpperCase().trim(), newName.trim(), priceVal);
    
    // Reset form
    setNewTicker("");
    setNewName("");
    setNewPrice("100");
    setShowAddModal(false);
  };

  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4 h-full flex flex-col" id="stock-search-panel">
      {/* Header and Add button */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-display font-bold text-white tracking-tight uppercase flex items-center gap-2">
          <Layers className="h-4 w-4 text-emerald-500" />
          Market Assets
        </h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-white text-black hover:bg-white/90 px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition duration-150 cursor-pointer"
          title="Add Custom Asset Ticker"
          id="btn-add-custom-stock"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Asset</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/30" />
        <input
          type="text"
          placeholder="Filter ticker or company..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#141414] hover:bg-[#1a1a1a] border border-white/10 rounded-lg py-1.5 pl-9 pr-4 text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition duration-150"
          id="stock-filter-input"
        />
      </div>

      {/* Stock Items Lists */}
      <div className="overflow-y-auto flex-1 space-y-2 pr-1" style={{ maxHeight: "400px" }}>
        {filteredStocks.length === 0 ? (
          <div className="text-center py-6 text-white/30 text-xs">
            No active tickers found.
          </div>
        ) : (
          filteredStocks.map((stock) => {
            const isSelected = stock.ticker === selectedStock.ticker;
            const isUp = stock.dailyChange >= 0;

            return (
              <div
                key={stock.ticker}
                onClick={() => onSelectStock(stock)}
                className={`p-3 rounded-lg cursor-pointer border transition duration-150 text-left ${
                  isSelected
                    ? "bg-white/10 border-white/25 shadow-xs"
                    : "bg-[#0a0a0a] border-white/5 hover:bg-white/5 hover:border-white/10"
                }`}
                id={`stock-item-${stock.ticker}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <span className="font-mono text-xs font-semibold text-white bg-[#141414] px-1.5 py-0.5 rounded mr-2 border border-white/10">
                      {stock.ticker}
                    </span>
                    <span className="text-xs font-semibold text-white/75 truncate max-w-[110px] inline-block align-middle">
                      {stock.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs font-bold text-white">
                      ${stock.currentPrice.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-white/40 font-medium">{stock.sector}</span>
                  <div className={`font-mono font-semibold flex items-center gap-0.5 ${isUp ? "text-emerald-500" : "text-rose-505" || "text-rose-500"}`}>
                    {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    <span>{isUp ? "+" : ""}{stock.changePercent.toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Add Custom Asset dialog overlay */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-5 w-full max-w-sm shadow-2xl relative transition duration-150 text-left">
            <h3 className="text-sm font-display font-semibold text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
              <Landmark className="h-4 w-4 text-emerald-500" />
              Configure Custom Ticker
            </h3>
            
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-white/40 uppercase mb-1">Ticker / Symbol</label>
                <input
                  type="text"
                  maxLength={5}
                  required
                  placeholder="e.g. AMD, BABA, SPY"
                  value={newTicker}
                  onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
                  className="w-full bg-[#141414] border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-white/30"
                  id="add-custom-ticker-input"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-white/40 uppercase mb-1">Company / Asset Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Advanced Micro Devices"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-[#141414] border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-white/30"
                  id="add-custom-name-input"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-white/40 uppercase mb-1">Current Share Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  required
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full bg-[#141414] border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-white/30"
                  id="add-custom-price-input"
                />
                <p className="text-[10px] text-white/30 mt-1">
                  We'll automatically back-populate 180 days of realistic price history using our random walk simulation model.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-[#141414] hover:bg-[#1c1c1c] border border-white/10 text-white/70 rounded-lg py-2 text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-white hover:bg-white/95 text-black rounded-lg py-2 text-xs font-bold transition shadow-md cursor-pointer"
                >
                  Create Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
