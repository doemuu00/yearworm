'use client';

type Tab = 'game' | 'library' | 'ranks' | 'profile';

interface BottomNavBarProps {
  activeTab?: Tab;
}

const navItems: { key: Tab; icon: string; label: string }[] = [
  { key: 'game', icon: 'videogame_asset', label: 'Game' },
  { key: 'library', icon: 'library_music', label: 'Library' },
  { key: 'ranks', icon: 'emoji_events', label: 'Ranks' },
  { key: 'profile', icon: 'person', label: 'Profile' },
];

export default function BottomNavBar({ activeTab = 'game' }: BottomNavBarProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[2.5rem] bg-surface-container-lowest/80 backdrop-blur-2xl shadow-[0_-8px_32px_rgba(0,0,0,0.3)] border-t border-white/5">
      <div className="flex items-center justify-around px-4 pb-6 pt-3">
        {navItems.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              className={`flex flex-col items-center gap-0.5 transition-all active:scale-90 duration-300 ${
                isActive
                  ? 'text-primary'
                  : 'text-on-surface/40 hover:text-primary'
              }`}
            >
              <span
                className={`flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-primary/20 rounded-full px-6 py-1.5 shadow-[0_0_15px_rgba(40,223,181,0.3)]'
                    : 'px-6 py-1.5'
                }`}
              >
                <span className="material-symbols-outlined text-2xl">{item.icon}</span>
              </span>
              <span className="font-display text-[9px] font-bold uppercase tracking-[0.15em]">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
