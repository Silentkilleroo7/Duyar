
import React, { useState } from 'react';

interface Props {
  onBack: () => void;
}

type SupportMode = 'MAIN' | 'CHAT' | 'EMAIL';

const HelpSupportScreen: React.FC<Props> = ({ onBack }) => {
  const [mode, setMode] = useState<SupportMode>('MAIN');

  if (mode === 'CHAT') return <LiveChatView onBack={() => setMode('MAIN')} />;
  if (mode === 'EMAIL') return <EmailSupportView onBack={() => setMode('MAIN')} />;

  return (
    <div className="relative flex min-h-screen w-full flex-col max-w-[430px] mx-auto overflow-x-hidden pb-32 bg-background-dark font-display text-white">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,#1a3333,#0a1414)]"></div>
      </div>

      <div className="relative z-10 flex items-center p-6 pb-2 justify-between sticky top-0 bg-background-dark/20 backdrop-blur-lg">
        <button 
          onClick={onBack}
          className="glass-button size-12 rounded-full flex items-center justify-center text-primary active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <div className="flex-1 text-center pr-12">
          <h2 className="text-primary text-sm font-extrabold leading-tight tracking-[0.1em] uppercase">Help & Support</h2>
        </div>
      </div>

      <div className="relative z-10 px-6 py-6">
        <label className="flex flex-col w-full">
          <div className="flex w-full items-stretch glass-card rounded-full h-14 overflow-hidden">
            <div className="text-primary/70 flex items-center justify-center pl-5">
              <span className="material-symbols-outlined">search</span>
            </div>
            <input 
              className="form-input flex w-full min-w-0 flex-1 border-none bg-transparent focus:outline-0 focus:ring-0 text-white placeholder:text-white/40 px-4 text-base font-normal" 
              placeholder="Search help topics..."
            />
          </div>
        </label>
      </div>

      <div className="relative z-10 px-6 space-y-4">
        <h3 className="text-white text-lg font-bold px-1 mb-2 italic uppercase">FAQs</h3>
        <div className="flex flex-col gap-3">
          <FAQItem question="How to post an ad?" answer="To post an ad, navigate to the 'Listings' tab, tap the '+' icon at the bottom, and follow the step-by-step instructions." />
          <FAQItem question="Booking a service" answer="Select a service provider from our marketplace, choose a preferred time slot, and confirm your booking." />
          <FAQItem question="Payment & Refunds" answer="Refunds are processed within 3-5 business days back to your original payment method." />
        </div>
      </div>

      <div className="relative z-10 px-6 pt-10 pb-10">
        <h3 className="text-white text-lg font-bold px-1 mb-6 italic uppercase">Contact Support</h3>
        <div className="flex justify-between items-center px-2">
          <ContactBtn icon="chat" label="Live Chat" onClick={() => setMode('CHAT')} />
          <ContactBtn icon="mail" label="Email Us" onClick={() => setMode('EMAIL')} />
          <ContactBtn icon="call" label="Call Now" onClick={() => { window.location.href = 'tel:+8809697257402'; }} />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto p-6 bg-gradient-to-t from-background-dark to-transparent pt-10 z-50">
        <button onClick={() => setMode('CHAT')} className="w-full bg-primary hover:bg-primary/90 text-background-dark font-extrabold text-base py-4 rounded-full shadow-[0_8px_20px_-4px_rgba(19,236,218,0.4)] active:scale-[0.98] transition-all uppercase tracking-widest">
          START LIVE CHAT
        </button>
      </div>

      <style>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .glass-button {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
};

const FAQItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => (
  <details className="flex flex-col rounded-2xl glass-card px-5 py-1 group overflow-hidden border border-white/5">
    <summary className="flex cursor-pointer items-center justify-between gap-6 py-4 list-none outline-none">
      <p className="text-white/90 text-base font-medium">{question}</p>
      <span className="material-symbols-outlined text-primary group-open:rotate-180 transition-transform duration-300">expand_more</span>
    </summary>
    <div className="pb-4 text-white/60 text-sm leading-relaxed animate-in fade-in slide-in-from-top-2">
      {answer}
    </div>
  </details>
);

const ContactBtn: React.FC<{ icon: string; label: string; onClick: () => void }> = ({ icon, label, onClick }) => (
  <div className="flex flex-col items-center gap-3">
    <button onClick={onClick} className="glass-button size-16 rounded-full flex items-center justify-center text-primary hover:bg-primary/10 transition-colors border border-primary/20">
      <span className="material-symbols-outlined text-3xl">{icon}</span>
    </button>
    <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">{label}</span>
  </div>
);

const LiveChatView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [messages, setMessages] = useState([
    { sender: 'agent', text: 'Hello Ariful! Welcome to Duyar Support. How can I help you today?', time: '10:00 AM' }
  ]);
  const [input, setInput] = useState('');

  const send = () => {
    if (!input.trim()) return;
    setMessages([...messages, { sender: 'user', text: input, time: '10:02 AM' }]);
    setInput('');
    setTimeout(() => {
      setMessages(prev => [...prev, { sender: 'agent', text: 'Sure, I can help with that. Please wait a moment while I check your account details.', time: '10:02 AM' }]);
    }, 1500);
  };

  return (
    <div className="flex h-screen w-full flex-col bg-background-dark max-w-[430px] mx-auto font-display">
      <header className="px-6 pt-12 pb-4 flex items-center gap-4 bg-background-dark/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <button onClick={onBack} className="glass-button size-10 rounded-full flex items-center justify-center text-white">
          <span className="material-symbols-outlined text-xl">close</span>
        </button>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/30">
              <span className="material-symbols-outlined">support_agent</span>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 size-3 bg-emerald-500 rounded-full border-2 border-background-dark"></div>
          </div>
          <div>
            <h4 className="font-bold text-sm leading-none">Duyar Concierge</h4>
            <p className="text-[10px] text-emerald-500 font-bold uppercase mt-1 tracking-widest">Always Active</p>
          </div>
        </div>
      </header>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${m.sender === 'user' ? 'bg-primary text-background-dark font-semibold rounded-tr-none' : 'glass-card text-white/90 rounded-tl-none border border-white/5'}`}>
              {m.text}
              <p className={`text-[9px] mt-1 opacity-50 ${m.sender === 'user' ? 'text-background-dark' : 'text-white'}`}>{m.time}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 pb-8 bg-background-dark/95 border-t border-white/10">
        <div className="flex items-center gap-2 glass-card rounded-full px-4 py-1.5 border border-white/10">
          <input 
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-white placeholder:text-white/20" 
            placeholder="Describe your issue..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && send()}
          />
          <button onClick={send} className="size-10 rounded-full bg-primary text-background-dark flex items-center justify-center active:scale-90 transition-transform shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined font-black">send</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const EmailSupportView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [priority, setPriority] = useState('Medium');
  const [sent, setSent] = useState(false);

  if (sent) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-background-dark px-6 text-center max-w-[430px] mx-auto animate-in zoom-in duration-500">
      <div className="size-20 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-6 border border-primary/30 shadow-[0_0_30px_rgba(19,236,218,0.2)]">
        <span className="material-symbols-outlined text-4xl">check</span>
      </div>
      <h2 className="text-2xl font-black italic uppercase tracking-tight">Email Sent!</h2>
      <p className="text-white/50 text-sm mt-3 leading-relaxed">Our support team will get back to you at support@duyar.online within 24 hours.</p>
      <button onClick={onBack} className="mt-10 w-full h-14 bg-primary text-background-dark font-black rounded-xl uppercase tracking-widest">Got it</button>
    </div>
  );

  return (
    <div className="min-h-screen w-full flex flex-col bg-background-dark max-w-[430px] mx-auto overflow-y-auto no-scrollbar pb-10">
      <header className="px-6 pt-12 pb-6 flex items-center gap-4">
        <button onClick={onBack} className="glass-button size-10 rounded-full flex items-center justify-center text-white">
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </button>
        <h1 className="text-primary font-black italic uppercase tracking-widest text-lg">Email Support</h1>
      </header>

      <div className="px-6 space-y-6">
        <div className="glass-card p-6 rounded-[2rem] border border-white/5 space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-1">Email Subject</label>
            <input className="w-full h-12 bg-white/5 rounded-xl border border-white/10 px-4 text-sm focus:border-primary outline-none" placeholder="e.g. Ad verification issue" />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-1">Urgency Level</label>
            <div className="relative">
              <select 
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full h-12 bg-white/5 rounded-xl border border-white/10 px-4 text-sm appearance-none outline-none focus:border-primary"
              >
                <option value="Low" className="bg-background-dark">Low Priority</option>
                <option value="Medium" className="bg-background-dark">Medium Priority</option>
                <option value="High" className="bg-background-dark text-red-400">High Priority</option>
              </select>
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">expand_more</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-1">Description</label>
            <textarea className="w-full min-h-[120px] bg-white/5 rounded-xl border border-white/10 p-4 text-sm focus:border-primary outline-none resize-none" placeholder="Explain your concern in detail..." />
          </div>

          <div className="space-y-3">
             <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-1">Attachment</label>
             <div className="w-full h-24 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center group hover:border-primary/40 cursor-pointer transition-all">
                <span className="material-symbols-outlined text-white/20 group-hover:text-primary transition-colors">add_a_photo</span>
                <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mt-1">Upload Screenshot</p>
             </div>
          </div>
        </div>

        <button onClick={() => setSent(true)} className="w-full h-16 bg-primary text-background-dark font-black rounded-2xl uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(19,236,218,0.2)] active:scale-[0.98] transition-all">
          SEND TO SUPPORT
        </button>
        
        <div className="text-center">
          <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Recipient: support@duyar.online</p>
        </div>
      </div>
    </div>
  );
};

export default HelpSupportScreen;
