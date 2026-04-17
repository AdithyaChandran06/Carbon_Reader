import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  variant: 'green' | 'yellow' | 'blue' | 'teal';
  className?: string;
}

const variantClasses = {
  green: 'metric-card-green',
  yellow: 'metric-card-yellow',
  blue: 'metric-card-blue',
  teal: 'metric-card-teal',
};

export function MetricCard({ title, value, unit, variant, className }: MetricCardProps) {
  return (
    <div className={cn(
      "rounded-lg p-4 shadow-sm",
      variantClasses[variant],
      className
    )}>
      <p className="text-sm font-medium opacity-90">{title}</p>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</span>
        {unit && <span className="text-sm font-medium opacity-80">{unit}</span>}
      </div>
    </div>
  );
}
