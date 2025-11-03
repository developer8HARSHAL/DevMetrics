'use client';

export default function Loader({ size = 'md', text = 'Loading...' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center p-12">
      <div className={`${sizeClasses[size]} border-3 border-gray-200 border-t-gray-900 rounded-full animate-spin`}></div>
      {text && <p className="mt-4 text-gray-600 text-sm">{text}</p>}
    </div>
  );
}