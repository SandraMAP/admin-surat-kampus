import { StatusPengajuan, STATUS_CONFIG } from '@/types/database';
import { Clock, CheckCircle, Loader, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: StatusPengajuan;
  className?: string;
  showIcon?: boolean;
}

const iconMap = {
  Clock,
  CheckCircle,
  Loader,
  CheckCheck,
};

export function StatusBadge({ status, className, showIcon = true }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const Icon = iconMap[config.icon as keyof typeof iconMap];

  return (
    <span className={cn('status-badge', config.bgClass, className)}>
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </span>
  );
}
