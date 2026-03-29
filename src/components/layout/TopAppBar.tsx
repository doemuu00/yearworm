'use client';

interface TopAppBarProps {
  rightActions?: React.ReactNode;
}

export default function TopAppBar({ rightActions }: TopAppBarProps) {
  const defaultActions = (
    <>
      <button className="p-2 rounded-full hover:bg-primary/10 text-on-surface/70 transition-colors active:scale-95 duration-200">
        <span className="material-symbols-outlined">search</span>
      </button>
      <button className="p-2 rounded-full hover:bg-primary/10 text-on-surface/70 transition-colors active:scale-95 duration-200">
        <span className="material-symbols-outlined">account_circle</span>
      </button>
    </>
  );

  return (
    <header className="fixed top-0 left-0 right-0 h-16 z-50 bg-surface-container-lowest/60 backdrop-blur-xl shadow-[0_12px_32px_rgba(40,223,181,0.08)] flex items-center justify-between px-6">
      <span className="font-headline text-2xl font-black text-primary tracking-tighter">
        Yearworm
      </span>
      <div className="flex items-center gap-2">
        {rightActions ?? defaultActions}
      </div>
    </header>
  );
}
