import { useState } from 'react';
import {
  CalendarClock,
  Camera,
  ChevronDown,
  Clock3,
  FileText,
  Lock,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import ScreenHeader from '@/components/ScreenHeader';
import pageBackground from '@/assets/select_sport_bk.png';
import indoorCricketCard from '@/assets/card_indoor_cricket.png';

const SPORT_LABELS = {
  cricket: 'Cricket',
  'indoor-cricket': 'Indoor Cricket',
  pickleball: 'Pickleball',
  soccer: 'Soccer',
  volleyball: 'Volleyball',
  badminton: 'Badminton',
  basketball: 'Basketball',
  kabaddi: 'Kabaddi',
} as const;

const FACILITY_RATE_PER_HOUR = 45;

type TermItem = {
  title: string;
  body: string;
  icon: LucideIcon;
};

const TERM_ITEMS: TermItem[] = [
  {
    title: '1. Booking & Payment',
    body: 'All bookings must be made in advance and are subject to availability. Full payment is required to confirm your booking.',
    icon: Clock3,
  },
  {
    title: '2. Cancellation & Refunds',
    body: 'Cancellations made at least 24 hours before the booking time will be eligible for a full refund. No refunds for cancellations made within 24 hours of the booking.',
    icon: CalendarClock,
  },
  {
    title: '3. Facility Rules',
    body: 'All users must follow the facility rules and guidelines. Any misuse of the facility may result in booking cancellation without refund.',
    icon: UserCheck,
  },
  {
    title: '4. Liability',
    body: 'SportyGo and its partners are not liable for any injury, loss, or damage to personal property while using the facility.',
    icon: ShieldAlert,
  },
  {
    title: '5. Conduct',
    body: 'Please be respectful to other players and staff. Inappropriate behavior may result in removal from the facility.',
    icon: Camera,
  },
];

function to12Hour(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const isPm = h >= 12;
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(hour12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${isPm ? 'PM' : 'AM'}`;
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = (h * 60 + m + minutes) % (24 * 60);
  const nextH = Math.floor(total / 60);
  const nextM = total % 60;
  return `${String(nextH).padStart(2, '0')}:${String(nextM).padStart(2, '0')}`;
}

export default function TermsScreen() {
  const { state, navigate, goBack } = useApp();
  const [agreed, setAgreed] = useState(false);
  const [expandedTerms, setExpandedTerms] = useState<number[]>([]);

  const selectedSportLabel = state.selectedSport ? SPORT_LABELS[state.selectedSport] : 'Cricket';
  const selectedDateText = state.selectedDate
    ? new Date(`${state.selectedDate}T00:00:00`).toLocaleDateString('en-SG', {
      day: 'numeric', month: 'short', year: 'numeric', weekday: 'short',
    })
    : 'Not selected';

  const selectedEndTime = state.selectedTime ? addMinutes(state.selectedTime, state.durationMins) : null;
  const total = (FACILITY_RATE_PER_HOUR * (state.durationMins / 60)).toFixed(2);

  function handleProceed() {
    if (!agreed) return;
    navigate('checkout');
  }

  function toggleTerm(index: number) {
    setExpandedTerms(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  }

  return (
    <div className="page-container page-container--immersive screen-fade-enter">
      <div className="terms-phone" style={{ backgroundImage: `url(${pageBackground})` }}>
        <ScreenHeader onBack={goBack} backAriaLabel="Back" />

        <section className="terms-steps" aria-hidden="true">
          <div className="terms-step">
            <span className="terms-step-dot">
              <CalendarClock size={16} strokeWidth={2.1} />
            </span>
            <small>Select Facility</small>
          </div>
          <div className="terms-step-line active" />
          <div className="terms-step">
            <span className="terms-step-dot">
              <Clock3 size={16} strokeWidth={2.1} />
            </span>
            <small>Choose Time</small>
          </div>
          <div className="terms-step-line" />
          <div className="terms-step">
            <span className="terms-step-dot gold">
              <FileText size={16} strokeWidth={2.1} />
            </span>
            <small>Review &amp; Pay</small>
          </div>
        </section>

        <section className="terms-title-wrap">
          <h1>
            <ShieldCheck size={28} strokeWidth={2.1} />
            <span>Terms &amp; Conditions</span>
          </h1>
          <p>Please read the terms and conditions carefully before proceeding to checkout.</p>
        </section>

        <section className="terms-panel">
          {TERM_ITEMS.map((item, idx) => {
            const Icon = item.icon;
            const isExpanded = expandedTerms.includes(idx);
            const contentId = `term-item-content-${idx}`;
            return (
              <article
                key={item.title}
                className={`terms-item${idx < TERM_ITEMS.length - 1 ? ' with-divider' : ''}${isExpanded ? ' expanded' : ''}`}
              >
                <div className="terms-item-icon" aria-hidden="true">
                  <Icon size={28} strokeWidth={1.9} />
                </div>
                <div className="terms-item-content">
                  <h3>{item.title}</h3>
                  {isExpanded && <p id={contentId}>{item.body}</p>}
                </div>

                <button
                  type="button"
                  className={`terms-item-toggle${isExpanded ? ' expanded' : ''}`}
                  aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${item.title}`}
                  aria-expanded={isExpanded}
                  aria-controls={contentId}
                  onClick={() => toggleTerm(idx)}
                >
                  <ChevronDown size={20} strokeWidth={2.1} className="terms-item-chevron" aria-hidden="true" />
                </button>
              </article>
            );
          })}
        </section>

        <button
          type="button"
          className={`terms-agree${agreed ? ' checked' : ''}`}
          aria-pressed={agreed}
          onClick={() => setAgreed(v => !v)}
        >
          <span className="terms-agree-box">{agreed ? '✓' : ''}</span>
          <span>I have read and agree to the <strong>Terms &amp; Conditions</strong></span>
        </button>

        <section className="terms-summary-card">
          <h2>Booking Summary</h2>
          <div className="terms-summary-body">
            <img src={indoorCricketCard} alt="Facility preview" className="terms-summary-image" />
            <div className="terms-summary-info">
              <h3>{selectedSportLabel} Net 2</h3>
              <p><MapPin size={14} strokeWidth={2.2} />Kallang, Singapore</p>
              <p><CalendarClock size={14} strokeWidth={2.2} />{selectedDateText}</p>
              <p>
                <Clock3 size={14} strokeWidth={2.2} />
                {state.selectedTime && selectedEndTime
                  ? `${to12Hour(state.selectedTime)} - ${to12Hour(selectedEndTime)} (${state.durationMins} min)`
                  : 'Time not selected'}
              </p>
            </div>
            <div className="terms-summary-amount">
              <strong>S${total}</strong>
              <span>(Incl. taxes)</span>
            </div>
          </div>

          <button
            type="button"
            className="terms-proceed-btn"
            disabled={!agreed}
            onClick={handleProceed}
          >
            <span className="terms-proceed-icon" aria-hidden="true">
              <Lock size={20} strokeWidth={2.1} />
            </span>
            Proceed to Checkout
            <span className="terms-proceed-arrow" aria-hidden="true">&#8594;</span>
          </button>
        </section>

        <div className="terms-security-note">
          <ShieldCheck size={18} strokeWidth={2.1} />
          <span>Your booking is safe and secure with SportyGo. We do not share your personal information.</span>
        </div>
      </div>
    </div>
  );
}
