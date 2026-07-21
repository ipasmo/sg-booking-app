import { useMemo, useState } from 'react';
import { useApp, useSelectPayMethod } from '@/context/AppContext';
import { createBooking } from '@/lib/api';
import { PACKAGES, PAY_OPTS, PLATFORM_FEE } from '@/lib/constants';
import { calcPricing, sgd } from '@/lib/pricing';
import { formatDateShort, makeReceiptId, announce } from '@/lib/utils';
import type { PayMethod } from '@/types';
import StepBar from '@/components/StepBar';
import ErrorBanner from '@/components/ErrorBanner';
import Spinner from '@/components/Spinner';

export default function CheckoutScreen() {
  const { state, dispatch } = useApp();
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

  function payBtnLabel(): string {
    if (paying) return 'Processing payment…';
    if (isCoaching && !state.packageOption) return 'Select a package to continue';
    if (!state.payMethod) return 'Select a payment method';
    return `Pay ${sgd(pricing.grandTotal)} via ${state.payMethod}`;
  }

  async function handlePayment() {
    if (!canPay || !state.authToken || !state.bookingType || !state.selectedDate || !state.selectedTime || !state.payMethod) return;

    const receiptId = makeReceiptId();
    setPaying(true);
    dispatch({ type: 'SET_PAYMENT_ERROR', payload: null });

    try {
      await createBooking(
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
      dispatch({ type: 'SET_SCREEN', payload: 'success' });
      announce('Payment successful! Booking confirmed.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Payment failed. Please try again.';
      dispatch({ type: 'SET_PAYMENT_ERROR', payload: msg });
      announce('Payment failed. Please try again.');
    } finally {
      setPaying(false);
    }
  }

  const dateLabel   = state.selectedDate ? formatDateShort(state.selectedDate) : '—';
  const durationLabel = isCoaching
    ? (PACKAGES.find(p => p.id === state.packageOption)?.label ?? 'No package selected')
    : `${state.durationMins} mins`;

  return (
    <div className="screen-fade-enter">
      <StepBar current={3} />

      <div className="section-title">Checkout</div>
      <div className="section-sub">Review your booking and complete payment.</div>

      <ErrorBanner
        message={state.paymentError}
        onDismiss={() => dispatch({ type: 'SET_PAYMENT_ERROR', payload: null })}
      />

      <div className="checkout-layout">

        {/* ── Left column ── */}
        <div>
          {/* Package picker — coaching only */}
          {isCoaching && (
            <div>
              <div className="pkg-section-title">Choose Package</div>
              <div className="pkg-grid">
                {PACKAGES.map(pkg => (
                  <div
                    key={pkg.id}
                    className={`pkg-card${state.packageOption === pkg.id ? ' selected' : ''}`}
                    role="button"
                    tabIndex={0}
                    aria-pressed={state.packageOption === pkg.id}
                    onClick={() => {
                      dispatch({ type: 'SET_PACKAGE', payload: pkg.id });
                      announce(`Package: ${pkg.label}`);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        dispatch({ type: 'SET_PACKAGE', payload: pkg.id });
                      }
                    }}
                  >
                    <div className="pkg-name">{pkg.label}</div>
                    <div className="pkg-price">{sgd(pkg.price)}</div>
                    <div className="pkg-per">{pkg.per}</div>
                  </div>
                ))}
              </div>
              <div className="divider" />
            </div>
          )}

          {/* Payment method */}
          <div className="slot-label" style={{ marginBottom: 12 }}>Payment Method</div>
          <div className="pay-methods">
            {PAY_OPTS.map(method => (
              <div
                key={method}
                className={`pay-card${state.payMethod === method ? ' selected' : ''}`}
                role="button"
                tabIndex={0}
                aria-pressed={state.payMethod === method}
                onClick={() => selectPay(method as PayMethod)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectPay(method as PayMethod); }
                }}
              >
                <span className="pay-icon">
                  {method === 'STRIPE' ? '💳' : method === 'PAYNOW' ? '📱' : '🟢'}
                </span>
                {method === 'STRIPE' ? 'Stripe' : method === 'PAYNOW' ? 'PayNow' : 'GrabPay'}
              </div>
            ))}
          </div>

          <button className="btn-primary" disabled={!canPay} onClick={handlePayment}>
            {paying && <Spinner />}
            {payBtnLabel()}
          </button>
        </div>

        {/* ── Right column — order summary ── */}
        <div>
          <div className="summary-card">
            <h3>Order Summary</h3>
            <div className="summary-row">
              <span className="sum-label">Type</span>
              <span>{isCoaching ? 'Coaching Session' : 'Court Rental'}</span>
            </div>
            <div className="summary-row">
              <span className="sum-label">Date</span>
              <span>{dateLabel}</span>
            </div>
            <div className="summary-row">
              <span className="sum-label">Time</span>
              <span>{state.selectedTime ?? '—'}</span>
            </div>
            <div className="summary-row">
              <span className="sum-label">{isCoaching ? 'Package' : 'Duration'}</span>
              <span>{durationLabel}</span>
            </div>
            <div className="summary-row">
              <span className="sum-label">Subtotal</span>
              <span>{sgd(pricing.priceSubtotal)}</span>
            </div>
            <div className="summary-row">
              <span className="sum-label">Platform Fee</span>
              <span>{sgd(pricing.platformFee)}</span>
            </div>
            <div className="summary-row">
              <span className="sum-label">GST (9%)</span>
              <span>{sgd(pricing.tax)}</span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <span>{sgd(pricing.grandTotal)}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
