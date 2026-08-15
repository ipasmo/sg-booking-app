import { useState } from 'react';
import { CardCvcElement, CardExpiryElement, CardNumberElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js';
import { Check, ClipboardCopy, FlaskConical, Lock } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { createStripeTestPaymentIntent } from '@/lib/api';
import { makeReceiptId, announce } from '@/lib/utils';
import { sgd } from '@/lib/pricing';
import ScreenHeader from '@/components/ScreenHeader';
import pageBackground from '@/assets/select_sport_bk.png';
import { stripePromise, stripePublishableKey } from '@/lib/stripe';

const PAYMENT_TEST_PAGE_ENABLED = (import.meta.env.VITE_PAYMENT_TEST_PAGE_ENABLED ?? 'false').trim() === 'true';
const ELEMENT_OPTIONS = {
  style: {
    base: { color: '#edf2fa', fontFamily: 'Segoe UI, sans-serif', fontSize: '15px', '::placeholder': { color: '#9ca6b7' } },
    invalid: { color: '#ff7d87' },
  },
};
const STRIPE_TEST_CARDS = [
  { number: '4242 4242 4242 4242', label: 'Success', color: '#22c55e' },
  { number: '4000 0000 0000 0002', label: 'Card declined', color: '#ef4444' },
  { number: '4000 0025 0000 3155', label: '3D Secure required', color: '#f59e0b' },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button type="button" className="pt-copy-btn" aria-label={`Copy ${text}`} onClick={() => {
      navigator.clipboard.writeText(text.replace(/\s/g, '')).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }).catch(() => undefined);
    }}>
      {copied ? <Check size={13} /> : <ClipboardCopy size={13} />}
    </button>
  );
}

function PaymentTestContent() {
  const { state, dispatch, navigate } = useApp();
  const stripe = useStripe();
  const elements = useElements();
  const [amount, setAmount] = useState('0.50');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function getAmount(): number | null {
    const parsed = Number(amount);
    return Number.isFinite(parsed) && parsed >= 0.5 ? Number(parsed.toFixed(2)) : null;
  }

  function completeSuccess(value: number, receiptId: string) {
    dispatch({ type: 'SET_BOOKING_TYPE', payload: 'court' });
    dispatch({ type: 'SET_PRICING', payload: { priceSubtotal: value, platformFee: 0, tax: 0, grandTotal: value } });
    dispatch({ type: 'SET_RECEIPT', payload: receiptId });
    dispatch({ type: 'SET_PAYMENT_STATUS', payload: 'success' });
    setSuccess(true);
    announce('Payment test succeeded.');
    setTimeout(() => navigate('booking-confirmation'), 500);
  }

  async function handleStripePayment() {
    const value = getAmount();
    if (value === null) {
      setError('Enter an amount of at least S$0.50.');
      return;
    }
    if (!stripe || !elements || !state.authToken) {
      setError('Stripe is unavailable or you are not logged in.');
      return;
    }
    const card = elements.getElement(CardNumberElement);
    if (!card) {
      setError('Enter card details before testing payment.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const receiptId = makeReceiptId();
      const intent = await createStripeTestPaymentIntent({ amount: value, currency: 'sgd', receiptId }, state.authToken);
      const result = await stripe.confirmCardPayment(intent.clientSecret, {
        payment_method: { card, billing_details: { email: state.customerEmail } },
      });
      if (result.error) throw new Error(result.error.message ?? 'Payment failed.');
      if (result.paymentIntent?.status !== 'succeeded') throw new Error('Payment was not completed.');
      completeSuccess(value, receiptId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed.');
    } finally {
      setBusy(false);
    }
  }

  if (!PAYMENT_TEST_PAGE_ENABLED) {
    return <div className="pt-disabled-notice"><FlaskConical size={40} /><h1>Test Page Disabled</h1><p>Set <code>VITE_PAYMENT_TEST_PAGE_ENABLED=true</code> and restart the frontend.</p></div>;
  }

  return (
    <div className="page-container page-container--immersive screen-fade-enter">
      <div className="pt-phone" style={{ backgroundImage: `url(${pageBackground})` }}>
        <ScreenHeader onBack={() => navigate('profile')} backAriaLabel="Back to profile" />
        <div className="pt-mode-badge"><FlaskConical size={14} /><span>Payment Test Mode</span></div>
        <h1 className="pt-title">Payment Integration Test</h1>
        <p className="pt-subtitle">Test Stripe with a developer-entered amount. No booking details are required.</p>

        <section className="pt-panel">
          <h2>Payment Amount</h2>
          <label className="pt-label" htmlFor="pt-amount">Amount (SGD)</label>
          <input id="pt-amount" className="pt-input pt-amount-input" type="number" min="0.50" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} />
          <p className="pt-hint">Minimum test amount: S$0.50. The entered amount is sent directly to Stripe in test mode.</p>
          <p className="pt-pricing-row total"><span>Test amount</span><span>{sgd(Number(amount) || 0).replace('SGD', 'S$')}</span></p>
        </section>

        <section className="pt-panel">
          <h2>Card Details</h2>
          <div className="pt-card-input"><CardNumberElement options={ELEMENT_OPTIONS} /></div>
          <div className="pt-card-input-grid"><div className="pt-card-input"><CardExpiryElement options={ELEMENT_OPTIONS} /></div><div className="pt-card-input"><CardCvcElement options={ELEMENT_OPTIONS} /></div></div>
          {error && <p className="pt-error">{error}</p>}
          {success && <p className="pt-result success"><Check size={16} /> Payment succeeded. Opening confirmation…</p>}
        </section>

        <section className="pt-panel">
          <h2>Stripe Test Cards</h2>
          <p className="pt-hint">Use any future expiry date and any three-digit CVC.</p>
          <div className="pt-card-list">{STRIPE_TEST_CARDS.map((card) => <div className="pt-card-row" key={card.number}><span className="pt-card-dot" style={{ background: card.color }} /><code className="pt-card-num">{card.number}</code><CopyButton text={card.number} /><span className="pt-card-label">{card.label}</span></div>)}</div>
        </section>

        <button type="button" className="pt-real-btn" disabled={busy || !stripePublishableKey} onClick={handleStripePayment}><Lock size={17} /><span>{busy ? 'Processing…' : `Pay ${amount || '0.00'} with Stripe`}</span></button>
      </div>
    </div>
  );
}

export default function PaymentTestScreen() {
  return <Elements stripe={stripePromise}><PaymentTestContent /></Elements>;
}
