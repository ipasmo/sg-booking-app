interface SpinnerProps {
  /** Use 'muted' variant inside dark backgrounds */
  variant?: 'default' | 'muted';
}

export default function Spinner({ variant = 'default' }: SpinnerProps) {
  const cls = variant === 'muted' ? 'spinner spinner-muted' : 'spinner';
  return <span className={cls} aria-hidden="true" />;
}
