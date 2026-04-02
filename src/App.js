import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { 
  Search, AlertCircle, RefreshCw, ChevronDown, Tag, Gift, MessageCircle, Copy, 
  ArrowUp, Check, Menu, Calendar, ShieldAlert, Youtube, Zap, Camera, 
  CreditCard, TrendingUp, Phone, X, Calculator, Percent, Layers, Box, Wallet, 
  Minus, Plus, IndianRupee, Star, ChevronLeft, ArrowUpDown 
} from 'lucide-react';

// ==========================================
// GLOBALS & UTILS (SamAssist)
// ==========================================
const BASE_SHEET_URL = "https://docs.google.com/spreadsheets/d/1uipnUzwMNwBJWRJ6qhp4RPnlpuBHwYGaWbwEsmatHJY/export?format=csv&gid=";
const IMAGE_DB_URL = "https://docs.google.com/spreadsheets/d/1QRvpQkJeFEdbx6L4zcZ_UT6fByAGz5odsd8HhASCwME/export?format=csv&gid=0";
const WA_CHANNEL_URL = "https://whatsapp.com/channel/0029VaxSwIM9Bb60YWXF8C3v";

const SHEET_TABS = [
  { name: 'A Series', gid: '2014959364' },
  { name: 'S & FE Series', gid: '2085730153' },
  { name: 'M & F Series', gid: '327181163' },
  { name: 'Tab Series', gid: '255331010' },
  { name: 'Gear Bud', gid: '596867009' }
];

// Exact Match of Screenshot Logo
const SamAssistIcon = ({ size = 28, className = "" }) => (
  <div className={`bg-[#111827] text-white rounded-lg flex items-center justify-center ${className}`} style={{ width: size, height: size, minWidth: size }}>
    <IndianRupee size={size * 0.55} strokeWidth={2.5} />
  </div>
);

const isValidDiscount = (val) => {
  if (!val) return false;
  const str = String(val).trim().toUpperCase();
  return str !== '0' && str !== '-' && str !== 'NA' && str !== 'NULL' && str !== 'NO CASHBACK' && str !== '';
};

const isComboOffer = (val) => {
  if (!val) return false;
  return String(val).toUpperCase().replace(/\s+/g, '').includes('+BCB');
};

const splitAmountAndDesc = (text) => {
  if (!text) return { amount: '', desc: '' };
  const str = String(text).trim();
  const match = str.match(/^((?:rs\.?|inr|₹)?\s*\d+[\d,]*\.?\d*)\s*(.*)$/i);
  if (match) return { amount: match[1].trim(), desc: match[2].trim() };
  return { amount: str, desc: '' };
};

const formatSafePrice = (val) => {
  if (!val) return '';
  const str = String(val).trim();
  if (/\d/.test(str) && !str.includes('₹')) return `₹${str}`;
  return str;
};

// Kept for Image Generation mostly, but standardizing display
const splitModelName = (fullName) => {
  if (!fullName) return { title: '', subtitle: '' };
  let title = String(fullName).trim(); let subtitle = "";
  const lastOpen = title.lastIndexOf('('); const lastClose = title.lastIndexOf(')');
  
  if (lastOpen !== -1 && lastClose > lastOpen && lastClose === title.length - 1) {
    const potentialSub = title.substring(lastOpen, lastClose + 1);
    const restOfName = title.substring(0, lastOpen).trim();
    if ((/GB|TB|RAM|ROM/i.test(potentialSub) && /\d/.test(potentialSub)) && !restOfName.includes('(')) {
      title = restOfName; subtitle = potentialSub;
    }
  }
  return { title, subtitle };
};

const parsePriceToNumber = (priceStr) => {
  if (!priceStr) return 0;
  const num = parseInt(String(priceStr).replace(/[^0-9]/g, ''), 10);
  return isNaN(num) ? 0 : num;
};

const formatCurrency = (num) => {
  const value = Number(num);
  if (isNaN(value) || value === 0) return '₹0';
  return '₹' + value.toLocaleString('en-IN');
};

