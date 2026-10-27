import React, { useState, useMemo } from 'react';
import { 
  MonthlyBreakdown, 
  CategorySummary, 
  ExpenditureItem, 
  ExpenditureCategory, 
  ExpenditureType,
  addExpenditure,
  deleteExpenditure
} from '../expenditureStorage';
import { haptics } from '../haptics';

interface Props {
  breakdown: MonthlyBreakdown;
  selectedMonth: string;
  availableMonths: { value: string; label: string }[];
  onMonthChange: (month: string) => void;
  lang?: 'EN' | 'BN';
}

export const ExpenditureDonutChart: React.FC<Props> = ({
  breakdown,
  selectedMonth,
  availableMonths,
  onMonthChange,
  lang = 'EN'
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'RENTAL' | 'SERVICE'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<ExpenditureCategory | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<ExpenditureCategory | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Expense Form State
  const [formTitle, setFormTitle] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState<ExpenditureCategory>('ELECTRICAL');
  const [formPaymentMethod, setFormPaymentMethod] = useState<'Duyar Wallet' | 'bKash' | 'Nagad' | 'Bank Transfer' | 'Cash'>('Duyar Wallet');
  const [formNotes, setFormNotes] = useState('');

  const isBn = lang === 'BN';

  // Filter category summaries based on filterType
  const filteredSummaries = useMemo(() => {
    if (filterType === 'ALL') return breakdown.categorySummaries;
    return breakdown.categorySummaries.filter(cat => cat.type === filterType);
  }, [breakdown.categorySummaries, filterType]);

  const filteredTotal = useMemo(() => {
    return filteredSummaries.reduce((sum, item) => sum + item.amount, 0);
  }, [filteredSummaries]);

  // SVG Geometry for Donut
  const size = 220;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2; // radius ~ 98
  const circumference = 2 * Math.PI * radius; // ~ 615.75

  // Calculate arc offsets for each category
  const arcs = useMemo(() => {
    if (filteredTotal <= 0) return [];
    let accumulatedOffset = 0;

    return filteredSummaries.map((cat) => {
      const slicePercentage = cat.amount / filteredTotal;
      const strokeLength = slicePercentage * circumference;
      const strokeDashoffset = -accumulatedOffset;
      accumulatedOffset += strokeLength;

      return {
        ...cat,
        slicePercentage: slicePercentage * 100,
        strokeLength,
        strokeDashoffset
      };
    });
  }, [filteredSummaries, filteredTotal, circumference]);

  const activeCategorySummary = useMemo(() => {
    if (!selectedCategory) return null;
    return breakdown.categorySummaries.find(c => c.category === selectedCategory) || null;
  }, [selectedCategory, breakdown.categorySummaries]);

  const handleSliceClick = (category: ExpenditureCategory) => {
    try {
      haptics.selection();
    } catch {}
    if (selectedCategory === category) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(category);
    }
  };

  const handleAddNewExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(formAmount);
    if (!formTitle.trim() || isNaN(parsed) || parsed <= 0) return;

    const isRental = formCategory === 'RENTAL';
    let icon = 'receipt_long';
    let color = '#13ecda';
    let label = 'Expense';

    switch (formCategory) {
      case 'RENTAL':
        icon = 'apartment';
        color = '#13ecda';
        label = 'Apartment Rent';
        break;
      case 'ELECTRICAL':
        icon = 'bolt';
        color = '#f59e0b';
        label = 'Electrical Repair';
        break;
      case 'PLUMBING':
        icon = 'plumbing';
        color = '#06b6d4';
        label = 'Plumbing & Drainage';
        break;
      case 'CLEANING':
        icon = 'sanitizer';
        color = '#10b981';
        label = 'Maid & Cleaning';
        break;
      case 'PICK_DROP':
        icon = 'local_shipping';
        color = '#a855f7';
        label = 'Pick & Drop Logistics';
        break;
      case 'SECURITY':
        icon = 'shield_person';
        color = '#f43f5e';
        label = 'Security & Guard';
        break;
      default:
        icon = 'home_repair_service';
        color = '#e2e8f0';
        label = 'Other Service';
    }

    addExpenditure({
      type: isRental ? 'RENTAL' : 'SERVICE',
      category: formCategory,
      categoryLabel: label,
      title: formTitle.trim(),
      amount: parsed,
      date: new Date().toISOString(),
      paymentMethod: formPaymentMethod,
      color,
      icon,
      notes: formNotes.trim() || undefined
    });

    setFormTitle('');
    setFormAmount('');
    setFormNotes('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="rounded-[2rem] p-6 glass-card border border-white/10 relative overflow-hidden mb-6 shadow-2xl bg-white/[0.02]">
      {/* Subtle Glow Effect in Background */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-44 h-44 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Month Selector */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">donut_large</span>
            <h3 className="text-white text-base font-black uppercase tracking-wider">
              {isBn ? 'মাসিক খরচ বিশ্লেষণ' : 'Monthly Spending Breakdown'}
            </h3>
          </div>
          <p className="text-white/40 text-[11px] font-medium mt-0.5">
            {isBn ? 'ভাড়া ও হোম সার্ভিসের খরচ ট্র্যাক করুন' : 'Rental outflows & on-demand service tracker'}
          </p>
        </div>

        {/* Month Selector Pill */}
        <div className="relative">
          <select
            value={selectedMonth}
            onChange={(e) => {
              try { haptics.selection(); } catch {}
              onMonthChange(e.target.value);
            }}
            className="appearance-none bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-3 py-1.5 pr-8 text-xs font-bold text-primary tracking-wide cursor-pointer focus:outline-none focus:border-primary/50 transition-colors"
          >
            {availableMonths.map((m) => (
              <option key={m.value} value={m.value} className="bg-[#0c1817] text-white">
                {m.label}
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined text-white/50 text-sm absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
            expand_more
          </span>
        </div>
      </div>

      {/* Type Filter Pills (All / Rental / Services) */}
      <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-xl border border-white/5 mb-5 relative z-10">
        <button
          type="button"
          onClick={() => {
            try { haptics.selection(); } catch {}
            setFilterType('ALL');
            setSelectedCategory(null);
          }}
          className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
            filterType === 'ALL'
              ? 'bg-primary text-background-dark shadow-md shadow-primary/20'
              : 'text-white/60 hover:text-white'
          }`}
        >
          All (৳{breakdown.totalSpent.toLocaleString()})
        </button>
        <button
          type="button"
          onClick={() => {
            try { haptics.selection(); } catch {}
            setFilterType('RENTAL');
            setSelectedCategory(null);
          }}
          className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
            filterType === 'RENTAL'
              ? 'bg-primary text-background-dark shadow-md shadow-primary/20'
              : 'text-white/60 hover:text-white'
          }`}
        >
          Rent ({breakdown.rentalPercentage.toFixed(0)}%)
        </button>
        <button
          type="button"
          onClick={() => {
            try { haptics.selection(); } catch {}
            setFilterType('SERVICE');
            setSelectedCategory(null);
          }}
          className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
            filterType === 'SERVICE'
              ? 'bg-primary text-background-dark shadow-md shadow-primary/20'
              : 'text-white/60 hover:text-white'
          }`}
        >
          Services ({breakdown.servicePercentage.toFixed(0)}%)
        </button>
      </div>

      {/* Interactive Donut Chart Visual */}
      <div className="flex flex-col items-center justify-center my-3 relative z-10">
        <div className="relative size-[220px] flex items-center justify-center">
          <svg
            className="w-full h-full -rotate-90 transform"
            viewBox={`0 0 ${size} ${size}`}
          >
            {/* Background Track Circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth={strokeWidth}
            />

            {/* Segment Slices */}
            {arcs.map((slice) => {
              const isSelected = selectedCategory === slice.category;
              return (
                <circle
                  key={slice.category}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth={isSelected ? strokeWidth + 6 : strokeWidth}
                  strokeDasharray={`${slice.strokeLength} ${circumference - slice.strokeLength}`}
                  strokeDashoffset={slice.strokeDashoffset}
                  strokeLinecap="butt"
                  className="transition-all duration-300 cursor-pointer"
                  style={{
                    filter: isSelected
                      ? `drop-shadow(0 0 10px ${slice.color})`
                      : 'none',
                    opacity: selectedCategory && !isSelected ? 0.35 : 1
                  }}
                  onClick={() => handleSliceClick(slice.category)}
                />
              );
            })}
          </svg>

          {/* Central Summary Callout */}
          <div 
            onClick={() => setSelectedCategory(null)}
            className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 cursor-pointer select-none"
            title="Tap to reset view"
          >
            {activeCategorySummary ? (
              <div className="animate-in fade-in zoom-in-95 duration-200">
                <span 
                  className="material-symbols-outlined text-xl mb-0.5 block"
                  style={{ color: activeCategorySummary.color }}
                >
                  {activeCategorySummary.icon}
                </span>
                <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest truncate max-w-[120px] block">
                  {activeCategorySummary.label}
                </span>
                <span className="text-white text-lg font-black tracking-tight block">
                  ৳ {activeCategorySummary.amount.toLocaleString()}
                </span>
                <span 
                  className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full inline-block mt-0.5"
                  style={{ 
                    backgroundColor: `${activeCategorySummary.color}25`,
                    color: activeCategorySummary.color 
                  }}
                >
                  {activeCategorySummary.percentage.toFixed(1)}% of Month
                </span>
              </div>
            ) : (
              <div className="animate-in fade-in duration-200">
                <span className="text-[9px] font-black uppercase tracking-widest text-[#92c9c5] block">
                  {filterType === 'ALL' ? 'Total Outflow' : filterType === 'RENTAL' ? 'Total Rent' : 'Total Services'}
                </span>
                <span className="text-white text-2xl font-black italic tracking-tight block mt-0.5">
                  ৳ {filteredTotal.toLocaleString()}
                </span>
                <span className="text-white/40 text-[9px] font-semibold block mt-0.5">
                  {breakdown.items.length} items logged
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Helper Note */}
        <p className="text-[10px] text-white/40 font-medium text-center mt-2">
          {selectedCategory ? 'Tap center or active slice to show all' : 'Tap any segment to inspect category'}
        </p>
      </div>

      {/* Rental vs Services Quick Ratio Bar */}
      <div className="my-4 p-3.5 rounded-2xl bg-black/40 border border-white/5 relative z-10">
        <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider mb-2">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-primary" />
            <span className="text-white/90">Rental: ৳{breakdown.rentalTotal.toLocaleString()}</span>
            <span className="text-primary font-bold text-[10px]">({breakdown.rentalPercentage.toFixed(0)}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-purple-400" />
            <span className="text-white/90">Services: ৳{breakdown.serviceTotal.toLocaleString()}</span>
            <span className="text-purple-300 font-bold text-[10px]">({breakdown.servicePercentage.toFixed(0)}%)</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden flex">
          <div 
            className="h-full bg-primary transition-all duration-500 shadow-[0_0_8px_rgba(19,236,218,0.5)]"
            style={{ width: `${breakdown.rentalPercentage}%` }}
          />
          <div 
            className="h-full bg-purple-400 transition-all duration-500"
            style={{ width: `${breakdown.servicePercentage}%` }}
          />
        </div>

        {/* Monthly Budget Pace & MoM Trend */}
        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/5 text-[10px]">
          <span className="text-white/50 font-medium flex items-center gap-1">
            <span className="material-symbols-outlined text-xs text-emerald-400">speed</span>
            Budget: {breakdown.budgetUsedPercentage.toFixed(0)}% of ৳{breakdown.budgetCap.toLocaleString()} cap
          </span>
          <span className={`font-bold flex items-center gap-0.5 ${
            breakdown.monthOverMonthDiff <= 0 ? 'text-emerald-400' : 'text-amber-400'
          }`}>
            <span className="material-symbols-outlined text-xs">
              {breakdown.monthOverMonthDiff <= 0 ? 'trending_down' : 'trending_up'}
            </span>
            {Math.abs(breakdown.monthOverMonthDiff).toFixed(1)}% vs last mo
          </span>
        </div>
      </div>

      {/* Category Breakdown List */}
      <div className="space-y-2 mt-4 relative z-10">
        <div className="flex items-center justify-between px-1 mb-2">
          <h4 className="text-white text-xs font-black uppercase tracking-wider">
            {isBn ? 'ক্যাটাগরি ভিত্তিক হিসাব' : 'Category Breakdown'}
          </h4>
          <button
            type="button"
            onClick={() => {
              try { haptics.selection(); } catch {}
              setIsAddModalOpen(true);
            }}
            className="text-primary hover:text-white text-[11px] font-black uppercase tracking-wider flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-xs font-bold">add</span>
            <span>+ Log Expense</span>
          </button>
        </div>

        {filteredSummaries.map((cat) => {
          const isSelected = selectedCategory === cat.category;
          const isExpanded = expandedCategory === cat.category;

          return (
            <div
              key={cat.category}
              className={`rounded-2xl border transition-all overflow-hidden ${
                isSelected
                  ? 'border-primary/60 bg-primary/10 shadow-lg'
                  : 'border-white/5 bg-white/[0.02] hover:border-white/20'
              }`}
            >
              {/* Category Row Header */}
              <div
                onClick={() => handleSliceClick(cat.category)}
                className="p-3.5 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-transform"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="size-10 rounded-xl flex items-center justify-center shrink-0 border"
                    style={{
                      backgroundColor: `${cat.color}20`,
                      borderColor: `${cat.color}40`,
                      color: cat.color
                    }}
                  >
                    <span className="material-symbols-outlined text-xl">{cat.icon}</span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white text-xs font-extrabold truncate">
                        {cat.label}
                      </p>
                      <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase tracking-wider text-white/40 bg-white/5">
                        {cat.count} {cat.count === 1 ? 'txn' : 'txns'}
                      </span>
                    </div>
                    <p className="text-white/40 text-[10px] font-medium capitalize mt-0.5">
                      {cat.type === 'RENTAL' ? 'Fixed Outflow' : 'Home Service'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-white text-sm font-black tracking-tight">
                      ৳ {cat.amount.toLocaleString()}
                    </p>
                    <p 
                      className="text-[10px] font-extrabold uppercase mt-0.5"
                      style={{ color: cat.color }}
                    >
                      {cat.percentage.toFixed(1)}%
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedCategory(isExpanded ? null : cat.category);
                    }}
                    className="size-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white"
                  >
                    <span className="material-symbols-outlined text-base">
                      {isExpanded ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Expanded Transactions Sub-List */}
              {isExpanded && (
                <div className="px-3.5 pb-3.5 pt-1 space-y-2 border-t border-white/5 bg-black/20 animate-in fade-in duration-200">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
                    Recorded Bills & Receipts
                  </p>
                  {cat.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-start justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-white/90 line-clamp-1">
                          {item.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-white/40">
                          <span>{new Date(item.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                          <span>•</span>
                          <span className="text-primary/80">{item.paymentMethod}</span>
                          {item.receiptNo && (
                            <>
                              <span>•</span>
                              <span className="font-mono">{item.receiptNo}</span>
                            </>
                          )}
                        </div>
                        {item.notes && (
                          <p className="text-[10px] text-white/60 italic mt-1">{item.notes}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-bold text-white">
                          ৳ {item.amount.toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => deleteExpenditure(item.id)}
                          className="size-6 rounded flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete entry"
                        >
                          <span className="material-symbols-outlined text-xs">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add / Log Custom Expense Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-[2rem] bg-[#0c1817] border border-primary/30 p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">receipt_long</span>
                </div>
                <h3 className="text-white text-base font-black uppercase tracking-tight">
                  Log Expenditure
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="size-8 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <form onSubmit={handleAddNewExpense} className="space-y-3.5 text-xs">
              {/* Category */}
              <div>
                <label className="block text-white/60 uppercase font-black tracking-wider text-[10px] mb-1">
                  Category
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as ExpenditureCategory)}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-white focus:outline-none focus:border-primary"
                >
                  <option value="RENTAL" className="bg-[#0c1817]">Apartment Monthly Rent</option>
                  <option value="ELECTRICAL" className="bg-[#0c1817]">Electrical & Diagnostics</option>
                  <option value="PLUMBING" className="bg-[#0c1817]">Plumbing & Sanitary</option>
                  <option value="CLEANING" className="bg-[#0c1817]">Maid & Deep Cleaning</option>
                  <option value="PICK_DROP" className="bg-[#0c1817]">Pick & Drop Logistics</option>
                  <option value="SECURITY" className="bg-[#0c1817]">Building Security / Guard</option>
                  <option value="OTHER_SERVICE" className="bg-[#0c1817]">Other Home Maintenance</option>
                </select>
              </div>

              {/* Title / Description */}
              <div>
                <label className="block text-white/60 uppercase font-black tracking-wider text-[10px] mb-1">
                  Description / Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. October Rent or AC Water Pump Repair"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-primary"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-white/60 uppercase font-black tracking-wider text-[10px] mb-1">
                  Amount in BDT (৳)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 28000"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-white placeholder-white/30 font-bold focus:outline-none focus:border-primary"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-white/60 uppercase font-black tracking-wider text-[10px] mb-1">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Duyar Wallet', 'bKash', 'Nagad', 'Bank Transfer', 'Cash'] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setFormPaymentMethod(method)}
                      className={`p-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all text-center ${
                        formPaymentMethod === method
                          ? 'bg-primary text-background-dark border-primary'
                          : 'bg-white/5 text-white/60 border-white/10 hover:border-white/20'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 font-bold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-3 rounded-xl bg-primary hover:bg-[#11d8c7] text-background-dark font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenditureDonutChart;
