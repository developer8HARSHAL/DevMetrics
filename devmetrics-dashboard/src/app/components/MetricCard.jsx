export default function MetricCard({ title, value, subtitle, icon: Icon, trend, color = 'blue' }) {
  const iconBgColors = {
    blue: 'bg-blue-50',
    green: 'bg-green-50',
    yellow: 'bg-amber-50',
    red: 'bg-red-50',
    purple: 'bg-purple-50',
  };

  const iconColors = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    yellow: 'text-amber-600',
    red: 'text-red-600',
    purple: 'text-purple-600',
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${iconBgColors[color]}`}>
          <Icon size={24} className={iconColors[color]} strokeWidth={1.5} />
        </div>
        {trend && (
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            trend.positive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {trend.value}
          </div>
        )}
      </div>
      
      <div>
        <p className="text-sm text-gray-600 mb-2">{title}</p>
        <p className="text-3xl font-semibold text-gray-900 mb-1">{value}</p>
        {subtitle && (
          <p className="text-xs text-gray-500">{subtitle}</p>
        )}
      </div>
    </div>
  );
}