// ==========================================
// PHONE CARD COMPONENT (Matched to Screenshot)
// ==========================================
const PhoneCard = memo(({ phone, isExpanded, isSelectedForCompare, onToggleExpand, onToggleCompare, onCopy, copyStatus, onWhatsApp, onGenerateImage, isGenerating, onOpenCalc }) => {
  const hasBank = isValidDiscount(phone.bank); const hasUpg = isValidDiscount(phone.upgrade);
  const hasSellOut = isValidDiscount(phone.sellOut); const hasSpcl = isValidDiscount(phone.specialUpgrade);
  const isCombo = isComboOffer(phone.specialUpgrade);

  return (
    <div className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${isExpanded ? 'border-slate-300 shadow-md' : 'border-slate-200 hover:border-slate-300 shadow-sm'}`}>
      <div onClick={() => onToggleExpand(phone.id)} className="hover:bg-slate-50 flex justify-between items-center p-3.5 sm:p-4 cursor-pointer transition-colors">
        <div className="flex items-center gap-3 w-2/3 pr-2 min-w-0">
          {phone.imageUrl ? (
            <img src={phone.imageUrl} alt="" loading="lazy" className="w-10 h-10 object-contain shrink-0" />
          ) : (
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0"><Phone className="text-slate-400" size={20} /></div>
          )}
          <div className="flex flex-col min-w-0 pt-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest mb-0.5 text-slate-500">{phone.modelCode}</span>
            {/* Displaying full model name on one line as per screenshot */}
            <h3 className="text-[13px] sm:text-[14px] font-extrabold text-[#111827] leading-tight truncate">{phone.model}</h3>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 shrink-0 pl-1">
          <div className="text-right">
            <p className="text-[9px] font-extrabold uppercase tracking-widest mb-0.5 text-slate-500">MOP</p>
            <p className="text-[15px] sm:text-base font-black text-slate-800">{phone.mop}</p>
          </div>
          {/* Subtle Grey Circle Chevron matching screenshot */}
          <div className={`p-1.5 rounded-full transition-transform duration-300 flex items-center justify-center ${isExpanded ? 'bg-slate-200 text-slate-800 rotate-180' : 'bg-slate-50 border border-slate-200 text-slate-400 rotate-0'}`}>
            <ChevronDown size={14} strokeWidth={2.5} />
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="bg-white px-4 pb-4 pt-1 origin-top animate-fade-in">
          <div className="w-full h-px mb-4 bg-slate-200"></div>
          <div className="flex justify-between items-center bg-slate-50 px-4 py-2.5 mb-5 rounded-lg border border-slate-100">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Dealer Price (DP)</span>
            <span className="text-sm font-black text-slate-800">{phone.dp}</span>
          </div>
          {hasSellOut && (
            <div className="flex flex-col items-center justify-center mb-4">
              <div className="flex items-center justify-center gap-1.5"><Tag size={16} className="text-emerald-600 shrink-0" /><span className="text-sm font-bold shrink-0 text-slate-800">Sellout Support:</span><span className="text-sm font-black text-emerald-700">- {formatSafePrice(splitAmountAndDesc(phone.sellOut).amount)}</span></div>
            </div>
          )}
          {hasUpg && (
            <div className="flex flex-col items-center justify-center mb-4">
              <div className="flex items-center justify-center gap-1.5"><TrendingUp size={16} className="text-purple-600 shrink-0" /><span className="text-sm font-bold shrink-0 text-slate-800">Upgrade Bonus:</span><span className="text-sm font-black text-purple-700">- {formatSafePrice(splitAmountAndDesc(phone.upgrade).amount)}</span></div>
            </div>
          )}
          {hasUpg && hasBank && !isCombo && (
            <div className="flex items-center justify-center my-2 opacity-50"><div className="h-px bg-slate-400 w-12"></div><span className="mx-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">OR</span><div className="h-px bg-slate-400 w-12"></div></div>
          )}
          {hasBank && (
            <div className="flex flex-col items-center justify-center mb-4">
              <div className="flex items-center justify-center gap-1.5"><CreditCard size={16} className="text-blue-600 shrink-0" /><span className="text-sm font-bold shrink-0 text-slate-800">Bank Offer:</span><span className="text-sm font-black text-blue-700">- {formatSafePrice(splitAmountAndDesc(phone.bank).amount)}</span></div>
            </div>
          )}
          {hasSpcl && (
            <div className="flex flex-col items-center justify-center mb-4">
              <div className="flex items-center justify-center gap-1.5"><Zap size={16} className="text-amber-500 shrink-0 fill-amber-500" /><span className="text-sm font-bold shrink-0 text-slate-800">Special Offer:</span><span className="text-sm font-black text-amber-600">{formatSafePrice(splitAmountAndDesc(phone.specialUpgrade).amount)}</span></div>
            </div>
          )}
          <div className="border-slate-900 bg-white shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] hover:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] border-2 rounded-xl p-3 text-center transition-transform mt-2">
            <p className="text-[10px] sm:text-xs font-extrabold uppercase tracking-[0.2em] mb-1 text-slate-500">Effective Price</p>
            <p className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">{phone.effectivePrice}</p>
          </div>
          
          <div className="mt-5 pt-4 border-t border-slate-200">
            <div className="grid grid-cols-4 gap-2 mb-3">
              <button onClick={(e) => { e.stopPropagation(); onCopy(phone); }} className="bg-slate-50 hover:bg-slate-100 text-slate-700 flex flex-col items-center justify-center gap-1 text-[10px] font-bold py-2.5 rounded-xl transition-colors border border-slate-200">
                {copyStatus === phone.id ? <><Check size={16} className="text-green-600"/> Copied</> : <><Copy size={16} /> Copy</>}
              </button>
              <button onClick={(e) => { e.stopPropagation(); onGenerateImage(phone); }} disabled={isGenerating === phone.id} className="bg-blue-50 hover:bg-blue-100 text-blue-700 flex flex-col items-center justify-center gap-1 text-[10px] font-bold py-2.5 rounded-xl transition-colors disabled:opacity-50 border border-blue-100">
                {isGenerating === phone.id ? (<RefreshCw size={16} className="animate-spin" />) : (<><Camera size={16} /> Poster</>)}
              </button>
              <button onClick={(e) => { e.stopPropagation(); onWhatsApp(phone); }} className="bg-[#e6f4ea] hover:bg-[#ceead6] text-[#137333] flex flex-col items-center justify-center gap-1 text-[10px] font-bold py-2.5 rounded-xl transition-colors border border-[#c3e6cb]">
                <MessageCircle size={16} /> WhatsApp
              </button>
              <button onClick={(e) => { e.stopPropagation(); onToggleCompare(phone); }} className={`flex flex-col items-center justify-center gap-1 text-[10px] font-bold py-2.5 rounded-xl transition-all border ${isSelectedForCompare ? 'bg-orange-500 border-orange-500 text-white shadow-inner' : 'bg-orange-50 border-orange-100 text-orange-600'}`}>
                <Layers size={16}/> {isSelectedForCompare ? 'Selected' : 'Compare'}
              </button>
            </div>
            
            <button onClick={(e) => { e.stopPropagation(); onOpenCalc(phone); }} className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-2.5 rounded-xl font-bold text-[11px] sm:text-xs flex items-center justify-center gap-2 transition-colors border border-indigo-100 shadow-sm hover:shadow">
              <Calculator size={16} /> Smart Calculate NLC
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

// ==========================================
// NLC CALCULATOR COMPONENT (Dark Theme w/ AutoFill & Custom Prompts)
// ==========================================
const GlassPane = ({ icon, label, value }) => (
  <div className="bg-white/[0.03] border border-white/10 border-t-white/20 rounded-2xl sm:rounded-[1.5rem] p-3.5 sm:p-4 flex flex-col justify-between shadow-[0_8px_16px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.1)] backdrop-blur-xl relative overflow-hidden group hover:bg-white/[0.05] transition-colors duration-300">
    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
      <div className="p-1 sm:p-1.5 bg-white/5 border border-white/10 rounded-lg shadow-inner group-hover:scale-105 transition-transform duration-300">
        {icon}
      </div>
      <span className="text-white/70 text-[10px] sm:text-[12px] font-semibold tracking-wide uppercase truncate">{label}</span>
    </div>
    <div className="text-lg sm:text-xl font-bold text-white drop-shadow-sm transition-all duration-300">
      {value}
    </div>
  </div>
);

const NlcCalculator = memo(({ onClose, initialData }) => {
  const [inputValue, setInputValue] = useState('');
  const [specialSupport, setSpecialSupport] = useState('');
  const [upgradeCb, setUpgradeCb] = useState('');
  const [series, setSeries] = useState('S'); 
  const [baseType, setBaseType] = useState('DP'); 
  const [schemePercent, setSchemePercent] = useState(6.5);
  const [kroPercent, setKroPercent] = useState(1.5);
  const [copied, setCopied] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [cbPromptAmount, setCbPromptAmount] = useState(null);

  useEffect(() => {
    setIsLoaded(true);
    if (initialData && initialData.model) {
      const categoryStr = (initialData.category || '').toUpperCase();
      const isASeries = categoryStr.includes('A SERIES') || categoryStr.includes('M & F');
      setSeries(isASeries ? 'A' : 'S');

      const dpNum = parsePriceToNumber(initialData.dp);
      const mopNum = parsePriceToNumber(initialData.mop);
      
      if (dpNum > 0) { setBaseType('DP'); setInputValue(dpNum.toString()); } 
      else if (mopNum > 0 && isASeries) { setBaseType('MOP'); setInputValue(mopNum.toString()); } 
      else if (mopNum > 0) { setBaseType('DP'); setInputValue(mopNum.toString()); }

      const spclNum = parsePriceToNumber(splitAmountAndDesc(initialData.specialUpgrade).amount);
      if (spclNum > 0) setSpecialSupport(spclNum.toString());

      const upgNum = parsePriceToNumber(splitAmountAndDesc(initialData.upgrade).amount);
      const bnkNum = parsePriceToNumber(splitAmountAndDesc(initialData.bank).amount);
      
      if (upgNum > 0) { setUpgradeCb(upgNum.toString()); } 
      else if (bnkNum > 0) { setCbPromptAmount(bnkNum); }
    }
  }, [initialData]);

  const rawInput = parseFloat(inputValue) || 0;
  const specialSupportValue = parseFloat(specialSupport) || 0;
  const upgradeCbValue = parseFloat(upgradeCb) || 0;
  
  const isMop = series === 'A' && baseType === 'MOP';
  const actualDp = isMop ? (rawInput / 1.04) : rawInput;
  const mopGap = isMop ? (rawInput - actualDp) : 0;
  
  const inbillMargin = Math.round(actualDp * 0.03);
  const purchaseRate = Math.round(actualDp - inbillMargin); 
  const monthlyBase = Math.max(0, actualDp - specialSupportValue); 
  
  const monthlyScheme = Math.round((monthlyBase / 1.18) * (schemePercent / 100));
  let kroScheme = 0;
  if (series === 'A') kroScheme = Math.round((monthlyBase / 1.18) * (kroPercent / 100));

  const nettMargin = Math.round(inbillMargin + monthlyScheme + kroScheme + mopGap);
  const netLanding = Math.round(rawInput - nettMargin - specialSupportValue - upgradeCbValue);

  const formatCurrencyCalc = (amount) => '₹' + amount.toLocaleString('en-IN');

  const handleCopyCalc = () => {
    if (netLanding !== 0) {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(netLanding.toString());
      } else {
        const textArea = document.createElement("textarea"); textArea.value = netLanding.toString();
        document.body.appendChild(textArea); textArea.select();
        try { document.execCommand('copy'); } catch (err) {}
        document.body.removeChild(textArea);
      }
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    }
  };

  const decreaseScheme = () => { if (schemePercent > 3.0) setSchemePercent(prev => parseFloat((prev - 0.5).toFixed(1))); };
  const increaseScheme = () => { if (schemePercent < 9.5) setSchemePercent(prev => parseFloat((prev + 0.5).toFixed(1))); };
  const decreaseKro = () => { if (kroPercent > 1.0) setKroPercent(prev => parseFloat((prev - 0.5).toFixed(1))); };
  const increaseKro = () => { if (kroPercent < 3.0) setKroPercent(prev => parseFloat((prev + 0.5).toFixed(1))); };

  return (
    <div className="min-h-[100dvh] w-full bg-[#05050A] flex justify-center py-6 px-3 sm:p-6 font-sans text-white relative overflow-y-auto overflow-x-hidden selection:bg-cyan-500/30">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[#030014]"></div>
        <div className={`absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] rounded-full filter blur-[80px] sm:blur-[100px] animate-mesh-1 transition-colors duration-1000 transform-gpu ${series === 'S' ? 'bg-cyan-600/25' : 'bg-fuchsia-600/25'}`}></div>
        <div className={`absolute top-[20%] right-[-20%] w-[50vw] h-[50vw] max-w-[500px] max-h-[500px] rounded-full filter blur-[80px] sm:blur-[100px] animate-mesh-2 transition-colors duration-1000 transform-gpu ${series === 'S' ? 'bg-fuchsia-600/25' : 'bg-amber-600/25'}`}></div>
        <div className={`absolute bottom-[-20%] left-[10%] w-[70vw] h-[70vw] max-w-[700px] max-h-[700px] rounded-full filter blur-[100px] sm:blur-[120px] animate-mesh-3 transition-colors duration-1000 transform-gpu ${series === 'S' ? 'bg-violet-600/25' : 'bg-pink-600/25'}`}></div>
      </div>

      {cbPromptAmount !== null && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl p-6 w-full max-w-xs sm:max-w-sm animate-fade-in-up shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full"></div>
            <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mb-4 shadow-inner"><CreditCard size={24} /></div>
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2 tracking-tight">Apply Bank Cashback?</h3>
            <p className="text-slate-400 text-xs sm:text-sm mb-6 leading-relaxed">This model has a Bank Cashback of <strong className="text-white">₹{cbPromptAmount}</strong>. <br/>Do you want to include it in the NLC calculation?</p>
            <div className="flex gap-3 relative z-10">
              <button onClick={() => { setUpgradeCb(''); setCbPromptAmount(null); }} className="flex-1 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-colors">No, Skip</button>
              <button onClick={() => { setUpgradeCb(cbPromptAmount.toString()); setCbPromptAmount(null); }} className="flex-1 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)] hover:bg-indigo-500 transition-colors">Yes, Apply</button>
            </div>
          </div>
        </div>
      )}

      <div className={`relative z-10 w-full max-w-[420px] my-auto rounded-[2rem] sm:rounded-[2.5rem] p-4 sm:p-6 bg-white/[0.03] backdrop-blur-2xl border border-white/10 border-t-white/20 border-l-white/10 border-b-black/40 border-r-black/40 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2)] app-glass-texture transition-all duration-700 ease-out flex flex-col ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="flex items-center justify-between mb-6 relative z-20">
          <div className="flex items-center gap-3 sm:gap-4">
            <button onClick={onClose} className="p-2 sm:p-2.5 bg-white/[0.05] border border-white/10 rounded-full sm:rounded-xl shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)] backdrop-blur-md hover:bg-white/10 transition-colors"><ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white/80" /></button>
            <div className={`p-2.5 sm:p-3 bg-white/[0.05] border border-white/10 rounded-xl sm:rounded-[1.2rem] shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)] backdrop-blur-md transition-colors duration-500 hidden sm:block`}><Calculator className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors duration-500 ${series === 'S' ? 'text-cyan-300 drop-shadow-[0_0_8px_rgba(103,232,249,0.8)]' : 'text-fuchsia-300 drop-shadow-[0_0_8px_rgba(217,70,239,0.8)]'}`} /></div>
            <div><h1 className="text-lg sm:text-xl font-bold text-white tracking-wide drop-shadow-md">SAMSUNG</h1><p className="text-white/50 text-[10px] sm:text-[11px] font-medium tracking-wide uppercase mt-0.5">NLC Calculator</p></div>
          </div>
          <div className="relative flex items-center bg-black/40 border border-white/10 rounded-full p-1 cursor-pointer shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)] w-[140px] sm:w-[150px] h-8 sm:h-9">
            <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full transition-transform duration-300 ease-out ${series === 'S' ? 'translate-x-0 bg-cyan-500/20 shadow-[0_0_10px_rgba(34,211,238,0.2),inset_0_1px_2px_rgba(255,255,255,0.1)] border border-cyan-400/30' : 'translate-x-[100%] bg-fuchsia-500/20 shadow-[0_0_10px_rgba(217,70,239,0.2),inset_0_1px_2px_rgba(255,255,255,0.1)] border border-fuchsia-400/30'}`}></div>
            <div onClick={() => { setSeries('S'); setBaseType('DP'); }} className={`relative z-10 w-1/2 flex justify-center items-center text-[10px] sm:text-[11px] uppercase tracking-wider font-bold transition-colors duration-300 ${series === 'S' ? 'text-cyan-300' : 'text-white/40 hover:text-white/80'}`}>S-Series</div>
            <div onClick={() => setSeries('A')} className={`relative z-10 w-1/2 flex justify-center items-center text-[10px] sm:text-[11px] uppercase tracking-wider font-bold transition-colors duration-300 ${series === 'A' ? 'text-fuchsia-300' : 'text-white/40 hover:text-white/80'}`}>A-Series</div>
          </div>
        </div>

        {initialData && initialData.model && (
          <div className="mb-4 text-center animate-fade-in">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-extrabold uppercase tracking-widest bg-white/5 border-white/10 ${series === 'S' ? 'text-cyan-300' : 'text-fuchsia-300'}`}><Phone size={12} /> {splitModelName(initialData.model).title}</span>
          </div>
        )}

        <div className={`relative overflow-hidden bg-gradient-to-br border rounded-2xl sm:rounded-[1.5rem] p-4 sm:p-5 mb-6 flex items-center justify-between shadow-[0_8px_32px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.2)] backdrop-blur-xl transition-all duration-700 animate-fade-in-up delay-100 ${series === 'S' ? 'from-cyan-500/10 to-violet-500/10 border-cyan-400/20 border-t-cyan-300/30' : 'from-fuchsia-500/10 to-amber-500/10 border-fuchsia-400/20 border-t-fuchsia-300/30'}`}>
          <div className={`absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent to-transparent transition-colors duration-700 ${series === 'S' ? 'via-cyan-300/50' : 'via-fuchsia-300/50'}`}></div>
          <div className="flex flex-col relative z-10"><div className="flex items-center gap-2 mb-1"><Wallet className={`w-4 h-4 transition-colors duration-500 ${series === 'S' ? 'text-cyan-400' : 'text-fuchsia-400'}`} /><span className={`text-xs sm:text-sm font-bold tracking-wide uppercase transition-colors duration-500 ${series === 'S' ? 'text-cyan-50' : 'text-fuchsia-50'}`}>Final NLC</span></div></div>
          <div className="flex items-center gap-2 sm:gap-3 relative z-10">
            <div className={`text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b drop-shadow-lg tracking-tight transition-colors duration-500 ${series === 'S' ? 'from-white to-cyan-200' : 'from-white to-fuchsia-200'}`}>{formatCurrencyCalc(netLanding)}</div>
            <button onClick={handleCopyCalc} className={`p-2 sm:p-2.5 rounded-[0.8rem] sm:rounded-[1rem] transition-all duration-300 border shadow-inner ${copied ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300 scale-110' : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/70 hover:scale-105 active:scale-95'} ${!copied && (series === 'S' ? 'hover:text-cyan-200' : 'hover:text-fuchsia-200')}`}>{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</button>
          </div>
        </div>

        <div className="space-y-4 mb-6 relative z-20">
          <div className="animate-fade-in-up delay-200">
            <div className="flex justify-between items-center mb-1.5 ml-1.5 mr-1 h-5">
              <label className={`block text-[10px] sm:text-[11px] font-bold tracking-wider uppercase transition-colors duration-500 ${series === 'S' ? 'text-cyan-300/80' : 'text-fuchsia-300/80'}`}>{series === 'S' ? 'Dealer Price (DP)' : `Base Amount (${baseType})`}</label>
              <div className={`flex bg-black/50 rounded-full p-0.5 border border-white/10 shadow-inner w-[76px] relative transition-all duration-500 ${series === 'A' ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none absolute right-1'}`}>
                <div className={`absolute top-[2px] bottom-[2px] w-[calc(50%-2px)] rounded-full bg-fuchsia-500/30 shadow-sm transition-transform duration-300 ease-out ${baseType === 'DP' ? 'translate-x-0' : 'translate-x-[100%]'}`}></div>
                <button onClick={() => setBaseType('DP')} className={`relative z-10 w-1/2 py-[2px] text-[9px] font-bold tracking-wider rounded-full transition-colors duration-300 ${baseType === 'DP' ? 'text-fuchsia-100' : 'text-white/40 hover:text-white/70'}`}>DP</button>
                <button onClick={() => setBaseType('MOP')} className={`relative z-10 w-1/2 py-[2px] text-[9px] font-bold tracking-wider rounded-full transition-colors duration-300 ${baseType === 'MOP' ? 'text-fuchsia-100' : 'text-white/40 hover:text-white/70'}`}>MOP</button>
              </div>
            </div>
            <div className="relative flex items-center group">
              <div className={`absolute left-3.5 sm:left-4 text-white/30 transition-colors duration-300 ${series === 'S' ? 'group-focus-within:text-cyan-400' : 'group-focus-within:text-fuchsia-400'}`}><IndianRupee className="w-4 h-4" /></div>
              <input type="number" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="0" className={`w-full bg-black/40 border border-white/5 border-b-white/10 rounded-2xl sm:rounded-[1.25rem] py-3 sm:py-3.5 pl-10 sm:pl-11 pr-4 text-base sm:text-lg font-bold text-white placeholder-white/20 focus:outline-none focus:bg-black/50 transition-all duration-300 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] ${series === 'S' ? 'focus:border-cyan-500/50' : 'focus:border-fuchsia-500/50'}`} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 animate-fade-in-up delay-300">
            <div>
              <label className="block text-violet-300/80 text-[9px] sm:text-[10px] font-bold mb-1.5 ml-1.5 tracking-wider uppercase truncate transition-opacity">Spl. Support</label>
              <div className="relative flex items-center group">
                <div className="absolute left-3 sm:left-3.5 text-white/30 transition-colors group-focus-within:text-violet-400"><Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></div>
                <input type="number" value={specialSupport} onChange={(e) => setSpecialSupport(e.target.value)} placeholder="0" className="w-full bg-black/40 border border-white/5 border-b-white/10 rounded-2xl sm:rounded-[1.25rem] py-2.5 sm:py-3 pl-9 sm:pl-10 pr-2 sm:pr-3 text-sm sm:text-base font-bold text-white placeholder-white/20 focus:outline-none focus:bg-black/50 focus:border-violet-500/50 transition-all duration-300 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]" />
              </div>
            </div>
            <div>
              <label className="block text-rose-300/80 text-[9px] sm:text-[10px] font-bold mb-1.5 ml-1.5 tracking-wider uppercase truncate transition-opacity">Upgrade / CB</label>
              <div className="relative flex items-center group">
                <div className="absolute left-3 sm:left-3.5 text-white/30 transition-colors group-focus-within:text-rose-400"><Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></div>
                <input type="number" value={upgradeCb} onChange={(e) => setUpgradeCb(e.target.value)} placeholder="0" className="w-full bg-black/40 border border-white/5 border-b-white/10 rounded-2xl sm:rounded-[1.25rem] py-2.5 sm:py-3 pl-9 sm:pl-10 pr-2 sm:pr-3 text-sm sm:text-base font-bold text-white placeholder-white/20 focus:outline-none focus:bg-black/50 focus:border-rose-500/50 transition-all duration-300 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3 relative z-20 flex-grow">
          <div className="grid grid-cols-2 gap-3 animate-fade-in-up delay-400">
            <GlassPane icon={<Percent className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />} label="Inbill (3%)" value={formatCurrencyCalc(inbillMargin)} />
            <GlassPane icon={<Box className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />} label="Purchase Rate" value={formatCurrencyCalc(purchaseRate)} />
          </div>
          <div className="bg-white/[0.03] border border-white/10 border-t-white/20 rounded-2xl sm:rounded-[1.5rem] p-3.5 sm:p-4 flex items-center justify-between shadow-[0_8px_16px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.1)] backdrop-blur-xl relative overflow-hidden transition-all duration-300 hover:bg-white/[0.05] animate-fade-in-up delay-500">
            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-16 sm:w-20 h-16 sm:h-20 bg-violet-500/20 blur-2xl rounded-full"></div>
            <div className="flex-1 flex flex-col justify-between relative z-10">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3"><div className="p-1 sm:p-1.5 bg-violet-500/10 border border-violet-500/20 rounded-lg shadow-inner"><Calculator className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-300" /></div><div className="flex flex-col"><span className="text-white/70 text-[10px] sm:text-[12px] font-semibold tracking-wide uppercase">Monthly Scheme</span><span className="text-violet-300/60 text-[9px] sm:text-[10px] font-bold transition-all">({schemePercent}%)</span></div></div>
              <div className="text-lg sm:text-xl font-bold text-white drop-shadow-sm transition-all duration-300">{formatCurrencyCalc(monthlyScheme)}</div>
            </div>
            <div className="w-[1px] h-10 sm:h-12 bg-gradient-to-b from-transparent via-white/20 to-transparent mx-3 sm:mx-4"></div>
            <div className="flex-1 flex flex-col items-center relative z-10">
              <span className="text-emerald-300/80 text-[8px] sm:text-[9px] font-bold mb-1.5 sm:mb-2 tracking-wider uppercase w-full text-center">Adjust %</span>
              <div className="flex items-center justify-between w-full bg-black/40 shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)] rounded-full p-1 border border-white/5">
                <button onClick={decreaseScheme} className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-90 text-white/50 hover:text-white transition-all"><Minus className="w-3 h-3" /></button>
                <span className="text-xs sm:text-sm font-bold text-white w-8 sm:w-10 text-center drop-shadow-md">{schemePercent}<span className="text-emerald-400 text-[8px] sm:text-[10px]"> %</span></span>
                <button onClick={increaseScheme} className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-90 text-white/50 hover:text-white transition-all"><Plus className="w-3 h-3" /></button>
              </div>
            </div>
          </div>
          <div className={`transition-all duration-500 ease-in-out origin-top overflow-hidden ${series === 'A' ? 'max-h-[150px] opacity-100 mt-3' : 'max-h-0 opacity-0 mt-0 pointer-events-none'}`}>
            <div className="bg-white/[0.03] border border-white/10 border-t-white/20 rounded-2xl sm:rounded-[1.5rem] p-3.5 sm:p-4 flex items-center justify-between shadow-[0_8px_16px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.1)] backdrop-blur-xl relative hover:bg-white/[0.05] transition-colors duration-300">
              <div className="absolute top-1/2 left-0 -translate-y-1/2 w-16 sm:w-20 h-16 sm:h-20 bg-pink-500/20 blur-2xl rounded-full"></div>
              <div className="flex-1 flex flex-col justify-between relative z-10">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3"><div className="p-1 sm:p-1.5 bg-pink-500/10 border border-pink-500/20 rounded-lg shadow-inner"><Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-300" /></div><div className="flex flex-col"><span className="text-white/70 text-[10px] sm:text-[12px] font-semibold tracking-wide uppercase">KRO Scheme</span><span className="text-pink-300/60 text-[9px] sm:text-[10px] font-bold transition-all">({kroPercent}%)</span></div></div>
                <div className="text-lg sm:text-xl font-bold text-white drop-shadow-sm transition-all duration-300">{formatCurrencyCalc(kroScheme)}</div>
              </div>
              <div className="w-[1px] h-10 sm:h-12 bg-gradient-to-b from-transparent via-white/20 to-transparent mx-3 sm:mx-4"></div>
              <div className="flex-1 flex flex-col items-center relative z-10">
                <span className="text-pink-300/80 text-[8px] sm:text-[9px] font-bold mb-1.5 sm:mb-2 tracking-wider uppercase w-full text-center">Adjust %</span>
                <div className="flex items-center justify-between w-full bg-black/40 shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)] rounded-full p-1 border border-white/5">
                  <button onClick={decreaseKro} className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-90 text-white/50 hover:text-white transition-all"><Minus className="w-3 h-3" /></button>
                  <span className="text-xs sm:text-sm font-bold text-white w-8 sm:w-10 text-center drop-shadow-md">{kroPercent}<span className="text-pink-400 text-[8px] sm:text-[10px]"> %</span></span>
                  <button onClick={increaseKro} className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-90 text-white/50 hover:text-white transition-all"><Plus className="w-3 h-3" /></button>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-amber-500/10 via-white/[0.03] to-white/[0.03] border border-amber-500/20 border-t-amber-400/30 rounded-2xl sm:rounded-[1.5rem] p-4 sm:p-5 flex items-center justify-between shadow-[0_8px_16px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.1)] backdrop-blur-xl relative overflow-hidden group hover:border-amber-500/40 transition-all duration-500 mt-1 animate-fade-in-up delay-600">
            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-24 h-24 bg-amber-500/20 blur-[30px] rounded-full pointer-events-none"></div>
            <div className="flex flex-col relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-1.5 sm:p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl shadow-inner group-hover:scale-105 transition-transform duration-300"><Layers className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" /></div>
                <span className="text-white/90 text-[11px] sm:text-[13px] font-bold tracking-widest uppercase drop-shadow-md">Nett Margin</span>
              </div>
              <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isMop ? 'max-h-6 opacity-100 mt-1.5' : 'max-h-0 opacity-0 mt-0'}`}>
                <div className="ml-10 text-[9px] sm:text-[10px] text-amber-300/60 font-medium tracking-wide">(+ MOP Gap: {formatCurrencyCalc(Math.round(mopGap))})</div>
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-amber-200 drop-shadow-[0_2px_10px_rgba(251,191,36,0.3)] relative z-10 transition-all duration-300">
              {formatCurrencyCalc(nettMargin)}
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes mesh-1 { 0% { transform: translate3d(0, 0, 0) scale(1); } 33% { transform: translate3d(5%, -10%, 0) scale(1.1); } 66% { transform: translate3d(-5%, 5%, 0) scale(0.95); } 100% { transform: translate3d(0, 0, 0) scale(1); } }
        @keyframes mesh-2 { 0% { transform: translate3d(0, 0, 0) scale(1); } 33% { transform: translate3d(-10%, 10%, 0) scale(1.1); } 66% { transform: translate3d(5%, -5%, 0) scale(0.9); } 100% { transform: translate3d(0, 0, 0) scale(1); } }
        @keyframes mesh-3 { 0% { transform: translate3d(0, 0, 0) scale(1); } 50% { transform: translate3d(10%, 10%, 0) scale(1.05); } 100% { transform: translate3d(0, 0, 0) scale(1); } }
        .animate-mesh-1 { animation: mesh-1 20s infinite alternate ease-in-out; }
        .animate-mesh-2 { animation: mesh-2 25s infinite alternate ease-in-out; animation-delay: -5s; }
        .animate-mesh-3 { animation: mesh-3 30s infinite alternate ease-in-out; animation-delay: -10s; }
        .app-glass-texture::before { content: ""; position: absolute; inset: 0; border-radius: inherit; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.04'/%3E%3C/svg%3E"); pointer-events: none; z-index: 1; }
      `}</style>
    </div>
  );
});

