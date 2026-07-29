import { useState } from 'react';
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { FaApple } from 'react-icons/fa';
import { useApp } from '@/context/AppContext';
import { loginUser, loginWithGoogle } from '@/lib/api';
import { getGoogleCredential } from '@/lib/googleIdentity';
import { announce } from '@/lib/utils';
import ErrorBanner from '@/components/ErrorBanner';
import Spinner from '@/components/Spinner';
import logoImage from '@/assets/logo.png';
import loginBackground from '@/assets/home_bk.png';
import googleBrandIcon from '@/assets/g_login.svg';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const { dispatch, state } = useApp();

  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [emailErr, setEmailErr]   = useState('');
  const [pwErr, setPwErr]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [loginErr, setLoginErr]   = useState<string | null>(null);

  function validate(): boolean {
    let valid = true;

    if (!email) {
      setEmailErr('Email is required.'); valid = false;
    } else if (!EMAIL_RE.test(email)) {
      setEmailErr('Enter a valid email address.'); valid = false;
    } else {
      setEmailErr('');
    }

    if (!password) {
      setPwErr('Password is required.'); valid = false;
    } else if (password.length < 8) {
      setPwErr('Password must be at least 8 characters.'); valid = false;
    } else {
      setPwErr('');
    }

    return valid;
  }

  async function handleLogin() {
    if (!validate()) return;
    setLoading(true);
    setLoginErr(null);

    try {
      const res = await loginUser(email, password);
      const redirectScreen = state.postLoginRedirect ?? 'sport-select';
      dispatch({ type: 'SET_LOGGED_IN', payload: { email: res.email, token: res.token } });
      dispatch({ type: 'SET_POST_LOGIN_REDIRECT', payload: null });
      dispatch({ type: 'SET_SCREEN', payload: redirectScreen });
      announce(`Login successful. Redirecting to ${redirectScreen === 'bookings' ? 'your bookings' : redirectScreen === 'checkout' ? 'checkout' : 'home'}.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setLoginErr(msg);
      announce('Login failed.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setLoginErr(null);
    setGoogleLoading(true);

    try {
      const credential = await getGoogleCredential(import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '');
      const res = await loginWithGoogle(credential);
      const redirectScreen = state.postLoginRedirect ?? 'sport-select';
      dispatch({ type: 'SET_LOGGED_IN', payload: { email: res.email, token: res.token } });
      dispatch({ type: 'SET_POST_LOGIN_REDIRECT', payload: null });
      dispatch({ type: 'SET_SCREEN', payload: redirectScreen });
      announce(`Google sign-in successful. Redirecting to ${redirectScreen === 'bookings' ? 'your bookings' : redirectScreen === 'checkout' ? 'checkout' : 'home'}.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed. Please try again.';
      setLoginErr(msg);
      announce('Google sign-in failed.');
    } finally {
      setGoogleLoading(false);
    }
  }

  const isFormValid = !!email && EMAIL_RE.test(email) && password.length >= 8;

  return (
    <div className="page-container page-container--immersive screen-fade-enter">
      <div className="login-phone" style={{ backgroundImage: `url(${loginBackground})` }}>
        <div className="sport-events-logo-wrap login-logo-wrap">
          <img src={logoImage} alt="SportyGo" className="sport-events-logo" />
        </div>

        <section className="login-hero">
          <h1>
            <span>Welcome</span>
            <strong>Back!</strong>
          </h1>
          <p>
            Log in to continue your sports journey with <em>SportyGo.</em>
          </p>
        </section>

        <section className="login-card">
          <ErrorBanner message={loginErr} onDismiss={() => setLoginErr(null)} />

          <div className="login-field">
            <label className="login-label" htmlFor="inp-email">Email Address</label>
            <div className={`login-input-wrap${emailErr ? ' has-error' : ''}`}>
              <Mail size={20} strokeWidth={2} className="login-input-icon" aria-hidden="true" />
              <input
                id="inp-email"
                type="email"
                className="login-input"
                placeholder="Enter your email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onBlur={validate}
              />
            </div>
            <div className="login-field-error">{emailErr}</div>
          </div>

          <div className="login-field">
            <label className="login-label" htmlFor="inp-pw">Password</label>
            <div className={`login-input-wrap${pwErr ? ' has-error' : ''}`}>
              <Lock size={20} strokeWidth={2} className="login-input-icon" aria-hidden="true" />
              <input
                id="inp-pw"
                type={showPw ? 'text' : 'password'}
                className="login-input"
                placeholder="Enter your password"
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onBlur={validate}
              />
              <button
                type="button"
                className="login-show-toggle"
                aria-label={showPw ? 'Hide password' : 'Show password'}
                onClick={() => setShowPw(v => !v)}
              >
                {showPw ? <EyeOff size={20} strokeWidth={2} /> : <Eye size={20} strokeWidth={2} />}
              </button>
            </div>
            <div className="login-field-error">{pwErr}</div>
          </div>

          <button type="button" className="login-forgot-btn">Forgot Password?</button>

          <button
            className="login-submit-btn"
            disabled={!isFormValid || loading}
            onClick={handleLogin}
          >
            {loading && <Spinner />}
            <span>{loading ? 'Logging In...' : 'Log In'}</span>
            {!loading && <ArrowRight size={20} strokeWidth={2.3} />}
          </button>

          <div className="login-divider" aria-hidden="true">
            <span />
            <strong>OR</strong>
            <span />
          </div>

          <div className="login-social-title">Continue with</div>
          <div className="login-social-row">
            <button type="button" className="login-social-btn" onClick={handleGoogleLogin} disabled={googleLoading}>
              <img src={googleBrandIcon} alt="" aria-hidden="true" className="login-google-brand-icon" />
              <span>{googleLoading ? 'Connecting...' : 'Google'}</span>
            </button>
            <button type="button" className="login-social-btn">
              <FaApple />
              <span>Apple</span>
            </button>
          </div>
        </section>

        <div className="login-signup-note">
          <span>Don't have an account?</span>
          <button type="button" className="login-signup-btn">
            Create Account <ArrowRight size={16} strokeWidth={2.4} />
          </button>
        </div>
      </div>
    </div>
  );
}
