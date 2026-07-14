import { useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { PACKAGES } from '@/lib/constants';
import { sgd } from '@/lib/pricing';
import { formatDateLong } from '@/lib/utils';
import StepBar from '@/components/StepBar';

export default function SuccessScreen() {
  const { state, dispatch } = useApp();

  const isCoaching    = state.bookingType === 'coaching';
  const dateLong      = state.selectedDate ? formatDateLong(state.selectedDate) : '';
  const packageLabel  = PACKAGES.find(p => p.id === state.packageOption)?.label ?? '';
  const durationLabel = isCoaching ? packageLabel : `${state.durationMins} minutes`;

  // Mark WhatsApp mock sent once
  useEffect(() => {
    if (!state.whatsAppMockSent) {
      dispatch({ type: 'MARK_WHATSAPP_SENT' });
    }
  }, [state.whatsAppMockSent, dispatch]);

  const now         = new Date();
  const sentTimeStr = now.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' });
  const typeStr     = isCoaching ? `Coaching — ${packageLabel}` : `Court Rental — ${state.durationMins} mins`;

  function handleReset() {
    dispatch({ type: 'RESET' });
  }

  return (
    <div className="screen-enter">
      <StepBar current={4} />

      <div className="success-wrap">
        <div className="success-badge" aria-label="Booking confirmed">✓</div>
        <div className="section-title">Booking Confirmed!</div>
        <div className="section-sub">
          Your slot is reserved. A confirmation has been sent to your email.
        </div>

        {/* Receipt */}
        <div className="receipt-card">
          <div className="receipt-id">{state.receiptId}</div>

          <div className="info-row">
            <span className="info-label">Booking Type</span>
            <span className="info-val">{isCoaching ? 'Coaching Session' : 'Court Rental'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Date</span>
            <span className="info-val">{dateLong}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Time</span>
            <span className="info-val">{state.selectedTime}</span>
          </div>
          <div className="info-row">
            <span className="info-label">{isCoaching ? 'Package' : 'Duration'}</span>
            <span className="info-val">{durationLabel}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Payment</span>
            <span className="info-val">{state.payMethod}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Amount Paid</span>
            <span className="info-val" style={{ color: 'var(--accent)' }}>{sgd(state.grandTotal)}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Account</span>
            <span className="info-val">{state.customerEmail}</span>
          </div>
        </div>

        {/* WhatsApp mock */}
        <div className="wa-card">
          <div className="wa-header">
            <div className="wa-dot" />
            <div>
              <div className="wa-label">WhatsApp Confirmation</div>
              <div className="wa-phone">+65 9*** **42</div>
            </div>
          </div>
          <div
            className="wa-bubble"
            dangerouslySetInnerHTML={{
              __html: [
                '✅ <strong>Booking Confirmed!</strong>',
                '',
                'Hi! Your Pickleball SG booking is locked in.',
                '',
                `📅 ${dateLong}`,
                `⏰ ${state.selectedTime}`,
                `🎾 ${typeStr}`,
                `💳 ${sgd(state.grandTotal)} via ${state.payMethod}`,
                `🧾 ${state.receiptId}`,
                '',
                'See you on the court! 🏓',
              ].join('<br />'),
            }}
          />
          <div className="wa-sent-time">{sentTimeStr}</div>
          <div className="wa-delivered">✓✓ Delivered</div>
        </div>

        <button className="btn-primary" style={{ marginTop: 32 }} onClick={handleReset}>
          Book Another Session
        </button>
      </div>
    </div>
  );
}
