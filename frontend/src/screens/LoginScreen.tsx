import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { loginUser } from '@/lib/api';
import { announce } from '@/lib/utils';
import StepBar from '@/components/StepBar';
import ErrorBanner from '@/components/ErrorBanner';
import Spinner from '@/components/Spinner';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const { dispatch } = useApp();

  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [emailErr, setEmailErr]   = useState('');
  const [pwErr, setPwErr]         = useState('');
  const [loading, setLoading]     = useState(false);
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
      dispatch({ type: 'SET_LOGGED_IN', payload: { email: res.email, token: res.token } });
      dispatch({ type: 'SET_SCREEN', payload: 'checkout' });
      announce('Login successful. Redirecting to checkout.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setLoginErr(msg);
      announce('Login failed.');
    } finally {
      setLoading(false);
    }
  }

  const isFormValid = !!email && EMAIL_RE.test(email) && password.length >= 8;

  return (
    <div className="screen-fade-enter">
      <StepBar current={2} />

      <div className="auth-wrap">
        <div className="auth-card">
          <h2>Sign In</h2>
          <p className="auth-sub">Sign in to confirm your booking securely.</p>

          <ErrorBanner message={loginErr} onDismiss={() => setLoginErr(null)} />

          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="inp-email">Email Address</label>
            <input
              id="inp-email"
              type="email"
              className={`form-input${emailErr ? ' has-error' : ''}`}
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onBlur={validate}
            />
            <div className="field-error">{emailErr}</div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="inp-pw">Password</label>
            <div className="input-wrap">
              <input
                id="inp-pw"
                type={showPw ? 'text' : 'password'}
                className={`form-input${pwErr ? ' has-error' : ''}`}
                placeholder="Minimum 8 characters"
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onBlur={validate}
              />
              <button
                type="button"
                className="pw-toggle"
                aria-label={showPw ? 'Hide password' : 'Show password'}
                onClick={() => setShowPw(v => !v)}
              >
                {showPw ? '🙈' : '👁'}
              </button>
            </div>
            <div className="field-error">{pwErr}</div>
          </div>

          <button
            className="btn-primary"
            disabled={!isFormValid || loading}
            onClick={handleLogin}
          >
            {loading && <Spinner />}
            {loading ? 'Signing in…' : 'Sign In'}
          </button>

          <p className="demo-hint">Demo: any valid email + 8+ char password</p>
        </div>
      </div>
    </div>
  );
}
