'use client';

export default function Loader({ size = 'md', text = 'Loading...' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center p-12">
      <div
        className={`${sizeClasses[size]} rounded-full animate-spin`}
        style={{ border: '3px solid var(--border)', borderTopColor: 'var(--brand)' }}
      />
      {text && (
        <p className="mt-4 text-sm" style={{ color: 'var(--ink-muted)' }}>{text}</p>
      )}
    </div>
  );
}