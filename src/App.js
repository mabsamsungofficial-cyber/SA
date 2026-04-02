import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { 
  Search, AlertCircle, RefreshCw, ChevronDown, Tag, Gift, MessageCircle, Copy, 
  ArrowUp, Check, Menu, Calendar, ShieldAlert, Youtube, Zap, Camera, 
  CreditCard, TrendingUp, Phone, X, Calculator, Percent, Layers, Box, Wallet, 
  Minus, Plus, IndianRupee, Star, ChevronLeft, ArrowRight
} from 'lucide-react';

// ==========================================
// GLOBALS & UTILS
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

const SamAssistIcon = ({ size = 28, className = "" }) => (
  <div className={`bg-gradient-to-br from-indigo-600 to-violet-800 text-white rounded-lg flex items-center justify-center shadow-md shadow-indigo-500/30 ${className}`} style={{ width: size, height: size, minWidth: size }}>
    <IndianRupee size={size * 0.55} strokeWidth={3} />
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
// COMPACT PHONE CARD COMPONENT
// ==========================================
const PhoneCard = memo(({ phone, isExpanded, isSelectedForCompare, onToggleExpand, onToggleCompare, onCopy, copyStatus, onWhatsApp, onGenerateImage, isGenerating, onOpenCalc }) => {
  const hasBank = isValidDiscount(phone.bank); const hasUpg = isValidDiscount(phone.upgrade);
  const hasSellOut = isValidDiscount(phone.sellOut); const hasSpcl = isValidDiscount(phone.specialUpgrade);
  const isCombo = isComboOffer(phone.specialUpgrade);

  const sellOutDetails = splitAmountAndDesc(phone.sellOut);
  const upgradeDetails = splitAmountAndDesc(phone.upgrade);
  const bankDetails = splitAmountAndDesc(phone.bank);
  const specialDetails = splitAmountAndDesc(phone.specialUpgrade);

  return (
    <div className={`bg-white rounded-[16px] transition-all duration-200 relative ${isExpanded ? 'shadow-md border border-slate-200 z-10' : 'shadow-sm border border-slate-100 hover:border-slate-200'}`}>
      
      {isCombo && (
        <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-bl-lg rounded-tr-[15px] z-10">
          Combo Offer
        </div>
      )}

      <div onClick={() => onToggleExpand(phone.id)} className="flex justify-between items-center p-3 cursor-pointer">
        <div className="flex items-center gap-3 w-[70%] pr-2">
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 p-1">
            {phone.imageUrl ? (
              <img src={phone.imageUrl} alt="" loading="lazy" className="w-full h-full object-contain" />
            ) : (
              <Phone className="text-slate-300" size={18} />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-500 leading-none mb-0.5">{phone.modelCode}</span>
            <h3 className="text-[12px] sm:text-[13px] font-extrabold text-slate-900 leading-[1.1] break-words">{phone.model}</h3>
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="text-right">
            <p className="text-[9px] font-bold uppercase text-slate-400 leading-none mb-0.5">MOP</p>
            <p className="text-[14px] sm:text-[15px] font-black text-slate-900 leading-none">{phone.mop}</p>
          </div>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${isExpanded ? 'bg-indigo-50 text-indigo-600 rotate-180' : 'bg-slate-50 text-slate-400 border border-slate-200 rotate-0'}`}>
            <ChevronDown size={14} strokeWidth={2.5} />
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-3 pb-3 pt-0 animate-fade-in origin-top">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-3">
            <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500">Dealer Price (DP)</span>
              <span className="text-[12px] font-bold text-slate-900">{phone.dp}</span>
            </div>
            
            <div className="space-y-1.5">
              {hasSellOut && (
                <div className="flex flex-col">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5"><Tag size={12} className="text-emerald-500" /><span className="text-[11px] font-medium text-slate-600">Sellout</span></div>
                    <span className="text-[11px] font-bold text-emerald-600">- {formatSafePrice(sellOutDetails.amount)}</span>
                  </div>
                  {sellOutDetails.desc && <div className="text-[9.5px] text-slate-400 text-right mt-0.5 leading-tight">{sellOutDetails.desc}</div>}
                </div>
              )}
              {hasUpg && (
                <div className="flex flex-col">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5"><TrendingUp size={12} className="text-purple-500" /><span className="text-[11px] font-medium text-slate-600">Upgrade</span></div>
                    <span className="text-[11px] font-bold text-purple-600">- {formatSafePrice(upgradeDetails.amount)}</span>
                  </div>
                  {upgradeDetails.desc && <div className="text-[9.5px] text-slate-400 text-right mt-0.5 leading-tight">{upgradeDetails.desc}</div>}
                </div>
              )}
              {hasBank && (
                <div className="flex flex-col">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5"><CreditCard size={12} className="text-blue-500" /><span className="text-[11px] font-medium text-slate-600">Bank Offer</span></div>
                    <span className="text-[11px] font-bold text-blue-600">- {formatSafePrice(bankDetails.amount)}</span>
                  </div>
                  {bankDetails.desc && <div className="text-[9.5px] text-slate-400 text-right mt-0.5 leading-tight">{bankDetails.desc}</div>}
                </div>
              )}
              {hasSpcl && (
                <div className="flex flex-col">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5"><Zap size={12} className="text-amber-500 fill-amber-500" /><span className="text-[11px] font-medium text-slate-600">Special</span></div>
                    <span className="text-[11px] font-bold text-amber-600">{formatSafePrice(specialDetails.amount)}</span>
                  </div>
                  {specialDetails.desc && <div className="text-[9.5px] text-slate-400 text-right mt-0.5 leading-tight">{specialDetails.desc}</div>}
                </div>
              )}
              {(!hasSellOut && !hasUpg && !hasBank && !hasSpcl) && (
                <div className="text-center text-[10px] text-slate-400 py-1">No additional offers</div>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl py-2 px-3 text-center shadow-md relative overflow-hidden mb-3">
            <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-300 mb-0.5 relative z-10">Effective Price</p>
            <p className="text-[18px] sm:text-[20px] font-black tracking-tight text-white relative z-10">{phone.effectivePrice}</p>
          </div>
          
          <div className="grid grid-cols-4 gap-1.5 mb-2.5">
            <button onClick={(e) => { e.stopPropagation(); onCopy(phone); }} className="flex flex-col items-center justify-center gap-1 py-2 rounded-lg transition-all bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-[9px] border border-slate-200">
              {copyStatus === phone.id ? <Check size={14} className="text-green-600"/> : <Copy size={14} />}
              {copyStatus === phone.id ? 'Copied' : 'Copy'}
            </button>
            <button onClick={(e) => { e.stopPropagation(); onGenerateImage(phone); }} disabled={isGenerating === phone.id} className="flex flex-col items-center justify-center gap-1 py-2 rounded-lg transition-all bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[9px] border border-indigo-100 disabled:opacity-50">
              {isGenerating === phone.id ? <RefreshCw size={14} className="animate-spin" /> : <Camera size={14} />}
              Poster
            </button>
            <button onClick={(e) => { e.stopPropagation(); onWhatsApp(phone); }} className="flex flex-col items-center justify-center gap-1 py-2 rounded-lg transition-all bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#166534] font-bold text-[9px] border border-[#BBF7D0]">
              <MessageCircle size={14} className="text-[#22C55E]" />
              Share
            </button>
            <button onClick={(e) => { e.stopPropagation(); onToggleCompare(phone); }} className={`flex flex-col items-center justify-center gap-1 py-2 rounded-lg transition-all font-bold text-[9px] border ${isSelectedForCompare ? 'bg-orange-500 border-orange-500 text-white' : 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200'}`}>
              <Layers size={14}/>
              {isSelectedForCompare ? 'Added' : 'Compare'}
            </button>
          </div>
          
          <button onClick={(e) => { e.stopPropagation(); onOpenCalc(phone); }} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-2.5 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all shadow-sm">
            <Calculator size={14} /> Open Smart Calculator
          </button>
        </div>
      )}
    </div>
  );
});

// ==========================================
// COMPACT NLC CALCULATOR COMPONENT
// ==========================================
const GlassPane = ({ icon, label, value }) => (
  <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col justify-between relative overflow-hidden group transition-colors">
    <div className="flex items-center gap-2 mb-2 relative z-10">
      <div className="p-1.5 bg-white/10 rounded-lg">{icon}</div>
      <span className="text-white/60 text-[9px] font-bold tracking-widest uppercase truncate">{label}</span>
    </div>
    <div className="text-[16px] sm:text-[18px] font-black text-white relative z-10">{value}</div>
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
  const [flatFit3Amount, setFlatFit3Amount] = useState(0); 
  const [copied, setCopied] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [cbPromptAmount, setCbPromptAmount] = useState(null);

  useEffect(() => {
    setIsLoaded(true);
    if (initialData && initialData.model) {
      const categoryStr = (initialData.category || '').toUpperCase();
      const modelStr = (initialData.model || '').toUpperCase();
      const isASeries = categoryStr.includes('A SERIES') || categoryStr.includes('M & F');
      setSeries(isASeries ? 'A' : 'S');

      const dpNum = parsePriceToNumber(initialData.dp);
      const mopNum = parsePriceToNumber(initialData.mop);
      let workingBase = 0;
      
      if (dpNum > 0) { setBaseType('DP'); setInputValue(dpNum.toString()); workingBase = dpNum; } 
      else if (mopNum > 0 && isASeries) { setBaseType('MOP'); setInputValue(mopNum.toString()); workingBase = mopNum / 1.04; } 
      else if (mopNum > 0) { setBaseType('DP'); setInputValue(mopNum.toString()); workingBase = mopNum; }

      const sellOutNum = parsePriceToNumber(splitAmountAndDesc(initialData.sellOut).amount);
      if (sellOutNum > 0) setSpecialSupport(sellOutNum.toString()); else setSpecialSupport('');

      const upgNum = parsePriceToNumber(splitAmountAndDesc(initialData.upgrade).amount);
      const spclUpNum = parsePriceToNumber(splitAmountAndDesc(initialData.specialUpgrade).amount);
      const bnkNum = parsePriceToNumber(splitAmountAndDesc(initialData.bank).amount);
      const totalUpgrade = upgNum + spclUpNum;
      
      if (totalUpgrade > 0) { setUpgradeCb(totalUpgrade.toString()); setCbPromptAmount(null); } 
      else if (bnkNum > 0) { setCbPromptAmount(bnkNum); setUpgradeCb(''); } 
      else { setUpgradeCb(''); setCbPromptAmount(null); }

      let calculatedScheme = 6.5; 
      if (categoryStr.includes('GEAR BUD') || modelStr.includes('WATCH') || modelStr.includes('BUDS') || modelStr.includes('RING') || modelStr.includes('FIT')) {
          if (modelStr.includes('FIT 3')) { calculatedScheme = 0; setFlatFit3Amount(350); } 
          else if (modelStr.includes('BUDS')) calculatedScheme = 15.5;
          else if (modelStr.includes('WATCH') || modelStr.includes('RING')) calculatedScheme = 9.5;
      } else if (categoryStr.includes('M & F SERIES') || modelStr.match(/[MF]\d{2}/)) {
          if (modelStr.includes('M56') || modelStr.includes('F56') || modelStr.includes('F17')) calculatedScheme = workingBase >= 20000 ? 6.5 : 5.5;
          else calculatedScheme = 2.0;
      } else { calculatedScheme = workingBase >= 20000 ? 6.5 : 5.5; }
      
      setSchemePercent(calculatedScheme);
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
  const monthlyScheme = flatFit3Amount > 0 ? flatFit3Amount : Math.round((monthlyBase / 1.18) * (schemePercent / 100));
  let kroScheme = 0;
  if (series === 'A') kroScheme = Math.round((monthlyBase / 1.18) * (kroPercent / 100));

  const nettMargin = Math.round(inbillMargin + monthlyScheme + kroScheme + mopGap);
  const netLanding = Math.round(rawInput - nettMargin - specialSupportValue - upgradeCbValue);

  const formatCurrencyCalc = (amount) => '₹' + amount.toLocaleString('en-IN');

  const handleCopyCalc = () => {
    if (netLanding !== 0) {
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(netLanding.toString());
      else {
        const textArea = document.createElement("textarea"); textArea.value = netLanding.toString(); document.body.appendChild(textArea); textArea.select();
        try { document.execCommand('copy'); } catch (err) {} document.body.removeChild(textArea);
      }
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    }
  };

  const decreaseScheme = () => { if (schemePercent > 0.0) setSchemePercent(prev => parseFloat((prev - 0.5).toFixed(1))); };
  const increaseScheme = () => { if (schemePercent < 20.0) setSchemePercent(prev => parseFloat((prev + 0.5).toFixed(1))); };
  const decreaseKro = () => { if (kroPercent > 1.0) setKroPercent(prev => parseFloat((prev - 0.5).toFixed(1))); };
  const increaseKro = () => { if (kroPercent < 3.0) setKroPercent(prev => parseFloat((prev + 0.5).toFixed(1))); };

  return (
    <div className="min-h-[100dvh] w-full bg-[#0a0a0f] flex justify-center items-center p-3 font-sans text-white relative">
      {cbPromptAmount !== null && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4">
          <div className="bg-[#12121a] border border-white/10 rounded-2xl p-5 w-full max-w-[320px] shadow-2xl animate-fade-in-up">
            <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mb-4"><CreditCard size={20} /></div>
            <h3 className="text-lg font-bold text-white mb-2">Apply Bank Cashback?</h3>
            <p className="text-white/60 text-xs mb-5">Bank Cashback is <strong className="text-white">₹{cbPromptAmount}</strong>. Include it?</p>
            <div className="flex gap-2">
              <button onClick={() => { setUpgradeCb(''); setCbPromptAmount(null); }} className="flex-1 py-2.5 rounded-lg font-bold text-xs bg-white/5 border border-white/10 text-white/70">Skip</button>
              <button onClick={() => { setUpgradeCb(cbPromptAmount.toString()); setCbPromptAmount(null); }} className="flex-1 py-2.5 rounded-lg font-bold text-xs bg-indigo-600 text-white">Apply</button>
            </div>
          </div>
        </div>
      )}

      <div className={`relative w-full max-w-[400px] rounded-[24px] p-4 bg-[#16161f]/90 backdrop-blur-xl border border-white/10 shadow-2xl transition-all duration-500 flex flex-col ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full"><ChevronLeft className="w-5 h-5 text-white/80" /></button>
            <div>
              <h1 className="text-[16px] font-black leading-tight text-white">NLC Calc</h1>
            </div>
          </div>
          <div className="bg-black/50 p-1 rounded-full border border-white/5 flex relative">
             <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full transition-transform duration-300 ease-out z-0 ${series === 'S' ? 'translate-x-0 bg-white/10' : 'translate-x-[100%] bg-white/10'}`}></div>
             <button onClick={() => { setSeries('S'); setBaseType('DP'); }} className={`relative z-10 px-3 py-1 text-[10px] font-bold rounded-full ${series === 'S' ? 'text-white' : 'text-white/40'}`}>S-Series</button>
             <button onClick={() => setSeries('A')} className={`relative z-10 px-3 py-1 text-[10px] font-bold rounded-full ${series === 'A' ? 'text-white' : 'text-white/40'}`}>A-Series</button>
          </div>
        </div>

        {initialData && initialData.model && (
          <div className="mb-4 text-center">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase bg-white/5 border-white/10`}>
              <Phone size={12} className={series === 'S' ? 'text-blue-400' : 'text-purple-400'} /> 
              {splitModelName(initialData.model).title}
            </span>
          </div>
        )}

        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-4 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-white/60 text-[10px] font-bold uppercase mb-0.5">Final NLC</span>
            <div className="text-2xl sm:text-3xl font-black text-white">{formatCurrencyCalc(netLanding)}</div>
          </div>
          <button onClick={handleCopyCalc} className={`p-2.5 rounded-xl border ${copied ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-400' : 'bg-black/40 border-white/10 text-white/70'}`}>
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>

        <div className="space-y-3 mb-4">
          <div>
            <div className="flex justify-between items-center mb-1.5 px-1">
              <label className="text-[10px] font-bold text-white/50 uppercase">{series === 'S' ? 'Dealer Price (DP)' : `Base Amount`}</label>
              <div className={`flex bg-black/40 rounded-md p-0.5 border border-white/5 ${series === 'A' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <button onClick={() => setBaseType('DP')} className={`px-2 py-0.5 text-[9px] font-bold rounded ${baseType === 'DP' ? 'bg-white/20 text-white' : 'text-white/40'}`}>DP</button>
                <button onClick={() => setBaseType('MOP')} className={`px-2 py-0.5 text-[9px] font-bold rounded ${baseType === 'MOP' ? 'bg-white/20 text-white' : 'text-white/40'}`}>MOP</button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"><IndianRupee size={16} /></div>
              <input type="number" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="0" className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-9 pr-3 text-[16px] font-bold text-white focus:outline-none focus:border-white/30" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-white/50 uppercase mb-1.5 px-1">Support</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"><Tag size={14} /></div>
                <input type="number" value={specialSupport} onChange={(e) => setSpecialSupport(e.target.value)} placeholder="0" className="w-full bg-black/30 border border-white/10 rounded-xl py-2.5 pl-8 pr-2 text-[14px] font-bold text-white focus:outline-none focus:border-white/30" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-white/50 uppercase mb-1.5 px-1">Upg/CB</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"><Gift size={14} /></div>
                <input type="number" value={upgradeCb} onChange={(e) => setUpgradeCb(e.target.value)} placeholder="0" className="w-full bg-black/30 border border-white/10 rounded-xl py-2.5 pl-8 pr-2 text-[14px] font-bold text-white focus:outline-none focus:border-white/30" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <GlassPane icon={<Percent className="w-4 h-4 text-emerald-400" />} label="Inbill (3%)" value={formatCurrencyCalc(inbillMargin)} />
            <GlassPane icon={<Box className="w-4 h-4 text-blue-400" />} label="Purchase" value={formatCurrencyCalc(purchaseRate)} />
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1 bg-indigo-500/20 rounded"><Calculator className="w-3 h-3 text-indigo-400" /></div>
                <span className="text-white/60 text-[9px] font-bold uppercase">M. Scheme <span className="text-indigo-400">{flatFit3Amount > 0 ? '(Flat)' : `${schemePercent}%`}</span></span>
              </div>
              <div className="text-[16px] font-black text-white">{formatCurrencyCalc(monthlyScheme)}</div>
            </div>
            <div className="flex items-center bg-black/40 rounded-lg p-1 border border-white/5">
              <button onClick={decreaseScheme} disabled={flatFit3Amount > 0} className="p-1.5 text-white/50 hover:text-white"><Minus size={12} /></button>
              <span className="text-[12px] font-bold text-white w-6 text-center">{flatFit3Amount > 0 ? '-' : schemePercent}</span>
              <button onClick={increaseScheme} disabled={flatFit3Amount > 0} className="p-1.5 text-white/50 hover:text-white"><Plus size={12} /></button>
            </div>
          </div>

          <div className={`transition-all duration-300 overflow-hidden ${series === 'A' ? 'max-h-[100px] opacity-100' : 'max-h-0 opacity-0 m-0'}`}>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1 bg-pink-500/20 rounded"><Star className="w-3 h-3 text-pink-400" /></div>
                  <span className="text-white/60 text-[9px] font-bold uppercase">KRO <span className="text-pink-400">{kroPercent}%</span></span>
                </div>
                <div className="text-[16px] font-black text-white">{formatCurrencyCalc(kroScheme)}</div>
              </div>
              <div className="flex items-center bg-black/40 rounded-lg p-1 border border-white/5">
                <button onClick={decreaseKro} className="p-1.5 text-white/50 hover:text-white"><Minus size={12} /></button>
                <span className="text-[12px] font-bold text-white w-6 text-center">{kroPercent}</span>
                <button onClick={increaseKro} className="p-1.5 text-white/50 hover:text-white"><Plus size={12} /></button>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between mt-1">
            <div className="flex flex-col">
              <span className="text-amber-400/80 text-[10px] font-bold uppercase mb-0.5">Total Nett Margin</span>
              {isMop && <span className="text-[9px] text-amber-500/60 font-bold">+ MOP Gap: {formatCurrencyCalc(Math.round(mopGap))}</span>}
            </div>
            <div className="text-[18px] font-black text-amber-400">{formatCurrencyCalc(nettMargin)}</div>
          </div>
        </div>
      </div>
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
    try { return localStorage.getItem('samassist_store_name') || 'Samsung Store'; } 
    catch (e) { return 'Samsung Store'; }
  });

  const [hasAgreed, setHasAgreed] = useState(true);
  const [isOutdated, setIsOutdated] = useState(false);

  useEffect(() => {
    document.title = "SamAssist Pro";
    try { if (!localStorage.getItem('samsung_dealer_agreed')) setHasAgreed(false); } catch (e) { setHasAgreed(true); }
  }, []);

  useEffect(() => {
    const handleScroll = () => setShowScroll(window.pageYOffset > 200);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const agreeToTerms = () => { try { localStorage.setItem('samsung_dealer_agreed', 'true'); } catch (e) {} setHasAgreed(true); };

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
        row.push(val); if (row.length > 0 || val.trim() !== "") result.push(row); row = []; val = "";
      } else val += char;
    }
    if (val || row.length > 0) { row.push(val); result.push(row); }
    return result;
  };

  const fetchImageDB = async () => {
    try {
      const res = await fetch(IMAGE_DB_URL); if (!res.ok) return {};
      const rows = csvToArray(await res.text()); const imgMap = {};
      rows.forEach(row => {
        if (row.length >= 2 && row[0] && row[1]) {
          const code = String(row[0]).trim().toUpperCase().replace(/\s+/g, '');
          let url = String(row[1]).trim();
          if (url.includes('drive.google.com/file/d/')) {
            const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/); if (match) url = `https://drive.google.com/uc?export=view&id=${match[1]}`;
          } else if (url.includes('drive.google.com/open?id=')) {
            const match = url.match(/id=([a-zA-Z0-9_-]+)/); if (match) url = `https://drive.google.com/uc?export=view&id=${match[1]}`;
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
        const rawG1 = rows[0][6].trim(); if (rawG1 && rawG1 !== '') fetchedDate = rawG1;
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
    if (!isBackground) setLoading(true); setIsRefreshing(true); setError(null);
    try {
      const allResults = await Promise.all(SHEET_TABS.map(tab => fetchSingleSheet(tab)));
      const combined = allResults.reduce((acc, curr) => acc.concat(curr.data || []), []);
      const fDate = allResults.map(r => r.fetchedDate).find(d => d && d.length > 0);
      if (combined.length === 0) throw new Error("No data found.");

      setPhones(combined); if (!isBackground) setLoading(false);
      const imgMap = await fetchImageDB(); const imgKeys = Object.keys(imgMap).sort((a, b) => b.length - a.length);

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
    <div className="min-h-screen font-sans pb-12 bg-[#F8FAFC] text-slate-900 relative">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeInUp { 0% { opacity: 0; transform: translateY(10px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fadeInUp 0.3s ease-out forwards; opacity: 0; }
        @keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }
        .animate-fade-in { animation: fadeIn 0.2s ease-out forwards; }
        body { overscroll-behavior-y: none; }
        input[type="number"]::-webkit-inner-spin-button, input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type="number"] { -moz-appearance: textfield; }
      `}</style>

      {calculatorData !== null && (
        <div className="fixed inset-0 z-[200] animate-fade-in bg-[#0a0a0f]">
          <NlcCalculator onClose={() => setCalculatorData(null)} initialData={calculatorData} />
        </div>
      )}

      {compareList.length > 0 && !showCompareModal && calculatorData === null && (
        <div className="fixed bottom-4 inset-x-0 z-[80] flex justify-center px-3 animate-fade-in pointer-events-none">
          <div className="bg-white/90 backdrop-blur-xl border border-slate-200 rounded-[20px] shadow-lg p-3 flex items-center justify-between gap-3 w-full max-w-sm pointer-events-auto">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-3">
                {compareList.map(p => (
                  <div key={p.id} className="w-8 h-8 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center text-[8px] font-bold overflow-hidden shadow-sm">
                    {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" alt=""/> : (p.modelCode || '').substring(0,2)}
                  </div>
                ))}
              </div>
              <span className="text-[11px] font-extrabold text-slate-700 leading-tight">{compareList.length}/3</span>
            </div>
            <div className="flex gap-2">
              <button onClick={clearCompare} className="text-[10px] font-bold text-slate-500 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200">Clear</button>
              <button onClick={() => setShowCompareModal(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-sm">Compare <ArrowRight size={12}/></button>
            </div>
          </div>
        </div>
      )}

      {showCompareModal && calculatorData === null && (
        <div className="fixed inset-0 z-[120] bg-[#F8FAFC] overflow-y-auto animate-fade-in">
          <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 flex justify-between items-center z-10 shadow-sm">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2"><Layers size={18} className="text-indigo-600"/> Compare</h2>
            <button onClick={() => setShowCompareModal(false)} className="p-1.5 bg-slate-100 rounded-full text-slate-600"><X size={18}/></button>
          </div>
          <div className="p-3 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="grid grid-cols-4 gap-1.5 bg-slate-50 p-2 border-b border-slate-100">
                <div className="col-span-1 pt-12 text-[9px] font-bold text-slate-400 uppercase text-center">Models</div>
                {compareList.map(p => (
                  <div key={p.id} className="col-span-1 flex flex-col items-center text-center gap-1.5">
                    <div className="w-10 h-10 bg-white rounded-xl p-1 border border-slate-100 flex items-center justify-center">
                      {p.imageUrl ? <img src={p.imageUrl} className="max-h-full object-contain" alt=""/> : <Phone className="text-slate-300" size={16}/>}
                    </div>
                    <span className="text-[9px] font-bold text-slate-900 leading-tight break-words px-1">{splitModelName(p.model).title}</span>
                    <button onClick={() => handleToggleCompare(p)} className="text-[8px] text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded-full">Remove</button>
                  </div>
                ))}
              </div>

              {[
                { label: 'MOP', key: 'mop', color: 'text-slate-900 font-bold' },
                { label: 'Effective', key: 'effectivePrice', color: 'text-indigo-700 font-black bg-indigo-50/50' },
                { label: 'Upgrade', key: 'upgrade', color: 'text-purple-600 font-semibold' },
                { label: 'Bank', key: 'bank', color: 'text-emerald-600 font-semibold' },
                { label: 'Sellout', key: 'sellOut', color: 'text-slate-600 font-semibold' },
                { label: 'Special', key: 'specialUpgrade', color: 'text-amber-600 font-semibold' }
              ].map((row) => (
                <div key={row.label} className={`grid grid-cols-4 gap-1.5 border-b border-slate-100 last:border-0 py-3 items-center ${row.key === 'effectivePrice' ? 'bg-indigo-50/30' : ''}`}>
                  <div className="col-span-1 text-[9px] font-bold text-slate-500 uppercase text-center">{row.label}</div>
                  {compareList.map(p => (
                    <div key={p.id} className={`col-span-1 text-center text-[10px] sm:text-[11px] ${row.color}`}>{p[row.key] || '-'}</div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {templateModalPhone && calculatorData === null && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-[24px] w-full max-w-[320px] overflow-hidden shadow-2xl relative">
            <div className="p-4 text-center border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900">Poster Design</h3>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3 bg-slate-50">
              <button onClick={() => handleGenerateImage(templateModalPhone, 'default')} className="flex flex-col items-center p-3 bg-white border border-slate-200 rounded-xl hover:border-slate-800 transition-all">
                <div className="w-full h-12 rounded-lg bg-slate-800 mb-2"></div>
                <span className="text-[10px] font-bold text-slate-700">Dark Mode</span>
              </button>
              <button onClick={() => handleGenerateImage(templateModalPhone, 'light')} className="flex flex-col items-center p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-500 transition-all">
                <div className="w-full h-12 rounded-lg bg-slate-100 border border-slate-200 mb-2"></div>
                <span className="text-[10px] font-bold text-slate-700">Light Mode</span>
              </button>
            </div>
            <div className="p-3 bg-white border-t border-slate-100">
              <button onClick={() => setTemplateModalPhone(null)} className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px]">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {!hasAgreed && calculatorData === null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[24px] shadow-2xl max-w-[320px] w-full p-6 text-center animate-fade-in">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4 mx-auto"><ShieldAlert size={24} /></div>
            <h2 className="text-lg font-black text-slate-900 mb-2">SamAssist Pro</h2>
            <p className="text-[11px] text-slate-500 mb-5 leading-relaxed">Internal dealer app. Please verify all prices manually before final billing.</p>
            <button onClick={agreeToTerms} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-[12px]">I Agree</button>
          </div>
        </div>
      )}

      {isOutdated && calculatorData === null && (
        <div className="bg-red-50 text-red-600 px-3 py-2 flex items-center justify-between text-[10px] font-bold sticky top-0 z-40 border-b border-red-100">
          <div className="flex items-center gap-1.5"><AlertCircle size={14} /><span>Data might be outdated.</span></div>
          <button onClick={() => fetchAllData(false)} className="bg-red-100 px-2.5 py-1 rounded-md text-red-700">Refresh</button>
        </div>
      )}

      <header className={`bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm ${isOutdated ? 'sticky top-8 z-30' : 'sticky top-0 z-30'}`}>
        <div className="max-w-4xl mx-auto px-3 py-3">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <SamAssistIcon size={30} />
              <div className="flex flex-col">
                <h1 className="text-[16px] font-black leading-none text-slate-900 tracking-tight">SamAssist</h1>
                <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest mt-0.5">Dealer Pro</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5">
              <button onClick={() => setCalculatorData({})} className="bg-indigo-50 text-indigo-600 w-8 h-8 rounded-lg flex items-center justify-center shadow-sm">
                <Calculator size={16} strokeWidth={2.5} />
              </button>
              <button onClick={() => fetchAllData(false)} className="bg-slate-50 text-slate-600 border border-slate-200 w-8 h-8 rounded-lg flex items-center justify-center shadow-sm relative">
                {isRefreshing && <span className="absolute top-0 right-0 w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>}
                <RefreshCw size={14} className={isRefreshing ? "animate-spin text-emerald-600" : ""} />
              </button>
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="bg-slate-900 text-white w-8 h-8 rounded-lg flex items-center justify-center shadow-sm">
                <Menu size={16} />
              </button>
              
              {isMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)}></div>
                  <div className="absolute right-3 top-[50px] w-64 rounded-[16px] shadow-xl border border-slate-200 bg-white z-50 animate-fade-in origin-top-right overflow-hidden">
                    <a href={WA_CHANNEL_URL} target="_blank" rel="noopener noreferrer" className="px-4 py-3 flex items-center gap-2 bg-[#F0FDF4] border-b border-slate-100">
                      <div className="bg-green-500 text-white p-1.5 rounded-lg"><MessageCircle size={14} /></div>
                      <div className="flex flex-col"><span className="text-[9px] font-bold text-green-600 uppercase">Community</span><span className="text-[12px] font-black text-slate-900">WhatsApp Group</span></div>
                    </a>
                    <div className="px-4 py-3 border-b border-slate-100">
                      <label className="text-[9px] font-bold text-slate-400 uppercase mb-1.5 block">Store Name</label>
                      <input type="text" value={storeName} onChange={(e) => { setStoreName(e.target.value); localStorage.setItem('samassist_store_name', e.target.value); }} placeholder="Enter Store Name" className="w-full text-[11px] font-bold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-indigo-500" />
                    </div>
                    <div className="px-4 py-3 flex items-center gap-2 border-b border-slate-100">
                      <div className="bg-blue-50 text-blue-600 p-1.5 rounded-lg"><Calendar size={14} /></div>
                      <div className="flex flex-col"><span className="text-[9px] font-bold text-slate-400 uppercase">Sheet Date</span><span className="text-[11px] font-bold text-slate-800">{sheetDate || 'N/A'}</span></div>
                    </div>
                    <a href="https://youtube.com/@MabArena" target="_blank" rel="noopener noreferrer" className="px-4 py-3 flex items-center gap-2">
                      <div className="bg-red-50 text-red-600 p-1.5 rounded-lg"><Youtube size={14} /></div>
                      <div className="flex flex-col"><span className="text-[9px] font-bold text-slate-400 uppercase">Developer</span><span className="text-[11px] font-bold text-slate-800">Mab Arena</span></div>
                    </a>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="relative mb-3">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-4 w-4 text-slate-400" /></div>
            <input type="text" placeholder="Search models or codes..." className="bg-slate-100 border-none text-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-300 w-full pl-9 pr-3 py-2.5 rounded-xl text-[12px] font-bold shadow-inner outline-none" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>

          <div className="flex items-center relative">
            <div className="relative shrink-0 z-10 mr-2">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={`appearance-none pl-3 pr-7 py-1.5 rounded-lg text-[10px] font-bold border outline-none shadow-sm ${sortBy !== 'none' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-slate-600 border-slate-200'}`}>
                <option value="none">Sort By</option><option value="low">Low Price</option><option value="high">High Price</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
            </div>
            <div className="flex overflow-x-auto gap-1.5 hide-scrollbar flex-1 pr-2">
              {categories.map((category) => (
                <button key={category} onClick={() => setActiveCategory(category)} className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${activeCategory === category ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}>{category}</button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-3 py-4 relative">
        {loading && phones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <RefreshCw className="text-indigo-500 h-6 w-6 animate-spin mb-3" />
            <p className="font-bold text-[11px] text-slate-500">Syncing Prices...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {displayPhones.length > 0 ? (
              displayPhones.map((phone) => (
                <PhoneCard 
                  key={phone.id}
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
              ))
            ) : (
              <div className="bg-white py-12 px-4 text-center rounded-[16px] border border-dashed border-slate-200">
                <Search className="text-slate-300 h-8 w-8 mx-auto mb-2" />
                <h3 className="text-[13px] font-bold text-slate-900">No Models Found</h3>
              </div>
            )}
          </div>
        )}
      </main>
      
      {showScroll && (
        <button onClick={scrollTop} className="bg-indigo-600 text-white fixed bottom-5 right-5 p-3 rounded-full shadow-lg z-50 flex items-center justify-center">
          <ArrowUp size={20} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}



