import React, { useState, useEffect, useRef } from 'react';
import { Provider } from '../types';
import { haptics } from '../haptics';
import { confirmNegotiatedTicket, releaseMaintenanceTicketToPending } from '../maintenanceStorage';
import { confirmPickDropRequest, releasePickDropRequestToPending } from '../pickDropStorage';
import { realtimeClient, RealtimeChatMessage } from '../realtimeClient';
import ProviderAvatar from './ProviderAvatar';

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
  const effectiveTicketId = ticketId || `ticket-${(provider?.name || 'service').toLowerCase().replace(/\s+/g, '-')}`;

  const [messages, setMessages] = useState<RealtimeChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [jobStatus, setJobStatus] = useState<'NEGOTIATING' | 'CONFIRMED'>('NEGOTIATING');
  const [negotiatedPrice, setNegotiatedPrice] = useState(cleanInitialPrice);
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [counterInput, setCounterInput] = useState(cleanInitialPrice);
  const [showPriceMismatchModal, setShowPriceMismatchModal] = useState(false);
  const [isRebroadcasted, setIsRebroadcasted] = useState(false);
  const [isWsConnected, setIsWsConnected] = useState(realtimeClient.getIsConnected());
  
  // Swipe-down dismissible state for the agreed price negotiation tab
  const [isPriceTabHidden, setIsPriceTabHidden] = useState(false);
  const [swipeOffsetY, setSwipeOffsetY] = useState(0);
  const [isSwipingTab, setIsSwipingTab] = useState(false);
  const tabTouchStartY = useRef<number | null>(null);
  const tabTouchStartX = useRef<number | null>(null);
  const tabGestureActive = useRef(false);

  // Automatically unhide tab whenever negotiated price updates (e.g. from counter offer)
  useEffect(() => {
    setIsPriceTabHidden(false);
  }, [negotiatedPrice]);

  const handleTabTouchStart = (clientY: number, clientX: number) => {
    tabTouchStartY.current = clientY;
    tabTouchStartX.current = clientX;
    tabGestureActive.current = true;
  };

  const handleTabTouchMove = (clientY: number, clientX: number) => {
    if (!tabGestureActive.current || tabTouchStartY.current === null || tabTouchStartX.current === null) return;
    const deltaY = clientY - tabTouchStartY.current;
    const deltaX = Math.abs(clientX - tabTouchStartX.current);

    // Only allow downward drag
    if (deltaY > 0 && deltaY > deltaX) {
      setIsSwipingTab(true);
      // Gentle damping resistance
      setSwipeOffsetY(Math.max(0, deltaY * 0.82));
    } else if (deltaY < -12 && !isSwipingTab) {
      // Swiping up cancels the downward gesture
      tabGestureActive.current = false;
      tabTouchStartY.current = null;
    }
  };

  const handleTabTouchEnd = () => {
    if (!tabGestureActive.current && !isSwipingTab) return;
    tabGestureActive.current = false;
    tabTouchStartY.current = null;
    tabTouchStartX.current = null;

    if (swipeOffsetY >= 35) {
      // Threshold exceeded -> slide out smoothly and hide
      try {
        haptics.selection();
      } catch (e) {}
      setSwipeOffsetY(90);
      setTimeout(() => {
        setIsPriceTabHidden(true);
        setSwipeOffsetY(0);
        setIsSwipingTab(false);
      }, 180);
    } else {
      // Snap back to top
      setSwipeOffsetY(0);
      setIsSwipingTab(false);
    }
  };

  // Real-time Active User Perspective (Resident vs Specialist/Provider)
  const [activeRole, setActiveRole] = useState<'customer' | 'provider'>('customer');
  
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Monitor WebSocket connection
  useEffect(() => {
    const unsub = realtimeClient.onConnectionChange((connected) => {
      setIsWsConnected(connected);
    });
    return unsub;
  }, []);

  // Subscribe to real-time chat messages for this ticket
  useEffect(() => {
    if (!effectiveTicketId) return;

    const unsubscribe = realtimeClient.subscribeChat(effectiveTicketId, (serverMessages) => {
      if (serverMessages.length === 0) {
        // Send initial customer offer to the real-time server
        realtimeClient.sendChatMessage(effectiveTicketId, {
          senderId: 'user-resident',
          senderName: 'Resident',
          senderRole: 'customer',
          type: 'offer',
          price: cleanInitialPrice,
          text: `Initial service offer: ৳ ${cleanInitialPrice}`
        });
      } else {
        setMessages(serverMessages);

        // Check if there is an accepted deal in the real chat history
        const confirmedMsg = [...serverMessages].reverse().find(m => m.type === 'acceptance');
        if (confirmedMsg) {
          setJobStatus('CONFIRMED');
          if (confirmedMsg.price) setNegotiatedPrice(confirmedMsg.price);
        } else {
          // Check latest counter price
          const counterMsg = [...serverMessages].reverse().find(m => m.price);
          if (counterMsg && counterMsg.price) {
            setNegotiatedPrice(counterMsg.price);
          }
        }
      }
    });

    return unsubscribe;
  }, [effectiveTicketId, cleanInitialPrice]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!provider) return null;

  // Real-time: Send message from active user
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    haptics.selection();

    const userText = inputText.trim();
    setInputText('');

    const senderRole = activeRole;
    const senderName = activeRole === 'customer' ? 'Resident' : (provider.name || 'Specialist');
    const senderId = activeRole === 'customer' ? 'resident-main' : `prov-${provider.id || 'spec'}`;

    await realtimeClient.sendChatMessage(effectiveTicketId, {
      senderId,
      senderName,
      senderRole,
      type: 'text',
      text: userText
    });
  };

  // Real-time: Propose Counter-Offer
  const handleProposeCounter = async (customPrice?: string) => {
    const finalPrice = customPrice || counterInput || cleanInitialPrice;
    setNegotiatedPrice(finalPrice);
    setShowCounterModal(false);
    haptics.selection();

    const senderRole = activeRole;
    const senderName = activeRole === 'customer' ? 'Resident' : (provider.name || 'Specialist');
    const senderId = activeRole === 'customer' ? 'resident-main' : `prov-${provider.id || 'spec'}`;

    await realtimeClient.sendChatMessage(effectiveTicketId, {
      senderId,
      senderName,
      senderRole,
      type: 'counter',
      price: finalPrice,
      text: `${senderName} proposed negotiated price: ৳ ${finalPrice}`
    });
  };

  // Real-time: Confirm negotiated price and lock the deal
  const handleConfirmDeal = async () => {
    haptics.bookingConfirmed();
    setJobStatus('CONFIRMED');

    // Update ticket in persistent storage
    if (ticketId) {
      if (ticketId.startsWith('PD-')) {
        confirmPickDropRequest(ticketId, negotiatedPrice);
      } else {
        confirmNegotiatedTicket(ticketId, negotiatedPrice);
      }
    }

    onConfirmed?.(negotiatedPrice);

    await realtimeClient.sendChatMessage(effectiveTicketId, {
      senderId: 'system',
      senderName: 'Duyar Dispatch System',
      senderRole: 'system',
      type: 'acceptance',
      price: negotiatedPrice,
      text: `Agreement officially confirmed at ৳ ${negotiatedPrice}. ${provider.name} is confirmed and request status is now CONFIRMED in history!`
    });

    realtimeClient.broadcastTicketStatus(effectiveTicketId, 'CONFIRMED', {
      providerName: provider.name,
      negotiatedPrice
    });
  };

  // Real-time: Price Mismatch Cancel & Re-broadcast
  const handlePriceMismatchCancel = async () => {
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

    await realtimeClient.sendChatMessage(effectiveTicketId, {
      senderId: 'system',
      senderName: 'Duyar Dispatch System',
      senderRole: 'system',
      type: 'text',
      text: isBn 
        ? `❌ দরদাম মেলেনি। এই অনুরোধটি বাতিল করে পুনরায় অপেক্ষমাণ (PENDING) তালিকায় অন্তর্ভুক্ত করা হয়েছে এবং অন্য অনুমোদিত সেবা প্রদানকারীদের জন্য পুনরায় সম্প্রচার করা হয়েছে।` 
        : `❌ Price negotiation cancelled due to price disagreement. This request has been returned to PENDING status and re-broadcasted to all authorized service providers.`
    });

    realtimeClient.broadcastTicketStatus(effectiveTicketId, 'PENDING', {
      reason: 'Price negotiation cancelled'
    });
  };

  return (
    <div className="relative flex h-screen w-full flex-col bg-background-dark font-display text-white overflow-hidden max-w-[480px] mx-auto">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0c1817]/95 backdrop-blur-2xl border-b border-white/[0.08]">
        <div className="flex items-center justify-between p-4 pt-10 pb-2.5 max-w-[480px] mx-auto">
          <button 
            type="button"
            onClick={onBack} 
            className="flex items-center justify-center size-10 rounded-full glass-card text-white hover:bg-white/10 active:scale-90 transition-all border border-white/10"
            title="Back"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
          </button>
          
          <div className="flex flex-col items-center">
            <ProviderAvatar 
              name={provider.name} 
              category={serviceCategory || provider.category} 
              image={provider.image}
              size="md"
              isOnline={isWsConnected}
              showOnlineDot={true}
            />
            <h2 className="text-white text-xs font-black mt-1 uppercase italic tracking-tight flex items-center gap-1">
              <span>{provider.name}</span>
              <span className="material-symbols-outlined text-primary text-xs font-black">verified</span>
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-primary text-[9.5px] font-bold uppercase tracking-wider opacity-90">
                {serviceCategory || provider.category || 'Specialist'} • ৳ {negotiatedPrice}
              </span>
              <span className="text-white/20 text-[9px]">•</span>
              <div className="flex items-center gap-1">
                <span className={`size-1.5 rounded-full ${isWsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                <span className={`text-[8.5px] font-black uppercase tracking-wider ${isWsConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {isWsConnected ? 'Real-Time' : 'Syncing'}
                </span>
              </div>
            </div>
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

        {/* Real-time Role Switcher Bar */}
        <div className="bg-black/40 border-t border-white/5 px-4 py-1.5 flex items-center justify-between text-[10px]">
          <span className="text-white/50 font-bold uppercase tracking-wider text-[9px]">
            {isBn ? 'আপনার ভূমিকা:' : 'Your Role:'}
          </span>
          <div className="flex items-center bg-white/5 p-0.5 rounded-full border border-white/10">
            <button
              type="button"
              onClick={() => {
                haptics.selection();
                setActiveRole('customer');
              }}
              className={`px-2.5 py-0.5 rounded-full font-black text-[9px] uppercase tracking-wider transition-all ${
                activeRole === 'customer'
                  ? 'bg-primary text-black shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {isBn ? 'গ্রাহক (Resident)' : 'Resident (Client)'}
            </button>
            <button
              type="button"
              onClick={() => {
                haptics.selection();
                setActiveRole('provider');
              }}
              className={`px-2.5 py-0.5 rounded-full font-black text-[9px] uppercase tracking-wider transition-all ${
                activeRole === 'provider'
                  ? 'bg-primary text-black shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {isBn ? 'প্রোভাইডার (Specialist)' : 'Specialist (Provider)'}
            </button>
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <main className="flex-1 pt-36 pb-36 px-4 overflow-y-auto no-scrollbar space-y-4 flex flex-col">
        {/* Status Pill */}
        <div className="flex justify-center my-1">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-[10px] font-black uppercase tracking-widest">
            <span className="size-2 rounded-full bg-primary animate-ping"></span>
            <span>{jobStatus === 'CONFIRMED' ? (isBn ? 'ইতিহাসে নিশ্চিতকৃত' : 'Confirmed in History') : (isBn ? 'সরাসরি দরদাম চলছে' : 'Live Real-Time Negotiation')}</span>
          </div>
        </div>

        {messages.map((m) => {
          const isMe = (m.senderRole === 'customer' && activeRole === 'customer') ||
                       (m.senderRole === 'provider' && activeRole === 'provider');
          const isSystem = m.senderRole === 'system' || m.type === 'acceptance';

          const formattedTime = m.createdAt
            ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Just now';

          return (
            <div 
              key={m.id} 
              className={`flex flex-col gap-1 max-w-[88%] ${
                isSystem ? 'self-center items-center w-full max-w-full' : isMe ? 'self-end items-end' : 'self-start items-start'
              }`}
            >
              {/* Sender label */}
              {!isSystem && (
                <span className="text-[9px] text-white/40 font-bold uppercase tracking-wider px-1">
                  {m.senderName} {isMe ? '(You)' : ''}
                </span>
              )}

              {/* Offer Bubble */}
              {m.type === 'offer' ? (
                <div className="bg-primary/10 border border-primary/30 rounded-3xl p-5 w-full text-center shadow-xl backdrop-blur-xl">
                  <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-1">
                    {isBn ? 'গ্রাহকের প্রাথমিক প্রস্তাব' : 'Customer Initial Offer'}
                  </p>
                  <h3 className="text-primary text-3xl font-black italic">৳ {m.price}</h3>
                  <p className="text-white/40 text-[9px] font-bold uppercase tracking-wider mt-1.5">
                    {isBn ? 'শর্ত নির্ধারণ করুন অথবা নিচে পাল্টা প্রস্তাব দিন' : 'Negotiate terms or counter-offer below'}
                  </p>
                </div>
              ) : m.type === 'counter' ? (
                <div className="bg-amber-400/10 border border-amber-400/30 rounded-3xl p-4 w-full text-center shadow-xl">
                  <p className="text-amber-300 text-[9.5px] font-black uppercase tracking-widest mb-0.5">
                    {isBn ? 'পাল্টা প্রস্তাব পেশ করা হয়েছে' : 'Counter-Offer Proposed'}
                  </p>
                  <h3 className="text-amber-300 text-2xl font-black italic">৳ {m.price}</h3>
                  <p className="text-white/40 text-[8.5px] font-bold uppercase mt-1">
                    {isBn ? 'সম্মতির অপেক্ষায়' : 'Awaiting Agreement Confirmation'}
                  </p>
                </div>
              ) : m.type === 'acceptance' ? (
                /* Confirmed Job Card */
                <div className="bg-[#0e211e]/95 backdrop-blur-2xl border border-primary/40 rounded-[2rem] p-6 w-full flex flex-col items-center gap-4 text-center shadow-[0_10px_40px_rgba(19,236,218,0.2)] my-2">
                  <div className="flex items-center justify-center size-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.3)]">
                    <span className="material-symbols-outlined text-3xl font-black">verified</span>
                  </div>
                  <div>
                    <h3 className="text-white text-lg font-black italic uppercase tracking-tight">
                      {isBn ? 'চুক্তি চূড়ান্ত ও নিশ্চিত হয়েছে!' : 'Deal Confirmed!'}
                    </h3>
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
                        id: effectiveTicketId
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
                    isMe 
                      ? 'bg-primary text-background-dark font-semibold rounded-br-sm shadow-primary/10' 
                      : 'bg-white/[0.06] border border-white/10 text-white/95 rounded-bl-sm'
                  }`}
                >
                  {m.text}
                </div>
              )}
              <span className="text-[9px] text-white/35 font-bold px-1.5">{formattedTime}</span>
            </div>
          );
        })}

        <div ref={chatBottomRef} />
      </main>

      {/* Floating Action / Confirm Bar (above input) with Swipe-Down Hide */}
      {jobStatus === 'NEGOTIATING' && !isRebroadcasted && (
        isPriceTabHidden ? (
          /* Minimized pill when hidden: Tap to restore */
          <div className="fixed bottom-24 left-0 right-0 z-40 px-4 max-w-[480px] mx-auto pointer-events-auto flex justify-center animate-in slide-in-from-bottom-2 fade-in duration-200">
            <button
              type="button"
              onClick={() => {
                try { haptics.selection(); } catch (e) {}
                setIsPriceTabHidden(false);
              }}
              className="px-3.5 py-1.5 rounded-full bg-[#0c1817]/95 border border-primary/40 backdrop-blur-xl shadow-2xl flex items-center gap-2 text-white hover:border-primary active:scale-95 transition-all group"
              title={isBn ? 'দরদামের ট্যাব খুলুন' : 'Tap to show agreed price tab'}
            >
              <span className="material-symbols-outlined text-primary text-sm animate-pulse">payments</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-white/90">
                {isBn ? 'প্রস্তাবিত মূল্য:' : 'Agreed Price:'} <span className="text-primary italic font-black">৳ {negotiatedPrice}</span>
              </span>
              <span className="text-[9px] text-primary font-black uppercase tracking-wider flex items-center gap-0.5 ml-1 bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 group-hover:bg-primary/20">
                <span>{isBn ? 'দেখান' : 'Show'}</span>
                <span className="material-symbols-outlined text-xs group-hover:-translate-y-0.5 transition-transform">keyboard_arrow_up</span>
              </span>
            </button>
          </div>
        ) : (
          /* Full Negotiation Tab: Swipe down to hide */
          <div 
            className="fixed bottom-24 left-0 right-0 z-40 px-4 max-w-[480px] mx-auto pointer-events-auto touch-pan-x"
            style={{
              transform: swipeOffsetY > 0 ? `translate3d(0, ${swipeOffsetY}px, 0)` : undefined,
              opacity: swipeOffsetY > 0 ? Math.max(0, 1 - (swipeOffsetY / 85)) : 1,
              transition: isSwipingTab ? 'none' : 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.22s ease-out'
            }}
            onTouchStart={(e) => {
              if (e.touches.length === 1) {
                handleTabTouchStart(e.touches[0].clientY, e.touches[0].clientX);
              }
            }}
            onTouchMove={(e) => {
              if (e.touches.length === 1) {
                handleTabTouchMove(e.touches[0].clientY, e.touches[0].clientX);
              }
            }}
            onTouchEnd={handleTabTouchEnd}
            onTouchCancel={handleTabTouchEnd}
          >
            <div className="glass-card p-2.5 pt-1.5 rounded-2xl border border-primary/30 shadow-2xl bg-[#0c1817]/95 backdrop-blur-xl relative">
              {/* Top Swipe-down handle bar */}
              <div 
                className="w-full flex flex-col items-center justify-center pt-0.5 pb-1 cursor-grab active:cursor-grabbing select-none"
                title={isBn ? 'নিচে সোয়াইপ করে লুকান' : 'Swipe down to hide'}
                onMouseDown={(e) => {
                  handleTabTouchStart(e.clientY, e.clientX);
                  const onMouseMove = (ev: MouseEvent) => handleTabTouchMove(ev.clientY, ev.clientX);
                  const onMouseUp = () => {
                    handleTabTouchEnd();
                    window.removeEventListener('mousemove', onMouseMove);
                    window.removeEventListener('mouseup', onMouseUp);
                  };
                  window.addEventListener('mousemove', onMouseMove);
                  window.addEventListener('mouseup', onMouseUp);
                }}
              >
                <div className="w-10 h-1 rounded-full bg-white/25 hover:bg-primary/50 transition-colors" />
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 pl-1 min-w-0">
                  <div className="flex flex-col">
                    <span className="text-[8.5px] uppercase tracking-wider text-white/50 font-bold leading-tight">{isBn ? 'প্রস্তাবিত মূল্য' : 'Agreed Price'}</span>
                    <span className="text-primary text-lg font-black italic leading-tight">৳ {negotiatedPrice}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      try { haptics.selection(); } catch (e) {}
                      setIsPriceTabHidden(true);
                    }}
                    className="size-5 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors shrink-0 ml-0.5"
                    title={isBn ? 'লুকান' : 'Hide tab'}
                  >
                    <span className="material-symbols-outlined text-xs">keyboard_arrow_down</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
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
          </div>
        )
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
              placeholder={
                activeRole === 'customer'
                  ? (isBn ? `${provider.name}-কে সরাসরি বার্তা পাঠান...` : `Send real message to ${provider.name}...`)
                  : (isBn ? `গ্রাহককে স্পেশালিস্ট হিসেবে বার্তা পাঠান...` : `Reply as ${provider.name} to Resident...`)
              } 
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
                  placeholder="যেমন: ১৫০০"
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
