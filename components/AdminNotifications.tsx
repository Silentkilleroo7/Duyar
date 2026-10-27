import React, { useState, useMemo } from 'react';
import { AdminMessage } from '../types';
import { persistInAppNotifications } from '../searchAlertStorage';
import { haptics } from '../haptics';

interface Props {
  onBack: () => void;
  messages: AdminMessage[];
  setMessages: React.Dispatch<React.SetStateAction<AdminMessage[]>>;
}

type FilterTab = 'ALL' | 'UNREAD' | 'READ';

const AdminNotifications: React.FC<Props> = ({ onBack, messages, setMessages }) => {
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handleMarkAsRead = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      haptics.selection();
    } catch (err) {}

    setMessages(prev => {
      const next = prev.map(m => m.id === id ? { ...m, isRead: true } : m);
      persistInAppNotifications(next);
      return next;
    });
    showToast('Notification marked as read');
  };

  const handleToggleReadStatus = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      haptics.selection();
    } catch (err) {}

    setMessages(prev => {
      const next = prev.map(m => m.id === id ? { ...m, isRead: !m.isRead } : m);
      persistInAppNotifications(next);
      return next;
    });
  };

  const handleClearMessage = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      haptics.light();
    } catch (err) {}

    setMessages(prev => {
      const next = prev.filter(m => m.id !== id);
      persistInAppNotifications(next);
      return next;
    });
    showToast('Notification cleared');
  };

  const handleClearAll = () => {
    if (window.confirm("Clear all notifications from list?")) {
      try {
        haptics.warning();
      } catch (err) {}
      setMessages([]);
      persistInAppNotifications([]);
      showToast('All notifications cleared');
    }
  };

  const handleMarkAllRead = () => {
    try {
      haptics.success();
    } catch (err) {}
    setMessages(prev => {
      const next = prev.map(m => ({ ...m, isRead: true }));
      persistInAppNotifications(next);
      return next;
    });
    showToast('All notifications marked as read');
  };

  const unreadCount = useMemo(() => messages.filter(m => !m.isRead).length, [messages]);
  const readCount = useMemo(() => messages.filter(m => m.isRead).length, [messages]);

  const filteredMessages = useMemo(() => {
    if (activeTab === 'UNREAD') return messages.filter(m => !m.isRead);
    if (activeTab === 'READ') return messages.filter(m => m.isRead);
    return messages;
  }, [messages, activeTab]);

  return (
    <div className="relative flex h-screen w-full flex-col bg-background-dark font-display max-w-[430px] mx-auto overflow-hidden text-white">
      {/* Background Decor */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 rounded-full blur-[120px]"></div>
      </div>

      {/* Floating Feedback Toast */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-primary/20 backdrop-blur-md border border-primary/40 text-primary text-xs font-bold shadow-lg animate-bounce flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <header className="px-5 pt-14 pb-4 shrink-0 flex flex-col gap-4 relative z-10 bg-background-dark/60 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack} 
              aria-label="Back to home"
              className="size-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 active:scale-90 transition-all hover:bg-white/10"
            >
              <span className="material-symbols-outlined text-white/60">arrow_back</span>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-primary tracking-tighter text-2xl font-black italic uppercase">In-Box</h1>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-primary text-background-dark text-[10px] font-black tracking-wider animate-pulse">
                    {unreadCount} NEW
                  </span>
                )}
              </div>
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-semibold">System & Admin Broadcasts</p>
            </div>
          </div>
          <div className="flex gap-2">
            {messages.length > 0 && (
              <button 
                onClick={handleClearAll} 
                title="Clear all notifications"
                className="size-10 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-400 active:scale-90 transition-all hover:bg-red-500/20"
              >
                <span className="material-symbols-outlined text-[20px]">delete_sweep</span>
              </button>
            )}
          </div>
        </div>
        
        {/* Filter Tabs */}
        <div className="flex items-center justify-between gap-1 p-1 bg-white/5 rounded-2xl border border-white/10 text-[10px] font-black tracking-wider">
          <button 
            onClick={() => setActiveTab('ALL')}
            className={`flex-1 py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1 ${activeTab === 'ALL' ? 'bg-primary text-background-dark font-black' : 'text-white/50 hover:text-white'}`}
          >
            <span>ALL</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[9px] ${activeTab === 'ALL' ? 'bg-black/20 text-black' : 'bg-white/10 text-white/60'}`}>{messages.length}</span>
          </button>
          <button 
            onClick={() => setActiveTab('UNREAD')}
            className={`flex-1 py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1 ${activeTab === 'UNREAD' ? 'bg-primary text-background-dark font-black' : 'text-white/50 hover:text-white'}`}
          >
            <span>UNREAD</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[9px] ${activeTab === 'UNREAD' ? 'bg-black/20 text-black' : 'bg-white/10 text-white/60'}`}>{unreadCount}</span>
          </button>
          <button 
            onClick={() => setActiveTab('READ')}
            className={`flex-1 py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1 ${activeTab === 'READ' ? 'bg-primary text-background-dark font-black' : 'text-white/50 hover:text-white'}`}
          >
            <span>READ</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[9px] ${activeTab === 'READ' ? 'bg-black/20 text-black' : 'bg-white/10 text-white/60'}`}>{readCount}</span>
          </button>
        </div>

        {unreadCount > 0 && (
          <button 
            onClick={handleMarkAllRead}
            className="w-full py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all bg-white/5 hover:bg-white/10 border border-white/10 text-primary flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            <span className="material-symbols-outlined text-[15px]">done_all</span>
            <span>MARK ALL AS READ</span>
          </button>
        )}
      </header>

      {/* Main List */}
      <main className="flex-1 overflow-y-auto px-5 pt-4 pb-24 no-scrollbar relative z-10">
        <div className="flex flex-col gap-3.5">
          {filteredMessages.length > 0 ? (
            filteredMessages.map((msg) => (
              <div 
                key={msg.id}
                className={`glass-card rounded-[1.75rem] p-4 flex flex-col gap-3 border transition-all ${
                  msg.isRead 
                    ? 'border-white/5 bg-white/[0.015] opacity-75' 
                    : 'border-primary/30 bg-primary/[0.04] shadow-lg shadow-primary/5'
                }`}
              >
                {/* Top Info Row */}
                <div className="flex items-start gap-3.5">
                  <div className={`size-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                    msg.type === 'ALERT' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                    msg.type === 'SUCCESS' ? 'bg-primary/10 text-primary border-primary/20' : 
                    'bg-blue-500/10 text-blue-400 border-white/10'
                  }`}>
                    <span className="material-symbols-outlined text-2xl">
                      {msg.type === 'ALERT' ? 'priority_high' : msg.type === 'SUCCESS' ? 'check_circle' : 'notifications'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className={`text-sm font-black italic tracking-tight uppercase truncate pr-2 ${msg.isRead ? 'text-white/60' : 'text-white'}`}>
                        {msg.title}
                      </h4>
                      <span className="text-[8px] font-black text-white/30 uppercase tracking-widest shrink-0 mt-1">
                        {msg.time}
                      </span>
                    </div>

                    {!msg.isRead && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="size-1.5 rounded-full bg-primary animate-pulse"></span>
                        <p className="text-[8px] font-black uppercase text-primary tracking-widest italic">New Broadcast</p>
                      </div>
                    )}

                    <p className={`text-[12px] leading-relaxed mt-1.5 ${msg.isRead ? 'text-white/50' : 'text-white/80 font-medium'}`}>
                      {msg.content}
                    </p>
                  </div>
                </div>

                {/* Individual Action Buttons: "Mark as Read" & "Clear" */}
                <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                  {/* Mark as Read Button */}
                  <div className="flex items-center gap-2">
                    {!msg.isRead ? (
                      <button
                        type="button"
                        onClick={(e) => handleMarkAsRead(msg.id, e)}
                        className="px-3 py-1.5 rounded-xl bg-primary/20 hover:bg-primary text-primary hover:text-background-dark border border-primary/40 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                        title="Mark this notification as read"
                      >
                        <span className="material-symbols-outlined text-[16px]">done</span>
                        <span>Mark as Read</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => handleToggleReadStatus(msg.id, e)}
                        className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70 border border-white/5 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
                        title="Mark as unread"
                      >
                        <span className="material-symbols-outlined text-[15px] text-primary/70">check_circle</span>
                        <span>Read</span>
                      </button>
                    )}
                  </div>

                  {/* Clear / Dismiss Individual Notification Button */}
                  <button
                    type="button"
                    onClick={(e) => handleClearMessage(msg.id, e)}
                    className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 border border-white/5 hover:border-red-500/30 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all active:scale-95"
                    title="Clear notification from list"
                  >
                    <span className="material-symbols-outlined text-[15px]">close</span>
                    <span className="text-[10px]">Clear</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-center opacity-30">
              <div className="size-20 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                <span className="material-symbols-outlined text-4xl text-white/60">
                  {activeTab === 'UNREAD' ? 'mark_chat_read' : 'notifications_off'}
                </span>
              </div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-white">
                {activeTab === 'UNREAD' ? 'No unread messages' : activeTab === 'READ' ? 'No read messages' : 'All caught up'}
              </p>
              <p className="text-[10px] text-white/50 tracking-wider mt-1">
                {activeTab === 'UNREAD' ? 'You have reviewed all incoming alerts' : 'System notifications will appear here'}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer Info */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-[380px] px-6 z-20 pointer-events-none">
        <div className="glass-card rounded-full py-2.5 px-5 flex items-center justify-center border border-white/10 bg-background-dark/90 backdrop-blur-2xl">
          <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] italic">Secure Broadcast Node v2.0</p>
        </div>
      </div>

      <style>{`
        .glass-card {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default AdminNotifications;
