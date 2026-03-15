import React, { useState, useEffect, useMemo } from 'react';
import { Search, AlertCircle, RefreshCw, ChevronDown, Tag, Gift, MessageCircle, Copy, ArrowUpDown, Clock, ArrowUp, CheckCircle2, Menu, Calendar, ShieldAlert, Youtube, Zap, Image as ImageIcon, CreditCard, TrendingUp, Smartphone, X } from 'lucide-react';

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

const SamAssistIcon = ({ size = 24, strokeWidth = 2, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
    <path d="M9 8h6" />
    <path d="M9 11h6" />
    <path d="M10 8c2.5 0 2.5 3 0 3" />
    <path d="M10 11l4 5" />
  </svg>
);

const isValidDiscount = (val) => {
  if (!val) return false;
  const str = String(val).trim().toUpperCase();
  return str !== '0' && str !== '-' && str !== 'NA' && str !== 'NULL' && str !== 'NO CASHBACK' && str !== '';
};

const isComboOffer = (val) => {
  if (!val) return false;
  const str = String(val).toUpperCase().replace(/\s+/g, '');
  return str.includes('+BCB');
};

const splitAmountAndDesc = (text) => {
  if (!text) return { amount: '', desc: '' };
  const str = String(text).trim();
  const match = str.match(/^((?:rs\.?|inr|₹)?\s*\d+[\d,]*\.?\d*)\s*(.*)$/i);
  if (match) {
    return { amount: match[1].trim(), desc: match[2].trim() };
  }
  return { amount: str, desc: '' };
};

const formatSafePrice = (val) => {
  if (!val) return '';
  const str = String(val).trim();
  if (/\d/.test(str) && !str.includes('₹')) {
    return `₹${str}`;
  }
  return str;
};

const splitModelName = (fullName) => {
  if (!fullName) return { title: '', subtitle: '' };
  let title = String(fullName).trim();
  let subtitle = "";
  
  const lastOpen = title.lastIndexOf('(');
  const lastClose = title.lastIndexOf(')');

  if (lastOpen !== -1 && lastClose > lastOpen && lastClose === title.length - 1) {
    const potentialSub = title.substring(lastOpen, lastClose + 1);
    const restOfName = title.substring(0, lastOpen).trim();

    const isMemory = /GB|TB|RAM|ROM/i.test(potentialSub) && /\d/.test(potentialSub);
    const hasAnotherParen = restOfName.includes('(');

    if (!isMemory || hasAnotherParen) {
      title = restOfName;
      subtitle = potentialSub;
    }
  }
  return { title, subtitle };
};

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
  
  // --- New Compare States ---
  const [compareList, setCompareList] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  
  const [storeName, setStoreName] = useState(() => {
    try {
      return localStorage.getItem('samassist_store_name') || 'Samsung Experience Store';
    } catch (e) {
      return 'Samsung Experience Store';
    }
  });

  const [hasAgreed, setHasAgreed] = useState(true);
  const [isOutdated, setIsOutdated] = useState(false);

  useEffect(() => {
    document.title = "SamAssist";
    try {
      const agreed = localStorage.getItem('samsung_dealer_agreed');
      if (!agreed) setHasAgreed(false);
    } catch (e) { setHasAgreed(true); }
  }, []);

  useEffect(() => {
    let ticking = false;
    const checkScrollTop = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setShowScroll(window.pageYOffset > 300);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', checkScrollTop, { passive: true });
    return () => window.removeEventListener('scroll', checkScrollTop);
  }, []);

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const agreeToTerms = () => {
    try { localStorage.setItem('samsung_dealer_agreed', 'true'); } catch (e) {}
    setHasAgreed(true);
  };

  const checkDataAge = (syncTime) => {
    if (!syncTime) return;
    const now = new Date();
    const diffInHours = (now - syncTime) / (1000 * 60 * 60);
    setIsOutdated(diffInHours > 24);
  };

  const parsePriceToNumber = (priceStr) => {
    if (!priceStr) return 0;
    const num = parseInt(String(priceStr).replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? 0 : num;
  };

  const formatCurrency = (num) => {
    if (!num || isNaN(num) || num === 0) return '₹0';
    return '₹' + num.toLocaleString('en-IN');
  };

  const formatSyncTime = (date) => {
    if (!date) return '';
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    if (isToday) return `Today, ${time}`;
    return `${date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}, ${time}`;
  };

  const csvToArray = (text) => {
    const result = []; let row = []; let inQuotes = false; let val = "";
    for (let i = 0; i < text.length; i++) {
      const char = text[i]; const nextChar = text[i + 1];
      if (char === '"' && inQuotes && nextChar === '"') { val += '"'; i++; 
      } else if (char === '"') { inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) { row.push(val); val = "";
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') i++;
        row.push(val); if (row.length > 0 || val.trim() !== "") result.push(row);
        row = []; val = "";
      } else { val += char; }
    }
    if (val || row.length > 0) { row.push(val); result.push(row); }
    return result;
  };

  const fetchImageDB = async () => {
    try {
      const response = await fetch(IMAGE_DB_URL);
      if (!response.ok) return {};
      const text = await response.text();
      const rows = csvToArray(text);
      const imgMap = {};
      
      rows.forEach(row => {
        if (row.length >= 2 && row[0] && row[1]) {
          const code = String(row[0]).trim().toUpperCase().replace(/\s+/g, '');
          let url = String(row[1]).trim();
          if (url.includes('drive.google.com/file/d/')) {
            const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
            if (match && match[1]) url = `https://drive.google.com/uc?export=view&id=${match[1]}`;
          } else if (url.includes('drive.google.com/open?id=')) {
            const match = url.match(/id=([a-zA-Z0-9_-]+)/);
            if (match && match[1]) url = `https://drive.google.com/uc?export=view&id=${match[1]}`;
          }
          if (url.startsWith('http') && code.length > 0) imgMap[code] = url;
        }
      });
      return imgMap;
    } catch (err) { return {}; }
  };

  const fetchSingleSheet = async (tabConfig) => {
    const { name: tabName, gid } = tabConfig;
    try {
      const response = await fetch(`${BASE_SHEET_URL}${gid}`);
      if (!response.ok) return { data: [], fetchedDate: null };
      const text = await response.text();
      if (text.trim().toLowerCase().startsWith('<!doctype html>')) return { data: [], fetchedDate: null };
      const rows = csvToArray(text);
      if (!rows || rows.length === 0) return { data: [], fetchedDate: null };

      let fetchedDate = null;
      if (rows[0] && rows[0].length > 6) {
        const rawG1 = rows[0][6].trim();
        if (rawG1 && rawG1 !== '') fetchedDate = rawG1;
      }

      let modelIdx = -1, modelCodeIdx = -1, giftIdx = -1, remarksIdx = -1, specialUpgradeIdx = -1, startIdx = 0;
      for (let i = 0; i < Math.min(15, rows.length); i++) {
        const row = rows[i]; if (!row) continue;
        modelIdx = row.findIndex(cell => cell && cell.trim().toUpperCase() === 'MODEL');
        if (modelIdx !== -1) {
          startIdx = i + 1;
          modelCodeIdx = row.findIndex(cell => cell && (cell.trim().toUpperCase().includes('MODEL CODE') || cell.trim().toUpperCase() === 'CODE' || cell.trim().toUpperCase() === 'ITEM CODE'));
          giftIdx = row.findIndex(cell => cell && cell.trim().toUpperCase().includes('GIFT'));
          remarksIdx = row.findIndex(cell => cell && cell.trim().toUpperCase().includes('REMARK'));
          specialUpgradeIdx = row.findIndex(cell => cell && cell.trim().toUpperCase().includes('SPECIAL UPGRADE'));
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

        const rawModelCode = getVal(0);
        const dpStr = getVal(modelIdx + 1);
        const mopStr = getVal(modelIdx + 2);
        const sellOutStr = getVal(modelIdx + 3);
        const upgradeStr = getVal(modelIdx + 4);
        const bankStr = getVal(modelIdx + 5);
        const effectiveStr = getVal(modelIdx + 6);

        const rawGift = giftIdx !== -1 && giftIdx < row.length ? row[giftIdx].trim() : '';
        const rawRemarks = remarksIdx !== -1 && remarksIdx < row.length ? row[remarksIdx].trim() : '';
        const rawSpecialUpgrade = specialUpgradeIdx !== -1 && specialUpgradeIdx < row.length ? row[specialUpgradeIdx].trim() : '';

        const cleanVal = (val) => {
          const upper = val.toUpperCase();
          return (upper === '0' || upper === 'NA' || upper === '-' || upper === 'NULL' || upper === '') ? null : val;
        };

        const mopNum = parsePriceToNumber(mopStr);
        const effNum = parsePriceToNumber(effectiveStr);

        const finalModelCode = (rawModelCode && rawModelCode.length > 2 && rawModelCode.toUpperCase() !== 'MODEL CODE') ? rawModelCode : tabName;

        parsedData.push({
          id: `${gid}-${i}`, model: rawModelName, modelCode: finalModelCode, category: tabName,
          dp: dpStr !== '0' && dpStr !== 'NA' && dpStr !== '' ? dpStr : '-',
          mop: mopNum > 0 ? formatCurrency(mopNum) : (mopStr !== '0' && mopStr !== '' ? mopStr : 'TBA'),
          sellOut: sellOutStr !== '0' && sellOutStr !== 'NA' && sellOutStr !== '' ? sellOutStr : '-',
          upgrade: upgradeStr !== '0' && upgradeStr !== 'NA' && upgradeStr !== '' ? upgradeStr : '-',
          bank: bankStr !== '0' && bankStr !== 'NA' && bankStr !== '' ? bankStr : 'No Cashback',
          effectivePrice: effNum > 0 ? formatCurrency(effNum) : (effectiveStr !== '0' && effectiveStr !== '' ? effectiveStr : 'TBA'),
          mopNum: mopNum, effNum: effNum, gift: cleanVal(rawGift), remarks: cleanVal(rawRemarks), specialUpgrade: cleanVal(rawSpecialUpgrade),
          imageUrl: null
        });
      }
      return { data: parsedData, fetchedDate };
    } catch (e) { return { data: [], fetchedDate: null }; }
  };

  const loadFromCache = () => {
    try {
      const cachedData = localStorage.getItem('samsung_dealer_data');
      const cachedTime = localStorage.getItem('samsung_dealer_sync_time');
      const cachedDate = localStorage.getItem('samsung_dealer_sheet_date');
      if (cachedData) {
        setPhones(JSON.parse(cachedData));
        if (cachedTime) {
          const syncTime = new Date(cachedTime);
          setLastSynced(syncTime); checkDataAge(syncTime);
        }
        if (cachedDate) setSheetDate(cachedDate);
        return true;
      }
    } catch (e) {} return false;
  };

  const saveToCache = (data, g1Date) => {
    try {
      const now = new Date();
      localStorage.setItem('samsung_dealer_data', JSON.stringify(data));
      localStorage.setItem('samsung_dealer_sync_time', now.toISOString());
      if (g1Date) localStorage.setItem('samsung_dealer_sheet_date', g1Date);
      setLastSynced(now); setIsOutdated(false);
      if (g1Date) setSheetDate(g1Date);
    } catch (e) {}
  };

  const fetchAllData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    setIsRefreshing(true); setError(null);
    try {
      const allResults = await Promise.all(SHEET_TABS.map(tab => fetchSingleSheet(tab)));
      let combinedPhones = allResults.reduce((acc, curr) => acc.concat(curr.data || []), []);
      const foundDate = allResults.map(res => res.fetchedDate).find(date => date && date.length > 0);
      if (combinedPhones.length === 0) throw new Error("No data found. Please verify your Google Sheet is public.");

      setPhones(combinedPhones);
      if (!isBackground) setLoading(false);

      fetchImageDB().then(imgMap => {
        const imgKeys = Object.keys(imgMap).sort((a, b) => b.length - a.length);
        if (imgKeys.length > 0) {
          setPhones(currentPhones => {
            const updatedPhones = currentPhones.map(phone => {
              const cleanPhoneCode = phone.modelCode ? phone.modelCode.toUpperCase().replace(/\s+/g, '') : '';
              const cleanModelName = phone.model ? phone.model.toUpperCase().replace(/\s+/g, '') : '';
              let matchedImg = null;
              for (let baseCode of imgKeys) {
                if (cleanPhoneCode.includes(baseCode) || cleanModelName.includes(baseCode)) {
                  matchedImg = imgMap[baseCode]; break;
                }
              }
              return matchedImg ? { ...phone, imageUrl: matchedImg } : phone;
            });
            saveToCache(updatedPhones, foundDate);
            return updatedPhones;
          });
        } else { saveToCache(combinedPhones, foundDate); }
      }).catch(e => {
        console.warn("Silent image fetch failed", e); saveToCache(combinedPhones, foundDate);
      }).finally(() => { setIsRefreshing(false); });
    } catch (err) {
      if (phones.length === 0) setError(err.message || "Network error. Please try again.");
      setLoading(false); setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const hasCache = loadFromCache();
    fetchAllData(hasCache);
  }, []);

  // --- Compare Toggle & Clear Functions ---
  const toggleCompare = (phone) => {
    const isAlreadyAdded = compareList.find(p => p.id === phone.id);
    if (isAlreadyAdded) {
      setCompareList(compareList.filter(p => p.id !== phone.id));
    } else {
      if (compareList.length >= 3) {
        alert("Maximum 3 models can be compared at once.");
        return;
      }
      setCompareList([...compareList, phone]);
    }
  };

  const clearCompare = () => setCompareList([]);

  const categories = ['All', ...SHEET_TABS.map(t => t.name)];

  const displayPhones = useMemo(() => {
    let filtered = phones.filter(phone => {
      const matchesCategory = activeCategory === 'All' || phone.category === activeCategory;
      const searchLower = searchQuery.toLowerCase().trim();
      const matchesSearch = searchLower === '' || 
        String(phone.model).toLowerCase().includes(searchLower) ||
        String(phone.modelCode).toLowerCase().includes(searchLower);
      return matchesCategory && matchesSearch;
    });
    if (sortBy === 'low') filtered.sort((a, b) => (a.effNum || a.mopNum) - (b.effNum || b.mopNum));
    else if (sortBy === 'high') filtered.sort((a, b) => (b.effNum || b.mopNum) - (a.effNum || a.mopNum));
    return filtered;
  }, [phones, searchQuery, activeCategory, sortBy]);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id); setCopyStatus(null);
  };

  const handleGenerateImage = async (phone, templateId) => {
    setTemplateModalPhone(null);
    setIsGeneratingImg(phone.id);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');
      let imgObj = null;
      if (phone.imageUrl) {
        try {
          imgObj = await new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = phone.imageUrl;
          });
        } catch (e) {
          console.warn("Could not load phone image.");
        }
      }

      const drawRoundRect = (ctx, x, y, w, h, r) => {
        ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
      };

      const drawWrappedText = (ctx, text, x, y, maxWidth, lineHeight, align = 'left') => {
        const words = String(text).split(' ');
        let line = ''; let lines = [];
        for (let i = 0; i < words.length; i++) {
          const testLine = line + words[i] + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && i > 0) { lines.push(line.trim()); line = words[i] + ' '; }
          else { line = testLine; }
        }
        lines.push(line.trim());
        lines.forEach((l, index) => {
          ctx.textAlign = align; ctx.fillText(l, x, y + (index * lineHeight));
        });
        return (lines.length - 1) * lineHeight;
      };

      const drawScaledStoreName = (ctx, text, x, y, maxWidth, defaultSize, color) => {
          let currentSize = defaultSize;
          ctx.font = `bold ${currentSize}px sans-serif`;
          while(ctx.measureText(text).width > maxWidth && currentSize > 25) {
              currentSize -= 2;
              ctx.font = `bold ${currentSize}px sans-serif`;
          }
          ctx.fillStyle = color;
          ctx.textAlign = 'center';
          ctx.fillText(text, x, y);
      };

      const splitName = splitModelName(phone.model);
      const hasBank = isValidDiscount(phone.bank);
      const hasUpg = isValidDiscount(phone.upgrade);
      const hasSellOut = isValidDiscount(phone.sellOut);
      const hasSpcl = isValidDiscount(phone.specialUpgrade);
      const isCombo = isComboOffer(phone.specialUpgrade);
      const storeText = storeName ? storeName.toUpperCase() : 'SAMSUNG EXPERIENCE STORE';

      const renderHeader = (colorTitle, colorSub) => {
        ctx.fillStyle = colorTitle; ctx.font = 'bold 65px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('EXCLUSIVE DEAL', 540, 100);
        ctx.fillStyle = colorSub; ctx.font = '32px sans-serif';
        ctx.fillText("GRAB IT BEFORE IT'S GONE", 540, 150);
      };

      const renderFooter = (colorVisit, colorStore, colorMab) => {
        ctx.fillStyle = colorVisit; ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('Visit at', 540, 1630);
        drawScaledStoreName(ctx, storeText, 540, 1680, 950, 42, colorStore);
        ctx.fillStyle = colorMab; ctx.font = 'bold 22px sans-serif';
        ctx.fillText('Powered by Mab Arena', 540, 1740);
      };

      const drawStandardRows = (startY, labelX, valX, maxWidth, colorLabel, colorValObj, alignVal = 'right') => {
        let currentY = startY;
        const rowSpacing = imgObj ? 45 : 55;

        const drawSingleRow = (label, rawValue, valColor, type) => {
          if (!rawValue || rawValue === '-' || rawValue === '0') return;
          ctx.fillStyle = colorLabel; ctx.font = 'bold 30px sans-serif'; ctx.textAlign = 'left';
          ctx.fillText(label, labelX, currentY);

          if (type === 'mop') {
            ctx.fillStyle = valColor; ctx.font = 'bold 36px sans-serif'; ctx.textAlign = alignVal;
            ctx.fillText(rawValue, valX, currentY); currentY += rowSpacing;
          } else {
            const parsed = splitAmountAndDesc(rawValue);
            let amountStr = type === 'special' ? parsed.amount : `- ${formatSafePrice(parsed.amount)}`;
            ctx.fillStyle = valColor; ctx.font = 'bold 36px sans-serif'; ctx.textAlign = alignVal;
            let extraHAmount = drawWrappedText(ctx, amountStr, valX, currentY, maxWidth, 45, alignVal);
            
            if (parsed.desc) {
              let descY = currentY + extraHAmount + 30;
              ctx.fillStyle = colorLabel; ctx.globalAlpha = 0.75; ctx.font = '600 21px sans-serif';
              let extraHDesc = drawWrappedText(ctx, parsed.desc, valX, descY, maxWidth, 30, alignVal);
              ctx.globalAlpha = 1.0;
              currentY = descY + extraHDesc + (rowSpacing - 10);
            } else { currentY += extraHAmount + rowSpacing; }
          }
        };

        drawSingleRow('MOP Price:', phone.mop, colorValObj.mop || colorValObj.default, 'mop');
        if (hasSellOut) drawSingleRow('Sellout Support:', phone.sellOut, colorValObj.sellOut || colorValObj.default, 'normal');

        if (hasUpg && hasBank && !isCombo) {
            drawSingleRow('Upgrade Bonus:', phone.upgrade, colorValObj.upg || colorValObj.default, 'normal');
            ctx.fillStyle = colorLabel; ctx.globalAlpha = 0.4; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center';
            const midX = labelX + ((valX - labelX) / 2);
            ctx.fillText('━━━ OR ━━━', midX, currentY - (rowSpacing === 45 ? 15 : 12));
            ctx.globalAlpha = 1.0; currentY += (rowSpacing === 45 ? 20 : 30);
            drawSingleRow('Bank Offer:', phone.bank, colorValObj.bank || colorValObj.default, 'normal');
        } else {
            if (hasUpg) drawSingleRow('Upgrade Bonus:', phone.upgrade, colorValObj.upg || colorValObj.default, 'normal');
            if (hasBank) drawSingleRow('Bank Offer:', phone.bank, colorValObj.bank || colorValObj.default, 'normal');
        }
        if (hasSpcl) drawSingleRow('Special Offer:', phone.specialUpgrade, colorValObj.spcl || colorValObj.default, 'special');
        
        return currentY;
      };

      if (templateId === 'default') {
        const gradient = ctx.createLinearGradient(0, 0, 1080, 1920);
        gradient.addColorStop(0, '#0f172a'); gradient.addColorStop(1, '#1e293b');
        ctx.fillStyle = gradient; ctx.fillRect(0, 0, 1080, 1920);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)'; ctx.beginPath(); ctx.arc(1080, 0, 700, 0, 2 * Math.PI); ctx.fill(); ctx.beginPath(); ctx.arc(0, 1920, 500, 0, 2 * Math.PI); ctx.fill();

        renderHeader('#ffffff', '#94a3b8');

        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 20;
        ctx.fillStyle = '#ffffff'; drawRoundRect(ctx, 80, 180, 920, 1360, 40); ctx.fill(); ctx.shadowColor = 'transparent';

        let currentY = 220;
        if (imgObj) {
          let drawW = imgObj.width; let drawH = imgObj.height;
          if (drawW > 450 || drawH > 260) { const ratio = Math.min(450 / drawW, 260 / drawH); drawW *= ratio; drawH *= ratio; }
          ctx.drawImage(imgObj, 540 - (drawW / 2), currentY, drawW, drawH); currentY += drawH + 30;
        } else { currentY = 300; }

        ctx.fillStyle = '#0f172a'; ctx.font = 'bold 50px sans-serif';
        let extraHeightTitle = drawWrappedText(ctx, splitName.title, 540, currentY, 850, 60, 'center');
        currentY += extraHeightTitle + 50;
        
        if (splitName.subtitle) {
            ctx.fillStyle = '#dc2626'; ctx.font = 'bold 26px sans-serif';
            let extraHeightSub = drawWrappedText(ctx, splitName.subtitle, 540, currentY, 850, 35, 'center');
            currentY += extraHeightSub + 45;
        }
        
        ctx.fillStyle = '#64748b'; ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`MODEL: ${phone.modelCode}`, 540, currentY);
        currentY += 40; ctx.fillStyle = '#e2e8f0'; ctx.fillRect(150, currentY, 780, 3); currentY += (imgObj ? 40 : 50);

        drawStandardRows(currentY, 120, 950, 480, '#475569', { default: '#334155', sellOut: '#059669', upg: '#9333ea', bank: '#2563eb', spcl: '#d97706' }, 'right');

        const priceBoxY = 1290;
        ctx.fillStyle = '#0f172a'; drawRoundRect(ctx, 140, priceBoxY, 800, 180, 30); ctx.fill();
        ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 24px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('EFFECTIVE PRICE', 540, priceBoxY + 55);
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 90px sans-serif'; ctx.fillText(phone.effectivePrice, 540, priceBoxY + 140);

        renderFooter('#94a3b8', '#f8fafc', '#475569');
      } else if (templateId === 'cyber') {
        ctx.fillStyle = '#060c17'; ctx.fillRect(0, 0, 1080, 1920);
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)'; ctx.lineWidth = 2;
        for(let i=0; i<1080; i+=60) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,1920); ctx.stroke(); }
        for(let i=0; i<1920; i+=60) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(1080,i); ctx.stroke(); }
        renderHeader('#06b6d4', '#94a3b8');

        let currentY = 200;
        if (imgObj) {
          let drawW = imgObj.width; let drawH = imgObj.height;
          if (drawW > 450 || drawH > 260) { const ratio = Math.min(450 / drawW, 260 / drawH); drawW *= ratio; drawH *= ratio; }
          ctx.drawImage(imgObj, 540 - (drawW / 2), currentY, drawW, drawH); currentY += drawH + 30;
        } else { currentY = 300; }

        ctx.fillStyle = '#f8fafc'; ctx.font = 'bold 50px sans-serif';
        let extraHeightTitle = drawWrappedText(ctx, splitName.title, 540, currentY, 850, 60, 'center');
        currentY += extraHeightTitle + 50;
        if (splitName.subtitle) {
            ctx.fillStyle = '#f43f5e'; ctx.font = 'bold 26px sans-serif';
            let extraHeightSub = drawWrappedText(ctx, splitName.subtitle, 540, currentY, 850, 35, 'center');
            currentY += extraHeightSub + 45;
        }

        ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`MODEL: ${phone.modelCode}`, 540, currentY);
        currentY += 40; ctx.fillStyle = 'rgba(6, 182, 212, 0.3)'; ctx.fillRect(150, currentY, 780, 2); currentY += (imgObj ? 40 : 50);

        drawStandardRows(currentY, 150, 930, 480, '#94a3b8', { default: '#f8fafc', sellOut: '#10b981', upg: '#c084fc', bank: '#38bdf8', spcl: '#fbbf24' }, 'right');

        const priceBoxY = 1290;
        ctx.shadowColor = '#f97316'; ctx.shadowBlur = 30;
        ctx.strokeStyle = '#f97316'; ctx.lineWidth = 4; ctx.fillStyle = '#0f172a';
        drawRoundRect(ctx, 190, priceBoxY, 700, 180, 20); ctx.fill(); ctx.stroke();
        ctx.shadowColor = 'transparent';

        ctx.fillStyle = '#fdba74'; ctx.font = 'bold 24px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('EFFECTIVE PRICE', 540, priceBoxY + 55);
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 85px sans-serif'; ctx.fillText(phone.effectivePrice, 540, priceBoxY + 140);

        renderFooter('#64748b', '#cbd5e1', '#334155');
      } else if (templateId === 'split') {
        ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, 480, 1920);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(480, 0, 600, 1920);

        ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 1550, 1080, 370);
        ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(0, 1550, 1080, 3);

        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 50px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('EXCLUSIVE', 240, 120);
        ctx.fillText('DEAL', 240, 180);

        let leftY = 280;
        if (imgObj) {
          let drawW = imgObj.width; let drawH = imgObj.height;
          if (drawW > 380 || drawH > 300) { const ratio = Math.min(380 / drawW, 300 / drawH); drawW *= ratio; drawH *= ratio; }
          ctx.drawImage(imgObj, 240 - (drawW / 2), leftY, drawW, drawH); leftY += drawH + 40;
        } else { leftY = 380; }

        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 45px sans-serif';
        let extraHeightTitle = drawWrappedText(ctx, splitName.title, 240, leftY, 400, 55, 'center');
        leftY += extraHeightTitle + 40;

        if (splitName.subtitle) {
            ctx.fillStyle = '#ef4444'; ctx.font = 'bold 22px sans-serif';
            let extraHeightSub = drawWrappedText(ctx, splitName.subtitle, 240, leftY, 400, 30, 'center');
            leftY += extraHeightSub + 35;
        }
        ctx.fillStyle = '#64748b'; ctx.font = 'bold 24px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`MODEL: ${phone.modelCode}`, 240, leftY);

        let rightY = 280;
        drawStandardRows(rightY, 520, 1020, 430, '#475569', { default: '#0f172a', sellOut: '#059669', upg: '#9333ea', bank: '#2563eb', spcl: '#d97706' }, 'right');

        const priceBoxY = 1280;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 10;
        ctx.fillStyle = '#ffffff'; drawRoundRect(ctx, 140, priceBoxY, 800, 180, 30); ctx.fill(); ctx.shadowColor = 'transparent';
        ctx.fillStyle = '#0f172a'; drawRoundRect(ctx, 145, priceBoxY + 5, 790, 170, 25); ctx.fill();

        ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 24px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('EFFECTIVE PRICE', 540, priceBoxY + 60);
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 90px sans-serif'; ctx.fillText(phone.effectivePrice, 540, priceBoxY + 140);

        renderFooter('#94a3b8', '#ffffff', '#475569');
      } else if (templateId === 'light') {
        ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, 1080, 1920);
        renderHeader('#0f172a', '#64748b');

        ctx.shadowColor = 'rgba(0, 0, 0, 0.08)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 20;
        ctx.fillStyle = '#ffffff'; drawRoundRect(ctx, 80, 180, 920, 1360, 40); ctx.fill(); ctx.shadowColor = 'transparent';

        let currentY = 220;
        if (imgObj) {
          let drawW = imgObj.width; let drawH = imgObj.height;
          if (drawW > 450 || drawH > 260) { const ratio = Math.min(450 / drawW, 260 / drawH); drawW *= ratio; drawH *= ratio; }
          ctx.drawImage(imgObj, 540 - (drawW / 2), currentY, drawW, drawH); currentY += drawH + 30;
        } else { currentY = 300; }

        ctx.fillStyle = '#0f172a'; ctx.font = 'bold 50px sans-serif';
        let extraHeightTitle = drawWrappedText(ctx, splitName.title, 540, currentY, 850, 60, 'center');
        currentY += extraHeightTitle + 50;

        if (splitName.subtitle) {
            ctx.fillStyle = '#dc2626'; ctx.font = 'bold 26px sans-serif';
            let extraHeightSub = drawWrappedText(ctx, splitName.subtitle, 540, currentY, 850, 35, 'center');
            currentY += extraHeightSub + 45;
        }

        ctx.fillStyle = '#64748b'; ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`MODEL: ${phone.modelCode}`, 540, currentY);
        currentY += 40; ctx.fillStyle = '#e2e8f0'; ctx.fillRect(150, currentY, 780, 2); currentY += (imgObj ? 40 : 50);

        drawStandardRows(currentY, 120, 950, 480, '#64748b', { default: '#0f172a', sellOut: '#059669', upg: '#7e22ce', bank: '#1d4ed8', spcl: '#b45309' }, 'right');

        const priceBoxY = 1290;
        ctx.fillStyle = '#f1f5f9'; drawRoundRect(ctx, 140, priceBoxY, 800, 180, 30); ctx.fill();
        ctx.fillStyle = '#64748b'; ctx.font = 'bold 24px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('EFFECTIVE PRICE', 540, priceBoxY + 55);
        ctx.fillStyle = '#0f172a'; ctx.font = 'bold 90px sans-serif'; ctx.fillText(phone.effectivePrice, 540, priceBoxY + 140);

        renderFooter('#64748b', '#0f172a', '#94a3b8');
      } else if (templateId === 'glass') {
        const gradient = ctx.createLinearGradient(0, 0, 1080, 1920);
        gradient.addColorStop(0, '#4f46e5');
        gradient.addColorStop(1, '#db2777');
        ctx.fillStyle = gradient; ctx.fillRect(0, 0, 1080, 1920);

        ctx.filter = 'blur(100px)';
        ctx.fillStyle = '#f97316'; ctx.beginPath(); ctx.arc(200, 400, 300, 0, 2*Math.PI); ctx.fill();
        ctx.fillStyle = '#38bdf8'; ctx.beginPath(); ctx.arc(880, 1500, 350, 0, 2*Math.PI); ctx.fill();
        ctx.filter = 'none';

        ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 10;
        renderHeader('#ffffff', '#e2e8f0');
        ctx.shadowColor = 'transparent';

        const cardW = 900; const cardH = 1380; const cardX = -450; const cardY = -690;
        ctx.save(); ctx.translate(540, 850); ctx.rotate(-4 * Math.PI / 180);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'; drawRoundRect(ctx, cardX, cardY, cardW, cardH, 40); ctx.fill(); ctx.restore();
        ctx.save(); ctx.translate(540, 850); ctx.rotate(2 * Math.PI / 180);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'; drawRoundRect(ctx, cardX, cardY, cardW, cardH, 40); ctx.fill(); ctx.restore();

        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)'; ctx.shadowBlur = 30;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        drawRoundRect(ctx, 90, 180, 900, 1380, 40); ctx.fill(); ctx.shadowColor = 'transparent';

        let currentY = 220;
        if (imgObj) {
          let drawW = imgObj.width; let drawH = imgObj.height;
          if (drawW > 450 || drawH > 260) { const ratio = Math.min(450 / drawW, 260 / drawH); drawW *= ratio; drawH *= ratio; }
          ctx.drawImage(imgObj, 540 - (drawW / 2), currentY, drawW, drawH); currentY += drawH + 30;
        } else { currentY = 300; }

        ctx.fillStyle = '#0f172a'; ctx.font = 'bold 50px sans-serif';
        let extraHeightTitle = drawWrappedText(ctx, splitName.title, 540, currentY, 800, 60, 'center');
        currentY += extraHeightTitle + 50;
        
        if (splitName.subtitle) {
            ctx.fillStyle = '#dc2626'; ctx.font = 'bold 26px sans-serif';
            let extraHeightSub = drawWrappedText(ctx, splitName.subtitle, 540, currentY, 800, 35, 'center');
            currentY += extraHeightSub + 45;
        }
        ctx.fillStyle = '#64748b'; ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`MODEL: ${phone.modelCode}`, 540, currentY);
        currentY += 40; ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.fillRect(150, currentY, 780, 2); currentY += (imgObj ? 40 : 50);

        drawStandardRows(currentY, 130, 940, 480, '#475569', { default: '#0f172a', sellOut: '#059669', upg: '#7e22ce', bank: '#1d4ed8', spcl: '#b45309' }, 'right');

        const priceBoxY = 1350;
        ctx.save(); ctx.translate(540, priceBoxY + 90); ctx.rotate(-2 * Math.PI / 180);
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 10;
        ctx.fillStyle = '#0f172a'; drawRoundRect(ctx, -420, -90, 840, 180, 30); ctx.fill(); ctx.shadowColor = 'transparent';
        ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 24px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('EFFECTIVE PRICE', 0, -30);
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 95px sans-serif'; ctx.fillText(phone.effectivePrice, 0, 55);
        ctx.restore();

        ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 10;
        renderFooter('#ffffff', '#ffffff', 'rgba(255,255,255,0.8)');
        ctx.shadowColor = 'transparent';
      }

      const link = document.createElement('a');
      link.download = `Offer_${splitName.title.replace(/\s+/g, '_')}_${templateId}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.95);
      link.click();
    } catch (err) {
      console.error("Image generation failed:", err);
      alert("Something went wrong generating the image.");
    } finally {
      setIsGeneratingImg(null);
    }
  };

  const generateShareText = (phone) => {
    const splitName = splitModelName(phone.model);
    let text = `📱 *${splitName.title}*\n`;
    if (splitName.subtitle) text += `   _${splitName.subtitle}_\n`;
    text += `MOP: *${phone.mop}*\n`;
    
    const hasBank = isValidDiscount(phone.bank); const hasUpg = isValidDiscount(phone.upgrade); const isCombo = isComboOffer(phone.specialUpgrade);

    if (isValidDiscount(phone.sellOut)) {
        const p = splitAmountAndDesc(phone.sellOut); text += `🏷️ Sellout Support: - ${formatSafePrice(p.amount)}\n`;
        if (p.desc) text += `   ↳ _(${p.desc})_\n`;
    }
    if (hasUpg) {
        const p = splitAmountAndDesc(phone.upgrade); text += `🔄 Upgrade Bonus: - ${formatSafePrice(p.amount)}\n`;
        if (p.desc) text += `   ↳ _(${p.desc})_\n`;
    }
    if (hasUpg && hasBank && !isCombo) text += `   *━━ OR ━━*\n`;
    if (hasBank) {
        const p = splitAmountAndDesc(phone.bank); text += `💳 Bank Offer: - ${formatSafePrice(p.amount)}\n`;
        if (p.desc) text += `   ↳ _(${p.desc})_\n`;
    }
    if (isValidDiscount(phone.specialUpgrade)) {
        const p = splitAmountAndDesc(phone.specialUpgrade); text += `⚡ Special Offer: ${formatSafePrice(p.amount)}\n`;
        if (p.desc) text += `   ↳ _(${p.desc})_\n`;
    }
    
    text += `🔥 *Effective Price: ${phone.effectivePrice}*\n\n`;
    if (storeName && storeName.trim() !== '') text += `📍 *Visit at:* ${storeName.trim()}\n`;
    text += `\n*(Note: Prices and offers are subject to change without prior notice. Please verify at the store before finalizing.)*`;
    return text;
  };

  const handleCopy = (phone) => {
    const text = generateShareText(phone);
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => { setCopyStatus(phone.id); setTimeout(() => setCopyStatus(null), 2000);
      }).catch(() => fallbackCopyTextToClipboard(text, phone.id));
    } else { fallbackCopyTextToClipboard(text, phone.id); }
  };

  const fallbackCopyTextToClipboard = (text, id) => {
    const textArea = document.createElement("textarea"); textArea.value = text;
    textArea.style.position = "fixed"; textArea.style.left = "-999999px"; textArea.style.top = "-999999px";
    document.body.appendChild(textArea); textArea.focus(); textArea.select();
    try { document.execCommand('copy'); setCopyStatus(id); setTimeout(() => setCopyStatus(null), 2000); } catch (err) {}
    document.body.removeChild(textArea);
  };

  const handleWhatsApp = (phone) => { window.open(`https://wa.me/?text=${encodeURIComponent(generateShareText(phone))}`, '_blank'); };

  return (
    <div className="min-h-screen font-sans pb-12 bg-slate-50 text-slate-900 relative">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .phone-card { content-visibility: auto; contain-intrinsic-size: 100px; }
        @keyframes fadeInUp { 0% { opacity: 0; transform: translateY(15px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        @keyframes expandDown { 0% { opacity: 0; transform: translateY(-10px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-expand { animation: expandDown 0.3s ease-out forwards; }
        body { overscroll-behavior-y: none; }
      `}</style>

      {/* --- Compare Floating Bar (Center Aligned) --- */}
      {compareList.length > 0 && !showCompareModal && (
        <div className="fixed bottom-6 inset-x-0 z-[80] flex justify-center px-4 animate-fade-in-up pointer-events-none">
          <div className="bg-slate-900 text-white rounded-[24px] shadow-2xl p-4 flex flex-col items-center gap-4 border border-slate-700 w-full max-w-sm pointer-events-auto">
            {/* Top: Selected items indicator (Centered) */}
            <div className="flex items-center gap-3">
              <div className="flex -space-x-3">
                {compareList.map(p => (
                  <div key={p.id} className="w-9 h-9 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold overflow-hidden shadow-sm">
                    {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" alt=""/> : p.modelCode.substring(0,2)}
                  </div>
                ))}
              </div>
              <span className="text-sm font-bold text-slate-200">{compareList.length} / 3 Selected</span>
            </div>
            {/* Bottom: Centered Buttons */}
            <div className="flex items-center justify-center gap-3 w-full">
              <button onClick={clearCompare} className="text-xs font-bold text-slate-300 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors">
                Clear
              </button>
              <button onClick={() => setShowCompareModal(true)} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl text-sm font-black transition-colors shadow-lg shadow-blue-900/50">
                Compare Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Compare Modal UI --- */}
      {showCompareModal && (
        <div className="fixed inset-0 z-[120] bg-white overflow-y-auto animate-fade-in-up">
          <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center z-10">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2"><ArrowUpDown size={20}/> Compare Models</h2>
            <button onClick={() => setShowCompareModal(false)} className="p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200 transition-colors"><X size={20}/></button>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-4 gap-2 mb-6 border-b pb-4">
              <div className="col-span-1 pt-20 text-[10px] font-black text-slate-400 uppercase">Features</div>
              {compareList.map(p => (
                <div key={p.id} className="col-span-1 flex flex-col items-center text-center gap-2">
                  <div className="w-16 h-16 bg-slate-50 rounded-xl p-2 border flex items-center justify-center">
                    {p.imageUrl ? <img src={p.imageUrl} className="max-h-full object-contain" alt=""/> : <Smartphone className="text-slate-300"/>}
                  </div>
                  <span className="text-[11px] font-black text-slate-900 leading-tight">{splitModelName(p.model).title}</span>
                  <button onClick={() => toggleCompare(p)} className="text-[9px] text-red-500 font-bold hover:underline">Remove</button>
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
              <div key={row.label} className="grid grid-cols-4 gap-2 border-b py-4 items-center">
                <div className="col-span-1 text-[9px] font-black text-slate-400 uppercase tracking-tighter leading-tight">{row.label}</div>
                {compareList.map(p => (
                  <div key={p.id} className={`col-span-1 text-center text-[11px] font-bold ${row.color}`}>
                    {p[row.key] || '-'}
                  </div>
                ))}
              </div>
            ))}

            <div className="mt-10 p-4 bg-blue-50 rounded-2xl text-center">
              <p className="text-xs font-bold text-blue-800 mb-4">Want to share this comparison?</p>
              <button 
                onClick={() => {
                  let text = `📊 *SMARTPHONE COMPARISON* 📊\n\n`;
                  compareList.forEach((phone, index) => {
                    const splitName = splitModelName(phone.model);
                    text += `📱 *${splitName.title}*\n`;
                    if (splitName.subtitle) text += `   _${splitName.subtitle}_\n`;
                    text += `🔸 MOP: *${phone.mop}*\n`;
                    
                    if (isValidDiscount(phone.sellOut)) text += `🏷️ Sellout: - ${formatSafePrice(splitAmountAndDesc(phone.sellOut).amount)}\n`;
                    if (isValidDiscount(phone.upgrade)) text += `🔄 Upgrade: - ${formatSafePrice(splitAmountAndDesc(phone.upgrade).amount)}\n`;
                    if (isValidDiscount(phone.bank)) text += `💳 Bank: - ${formatSafePrice(splitAmountAndDesc(phone.bank).amount)}\n`;
                    if (isValidDiscount(phone.specialUpgrade)) text += `⚡ Special: ${formatSafePrice(splitAmountAndDesc(phone.specialUpgrade).amount)}\n`;
                    
                    text += `🔥 *Effective Price: ${phone.effectivePrice}*\n`;
                    
                    if (index < compareList.length - 1) {
                      text += `\n〰️〰️〰️〰️〰️〰️〰️〰️\n\n`;
                    }
                  });
                  text += `\n\n📍 *Visit at:* ${storeName ? storeName.trim() : 'Samsung Experience Store'}\n`;
                  text += `\n*(Note: Prices and offers are subject to change without prior notice. Please verify at the store before finalizing.)*`;

                  navigator.clipboard.writeText(text);
                  alert("Professional comparison text copied!");
                }}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors shadow-lg"
              >
                Copy All Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Template Selector Modal --- */}
      {templateModalPhone && (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-fade-in-up">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative">
            <div className="p-5 text-center border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">Choose Poster Design</h3>
              <p className="text-xs font-semibold text-slate-500 mt-1">Select a theme to download status image</p>
            </div>
            
            <div className="p-5 grid grid-cols-2 gap-3 bg-slate-50">
              <button onClick={() => handleGenerateImage(templateModalPhone, 'default')} className="flex flex-col items-center justify-center p-4 bg-white border-2 border-slate-200 rounded-2xl hover:border-slate-900 hover:shadow-md transition-all group">
                <div className="w-full h-16 rounded-lg bg-gradient-to-br from-slate-900 to-slate-800 mb-3 shadow-inner relative overflow-hidden">
                  <div className="absolute inset-x-2 top-2 bottom-2 bg-white rounded opacity-90"></div>
                </div>
                <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900">Default Dark</span>
              </button>
              <button onClick={() => handleGenerateImage(templateModalPhone, 'light')} className="flex flex-col items-center justify-center p-4 bg-white border-2 border-slate-200 rounded-2xl hover:border-slate-900 hover:shadow-md transition-all group">
                <div className="w-full h-16 rounded-lg bg-slate-100 border border-slate-200 mb-3 shadow-inner relative overflow-hidden">
                  <div className="absolute inset-x-2 top-2 bottom-2 bg-white rounded shadow-sm"></div>
                </div>
                <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900">Clean Light</span>
              </button>
              <button onClick={() => handleGenerateImage(templateModalPhone, 'split')} className="flex flex-col items-center justify-center p-4 bg-white border-2 border-slate-200 rounded-2xl hover:border-slate-900 hover:shadow-md transition-all group">
                <div className="w-full h-16 rounded-lg bg-white border border-slate-200 mb-3 shadow-inner flex overflow-hidden">
                  <div className="w-2/5 h-full bg-slate-900"></div><div className="w-3/5 h-full bg-slate-100"></div>
                </div>
                <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900">Split Style</span>
              </button>
              <button onClick={() => handleGenerateImage(templateModalPhone, 'glass')} className="flex flex-col items-center justify-center p-4 bg-white border-2 border-slate-200 rounded-2xl hover:border-slate-900 hover:shadow-md transition-all group">
                <div className="w-full h-16 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 mb-3 shadow-inner relative overflow-hidden flex items-center justify-center">
                  <div className="w-4/5 h-4/5 bg-white/40 backdrop-blur-sm rounded rotate-[-3deg]"></div>
                </div>
                <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900">Glassmorphism</span>
              </button>
              <button onClick={() => handleGenerateImage(templateModalPhone, 'cyber')} className="flex flex-col items-center justify-center p-4 bg-white border-2 border-slate-200 rounded-2xl hover:border-slate-900 hover:shadow-md transition-all group col-span-2 sm:col-span-1">
                <div className="w-full h-16 rounded-lg bg-black mb-3 shadow-inner relative overflow-hidden border border-cyan-500/30 flex items-center justify-center">
                   <div className="w-full h-px bg-cyan-500/50 absolute top-1/2"></div>
                   <div className="w-4/5 h-8 border border-orange-500 rounded shadow-[0_0_8px_rgba(249,115,22,0.6)]"></div>
                </div>
                <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900">Cyber Neon</span>
              </button>
            </div>
            
            <div className="p-4 bg-white border-t border-slate-100">
              <button onClick={() => setTemplateModalPhone(null)} className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {!hasAgreed && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-expand">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4 mx-auto">
              <ShieldAlert size={24} />
            </div>
            <h2 className="text-xl font-extrabold text-center text-slate-900 mb-2">Welcome to SamAssist</h2>
            <p className="text-[13px] sm:text-sm text-slate-600 text-center mb-6 leading-relaxed">
              This app is a quick reference tool for dealers. <br/><br/>
              <b>Prices and schemes can change at any time.</b> The developer is not responsible for any financial loss. <br/><br/>
              Please always cross-check the final prices and cashback offers with the <b>Official Scheme Letters</b> provided by the company, or confirm with your <b>Team Leader</b> before confirming any deal with a customer.
            </p>
            <button onClick={agreeToTerms} className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm transition-colors shadow-lg shadow-slate-900/20">
              I Understand & Agree
            </button>
          </div>
        </div>
      )}

      {isOutdated && (
        <div className="bg-red-500 text-white px-4 py-2 flex items-center justify-between text-xs sm:text-sm font-bold sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-2"><AlertCircle size={16} /><span>Data might be outdated.</span></div>
          <button onClick={() => fetchAllData(false)} className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors">Refresh Now</button>
        </div>
      )}

      <header className={`bg-white border-b border-slate-200 shadow-sm ${isOutdated ? 'sticky top-9 z-30' : 'sticky top-0 z-30'}`}>
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2 sm:gap-3 overflow-hidden pr-2">
              <div className="bg-slate-900 text-white p-1.5 sm:p-2 rounded-lg shadow-sm shrink-0"><SamAssistIcon size={20} strokeWidth={2} /></div>
              <div className="flex flex-col min-w-0">
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight truncate leading-tight text-slate-900">SamAssist</h1>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 relative">
              {lastSynced && (
                <div className="flex flex-col items-end justify-center mr-1">
                  <span className="text-[8px] sm:text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none mb-1">Last Sync</span>
                  <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600 leading-none">{formatSyncTime(lastSynced)}</span>
                </div>
              )}
              <button onClick={() => fetchAllData(false)} className="bg-slate-100 text-slate-700 hover:bg-slate-200 p-1.5 sm:p-2 rounded-full transition-colors relative" title="Refresh Data">
                {isRefreshing && <span className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full animate-ping"></span>}
                <RefreshCw size={16} className={isRefreshing ? "animate-spin text-blue-600" : ""} />
              </button>
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={`bg-slate-100 text-slate-700 hover:bg-slate-200 p-1.5 sm:p-2 rounded-full transition-colors flex items-center justify-center ${isMenuOpen ? 'ring-2 ring-slate-300' : ''}`} title="Menu">
                <Menu size={16} />
              </button>
              {isMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)}></div>
                  <div className="absolute right-0 top-full mt-2 w-64 rounded-xl shadow-lg border bg-white border-slate-200 z-50 overflow-hidden animate-expand">
                    <a href={WA_CHANNEL_URL} target="_blank" rel="noopener noreferrer" className="px-4 py-3 flex items-center gap-3 hover:bg-green-100 transition-colors border-b border-slate-100 bg-green-50">
                      <div className="bg-[#25D366] text-white p-1.5 rounded-full shrink-0">
                        <MessageCircle size={16} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-extrabold text-green-700 uppercase tracking-wider mb-0.5">Join Our Channel</span>
                        <span className="text-sm font-bold text-slate-900">SAMSUNG (Nagpur)</span>
                      </div>
                    </a>
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                      <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 block">Your Store Name</label>
                      <input type="text" value={storeName} onChange={(e) => { setStoreName(e.target.value); localStorage.setItem('samassist_store_name', e.target.value); }} placeholder="Enter Store Name" className="w-full text-sm font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm" />
                    </div>
                    <div className="px-4 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors">
                      <Calendar size={18} className="text-blue-600 mt-0.5 shrink-0" />
                      <div className="flex flex-col"><span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-0.5">Prices Updated On</span><span className="text-sm font-bold text-slate-800">{sheetDate ? sheetDate : 'Not Available'}</span></div>
                    </div>
                    <a href="https://youtube.com/@MabArena" target="_blank" rel="noopener noreferrer" className="px-4 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors border-t border-slate-100">
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
            <input type="text" placeholder="Search model or code (e.g. S26, Z Fold7)..." className="bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-slate-900 block w-full pl-10 pr-4 py-2 sm:py-2.5 border rounded-lg transition-all font-medium text-sm shadow-sm outline-none focus:ring-2 focus:border-transparent" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>

          <div className="flex items-center relative pb-1">
            <div className="relative shrink-0 z-10 mr-2">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={`appearance-none pl-3 pr-7 py-1.5 rounded-full text-xs font-bold transition-all border outline-none cursor-pointer shadow-sm ${sortBy !== 'none' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                <option value="none">Sort</option><option value="low">Low to High</option><option value="high">High to Low</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none"><ArrowUpDown size={12} className={sortBy !== 'none' ? 'text-blue-700' : 'text-slate-400'} /></div>
            </div>
            <div className="w-[1px] h-6 bg-slate-200 shrink-0 mr-2"></div>
            <div className="flex overflow-x-auto gap-2 hide-scrollbar scroll-smooth flex-1 relative pr-4">
              {categories.map((category) => (
                <button key={category} onClick={() => setActiveCategory(category)} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${activeCategory === category ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{category}</button>
              ))}
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white to-transparent pointer-events-none z-10"></div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 sm:px-6 relative">
        {error && phones.length === 0 && (
          <div className="bg-red-50 border-red-200 mb-6 p-3 rounded-lg flex gap-3 items-start border">
            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
            <div><h3 className="text-sm font-bold text-red-800">Error Fetching Data</h3><p className="text-xs mt-1 text-red-700">{error}</p></div>
          </div>
        )}

        {loading && phones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <RefreshCw className="text-slate-400 h-8 w-8 animate-spin mb-4" />
            <p className="font-bold text-sm text-slate-500">Fetching Latest Prices...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3" key={activeCategory + sortBy + searchQuery}>
            {displayPhones.length > 0 ? (
              displayPhones.map((phone, index) => {
                const isExpanded = expandedId === phone.id;
                const isSelectedForCompare = compareList.find(p => p.id === phone.id);
                const hasBank = isValidDiscount(phone.bank); const hasUpg = isValidDiscount(phone.upgrade);
                const hasSellOut = isValidDiscount(phone.sellOut); const hasSpcl = isValidDiscount(phone.specialUpgrade);
                const isCombo = isComboOffer(phone.specialUpgrade);

                return (
                  <div key={phone.id} className={`phone-card animate-fade-in-up bg-white rounded-xl border transition-all duration-200 overflow-hidden ${isExpanded ? 'border-slate-400 shadow-md' : 'border-slate-200 hover:border-slate-300 shadow-sm'}`} style={{ animationDelay: `${index * 0.04}s` }}>
                    <div onClick={() => toggleExpand(phone.id)} className="hover:bg-slate-50 flex justify-between items-center p-3.5 sm:p-4 cursor-pointer transition-colors">
                      <div className="flex items-center gap-3 w-2/3 pr-2 min-w-0">
                        {phone.imageUrl ? (
                          <img src={phone.imageUrl} alt="" loading="lazy" className="w-10 h-10 object-contain shrink-0" />
                        ) : (
                          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0"><Smartphone className="text-slate-400" size={20} /></div>
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider mb-0.5 text-slate-500">{phone.modelCode}</span>
                          <h3 className="text-[14px] sm:text-[15px] font-extrabold text-slate-900 leading-snug truncate">{splitModelName(phone.model).title}</h3>
                          {splitModelName(phone.model).subtitle && (<span className="text-[10px] sm:text-[11px] font-bold text-red-600 truncate mt-0.5">{splitModelName(phone.model).subtitle}</span>)}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 sm:gap-4 shrink-0 pl-1">
                        <div className="text-right">
                          <p className="text-[10px] font-extrabold uppercase tracking-widest mb-0.5 text-slate-500">MOP</p>
                          <p className="text-base sm:text-lg font-bold text-slate-800">{phone.mop}</p>
                        </div>
                        <div className={`p-1 rounded-full transition-all duration-300 ${isExpanded ? 'bg-slate-200 text-slate-800 rotate-180' : 'bg-slate-100 text-slate-400 rotate-0'}`}><ChevronDown size={18} /></div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="bg-white px-4 pb-4 pt-1 animate-expand origin-top">
                        <div className="w-full h-px mb-4 bg-slate-200"></div>
                        <div className="flex justify-between items-center bg-slate-50 px-4 py-2.5 mb-5 rounded-lg border border-slate-100">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Dealer Price (DP)</span>
                          <span className="text-sm font-black text-slate-800">{phone.dp}</span>
                        </div>
                        {hasSellOut && (
                          <div className="flex flex-col items-center justify-center mb-4">
                            <div className="flex items-center justify-center gap-1.5"><Tag size={16} className="text-emerald-600 shrink-0" /><span className="text-sm font-bold shrink-0 text-slate-800">Sellout Support:</span><span className="text-sm font-black text-emerald-700">- {formatSafePrice(splitAmountAndDesc(phone.sellOut).amount)}</span></div>
                            {splitAmountAndDesc(phone.sellOut).desc && (<span className="text-[11px] font-semibold text-slate-500 text-center max-w-[85%] mt-0.5 leading-tight">{splitAmountAndDesc(phone.sellOut).desc}</span>)}
                          </div>
                        )}
                        {hasUpg && (
                          <div className="flex flex-col items-center justify-center mb-4">
                            <div className="flex items-center justify-center gap-1.5"><TrendingUp size={16} className="text-purple-600 shrink-0" /><span className="text-sm font-bold shrink-0 text-slate-800">Upgrade Bonus:</span><span className="text-sm font-black text-purple-700">- {formatSafePrice(splitAmountAndDesc(phone.upgrade).amount)}</span></div>
                            {splitAmountAndDesc(phone.upgrade).desc && (<span className="text-[11px] font-semibold text-slate-500 text-center max-w-[85%] mt-0.5 leading-tight">{splitAmountAndDesc(phone.upgrade).desc}</span>)}
                          </div>
                        )}
                        {hasUpg && hasBank && !isCombo && (
                          <div className="flex items-center justify-center my-2 opacity-50">
                            <div className="h-px bg-slate-400 w-12"></div><span className="mx-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">OR</span><div className="h-px bg-slate-400 w-12"></div>
                          </div>
                        )}
                        {hasBank && (
                          <div className="flex flex-col items-center justify-center mb-4">
                            <div className="flex items-center justify-center gap-1.5"><CreditCard size={16} className="text-blue-600 shrink-0" /><span className="text-sm font-bold shrink-0 text-slate-800">Bank Offer:</span><span className="text-sm font-black text-blue-700">- {formatSafePrice(splitAmountAndDesc(phone.bank).amount)}</span></div>
                            {splitAmountAndDesc(phone.bank).desc && (<span className="text-[11px] font-semibold text-slate-500 text-center max-w-[85%] mt-0.5 leading-tight">{splitAmountAndDesc(phone.bank).desc}</span>)}
                          </div>
                        )}
                        {hasSpcl && (
                          <div className="flex flex-col items-center justify-center mb-4">
                            <div className="flex items-center justify-center gap-1.5"><Zap size={16} className="text-amber-500 shrink-0 fill-amber-500" /><span className="text-sm font-bold shrink-0 text-slate-800">Special Offer:</span><span className="text-sm font-black text-amber-600">{formatSafePrice(splitAmountAndDesc(phone.specialUpgrade).amount)}</span></div>
                            {splitAmountAndDesc(phone.specialUpgrade).desc && (<span className="text-[11px] font-semibold text-slate-500 text-center max-w-[85%] mt-0.5 leading-tight">{splitAmountAndDesc(phone.specialUpgrade).desc}</span>)}
                          </div>
                        )}
                        {phone.gift && (
                          <div className="flex items-center justify-center gap-1.5 mb-4">
                            <Gift size={16} className="text-pink-600 shrink-0" /><span className="text-sm font-black text-center break-words text-pink-600">{phone.gift}</span>
                          </div>
                        )}
                        {phone.remarks && (
                          <div className="bg-amber-50 border-amber-200 mb-4 mx-2 rounded-lg p-2.5 text-center shadow-sm">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider block mb-0.5 text-amber-700">Remarks</span><span className="text-xs font-bold text-amber-900">{phone.remarks}</span>
                          </div>
                        )}
                        <div className="border-slate-900 bg-white shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] hover:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] border-2 rounded-xl p-3 text-center transition-transform mt-2">
                          <p className="text-[10px] sm:text-xs font-extrabold uppercase tracking-[0.2em] mb-1 text-slate-500">Effective Price</p>
                          <p className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">{phone.effectivePrice}</p>
                        </div>
                        {phone.mopNum > 0 && phone.effNum > 0 && phone.mopNum > phone.effNum && (
                          <div className="mt-3 text-center"><span className="bg-green-100 text-green-800 border-green-200 inline-block text-[10px] font-bold px-2.5 py-1 rounded-full border">Total Benefit: ₹{(phone.mopNum - phone.effNum).toLocaleString('en-IN')}</span></div>
                        )}
                        
                        {/* 4 Action Buttons included Compare */}
                        <div className="mt-5 pt-4 grid grid-cols-4 gap-2 border-t border-slate-200">
                          <button onClick={(e) => { e.stopPropagation(); handleCopy(phone); }} className="bg-slate-100 hover:bg-slate-200 text-slate-700 flex flex-col items-center justify-center gap-1 text-[10px] font-bold py-2.5 rounded-xl transition-colors">
                            {copyStatus === phone.id ? <><CheckCircle2 size={16} className="text-green-600"/> Copied</> : <><Copy size={16} /> Copy</>}
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setTemplateModalPhone(phone); }} disabled={isGeneratingImg === phone.id} className="bg-blue-50 hover:bg-blue-100 text-blue-700 flex flex-col items-center justify-center gap-1 text-[10px] font-bold py-2.5 rounded-xl transition-colors disabled:opacity-50">
                            {isGeneratingImg === phone.id ? (<RefreshCw size={16} className="animate-spin" />) : (<><ImageIcon size={16} /> Poster</>)}
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleWhatsApp(phone); }} className="bg-[#e6f4ea] hover:bg-[#ceead6] text-[#137333] flex flex-col items-center justify-center gap-1 text-[10px] font-bold py-2.5 rounded-xl transition-colors">
                            <MessageCircle size={16} /> WhatsApp
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); toggleCompare(phone); }} className={`flex flex-col items-center justify-center gap-1 text-[10px] font-bold py-2.5 rounded-xl transition-all ${isSelectedForCompare ? 'bg-orange-500 text-white shadow-inner' : 'bg-orange-50 text-orange-600'}`}>
                            <ArrowUpDown size={16}/> {isSelectedForCompare ? 'Selected' : 'Compare'}
                          </button>
                        </div>

                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="bg-white border-slate-200 flex flex-col items-center justify-center py-16 px-4 text-center rounded-xl border border-dashed">
                <SamAssistIcon className="text-slate-300 h-10 w-10 mb-3" />
                <h3 className="text-base font-bold text-slate-900">No models found</h3>
                <p className="text-xs mt-1 text-slate-500">Please try another search or check data.</p>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="max-w-4xl mx-auto px-6 py-8 text-center pb-24 opacity-80">
        <div className="flex flex-col items-center justify-center gap-3 mb-6 border-b border-slate-200 pb-6">
          <p className="text-xs font-bold text-slate-600">Stay updated with Samsung deals!</p>
          <a href={WA_CHANNEL_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-2.5 bg-[#25D366] text-white rounded-full shadow-md hover:bg-[#1da851] hover:-translate-y-0.5 transition-all duration-200">
            <MessageCircle size={18} />
            <span className="text-sm font-bold">Join SAMSUNG (Nagpur) Channel</span>
          </a>
        </div>
        <p className="text-[10px] sm:text-xs text-slate-500 font-medium leading-relaxed mb-5">
          ⚠️ <strong className="text-slate-600">Disclaimer:</strong> This app is only for quick estimation. The developer is not liable for any incorrect pricing. Always verify the final amount using <b>Official Scheme Letters</b> or by contacting your <b>Team Leader</b> before billing.
        </p>
        <div className="flex items-center justify-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Powered by</span>
          <a href="https://youtube.com/@MabArena" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-full transition-colors">
            <Youtube size={14} className="text-red-600" /><span className="text-xs font-extrabold text-slate-800">Mab Arena</span>
          </a>
        </div>
      </footer>

      {showScroll && (
        <button onClick={scrollTop} className="bg-slate-900 hover:bg-slate-800 text-white fixed bottom-6 right-6 p-3 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.3)] hover:-translate-y-1 transition-all duration-300 z-50 flex items-center justify-center" aria-label="Scroll to top">
          <ArrowUp size={24} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}