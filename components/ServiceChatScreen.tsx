import React, { useState, useEffect, useRef } from 'react';
import { Provider } from '../types';
import { haptics } from '../haptics';
import { confirmNegotiatedTicket, releaseMaintenanceTicketToPending } from '../maintenanceStorage';
import { confirmPickDropRequest, releasePickDropRequestToPending } from '../pickDropStorage';

interface Props {
  provider: Provider | null;
  initialPrice: string;
  serviceCategory?: string;
  ticketId?: string;
  onBack: () => void;
  onTrack: (serviceInfo?: any) => void;
  onConfirmed?: (finalPrice: string) => void;
  lang?: 'EN' | 'BN';
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'provider' | 'system';
  type?: 'text' | 'offer' | 'acceptance' | 'counter';
  text?: string;
  price?: string;
  time: string;
}

const ServiceChatScreen: React.FC<Props> = ({ 
  provider, 
  initialPrice, 
  serviceCategory, 
  ticketId, 
  onBack, 
  onTrack,
  onConfirmed,
  lang = 'EN'
}) => {
  const isBn = lang === 'BN';
  const cleanInitialPrice = initialPrice.replace(/[^0-9]/g, '') || '1500';
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [jobStatus, setJobStatus] = useState<'NEGOTIATING' | 'CONFIRMED'>('NEGOTIATING');
  const [negotiatedPrice, setNegotiatedPrice] = useState(cleanInitialPrice);
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [counterInput, setCounterInput] = useState(cleanInitialPrice);
  const [showPriceMismatchModal, setShowPriceMismatchModal] = useState(false);
  const [isRebroadcasted, setIsRebroadcasted] = useState(false);
  
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Initial Offer from User
    setMessages([
      { 
        id: 'msg-1',
        sender: 'user', 
        type: 'offer', 
        price: cleanInitialPrice, 
        text: `Initial service offer: ৳ ${cleanInitialPrice}`,
        time: nowStr 
      }
    ]);

    // Simulated Provider Greeting
    const timer = setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const isSec = (serviceCategory || '').toLowerCase().includes('security') || (serviceCategory || '').toLowerCase().includes('guard');
        const greetingText = isSec 
          ? `Salam! I am ${provider?.name || 'Habibur Rahman'}, Senior Security Officer. I have reviewed your security deployment request and location. Are your dates and timings flexible, or would you like me to deploy on the scheduled hour?`
          : `Hello! I am ${provider?.name || 'the service specialist'}. I have received your request for ${serviceCategory || 'the service'}. I am currently available in your area. Let me know if you would like to proceed with ৳ ${cleanInitialPrice} or discuss the scope.`;

        setMessages(prev => [...prev, { 
          id: 'msg-2',
          sender: 'provider', 
          type: 'text',
          text: greetingText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        }]);
      }, 1400);
    }, 800);

    return () => clearTimeout(timer);
  }, [cleanInitialPrice, provider?.name, serviceCategory]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  if (!provider) return null;

  // Handle user sending a text message
  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    haptics.selection();

    const userText = inputText.trim();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      type: 'text',
      text: userText,
      time: timeStr
    };

    setMessages(prev => [...prev, newMsg]);
    setInputText('');

    // Provider auto-response logic
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      let reply = "Understood. Everything is noted, and I am ready to carry out the assignment safely and professionally.";
      
      const lower = userText.toLowerCase();
      if (lower.includes('discount') || lower.includes('less') || lower.includes('price') || lower.includes('cost') || lower.includes('tk') || lower.includes('taka')) {
        reply = `I can accommodate your budget! If you agree to ৳ ${negotiatedPrice}, we can confirm and lock in the deal right away.`;
      } else if (lower.includes('time') || lower.includes('when') || lower.includes('today') || lower.includes('arrive')) {
        reply = "I am on standby and can be on-site within 20 to 30 minutes once we confirm the booking.";
      } else if (lower.includes('gate') || lower.includes('guard') || lower.includes('uniform') || lower.includes('security')) {
        reply = "I will report in full standard uniform with personal logbook, two-way comms, and duty inspection equipment.";
      }

      setMessages(prev => [...prev, {
        id: `msg-${Date.now() + 1}`,
        sender: 'provider',
        type: 'text',
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 1300);
  };

  // Handle submitting a counter-offer
  const handleProposeCounter = (customPrice?: string) => {
    const finalPrice = customPrice || counterInput || cleanInitialPrice;
    setNegotiatedPrice(finalPrice);
    setShowCounterModal(false);
    haptics.selection();

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages(prev => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        sender: 'user',
        type: 'counter',
        price: finalPrice,
        text: `Proposed Negotiated Price: ৳ ${finalPrice}`,
        time: timeStr
      }
    ]);

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [
        ...prev,
        {
          id: `msg-${Date.now() + 1}`,
          sender: 'provider',
          type: 'text',
          text: `৳ ${finalPrice} works for me! You can click "Confirm & Lock Deal" below to activate and start live dispatch.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 1200);
  };

  // Confirm negotiated price and lock the deal
  const handleConfirmDeal = () => {
    haptics.bookingConfirmed();
    setJobStatus('CONFIRMED');

    // Update ticket in persistent storage if ticketId is provided
    if (ticketId) {
      if (ticketId.startsWith('PD-')) {
        confirmPickDropRequest(ticketId, negotiatedPrice);
      } else {
        confirmNegotiatedTicket(ticketId, negotiatedPrice);
      }
    }

    onConfirmed?.(negotiatedPrice);

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        sender: 'system',
        type: 'acceptance',
        price: negotiatedPrice,
        text: `Agreement officially confirmed at ৳ ${negotiatedPrice}. ${provider.name} is confirmed and request status is now CONFIRMED in history!`,
        time: timeStr
      }
    ]);
  };

  // Handle Price Mismatch / Cancel and Re-broadcast to other providers
  const handlePriceMismatchCancel = () => {
    haptics.selection();
    if (ticketId) {
      if (ticketId.startsWith('PD-')) {
        releasePickDropRequestToPending(ticketId, 'Price negotiation could not reach agreement');
      } else {
        releaseMaintenanceTicketToPending(ticketId, 'Price negotiation could not reach agreement');
      }
    }
    setIsRebroadcasted(true);
    setShowPriceMismatchModal(false);

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        sender: 'system',
        type: 'text',
        text: isBn 
          ? `❌ দরদাম মেলেনি। এই অনুরোধটি বাতিল করে পুনরায় অপেক্ষমাণ (PENDING) তালিকায় অন্তর্ভুক্ত করা হয়েছে এবং অন্য অনুমোদিত সেবা প্রদানকারীদের জন্য পুনরায় সম্প্রচার করা হয়েছে।` 
          : `❌ Price negotiation cancelled due to price disagreement. This request has been returned to PENDING status and re-broadcasted to all authorized service providers.`,
        time: timeStr
      }
    ]);
  };

  return (
    <div className="relative flex h-screen w-full flex-col bg-background-dark font-display text-white overflow-hidden max-w-[480px] mx-auto">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0c1817]/90 backdrop-blur-2xl border-b border-white/[0.08]">
        <div className="flex items-center justify-between p-4 pt-11 pb-3 max-w-[480px] mx-auto">
          <button 
            type="button"
            onClick={onBack} 
            className="flex items-center justify-center size-10 rounded-full glass-card text-white hover:bg-white/10 active:scale-90 transition-all border border-white/10"
            title="Back"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
          </button>
          
          <div className="flex flex-col items-center">
            <div className="relative">
              <div 
                className="size-11 rounded-full bg-cover bg-center border-2 border-primary/40 shadow-[0_0_15px_rgba(19,236,218,0.3)]" 
                style={{ backgroundImage: `url("${provider.image}")` }}
              />
              <div className="absolute bottom-0 right-0 size-3 bg-emerald-400 rounded-full border-2 border-background-dark shadow"></div>
            </div>
            <h2 className="text-white text-sm font-black mt-1 uppercase italic tracking-tight flex items-center gap-1">
              <span>{provider.name}</span>
              <span className="material-symbols-outlined text-primary text-xs font-black">verified</span>
            </h2>
            <p className="text-primary text-[10px] font-bold uppercase tracking-widest opacity-90">
              {serviceCategory || provider.category || 'Specialist'} • ৳ {negotiatedPrice}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {jobStatus === 'NEGOTIATING' && !isRebroadcasted && (
              <button 
                type="button"
                onClick={() => setShowPriceMismatchModal(true)}
                className="flex items-center justify-center size-10 rounded-full glass-card text-red-400 hover:bg-red-500/10 active:scale-90 transition-all border border-red-500/20"
                title={isBn ? 'দরদাম না মিললে বাতিল ও পুনরায় সম্প্রচার' : "Price doesn't meet? Cancel & Re-broadcast"}
              >
                <span className="material-symbols-outlined text-lg">call_end</span>
              </button>
            )}
            <button 
              type="button"
              onClick={() => setShowCounterModal(true)}
              className="flex items-center justify-center size-10 rounded-full glass-card text-primary hover:bg-primary/10 active:scale-90 transition-all border border-primary/20"
              title="Negotiate Price"
            >
              <span className="material-symbols-outlined text-lg">payments</span>
            </button>
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <main className="flex-1 pt-32 pb-36 px-4 overflow-y-auto no-scrollbar space-y-4 flex flex-col">
        {/* Status Pill */}
        <div className="flex justify-center my-1">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-[10px] font-black uppercase tracking-widest">
            <span className="size-2 rounded-full bg-primary animate-ping"></span>
            <span>{jobStatus === 'CONFIRMED' ? (isBn ? 'ইতিহাসে নিশ্চিতকৃত' : 'Confirmed in History') : (isBn ? 'সরাসরি দরদাম চলছে' : 'Live Negotiation Active')}</span>
          </div>
        </div>

        {messages.map((m) => (
          <div 
            key={m.id} 
            className={`flex flex-col gap-1 max-w-[88%] ${
              m.sender === 'user' ? 'self-end items-end' : m.sender === 'system' ? 'self-center items-center w-full max-w-full' : 'self-start items-start'
            }`}
          >
            {/* Offer Bubble */}
            {m.type === 'offer' ? (
              <div className="bg-primary/10 border border-primary/30 rounded-3xl p-5 w-full text-center shadow-xl backdrop-blur-xl">
                <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-1">{isBn ? 'গ্রাহকের প্রাথমিক প্রস্তাব' : 'Customer Initial Offer'}</p>
                <h3 className="text-primary text-3xl font-black italic">৳ {m.price}</h3>
                <p className="text-white/40 text-[9px] font-bold uppercase tracking-wider mt-1.5">
                  {isBn ? 'শর্ত নির্ধারণ করুন অথবা নিচে পাল্টা প্রস্তাব দিন' : 'Negotiate terms or counter-offer below'}
                </p>
              </div>
            ) : m.type === 'counter' ? (
              <div className="bg-amber-400/10 border border-amber-400/30 rounded-3xl p-4 w-full text-center shadow-xl">
                <p className="text-amber-300 text-[9.5px] font-black uppercase tracking-widest mb-0.5">{isBn ? 'পাল্টা প্রস্তাব পেশ করা হয়েছে' : 'Counter-Offer Proposed'}</p>
                <h3 className="text-amber-300 text-2xl font-black italic">৳ {m.price}</h3>
                <p className="text-white/40 text-[8.5px] font-bold uppercase mt-1">{isBn ? 'সম্মতির অপেক্ষায়' : 'Awaiting Agreement Confirmation'}</p>
              </div>
            ) : m.type === 'acceptance' ? (
              /* Confirmed Job Card */
              <div className="bg-[#0e211e]/95 backdrop-blur-2xl border border-primary/40 rounded-[2rem] p-6 w-full flex flex-col items-center gap-4 text-center shadow-[0_10px_40px_rgba(19,236,218,0.2)] my-2">
                <div className="flex items-center justify-center size-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.3)]">
                  <span className="material-symbols-outlined text-3xl font-black">verified</span>
                </div>
                <div>
                  <h3 className="text-white text-lg font-black italic uppercase tracking-tight">{isBn ? 'চুক্তি চূড়ান্ত ও নিশ্চিত হয়েছে!' : 'Deal Confirmed!'}</h3>
                  <p className="text-emerald-400 text-[11px] font-black uppercase tracking-widest mt-0.5">
                    {isBn ? 'চূড়ান্ত দরদামকৃত মূল্য:' : 'Final Negotiated Price:'} ৳ {m.price}
                  </p>
                  <p className="text-white/50 text-[9.5px] font-bold uppercase tracking-wider mt-1">
                    {isBn ? 'এই অনুরোধটি এখন সেবা ও কাজের ' : 'Request status is now '}
                    <span className="text-emerald-400 font-black">{isBn ? 'ইতিহাসে নিশ্চিত' : 'CONFIRMED'}</span> 
                    {isBn ? ' হয়েছে' : ' in History'}
                  </p>
                </div>

                <div className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex flex-col gap-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-white/50 font-bold uppercase text-[10px]">{isBn ? 'সেবা' : 'Service'}</span>
                    <span className="text-white font-black italic">{serviceCategory || provider.category}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/50 font-bold uppercase text-[10px]">{isBn ? 'সেবা প্রদানকারী' : 'Provider'}</span>
                    <span className="text-white font-black italic">{provider.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/50 font-bold uppercase text-[10px]">{isBn ? 'ইতিহাসের অবস্থা' : 'History State'}</span>
                    <span className="text-emerald-400 font-black uppercase text-[10px] flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-emerald-400"></span>
                      {isBn ? 'নিশ্চিতকৃত চুক্তি' : 'CONFIRMED REQUEST'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 w-full pt-1">
                  <button 
                    type="button"
                    onClick={onBack}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white font-black py-3.5 rounded-xl border border-white/10 tracking-widest uppercase italic text-[10px] active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-base">receipt_long</span>
                    <span>{isBn ? 'ইতিহাস দেখুন' : 'View in History'}</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => onTrack({
                      providerName: provider.name,
                      category: serviceCategory || provider.category,
                      price: `৳ ${m.price}`,
                      providerImage: provider.image,
                      providerPhone: '+880 1855-667788',
                      id: ticketId
                    })} 
                    className="flex-1 bg-primary text-background-dark font-black py-3.5 rounded-xl shadow-lg tracking-widest uppercase italic text-[10px] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-base font-black">near_me</span>
                    <span>{isBn ? 'লাইভ ট্র্যাকিং' : 'Track Live'}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Regular Text Bubble */
              <div 
                className={`px-4 py-3 rounded-2xl text-[13px] leading-relaxed shadow-md ${
                  m.sender === 'user' 
                    ? 'bg-primary text-background-dark font-medium rounded-br-sm shadow-primary/10' 
                    : 'bg-white/[0.06] border border-white/10 text-white/95 rounded-bl-sm'
                }`}
              >
                {m.text}
              </div>
            )}
            <span className="text-[9px] text-white/35 font-bold px-1.5">{m.time}</span>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 self-start pl-2">
            <div className="flex gap-1">
              <div className="size-1.5 bg-primary/60 rounded-full animate-bounce"></div>
              <div className="size-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="size-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
            <span className="text-[10px] text-white/40 italic font-bold uppercase tracking-wider">
              {provider.name} {isBn ? 'টাইপ করছেন...' : 'is typing...'}
            </span>
          </div>
        )}

        <div ref={chatBottomRef} />
      </main>

      {/* Floating Action / Confirm Bar (above input) */}
      {jobStatus === 'NEGOTIATING' && !isRebroadcasted && (
        <div className="fixed bottom-24 left-0 right-0 z-40 px-4 max-w-[480px] mx-auto pointer-events-auto">
          <div className="glass-card p-2.5 rounded-2xl border border-primary/30 flex items-center justify-between gap-2 shadow-2xl bg-[#0c1817]/95 backdrop-blur-xl">
            <div className="flex flex-col pl-1.5">
              <span className="text-[9px] uppercase tracking-wider text-white/50 font-bold">{isBn ? 'প্রস্তাবিত মূল্য' : 'Agreed Price'}</span>
              <span className="text-primary text-lg font-black italic">৳ {negotiatedPrice}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowPriceMismatchModal(true)}
                className="py-2.5 px-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1"
                title={isBn ? 'দরদাম মেলেনি? বাতিল ও পুনরায় সম্প্রচার' : "Price mismatch? Cancel & re-broadcast"}
              >
                <span className="material-symbols-outlined text-xs">call_end</span>
                <span>{isBn ? 'দরদাম মেলেনি' : 'Mismatch'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowCounterModal(true)}
                className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-[10px] font-black uppercase tracking-wider transition-all"
              >
                {isBn ? 'পাল্টা প্রস্তাব' : 'Counter'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDeal}
                className="py-2.5 px-3.5 rounded-xl bg-primary text-background-dark text-[10px] font-black uppercase tracking-wider shadow-lg shadow-primary/25 hover:brightness-110 active:scale-95 transition-all flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-xs font-black">check</span>
                <span>{isBn ? 'চূড়ান্ত' : 'Confirm'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input Bar or Re-broadcasted Status Banner */}
      {isRebroadcasted ? (
        <footer className="fixed bottom-0 left-0 right-0 p-4 pb-8 z-50 bg-[#0c1817]/95 border-t border-amber-500/30 backdrop-blur-2xl max-w-[480px] mx-auto text-center space-y-2.5 shadow-2xl">
          <div className="flex items-center justify-center gap-2 text-amber-300 text-xs font-black uppercase tracking-wide">
            <span className="material-symbols-outlined text-base animate-spin">sync</span>
            <span>{isBn ? 'অনুরোধটি পুনরায় PENDING অবস্থায় সম্প্রচারিত!' : 'Request Returned to PENDING & Broadcasted!'}</span>
          </div>
          <p className="text-[11px] text-white/70 max-w-sm mx-auto leading-relaxed">
            {isBn 
              ? 'দরদামে একমত না হওয়ায় অনুরোধটি পুনরায় উন্মুক্ত করা হয়েছে। অন্য সকল অনুমোদিত সেবা প্রদানকারী এটি দেখতে ও গ্রহণ করতে পারবেন।' 
              : 'Price negotiation discontinued. This request has been re-opened in PENDING status for other authorized providers to accept.'}
          </p>
          <button
            type="button"
            onClick={onBack}
            className="w-full py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-amber-400/25"
          >
            <span className="material-symbols-outlined text-base font-black">receipt_long</span>
            <span>{isBn ? 'সেবা ও কাজের ইতিহাস দেখুন' : 'View in Service History'}</span>
          </button>
        </footer>
      ) : (
        <footer className="fixed bottom-0 left-0 right-0 p-4 pb-8 z-50 bg-gradient-to-t from-background-dark via-background-dark/95 to-transparent pt-3 max-w-[480px] mx-auto">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="glass-card rounded-full p-1.5 pl-4 flex items-center gap-2 shadow-2xl border border-white/10 backdrop-blur-2xl bg-[#0d1c1a]/90"
          >
            <button 
              type="button"
              onClick={() => setShowCounterModal(true)}
              className="flex items-center justify-center size-9 rounded-full text-white/50 hover:text-primary transition-colors shrink-0"
              title="Make a price offer"
            >
              <span className="material-symbols-outlined text-[20px]">price_change</span>
            </button>
            
            <input 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-white/30 text-[13px] font-medium outline-none" 
              placeholder={isBn ? `${provider.name}-কে বার্তা পাঠান...` : `Message ${provider.name}...`} 
              type="text"
            />

            <button 
              type="submit"
              disabled={!inputText.trim()}
              className="bg-primary disabled:opacity-40 size-10 rounded-full flex items-center justify-center shadow-lg shadow-primary/30 active:scale-90 transition-transform text-background-dark shrink-0"
            >
              <span className="material-symbols-outlined text-[20px] font-bold">arrow_upward</span>
            </button>
          </form>
        </footer>
      )}

      {/* Counter-Offer Modal */}
      {showCounterModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background-dark/80 backdrop-blur-md animate-in fade-in">
          <div className="glass-card rounded-3xl p-6 w-full max-w-sm border border-primary/30 bg-[#0c1c1a] shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-white/10">
              <h3 className="text-white text-base font-black uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">payments</span>
                <span>{isBn ? 'পাল্টা মূল্য প্রস্তাব দিন' : 'Propose Counter-Offer'}</span>
              </h3>
              <button 
                type="button"
                onClick={() => setShowCounterModal(false)}
                className="text-white/40 hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-white/60 tracking-wider">
                {isBn ? 'কাঙ্ক্ষিত মূল্য লিখুন (৳ বাংলাদেশি টাকা)' : 'Enter Desired Price (৳ BDT)'}
              </label>
              <div className="flex items-center gap-2 bg-white/5 rounded-2xl px-4 py-3 border border-white/15">
                <span className="text-primary text-xl font-black">৳</span>
                <input 
                  type="number"
                  value={counterInput}
                  onChange={(e) => setCounterInput(e.target.value)}
                  className="bg-transparent border-none focus:ring-0 text-white font-black text-xl w-full outline-none"
                  placeholder="যেমন: ১৫০০০"
                />
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex gap-2">
              {[
                { label: '- ৳ ৫০০', val: Math.max(500, Number(negotiatedPrice) - 500) },
                { label: '+ ৳ ৫০০', val: Number(negotiatedPrice) + 500 },
                { label: '+ ৳ ১০০০', val: Number(negotiatedPrice) + 1000 }
              ].map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCounterInput(String(p.val))}
                  className="flex-1 py-1.5 px-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-[10px] font-bold"
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowCounterModal(false)}
                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-bold uppercase tracking-wider"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => handleProposeCounter()}
                className="flex-1 py-3 rounded-xl bg-primary text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-primary/30 hover:brightness-110 active:scale-95 transition-all"
              >
                {isBn ? 'প্রস্তাব পাঠান' : 'Send Offer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Price Mismatch / Cancel & Re-broadcast Modal */}
      {showPriceMismatchModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background-dark/85 backdrop-blur-md animate-in fade-in">
          <div className="glass-card rounded-3xl p-6 w-full max-w-sm border border-red-500/30 bg-[#0f1b19] shadow-2xl space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-white/10">
              <div className="size-11 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <span className="material-symbols-outlined text-2xl font-black">sync_problem</span>
              </div>
              <div>
                <h3 className="text-white text-sm font-black uppercase tracking-tight">
                  {isBn ? 'দরদাম মেলেনি? পুনরায় সম্প্রচার' : "Price Doesn't Meet? Re-broadcast"}
                </h3>
                <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">
                  {isBn ? 'বাতিল করে অন্য প্রোভাইডার খুঁজুন' : 'Reset to PENDING & Broadcast'}
                </p>
              </div>
            </div>

            <p className="text-white/80 text-xs leading-relaxed font-medium">
              {isBn 
                ? `আপনি এবং ${provider.name} মূল্যের বিষয়ে একমত হতে না পারলে এই চ্যাট ও আলোচনা বাতিল করতে পারেন। আপনার এই অনুরোধটির স্ট্যাটাস পুনরায় 'PENDING' হবে এবং সিস্টেমের অন্য সকল অনুমোদিত সেবা প্রদানকারীদের কাছে পুনরায় সম্প্রচার করা হবে।`
                : `If you and ${provider.name} cannot agree on the price, cancelling will reset your request back to PENDING status and automatically re-broadcast it to all other approved service providers.`}
            </p>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
              <span className="text-white/60 font-bold uppercase text-[10px]">{isBn ? 'বর্তমান অফার' : 'Current Offer'}</span>
              <span className="text-primary font-black italic">৳ {negotiatedPrice}</span>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowPriceMismatchModal(false)}
                className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 text-xs font-bold uppercase tracking-wider transition-all"
              >
                {isBn ? 'দরদাম চালিয়ে যান' : 'Keep Negotiating'}
              </button>
              <button
                type="button"
                onClick={handlePriceMismatchCancel}
                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-400 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-red-500/30 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm font-black">sync</span>
                <span>{isBn ? 'বাতিল ও সম্প্রচার' : 'Cancel & Re-broadcast'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .glass-card { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default ServiceChatScreen;
