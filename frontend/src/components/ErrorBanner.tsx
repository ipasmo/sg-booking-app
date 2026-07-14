interface ErrorBannerProps {
  message: string | null;
  onDismiss?: () => void;
}

export default function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  if (!message) return null;
  return (
    <div className="error-banner" role="alert">
      <span className="err-icon">⚠️</span>
      <span>{message}</span>
      {onDismiss && (
        <span
          className="retry-lnk"
          role="button"
          tabIndex={0}
          onClick={onDismiss}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onDismiss(); }}
        >
          Dismiss
        </span>
      )}
    </div>
  );
}
