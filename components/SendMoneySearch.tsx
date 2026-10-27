
import React from 'react';

interface Props {
  onBack: () => void;
  onSelect: (user: any) => void;
}

const SendMoneySearch: React.FC<Props> = ({ onBack, onSelect }) => {
  const recentContacts = [
    { name: 'Ariful', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBJqwjwGKXObSlMt4JdDPkaM42am0kLazhVxxq-AHzXQyK1-JqoRvjvRt_Y5N8ardDA3jmGYazCy79zeFC4BC3LHXpTHRhCCPjR6xs1BqmanLpSOocXYmYCxQvvtkzVJSuD6DcxT2Jy618-xVnSY2fBf5vFrCNOVt8p6JqD_uZLmfzME3ltl4nRF46m3hvcH4a9ByxncldACLu1dYDr6z-ds38D4ppEAcaK15Y-3YaZ9DkN1ly8Z7t0WJcMnDDVEPxJHm46rwxjxfc', phone: '017***123' },
    { name: 'Sarah', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBPbUelLkEaGZGeD_dIKjjgxexIAfOs_cjp0nUs3v_gzt0p-Vq3MyEJNqKE8oZi0SuIAzrYcSoMsjCxm1SeWhloU4iyd3hs-rDTr3JKOMgbWE5t-3Wsjf4XPhe1jWVp38-Ubnk32pii5km7UTOdSfVV4KBy1h-_mzqe5lhV5T2oB9jtUeG31lg7kf9xyQnRlrmeqvTJa3nJvR5r5IhymXiYhKmAuY3enf3Vlkeq4qdCSqo6bvpYcF9qGLKhL9d48LQHXy3w5CIvmY4', phone: '018***444' },
    { name: 'John', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAd_1a8pF-2inm3PHiHgbfTVyuPCPW-epVLin39a0ytcHKtcKwsCx-u3zJEaRDbQTaQmK6Hx0f0y3Wyh9u4uKhvFpKgkWouLeHwULk68vAKnJ1aIysyv4AP5pRNSl_HyusyQdn-KJsTbDcykaH6Pac4aCCD1f8QNn0BpeDuhnkTR5WZ6VJO1Z5XGLBEo2nMK3KNsOUhFW80oSGPimN8kHXqrwTAi04gTWulWyAROR54FrIomN1QlyTSn6_bTjOo5Lvjjd-E1yUJGqo', phone: '019***555' }
  ];

  const suggestedUsers = [
    { id: 1, name: 'Ariful Islam', phone: '017***123', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCEN35-hcZgDlM2dlURQSQkd1gmTzk6OOhHwRl7LLadNpITbmwbxcShecUV2kL8KP8KrYuJ_yXYYErLVZuTAIFPr3MccVrVH7Q3u1nP3bh4Zr7RP6r0jwXvYypNETwMKAcQ1JIL7LWG3GIQmDgdn5lANBz8O5Xpb8Li6Z_j89rh4l4c0nkyVaYN5Kchwp2xfBGiEHeD1pL8cJKWiDE85x7Ev39HqAx37Wm3qUoA4tmAZZnwhRLJfRcLzZAY16261CGrZzxjvDjiQ7w' },
    { id: 2, name: 'Jane Smith', phone: '019***456', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA9SyHULwOnJcnDuRP5ro5uHbIWTf8LSWDk70b5xSzloMVcFU7-0Br9k6sWzXeTo3jE4vumEampRjszNeOzqe8iqa9OBRYfD71hzXdyXhNC7Kmw8P8ktuq8NxE7cWH-eAdbfCvKVAXGN2pm0qDLndksqFJzGeatNnNoV2C9dLl1o5tTBsC1bCOSUGJPgceCuD1t95eeJXhTffmcmDHp6-TAmgwo2wToRqDEFWbhn0QHONnNYy4bIy1Tn3Z4e7KBHIiFsBOH3Iw-6VY' },
    { id: 3, name: 'Kamrul H.', phone: '016***882', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAcruvwU1TD98EXeS1_w3CwrWqbDP7iYVmeFp4dw7tzPbvXvPCOZfzYo7almKT0iiuXD5gg54mHJ8OxrM1jvGngLZ1SkjbvSpVbHbIwnpl1CAsooTO6SSDWY0lzyV3yY6Qq0oH_NyN96ga4qncntFc_PDTTGXH_WldBtUDzrrkenKvFaeosxNjg_IObW3rR7q4A7DfZKjPR0Q5wKkGXt--wUFJRgBmsK4DkoJMIFbx_z6graNG0y2VJhs8e909Bp4HYssg8ZFuTTmc' }
  ];

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-dark max-w-md mx-auto overflow-x-hidden">
      <div className="absolute inset-0 map-overlay opacity-5 pointer-events-none"></div>

      <div className="flex items-center p-6 pb-2 z-10">
        <button onClick={onBack} className="flex size-11 items-center justify-center rounded-full glass-card text-white hover:bg-white/10 transition-colors">
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
      </div>

      <div className="px-6 pt-6 pb-4 z-10">
        <h1 className="text-primary text-[32px] font-bold tracking-tight uppercase">SEND MONEY</h1>
      </div>

      <div className="px-6 py-4 z-10">
        <div className="flex w-full h-14 items-stretch rounded-full glass-input overflow-hidden px-4 border border-white/10">
          <div className="text-primary flex items-center justify-center">
            <span className="material-symbols-outlined">search</span>
          </div>
          <input className="flex w-full min-w-0 flex-1 border-none bg-transparent focus:ring-0 text-white placeholder:text-white/40 px-3 text-base font-normal" placeholder="Enter Name or Phone Number..."/>
        </div>
      </div>

      <div className="py-4 z-10">
        <p className="px-6 text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Recent Contacts</p>
        <div className="flex w-full overflow-x-auto no-scrollbar px-6 gap-5 scroll-smooth">
          {recentContacts.map((contact, i) => (
            <div 
              key={i} 
              onClick={() => onSelect(contact)}
              className="flex flex-col items-center gap-3 shrink-0 cursor-pointer active:scale-95 transition-transform"
            >
              <div className="w-16 h-16 rounded-full border-2 border-primary/30 p-0.5">
                <div className="w-full h-full bg-center bg-no-repeat bg-cover rounded-full" style={{ backgroundImage: `url("${contact.image}")` }}></div>
              </div>
              <p className="text-white text-[13px] font-medium">{contact.name}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 px-6 py-6 z-10 overflow-y-auto">
        <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Suggested Users</p>
        <div className="space-y-3 pb-10">
          {suggestedUsers.map((user) => (
            <div 
              key={user.id} 
              onClick={() => onSelect(user)}
              className="flex items-center gap-4 glass-card p-4 rounded-xl justify-between group hover:bg-white/5 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="bg-center bg-no-repeat bg-cover rounded-full h-14 w-14 ring-1 ring-white/10" style={{ backgroundImage: `url("${user.image}")` }}></div>
                <div className="flex flex-col justify-center">
                  <p className="text-white text-base font-semibold leading-normal">{user.name}</p>
                  <p className="text-primary/70 text-sm font-medium leading-normal">{user.phone}</p>
                </div>
              </div>
              <div className="shrink-0">
                <div className="bg-primary text-background-dark rounded-full size-10 flex items-center justify-center shadow-[0_0_15px_rgba(19,236,218,0.3)] transition-shadow group-hover:shadow-[0_0_25px_rgba(19,236,218,0.5)]">
                  <span className="material-symbols-outlined">arrow_forward</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .glass-input {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(8px);
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default SendMoneySearch;
