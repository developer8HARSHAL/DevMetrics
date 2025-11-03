export default function ChartCard({ title, subtitle, children, actions }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
      <div className="w-full">{children}</div>
    </div>
  );
}