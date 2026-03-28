interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-3',
};

export default function LoadingSpinner({
  size = 'md',
  className = '',
}: LoadingSpinnerProps) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-white/30 border-t-white ${sizeMap[size]} ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}
