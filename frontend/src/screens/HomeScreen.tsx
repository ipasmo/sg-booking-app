import { useApp, useSelectBookingType } from '@/context/AppContext';
import { announce } from '@/lib/utils';
import StepBar from '@/components/StepBar';

export default function HomeScreen() {
  const { state, navigate } = useApp();
  const selectType = useSelectBookingType();

  function handleSelect(type: 'court' | 'coaching') {
    selectType(type);
    announce(`${type === 'court' ? 'Court Rental' : 'Coaching Session'} selected`);
  }

  return (
    <div className="screen-enter">
      <div className="hero">
        <div className="hero-eyebrow">Pickleball Singapore</div>
        <div className="hero-title">
          Play More.<br />Book Smarter.
        </div>
        <div className="hero-desc">
          Reserve a court by the hour or book a certified coach — in seconds.
        </div>
      </div>

      <StepBar current={0} />

      <div className="section-title">Choose Booking Type</div>
      <div className="section-sub">What are you booking today?</div>

      <div className="tile-grid">
        {/* Court Rental tile */}
        <div
          className={`tile${state.bookingType === 'court' ? ' selected' : ''}`}
          role="button"
          tabIndex={0}
          aria-pressed={state.bookingType === 'court'}
          onClick={() => handleSelect('court')}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelect('court'); } }}
        >
          <div className="tile-icon">🎾</div>
          <div className="tile-title">Court Rental</div>
          <div className="tile-desc">
            Grab a court for 60, 90, or 120 minutes. Bring your own paddles or rent from us.
          </div>
          <span className="tile-badge">From SGD 28 / hr</span>
        </div>

        {/* Coaching Session tile */}
        <div
          className={`tile${state.bookingType === 'coaching' ? ' selected' : ''}`}
          role="button"
          tabIndex={0}
          aria-pressed={state.bookingType === 'coaching'}
          onClick={() => handleSelect('coaching')}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelect('coaching'); } }}
        >
          <div className="tile-icon">🏆</div>
          <div className="tile-title">Coaching Session</div>
          <div className="tile-desc">
            Train with a certified coach. Flexible multi-session packages available.
          </div>
          <span className="tile-badge">From SGD 88 / pack</span>
        </div>
      </div>

      <button
        className="btn-primary"
        disabled={!state.bookingType}
        onClick={() => navigate('schedule')}
      >
        Select Date &amp; Time →
      </button>
    </div>
  );
}