// ==========================================
// MAIN APP COMPONENT
// ==========================================
export default function App() {
  const [phones, setPhones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [expandedId, setExpandedId] = useState(null);
  const [sortBy, setSortBy] = useState('none');
  const [copyStatus, setCopyStatus] = useState(null);
  const [lastSynced, setLastSynced] = useState(null);
  const [showScroll, setShowScroll] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [sheetDate, setSheetDate] = useState('');
  const [isGeneratingImg, setIsGeneratingImg] = useState(null);
  const [templateModalPhone, setTemplateModalPhone] = useState(null);
  const [compareList, setCompareList] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  
  const [calculatorData, setCalculatorData] = useState(null);
  
  const [storeName, setStoreName] = useState(() => {
    try { return localStorage.getItem('samassist_store_name') || 'Samsung Experience Store'; } 
    catch (e) { return 'Samsung Experience Store'; }
  });

  const [hasAgreed, setHasAgreed] = useState(true);
  const [isOutdated, setIsOutdated] = useState(false);

  useEffect(() => {
    document.title = "SamAssist Pro";
    try {
      if (!localStorage.getItem('samsung_dealer_agreed')) setHasAgreed(false);
    } catch (e) { setHasAgreed(true); }
  }, []);

  useEffect(() => {
    const handleScroll = () => setShowScroll(window.pageYOffset > 300);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const agreeToTerms = () => {
    try { localStorage.setItem('samsung_dealer_agreed', 'true'); } catch (e) {}
    setHasAgreed(true);
  };

  const checkDataAge = (syncTime) => {
    if (!syncTime) return;
    const diffInHours = (new Date() - syncTime) / (1000 * 60 * 60);
    setIsOutdated(diffInHours > 24);
  };

  const csvToArray = (text) => {
    const result = []; let row = []; let inQuotes = false; let val = "";
    for (let i = 0; i < text.length; i++) {
      const char = text[i]; const nextChar = text[i + 1];
      if (char === '"' && inQuotes && nextChar === '"') { val += '"'; i++; } 
      else if (char === '"') inQuotes = !inQuotes;
      else if (char === ',' && !inQuotes) { row.push(val); val = ""; } 
      else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') i++;
        row.push(val); if (row.length > 0 || val.trim() !== "") result.push(row);
        row = []; val = "";
      } else val += char;
    }
    if (val || row.length > 0) { row.push(val); result.push(row); }
    return result;
  };

  const fetchImageDB = async () => {
    try {
      const res = await fetch(IMAGE_DB_URL); if (!res.ok) return {};
      const rows = csvToArray(await res.text());
      const imgMap = {};
      rows.forEach(row => {
        if (row.length >= 2 && row[0] && row[1]) {
          const code = String(row[0]).trim().toUpperCase().replace(/\s+/g, '');
          let url = String(row[1]).trim();
          if (url.includes('drive.google.com/file/d/')) {
            const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
            if (match) url = `https://drive.google.com/uc?export=view&id=${match[1]}`;
          } else if (url.includes('drive.google.com/open?id=')) {
            const match = url.match(/id=([a-zA-Z0-9_-]+)/);
            if (match) url = `https://drive.google.com/uc?export=view&id=${match[1]}`;
          }
          if (url.startsWith('http') && code.length > 0) imgMap[code] = url;
        }
      });
      return imgMap;
    } catch (e) { return {}; }
  };

  const fetchSingleSheet = async ({ name, gid }) => {
    try {
      const res = await fetch(`${BASE_SHEET_URL}${gid}`);
      if (!res.ok) return { data: [], fetchedDate: null };
      const text = await res.text();
      if (text.trim().toLowerCase().startsWith('<!doctype html>')) return { data: [], fetchedDate: null };
      const rows = csvToArray(text);
      if (!rows || rows.length === 0) return { data: [], fetchedDate: null };

      let fetchedDate = null;
      if (rows[0] && rows[0].length > 6) {
        const rawG1 = rows[0][6].trim();
        if (rawG1 && rawG1 !== '') fetchedDate = rawG1;
      }

      let modelIdx = -1, giftIdx = -1, remarksIdx = -1, specialUpgradeIdx = -1, startIdx = 0;
      for (let i = 0; i < Math.min(15, rows.length); i++) {
        const row = rows[i]; if (!row) continue;
        modelIdx = row.findIndex(c => c && c.trim().toUpperCase() === 'MODEL');
        if (modelIdx !== -1) {
          startIdx = i + 1;
          giftIdx = row.findIndex(c => c && c.trim().toUpperCase().includes('GIFT'));
          remarksIdx = row.findIndex(c => c && c.trim().toUpperCase().includes('REMARK'));
          specialUpgradeIdx = row.findIndex(c => c && c.trim().toUpperCase().includes('SPECIAL UPGRADE'));
          break;
        }
      }

      if (modelIdx === -1) return { data: [], fetchedDate };
      const parsedData = [];
      for (let i = startIdx; i < rows.length; i++) {
        const row = rows[i]; if (!row || row.length === 0) continue;
        const getVal = (idx) => (idx < 0 || idx >= row.length || !row[idx]) ? '0' : row[idx].trim();

        const rawModelName = getVal(modelIdx); const upperModelName = rawModelName.toUpperCase();
        if (!rawModelName || upperModelName.includes('MODEL') || rawModelName === '0' || rawModelName === 'NULL' || rawModelName === '') continue;

        const rawModelCode = getVal(0); const dpStr = getVal(modelIdx + 1); const mopStr = getVal(modelIdx + 2);
        const sellOutStr = getVal(modelIdx + 3); const upgradeStr = getVal(modelIdx + 4);
        const bankStr = getVal(modelIdx + 5); const effectiveStr = getVal(modelIdx + 6);

        const cleanVal = (val) => {
          const up = val.toUpperCase();
          return (up === '0' || up === 'NA' || up === '-' || up === 'NULL' || up === '') ? null : val;
        };

        const mopNum = parsePriceToNumber(mopStr); const effNum = parsePriceToNumber(effectiveStr);
        const finalModelCode = (rawModelCode && rawModelCode.length > 2 && rawModelCode.toUpperCase() !== 'MODEL CODE') ? rawModelCode : name;

        parsedData.push({
          id: `${gid}-${i}`, model: rawModelName, modelCode: finalModelCode, category: name,
          dp: dpStr !== '0' && dpStr !== 'NA' && dpStr !== '' ? dpStr : '-',
          mop: mopNum > 0 ? formatCurrency(mopNum) : (mopStr !== '0' && mopStr !== '' ? mopStr : 'TBA'),
          sellOut: sellOutStr !== '0' && sellOutStr !== 'NA' && sellOutStr !== '' ? sellOutStr : '-',
          upgrade: upgradeStr !== '0' && upgradeStr !== 'NA' && upgradeStr !== '' ? upgradeStr : '-',
          bank: bankStr !== '0' && bankStr !== 'NA' && bankStr !== '' ? bankStr : 'No Cashback',
          effectivePrice: effNum > 0 ? formatCurrency(effNum) : (effectiveStr !== '0' && effectiveStr !== '' ? effectiveStr : 'TBA'),
          mopNum, effNum, gift: cleanVal(getVal(giftIdx)), remarks: cleanVal(getVal(remarksIdx)), specialUpgrade: cleanVal(getVal(specialUpgradeIdx)),
          imageUrl: null
        });
      }
      return { data: parsedData, fetchedDate };
    } catch (e) { return { data: [], fetchedDate: null }; }
  };

  const fetchAllData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    setIsRefreshing(true); setError(null);
    try {
      const allResults = await Promise.all(SHEET_TABS.map(tab => fetchSingleSheet(tab)));
      const combined = allResults.reduce((acc, curr) => acc.concat(curr.data || []), []);
      const fDate = allResults.map(r => r.fetchedDate).find(d => d && d.length > 0);
      if (combined.length === 0) throw new Error("No data found.");

      setPhones(combined); if (!isBackground) setLoading(false);
      const imgMap = await fetchImageDB();
      const imgKeys = Object.keys(imgMap).sort((a, b) => b.length - a.length);

      setPhones(prev => {
        const updated = prev.map(p => {
          const cCode = p.modelCode ? p.modelCode.toUpperCase().replace(/\s+/g, '') : '';
          const cModel = p.model ? p.model.toUpperCase().replace(/\s+/g, '') : '';
          let matched = null;
          for (let k of imgKeys) { if (cCode.includes(k) || cModel.includes(k)) { matched = imgMap[k]; break; } }
          return matched ? { ...p, imageUrl: matched } : p;
        });
        
        try {
          const now = new Date();
          localStorage.setItem('samsung_dealer_data', JSON.stringify(updated));
          localStorage.setItem('samsung_dealer_sync_time', now.toISOString());
          if (fDate) { localStorage.setItem('samsung_dealer_sheet_date', fDate); setSheetDate(fDate); }
          setLastSynced(now); setIsOutdated(false);
        } catch(e) {}
        return updated;
      });
    } catch (err) {
      if (phones.length === 0) setError(err.message || "Network error.");
    } finally { setLoading(false); setIsRefreshing(false); }
  };

  useEffect(() => {
    let hasCache = false;
    try {
      const data = localStorage.getItem('samsung_dealer_data');
      const time = localStorage.getItem('samsung_dealer_sync_time');
      const date = localStorage.getItem('samsung_dealer_sheet_date');
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) { setPhones(parsed); hasCache = true; }
        if (time) { const t = new Date(time); setLastSynced(t); checkDataAge(t); }
        if (date) setSheetDate(date);
      }
    } catch(e) {}
    fetchAllData(hasCache);
  }, []);

  const displayPhones = useMemo(() => {
    let filtered = phones.filter(p => {
      if (activeCategory !== 'All' && p.category !== activeCategory) return false;
      if (searchQuery.trim() === '') return true;
      const lowerQ = searchQuery.toLowerCase().trim();
      return String(p.model).toLowerCase().includes(lowerQ) || String(p.modelCode).toLowerCase().includes(lowerQ);
    });
    if (sortBy === 'low') filtered.sort((a, b) => (a.effNum || a.mopNum) - (b.effNum || b.mopNum));
    else if (sortBy === 'high') filtered.sort((a, b) => (b.effNum || b.mopNum) - (a.effNum || a.mopNum));
    return filtered;
  }, [phones, searchQuery, activeCategory, sortBy]);

  const handleToggleExpand = useCallback((id) => { setExpandedId(prev => prev === id ? null : id); setCopyStatus(null); }, []);
  const handleToggleCompare = useCallback((phone) => {
    setCompareList(prev => {
      if (prev.find(p => p.id === phone.id)) return prev.filter(p => p.id !== phone.id);
      if (prev.length >= 3) { alert("Max 3 models allowed."); return prev; }
      return [...prev, phone];
    });
  }, []);
  const clearCompare = useCallback(() => setCompareList([]), []);

  const generateShareText = useCallback((phone) => {
    const sName = splitModelName(phone.model);
    let txt = `📱 *${sName.title}*\n`;
    if (sName.subtitle) txt += `   _${sName.subtitle}_\n`;
    txt += `MOP: *${phone.mop}*\n`;
    
    if (isValidDiscount(phone.sellOut)) { const p = splitAmountAndDesc(phone.sellOut); txt += `🏷️ Sellout: - ${formatSafePrice(p.amount)}\n`; if(p.desc) txt += `   ↳ _(${p.desc})_\n`; }
    if (isValidDiscount(phone.upgrade)) { const p = splitAmountAndDesc(phone.upgrade); txt += `🔄 Upgrade: - ${formatSafePrice(p.amount)}\n`; if(p.desc) txt += `   ↳ _(${p.desc})_\n`; }
    if (isValidDiscount(phone.bank)) { const p = splitAmountAndDesc(phone.bank); txt += `💳 Bank: - ${formatSafePrice(p.amount)}\n`; if(p.desc) txt += `   ↳ _(${p.desc})_\n`; }
    if (isValidDiscount(phone.specialUpgrade)) { const p = splitAmountAndDesc(phone.specialUpgrade); txt += `⚡ Special: ${formatSafePrice(p.amount)}\n`; if(p.desc) txt += `   ↳ _(${p.desc})_\n`; }
    
    txt += `🔥 *Effective Price: ${phone.effectivePrice}*\n\n`;
    if (storeName && storeName.trim()) txt += `📍 *Visit at:* ${storeName.trim()}\n`;
    txt += `\n*(Note: Prices subject to change. Verify before finalizing.)*`;
    return txt;
  }, [storeName]);

  const handleCopy = useCallback((phone) => {
    const txt = generateShareText(phone);
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(txt).then(() => { setCopyStatus(phone.id); setTimeout(() => setCopyStatus(null), 2000); }).catch(() => {});
    } else {
      const el = document.createElement("textarea"); el.value = txt; document.body.appendChild(el); el.select();
      try { document.execCommand('copy'); setCopyStatus(phone.id); setTimeout(() => setCopyStatus(null), 2000); } catch (e) {}
      document.body.removeChild(el);
    }
  }, [generateShareText]);

  const handleWhatsApp = useCallback((phone) => { window.open(`https://wa.me/?text=${encodeURIComponent(generateShareText(phone))}`, '_blank'); }, [generateShareText]);
  const handleOpenTemplateModal = useCallback((phone) => setTemplateModalPhone(phone), []);
  const handleOpenCalculator = useCallback((phone) => setCalculatorData(phone), []);

  const handleGenerateImage = async (phone, templateId) => {
    setTemplateModalPhone(null); setIsGeneratingImg(phone.id);
    try {
      const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = 1920; const ctx = canvas.getContext('2d');
      let imgObj = null;
      if (phone.imageUrl) {
        try { imgObj = await new Promise((res, rej) => { const img = new Image(); img.crossOrigin = "anonymous"; img.onload = () => res(img); img.onerror = rej; img.src = phone.imageUrl; }); } 
        catch (e) {}
      }

      const drawRoundRect = (ctx, x, y, w, h, r) => {
        ctx.beginPath(); ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y); ctx.quadraticCurveTo(x+w, y, x+w, y+r); ctx.lineTo(x+w, y+h-r);
        ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h); ctx.lineTo(x+r, y+h); ctx.quadraticCurveTo(x, y+h, x, y+h-r); ctx.lineTo(x, y+r);
        ctx.quadraticCurveTo(x, y, x+r, y); ctx.closePath();
      };
      const drawWrappedText = (ctx, text, x, y, maxW, lh, align='left') => {
        const words = String(text).split(' '); let line = ''; let lines = [];
        for (let i = 0; i < words.length; i++) {
          const test = line + words[i] + ' '; if (ctx.measureText(test).width > maxW && i > 0) { lines.push(line.trim()); line = words[i] + ' '; } else line = test;
        }
        lines.push(line.trim()); lines.forEach((l, i) => { ctx.textAlign = align; ctx.fillText(l, x, y + (i * lh)); });
        return (lines.length - 1) * lh;
      };

      const sn = splitModelName(phone.model);
      if (templateId === 'default') {
        const grd = ctx.createLinearGradient(0, 0, 1080, 1920); grd.addColorStop(0, '#0f172a'); grd.addColorStop(1, '#1e293b');
        ctx.fillStyle = grd; ctx.fillRect(0, 0, 1080, 1920);
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 65px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('EXCLUSIVE DEAL', 540, 100);
        ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 50; ctx.fillStyle = '#ffffff'; drawRoundRect(ctx, 80, 180, 920, 1360, 40); ctx.fill(); ctx.shadowColor = 'transparent';
        
        let cY = 220;
        if (imgObj) {
          let dW = imgObj.width; let dH = imgObj.height;
          if (dW > 450 || dH > 260) { const ratio = Math.min(450/dW, 260/dH); dW *= ratio; dH *= ratio; }
          ctx.drawImage(imgObj, 540 - (dW/2), cY, dW, dH); cY += dH + 30;
        } else cY = 300;
        
        ctx.fillStyle = '#0f172a'; ctx.font = 'bold 50px sans-serif'; cY += drawWrappedText(ctx, sn.title, 540, cY, 850, 60, 'center') + 50;
        ctx.fillStyle = '#64748b'; ctx.font = 'bold 26px sans-serif'; ctx.fillText(`MOP: ${phone.mop}`, 540, cY); cY += 50;
        
        ctx.fillStyle = '#0f172a'; drawRoundRect(ctx, 140, 1290, 800, 180, 30); ctx.fill();
        ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 24px sans-serif'; ctx.fillText('EFFECTIVE PRICE', 540, 1345);
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 90px sans-serif'; ctx.fillText(phone.effectivePrice, 540, 1430);
      } else {
        ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, 1080, 1920);
        ctx.fillStyle = '#0f172a'; ctx.font = 'bold 65px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('EXCLUSIVE DEAL', 540, 100);
        ctx.shadowColor = 'rgba(0,0,0,0.08)'; ctx.shadowBlur = 40; ctx.fillStyle = '#ffffff'; drawRoundRect(ctx, 80, 180, 920, 1360, 40); ctx.fill(); ctx.shadowColor = 'transparent';
        
        let cY = 220;
        if (imgObj) {
          let dW = imgObj.width; let dH = imgObj.height;
          if (dW > 450 || dH > 260) { const ratio = Math.min(450/dW, 260/dH); dW *= ratio; dH *= ratio; }
          ctx.drawImage(imgObj, 540 - (dW/2), cY, dW, dH); cY += dH + 30;
        } else cY = 300;
        
        ctx.fillStyle = '#0f172a'; ctx.font = 'bold 50px sans-serif'; cY += drawWrappedText(ctx, sn.title, 540, cY, 850, 60, 'center') + 50;
        ctx.fillStyle = '#64748b'; ctx.font = 'bold 26px sans-serif'; ctx.fillText(`MOP: ${phone.mop}`, 540, cY); cY += 50;
        
        ctx.fillStyle = '#f1f5f9'; drawRoundRect(ctx, 140, 1290, 800, 180, 30); ctx.fill();
        ctx.fillStyle = '#64748b'; ctx.font = 'bold 24px sans-serif'; ctx.fillText('EFFECTIVE PRICE', 540, 1345);
        ctx.fillStyle = '#0f172a'; ctx.font = 'bold 90px sans-serif'; ctx.fillText(phone.effectivePrice, 540, 1430);
      }

      ctx.fillStyle = '#475569'; ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Visit at', 540, 1630);
      let sText = storeName ? storeName.toUpperCase() : 'STORE';
      ctx.font = 'bold 42px sans-serif'; ctx.fillStyle = templateId==='default'?'#ffffff':'#0f172a'; ctx.fillText(sText, 540, 1680);

      const link = document.createElement('a'); link.download = `Offer_${sn.title.replace(/\s+/g,'_')}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.95); link.click();
    } catch(e) {} finally { setIsGeneratingImg(null); }
  };

  const categories = ['All', ...SHEET_TABS.map(t => t.name)];

  return (
    <div className="min-h-screen font-sans pb-12 bg-white text-slate-900 relative">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeInUp { 0% { opacity: 0; transform: translateY(15px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        @keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }
        .animate-fade-in { animation: fadeIn 0.2s ease-out forwards; }
        body { overscroll-behavior-y: none; background-color: #f8fafc; }
        input[type="number"]::-webkit-inner-spin-button, input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type="number"] { -moz-appearance: textfield; }
      `}</style>

      {/* OVERLAY NLC CALCULATOR */}
      {calculatorData !== null && (
        <div className="fixed inset-0 z-[200] animate-fade-in-up bg-[#05050A]">
          <NlcCalculator onClose={() => setCalculatorData(null)} initialData={calculatorData} />
        </div>
      )}

      {/* --- Compare Floating Bar --- */}
      {compareList.length > 0 && !showCompareModal && calculatorData === null && (
        <div className="fixed bottom-6 inset-x-0 z-[80] flex justify-center px-4 animate-fade-in-up pointer-events-none">
          <div className="bg-slate-900 text-white rounded-[24px] shadow-2xl p-4 flex flex-col items-center gap-4 border border-slate-700 w-full max-w-sm pointer-events-auto">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-3">
                {compareList.map(p => (
                  <div key={p.id} className="w-9 h-9 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold overflow-hidden shadow-sm">
                    {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" alt=""/> : (p.modelCode || '').substring(0,2)}
                  </div>
                ))}
              </div>
              <span className="text-sm font-bold text-slate-200">{compareList.length} / 3 Selected</span>
            </div>
            <div className="flex items-center justify-center gap-3 w-full">
              <button onClick={clearCompare} className="text-xs font-bold text-slate-300 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors">Clear</button>
              <button onClick={() => setShowCompareModal(true)} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl text-sm font-black transition-colors shadow-lg shadow-blue-900/50">Compare Now</button>
            </div>
          </div>
        </div>
      )}

      {/* --- Compare Modal UI --- */}
      {showCompareModal && calculatorData === null && (
        <div className="fixed inset-0 z-[120] bg-white overflow-y-auto animate-fade-in-up">
          <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center z-10 shadow-sm">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2"><Layers size={20}/> Compare Models</h2>
            <button onClick={() => setShowCompareModal(false)} className="p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200 transition-colors"><X size={20}/></button>
          </div>
          <div className="p-4 max-w-4xl mx-auto">
            <div className="grid grid-cols-4 gap-2 mb-6 border-b pb-4">
              <div className="col-span-1 pt-20 text-[10px] font-black text-slate-400 uppercase">Features</div>
              {compareList.map(p => (
                <div key={p.id} className="col-span-1 flex flex-col items-center text-center gap-2">
                  <div className="w-16 h-16 bg-slate-50 rounded-xl p-2 border flex items-center justify-center">
                    {p.imageUrl ? <img src={p.imageUrl} className="max-h-full object-contain" alt=""/> : <Phone className="text-slate-300"/>}
                  </div>
                  <span className="text-[11px] font-black text-slate-900 leading-tight">{splitModelName(p.model).title}</span>
                  <button onClick={() => handleToggleCompare(p)} className="text-[9px] text-red-500 font-bold hover:underline">Remove</button>
                </div>
              ))}
            </div>

            {[
              { label: 'MOP PRICE', key: 'mop', color: 'text-slate-900' },
              { label: 'EFFECTIVE', key: 'effectivePrice', color: 'text-blue-700 font-black' },
              { label: 'UPGRADE', key: 'upgrade', color: 'text-purple-600' },
              { label: 'BANK OFFER', key: 'bank', color: 'text-emerald-600' },
              { label: 'SELLOUT', key: 'sellOut', color: 'text-slate-600' },
              { label: 'SPECIAL', key: 'specialUpgrade', color: 'text-amber-600' }
            ].map(row => (
              <div key={row.label} className="grid grid-cols-4 gap-2 border-b py-4 items-center hover:bg-slate-50 transition-colors">
                <div className="col-span-1 text-[9px] font-black text-slate-400 uppercase tracking-tighter leading-tight pl-2">{row.label}</div>
                {compareList.map(p => (
                  <div key={p.id} className={`col-span-1 text-center text-[11px] font-bold ${row.color}`}>{p[row.key] || '-'}</div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- Template Selector Modal --- */}
      {templateModalPhone && calculatorData === null && (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-fade-in-up">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative">
            <div className="p-5 text-center border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">Choose Poster Design</h3>
            </div>
            <div className="p-5 grid grid-cols-2 gap-3 bg-slate-50">
              <button onClick={() => handleGenerateImage(templateModalPhone, 'default')} className="flex flex-col items-center justify-center p-4 bg-white border-2 border-slate-200 rounded-2xl hover:border-slate-900 hover:shadow-md transition-all group">
                <div className="w-full h-16 rounded-lg bg-gradient-to-br from-slate-900 to-slate-800 mb-3 shadow-inner relative overflow-hidden"><div className="absolute inset-x-2 top-2 bottom-2 bg-white rounded opacity-90"></div></div>
                <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900">Default Dark</span>
              </button>
              <button onClick={() => handleGenerateImage(templateModalPhone, 'light')} className="flex flex-col items-center justify-center p-4 bg-white border-2 border-slate-200 rounded-2xl hover:border-slate-900 hover:shadow-md transition-all group">
                <div className="w-full h-16 rounded-lg bg-slate-100 border border-slate-200 mb-3 shadow-inner relative overflow-hidden"><div className="absolute inset-x-2 top-2 bottom-2 bg-white rounded shadow-sm"></div></div>
                <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900">Clean Light</span>
              </button>
            </div>
            <div className="p-4 bg-white border-t border-slate-100">
              <button onClick={() => setTemplateModalPhone(null)} className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {!hasAgreed && calculatorData === null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-fade-in-up">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4 mx-auto"><ShieldAlert size={24} /></div>
            <h2 className="text-xl font-extrabold text-center text-slate-900 mb-2">Welcome to SamAssist</h2>
            <button onClick={agreeToTerms} className="mt-6 w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm transition-colors shadow-lg shadow-slate-900/20">I Understand & Agree</button>
          </div>
        </div>
      )}

      {isOutdated && calculatorData === null && (
        <div className="bg-red-500 text-white px-4 py-2 flex items-center justify-between text-xs sm:text-sm font-bold sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-2"><AlertCircle size={16} /><span>Data might be outdated.</span></div>
          <button onClick={() => fetchAllData(false)} className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors">Refresh Now</button>
        </div>
      )}

      {/* Main Header */}
      <header className={`bg-white border-b border-slate-200 shadow-sm ${isOutdated ? 'sticky top-9 z-30' : 'sticky top-0 z-30'}`}>
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2 sm:gap-3 overflow-hidden pr-2">
              <SamAssistIcon size={34} />
              <div className="flex flex-col min-w-0 ml-1">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight truncate leading-none text-[#111827]">SamAssist</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 relative">
              {lastSynced && (
                <div className="hidden sm:flex flex-col items-end justify-center mr-2">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none mb-1">Last Sync</span>
                  <span className="text-[10px] font-bold text-emerald-600 leading-none">{lastSynced.toLocaleDateString() === new Date().toLocaleDateString() ? `Today, ${lastSynced.toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit'})}` : lastSynced.toLocaleDateString()}</span>
                </div>
              )}
              
              <button onClick={() => fetchAllData(false)} className="bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 p-2 rounded-full transition-colors relative" title="Refresh Data">
                {isRefreshing && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full animate-ping"></span>}
                <RefreshCw size={18} className={isRefreshing ? "animate-spin text-emerald-600" : ""} />
              </button>
              
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={`bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 p-2 rounded-full transition-colors flex items-center justify-center ${isMenuOpen ? 'ring-2 ring-slate-300' : ''}`} title="Menu">
                <Menu size={18} />
              </button>
              
              {isMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)}></div>
                  <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl shadow-xl border bg-white border-slate-200 z-50 overflow-hidden animate-fade-in-up">
                    <a href={WA_CHANNEL_URL} target="_blank" rel="noopener noreferrer" className="px-4 py-3.5 flex items-center gap-3 hover:bg-green-50 transition-colors border-b border-slate-100 bg-[#f0fdf4]">
                      <div className="bg-[#25D366] text-white p-2 rounded-full shrink-0"><MessageCircle size={18} /></div>
                      <div className="flex flex-col"><span className="text-[10px] font-extrabold text-green-700 uppercase tracking-wider mb-0.5">Join Our Channel</span><span className="text-sm font-bold text-slate-900">SAMSUNG (Nagpur)</span></div>
                    </a>
                    <div className="px-4 py-3.5 bg-white border-b border-slate-100">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5 block">Your Store Name</label>
                      <input type="text" value={storeName} onChange={(e) => { setStoreName(e.target.value); localStorage.setItem('samassist_store_name', e.target.value); }} placeholder="Enter Store Name" className="w-full text-sm font-bold text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm" />
                    </div>
                    {/* Restored Menu Items */}
                    <div className="px-4 py-3.5 flex items-start gap-3 hover:bg-slate-50 transition-colors border-b border-slate-100">
                      <Calendar size={18} className="text-blue-600 mt-0.5 shrink-0" />
                      <div className="flex flex-col"><span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-0.5">Prices Updated On</span><span className="text-sm font-bold text-slate-800">{sheetDate ? sheetDate : 'Not Available'}</span></div>
                    </div>
                    <a href="https://youtube.com/@MabArena" target="_blank" rel="noopener noreferrer" className="px-4 py-3.5 flex items-start gap-3 hover:bg-slate-50 transition-colors">
                      <Youtube size={18} className="text-red-600 mt-0.5 shrink-0" />
                      <div className="flex flex-col"><span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-0.5">Created By</span><span className="text-sm font-bold text-slate-800">Mab Arena</span></div>
                    </a>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Search className="h-4 w-4 text-slate-400" /></div>
            <input type="text" placeholder="Search model or code..." className="bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-slate-900 block w-full pl-10 pr-4 py-2 sm:py-2.5 border rounded-xl transition-all font-bold text-sm shadow-sm outline-none focus:ring-2 focus:border-transparent" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>

          <div className="flex items-center relative pb-1">
            <div className="relative shrink-0 z-10 mr-3">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={`appearance-none pl-4 pr-8 py-1.5 rounded-full text-xs font-bold transition-all border outline-none cursor-pointer shadow-sm ${sortBy !== 'none' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                <option value="none">Sort</option><option value="low">Low to High</option><option value="high">High to Low</option>
              </select>
            </div>
            <div className="flex overflow-x-auto gap-2 hide-scrollbar scroll-smooth flex-1 relative pr-4">
              {categories.map((category) => (
                <button key={category} onClick={() => setActiveCategory(category)} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${activeCategory === category ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{category}</button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-3 py-5 sm:px-6 relative bg-slate-50">
        {loading && phones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <RefreshCw className="text-slate-400 h-8 w-8 animate-spin mb-4" />
            <p className="font-bold text-sm text-slate-500">Fetching Latest Prices...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {displayPhones.length > 0 ? (
              displayPhones.map((phone, index) => (
                <div key={phone.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 0.03}s` }}>
                  <PhoneCard 
                    phone={phone} 
                    isExpanded={expandedId === phone.id} 
                    isSelectedForCompare={!!compareList.find(p => p.id === phone.id)}
                    onToggleExpand={handleToggleExpand}
                    onToggleCompare={handleToggleCompare}
                    onCopy={handleCopy}
                    copyStatus={copyStatus}
                    onWhatsApp={handleWhatsApp}
                    onGenerateImage={handleOpenTemplateModal}
                    isGenerating={isGeneratingImg}
                    onOpenCalc={handleOpenCalculator}
                  />
                </div>
              ))
            ) : (
              <div className="bg-white border-slate-200 flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-dashed shadow-sm">
                <Search className="text-slate-300 h-10 w-10 mb-3" />
                <h3 className="text-base font-bold text-slate-900">No models found</h3>
                <p className="text-xs font-medium text-slate-500 mt-1">Try another search or refresh data.</p>
              </div>
            )}
          </div>
        )}
      </main>
      
      {showScroll && (
        <button onClick={scrollTop} className="bg-slate-900 hover:bg-slate-800 text-white fixed bottom-6 right-6 p-3.5 rounded-full shadow-xl hover:-translate-y-1 transition-all duration-300 z-50 flex items-center justify-center">
          <ArrowUp size={22} strokeWidth={3} />
        </button>
      )}
    </div>
  );
}


