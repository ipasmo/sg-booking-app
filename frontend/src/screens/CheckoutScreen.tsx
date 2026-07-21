import { useMemo, useState } from 'react';
import { ArrowRight, CalendarDays, Check, ChevronDown, Clock3, Lock, MapPin } from 'lucide-react';
import { useApp, useSelectPayMethod } from '@/context/AppContext';
import { createBooking } from '@/lib/api';
import { PACKAGES, PLATFORM_FEE } from '@/lib/constants';
import { calcPricing, sgd } from '@/lib/pricing';
import { formatDateShort, makeReceiptId, announce } from '@/lib/utils';
import type { PayMethod } from '@/types';
import ErrorBanner from '@/components/ErrorBanner';
import Spinner from '@/components/Spinner';
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

const PAY_METHODS: Array<{ id: PayMethod; title: string; subtitle: string; badge: string }> = [
  { id: 'STRIPE', title: 'Credit / Debit Card', subtitle: 'Visa, Mastercard, AMEX', badge: 'CARD' },
  { id: 'GPAY', title: 'Google Pay', subtitle: 'Pay securely with Google Pay', badge: 'GPay' },
  { id: 'PAYNOW', title: 'PayNow', subtitle: 'Pay securely with PayNow', badge: 'PAYNOW' },
  { id: 'GRABPAY', title: 'GrabPay', subtitle: 'Pay securely with GrabPay', badge: 'GrabPay' },
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

export default function CheckoutScreen() {
  const { state, dispatch, navigate } = useApp();
  const selectPay = useSelectPayMethod();
  const [paying, setPaying] = useState(false);

  const isCoaching = state.bookingType === 'coaching';

  // Compute pricing synchronously on every render — no async useEffect needed.
  // This guarantees the correct price is shown even when the user keeps the
  // default 60-min duration (i.e. SET_DURATION was never dispatched).
  const pricing = useMemo(() => {
    if (!state.bookingType) {
      return { priceSubtotal: 0, tax: 0, platformFee: PLATFORM_FEE, grandTotal: 0 };
    }
    return calcPricing(state.bookingType, state.durationMins, state.packageOption);
  }, [state.bookingType, state.durationMins, state.packageOption]);

  const coachingReady = isCoaching ? !!state.packageOption : true;
  const canPay = !!state.payMethod && coachingReady && pricing.grandTotal > 0 && !paying;

  const selectedSportLabel = state.selectedSport ? SPORT_LABELS[state.selectedSport] : 'Cricket';
  const selectedDateText = state.selectedDate
    ? formatDateShort(state.selectedDate)
    : '—';
  const timeRange = state.selectedTime
    ? `${to12Hour(state.selectedTime)} - ${to12Hour(addMinutes(state.selectedTime, state.durationMins))} (${state.durationMins} min)`
    : '—';

  const selectedMethod = state.payMethod ?? 'STRIPE';

  function payBtnLabel(): string {
    if (paying) return 'Processing payment...';
    if (isCoaching && !state.packageOption) return 'Select a package to continue';
    if (!state.payMethod) return 'Select a payment method';
    return `Pay ${sgd(pricing.grandTotal)} Securely`;
  }

  async function handlePayment() {
    if (!canPay || !state.bookingType || !state.selectedDate || !state.selectedTime || !state.payMethod) return;

    if (!state.isLoggedIn || !state.authToken) {
      dispatch({ type: 'SET_SCREEN', payload: 'login' });
      announce('Please log in to continue checkout.');
      return;
    }

    const receiptId = makeReceiptId();
    setPaying(true);
    dispatch({ type: 'SET_PAYMENT_ERROR', payload: null });

    try {
      const result = await createBooking(
        {
          bookingType:   state.bookingType,
          selectedDate:  state.selectedDate,
          selectedTime:  state.selectedTime,
          durationMins:  state.durationMins,
          packageOption: state.packageOption,
          payMethod:     state.payMethod,
          grandTotal:    pricing.grandTotal,   // always use derived, never stale state
          receiptId,
          customerEmail: state.customerEmail,
        },
        state.authToken
      );

      // Persist derived pricing to state so SuccessScreen receipt shows correct amount
      dispatch({ type: 'SET_PRICING', payload: pricing });
      dispatch({ type: 'SET_RECEIPT', payload: receiptId });
      dispatch({ type: 'SET_PAYMENT_STATUS', payload: result.status });
      navigate('success');
      if (result.status === 'success') {
        announce('Payment successful! Booking confirmed.');
      } else {
        announce('Online payment could not be completed. Proceed with cash payment.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Payment failed. Please try again.';
      dispatch({ type: 'SET_PAYMENT_ERROR', payload: msg });
      announce('Payment failed. Please try again.');
    } finally {
      setPaying(false);
    }
  }

  const selectedPackageLabel = PACKAGES.find(p => p.id === state.packageOption)?.label ?? 'No package selected';

  return (
    <div className="page-container page-container--immersive screen-fade-enter">
      <div className="checkout-phone" style={{ backgroundImage: `url(${pageBackground})` }}>
        <div className="sport-events-logo-wrap checkout-logo-wrap">
          <img src={logoImage} alt="SportyGo" className="sport-events-logo" />
        </div>

        <h1 className="checkout-title">Checkout</h1>

        <section className="checkout-steps" aria-hidden="true">
          <div className="checkout-step">
            <span className="checkout-step-dot done"><Check size={17} strokeWidth={2.5} /></span>
            <small>Select Facility</small>
          </div>
          <div className="checkout-step-line active" />
          <div className="checkout-step">
            <span className="checkout-step-dot done"><Check size={17} strokeWidth={2.5} /></span>
            <small>Choose Time</small>
          </div>
          <div className="checkout-step-line" />
          <div className="checkout-step">
            <span className="checkout-step-dot current">3</span>
            <small>Review &amp; Pay</small>
          </div>
        </section>

        <ErrorBanner
          message={state.paymentError}
          onDismiss={() => dispatch({ type: 'SET_PAYMENT_ERROR', payload: null })}
        />

        <section className="checkout-summary-card-v2">
          <h2>Booking Summary</h2>
          <div className="checkout-summary-body-v2">
            <img src={indoorCricketCard} alt="Facility preview" className="checkout-summary-image-v2" />
            <div className="checkout-summary-info-v2">
              <h3>{selectedSportLabel} Net 2</h3>
              <p><MapPin size={14} strokeWidth={2.1} />Kallang, Singapore</p>
              <p><CalendarDays size={14} strokeWidth={2.1} />{selectedDateText}</p>
              <p><Clock3 size={14} strokeWidth={2.1} />{timeRange}</p>
              <div className="checkout-summary-tags-v2">
                <span>Indoor</span>
                <span>Net Lane</span>
              </div>
            </div>
            <div className="checkout-summary-price-v2">
              <strong>{sgd(pricing.grandTotal).replace('SGD', 'S$')}</strong>
              <span>(Incl. taxes)</span>
            </div>
          </div>
        </section>

        {isCoaching && (
          <section className="checkout-panel-v2 coaching-panel-v2">
            <h2>Package</h2>
            <div className="coaching-selected-package">{selectedPackageLabel}</div>
          </section>
        )}

        <section className="checkout-panel-v2">
          <h2>Payment Method</h2>
          <div className="checkout-pay-list-v2">
            {PAY_METHODS.map(method => {
              const selected = selectedMethod === method.id;
              return (
                <button
                  type="button"
                  key={method.id}
                  className={`checkout-pay-item-v2${selected ? ' selected' : ''}`}
                  aria-pressed={selected}
                  onClick={() => selectPay(method.id)}
                >
                  <span className={`checkout-pay-badge-v2 badge-${method.id.toLowerCase()}`}>{method.badge}</span>
                  <span className="checkout-pay-copy-v2">
                    <strong>{method.title}</strong>
                    <small>{method.subtitle}</small>
                  </span>
                  <span className={`checkout-pay-radio-v2${selected ? ' selected' : ''}`} aria-hidden="true" />
                </button>
              );
            })}
          </div>

          <div className="checkout-secure-note-v2">
            <Lock size={16} strokeWidth={2.2} />
            <span>Your payment information is secure and encrypted. We do not store your card details.</span>
          </div>
        </section>

        <section className="checkout-total-bar-v2">
          <div>
            <small>Total Amount</small>
            <span>Inclusive of taxes</span>
          </div>
          <div className="checkout-total-right-v2">
            <strong>{sgd(pricing.grandTotal).replace('SGD', 'S$')}</strong>
            <ChevronDown size={20} strokeWidth={2.1} />
          </div>
        </section>

        <button className="checkout-pay-btn-v2" disabled={!canPay} onClick={handlePayment}>
          {paying ? (
            <>
              <Spinner />
              <span>Processing payment...</span>
            </>
          ) : (
            <>
              <Lock size={20} strokeWidth={2.1} />
              <span>{payBtnLabel()}</span>
              <ArrowRight size={22} strokeWidth={2.3} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
