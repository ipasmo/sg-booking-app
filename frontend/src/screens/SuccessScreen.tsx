import { useEffect } from 'react';
import { ArrowRight, CalendarDays, Check, Copy, Lock, MapPin, ShieldCheck, Trophy } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { sgd } from '@/lib/pricing';
import { announce, formatDateLong } from '@/lib/utils';
import logoImage from '@/assets/logo.png';
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

function paymentMethodLabel(method: string | null): string {
  if (method === 'STRIPE') return 'VISA •••• 4242';
  if (method === 'GPAY') return 'Google Pay';
  if (method === 'PAYNOW') return 'PayNow';
  if (method === 'GRABPAY') return 'GrabPay';
  return 'Cash Payment';
}

export default function SuccessScreen() {
  const { state, dispatch, navigate } = useApp();

  const selectedSportLabel = state.selectedSport ? SPORT_LABELS[state.selectedSport] : 'Cricket';
  const dateLong      = state.selectedDate ? formatDateLong(state.selectedDate) : 'Not selected';
  const paymentStatus = state.paymentStatus ?? 'success';
  const isPaid = paymentStatus === 'success';
  const timeLabel = state.selectedTime
    ? `${to12Hour(state.selectedTime)} - ${to12Hour(addMinutes(state.selectedTime, state.durationMins))} (${state.durationMins} min)`
    : 'Time not selected';
  const displayReceipt = state.receiptId.replace(/-/g, '');

  // Mark WhatsApp mock sent once
  useEffect(() => {
    if (!state.whatsAppMockSent) {
      dispatch({ type: 'MARK_WHATSAPP_SENT' });
    }
  }, [state.whatsAppMockSent, dispatch]);

  const now         = new Date();
  const sentTimeStr = now.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' });

  function handleReset() {
    dispatch({ type: 'RESET' });
  }

  function handleBackHome() {
    dispatch({ type: 'RESET' });
    dispatch({ type: 'SET_SCREEN', payload: 'sport-select' });
  }

  function handleViewBookings() {
    if (!state.isLoggedIn) {
      dispatch({ type: 'SET_POST_LOGIN_REDIRECT', payload: 'bookings' });
      dispatch({ type: 'SET_SCREEN', payload: 'login' });
      announce('Please log in to view your bookings.');
      return;
    }

    dispatch({ type: 'SET_POST_LOGIN_REDIRECT', payload: null });
    navigate('bookings');
  }

  function copyReceiptId() {
    navigator.clipboard.writeText(displayReceipt).catch(() => undefined);
  }

  return (
    <div className="page-container page-container--immersive screen-fade-enter">
      <div className="success-phone" style={{ backgroundImage: `url(${pageBackground})` }}>
        <div className="sport-events-logo-wrap success-logo-wrap">
          <img src={logoImage} alt="SportyGo" className="sport-events-logo" />
        </div>

        <section className="success-hero-v2">
          <div className={`success-check-v2${isPaid ? '' : ' cash'}`} aria-hidden="true">
            {isPaid ? <Check size={42} strokeWidth={3.1} /> : <Lock size={38} strokeWidth={2.8} />}
          </div>
          <h1>
            {isPaid ? (
              <>
                Payment <span>Successful!</span>
              </>
            ) : (
              <>
                Payment <span>Pending</span>
              </>
            )}
          </h1>
          <p>
            {isPaid
              ? 'Your booking is confirmed. We look forward to seeing you on the field!'
              : 'Online payment was not completed. Your slot is blocked. Please proceed to pay in cash at the venue.'}
          </p>
        </section>

        <section className="success-card-v2">
          <div className="success-card-header-v2">
            <span className="success-card-icon-v2"><CalendarDays size={20} strokeWidth={2.2} /></span>
            <div>
              <strong>Booking Confirmation</strong>
              <small>Confirmation ID</small>
              <div className="success-confirm-id-v2">
                {displayReceipt}
                <button type="button" onClick={copyReceiptId} aria-label="Copy confirmation id">
                  <Copy size={18} strokeWidth={2.2} />
                </button>
              </div>
              <p>A confirmation has been sent to <span>{state.customerEmail}</span></p>
            </div>
          </div>

          <div className="success-venue-v2">
            <img src={indoorCricketCard} alt="Booked facility" />
            <div>
              <h2>{selectedSportLabel} Net 2</h2>
              <p><MapPin size={14} strokeWidth={2.1} />Kallang, Singapore</p>
              <p><CalendarDays size={14} strokeWidth={2.1} />{dateLong}</p>
              <p><Lock size={14} strokeWidth={2.1} />{timeLabel}</p>
              <div className="success-tags-v2"><span>Indoor</span><span>Net Lane</span></div>
            </div>
          </div>

          <div className="success-payment-row-v2">
            <div>
              <small>{isPaid ? 'Paid Amount' : 'Amount Due in Cash'}</small>
              <strong>{sgd(state.grandTotal).replace('SGD', 'S$')}</strong>
              <span>(Inclusive of taxes)</span>
            </div>
            <div>
              <small>Payment Method</small>
              <strong>{isPaid ? paymentMethodLabel(state.payMethod) : 'Cash at Venue'}</strong>
            </div>
          </div>

          <div className="success-thanks-v2">
            <ShieldCheck size={22} strokeWidth={2.2} />
            <span>
              {isPaid ? 'Thank you for choosing SportyGo! We hope you have a great game.' : 'Please arrive 10 minutes early and complete your cash payment at the counter.'}
            </span>
          </div>
        </section>

        <section className="success-banner-v2">
          <span className="success-banner-icon-v2"><Trophy size={22} strokeWidth={2.2} /></span>
          <div>
            <strong>{isPaid ? 'Keep Moving. Keep Achieving!' : 'Your Slot Is Reserved!'}</strong>
            <small>{isPaid ? `See you on the field! (${sentTimeStr})` : `Proceed to cash payment at check-in. (${sentTimeStr})`}</small>
          </div>
        </section>

        <button className="success-primary-btn-v2" onClick={isPaid ? handleViewBookings : handleReset}>
          <span>{isPaid ? 'View My Bookings' : 'Proceed to Pay in Cash'}</span>
          <ArrowRight size={22} strokeWidth={2.3} />
        </button>
        <button className="success-secondary-btn-v2" onClick={handleBackHome}>
          Back to Home
        </button>
      </div>
    </div>
  );
}
