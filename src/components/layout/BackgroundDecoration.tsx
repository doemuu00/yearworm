export default function BackgroundDecoration() {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10" aria-hidden="true">
      {/* Top-left ambient blob */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/5 blur-[160px] rounded-full" />
      {/* Bottom-right ambient blob */}
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-secondary/5 blur-[150px] rounded-full" />
    </div>
  );
}
