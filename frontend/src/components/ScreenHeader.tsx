import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import logoImage from '@/assets/logo.png';

type ScreenHeaderProps = {
  onBack?: () => void;
  backAriaLabel?: string;
  rightSlot?: ReactNode;
  hideBack?: boolean;
};

export default function ScreenHeader({
  onBack,
  backAriaLabel = 'Back',
  rightSlot,
  hideBack = false,
}: ScreenHeaderProps) {
  return (
    <div className="screen-header">
      <div className="screen-header-left">
        {!hideBack && onBack ? (
          <button
            type="button"
            className="screen-back-btn"
            aria-label={backAriaLabel}
            onClick={onBack}
          >
            <ChevronLeft size={21} strokeWidth={2.8} />
          </button>
        ) : null}
      </div>

      <div className="sport-events-logo-wrap screen-header-logo-wrap">
        <img src={logoImage} alt="SportyGo" className="sport-events-logo" />
      </div>

      {rightSlot ? <div className="screen-header-right">{rightSlot}</div> : null}
    </div>
  );
}
