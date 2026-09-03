import { CircleAlert, RefreshCw } from 'lucide-react';
import Button from './Button';

function ErrorState({
  title = "Something went wrong.",
  description = 'We could not load this content. Please try again.',
  onRetry,
  retryLabel = 'Try again',
  icon: Icon = CircleAlert,
  compact = false,
  className = '',
}) {
  return (
    <div
      role="alert"
      className={[
        'flex flex-col gap-5',
        'rounded-lg border border-destructive/20',
        'bg-card',
        compact
          ? 'px-5 py-6'
          : 'px-6 py-8 sm:px-8',
        className,
      ].join(' ')}
    >
      <div className="flex items-start gap-3.5">
        <div
          className={[
            'flex shrink-0 items-center justify-center',
            'rounded-lg bg-destructive/10 text-destructive',
            compact ? 'h-8 w-8' : 'h-9 w-9',
          ].join(' ')}
        >
          <Icon
            size={compact ? 15 : 17}
            strokeWidth={1.8}
          />
        </div>

        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">
            {title}
          </h3>

          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>

      {onRetry && (
        <div className="pl-0 sm:pl-[3.25rem]">
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            leftIcon={
              <RefreshCw
                size={13}
                strokeWidth={1.8}
              />
            }
          >
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

export default ErrorState;