import { useState } from 'react';
import { ArrowRight, KeyRound, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { requestPasswordResetCode, resetPasswordWithCode, verifyPasswordResetCode } from '@/lib/api';
import { announce } from '@/lib/utils';
import ScreenHeader from '@/components/ScreenHeader';
import ErrorBanner from '@/components/ErrorBanner';
import Spinner from '@/components/Spinner';
import pageBackground from '@/assets/home_bk.png';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ResetStep = 'request' | 'verify' | 'password' | 'success';

export default function ForgotPasswordScreen() {
  const { dispatch, navigate } = useApp();
  const [step, setStep] = useState<ResetStep>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailErr, setEmailErr] = useState('');
  const [codeErr, setCodeErr] = useState('');
  const [passwordErr, setPasswordErr] = useState('');
  const [confirmErr, setConfirmErr] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validateEmail(): boolean {
    if (!email.trim()) {
      setEmailErr('Email is required.');
      return false;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setEmailErr('Enter a valid email address.');
      return false;
    }
    setEmailErr('');
    return true;
  }

  function validateCode(): boolean {
    if (!/^\d{6}$/.test(code.trim())) {
      setCodeErr('Enter a valid 6-digit passcode.');
      return false;
    }
    setCodeErr('');
    return true;
  }

  function validatePasswords(): boolean {
    let valid = true;
    if (!password) {
      setPasswordErr('New password is required.');
      valid = false;
    } else if (password.length < 8) {
      setPasswordErr('Password must be at least 8 characters.');
      valid = false;
    } else {
      setPasswordErr('');
    }

    if (!confirmPassword) {
      setConfirmErr('Confirm your new password.');
      valid = false;
    } else if (confirmPassword !== password) {
      setConfirmErr('Passwords do not match.');
      valid = false;
    } else {
      setConfirmErr('');
    }

    return valid;
  }

  async function handleRequestCode() {
    if (!validateEmail()) return;
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const response = await requestPasswordResetCode(email.trim());
      setStep('verify');
      setSuccessMsg(response.message);
      announce('Reset passcode sent.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send reset passcode.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode() {
    if (!validateEmail() || !validateCode()) return;
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const response = await verifyPasswordResetCode(email.trim(), code.trim());
      setStep('password');
      setSuccessMsg(response.message);
      announce('Passcode verified.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to verify passcode.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    if (!validateEmail() || !validateCode() || !validatePasswords()) return;
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const response = await resetPasswordWithCode(email.trim(), code.trim(), password);
      setStep('success');
      setSuccessMsg(response.message);
      announce('Password reset successful.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset password.');
    } finally {
      setLoading(false);
    }
  }

  function goToLogin() {
    dispatch({ type: 'SET_POST_LOGIN_REDIRECT', payload: null });
    dispatch({ type: 'SET_SCREEN', payload: 'login' });
  }

  return (
    <div className="page-container page-container--immersive screen-fade-enter">
      <div className="forgot-password-phone" style={{ backgroundImage: `url(${pageBackground})` }}>
        <ScreenHeader onBack={() => navigate('login')} backAriaLabel="Back to login" />

        <section className="forgot-password-hero">
          <p className="forgot-password-eyebrow">SportyGo Security</p>
          <h1>Reset Your Password</h1>
          <p>
            {step === 'request' && 'Enter your email address to receive a 6-digit verification passcode.'}
            {step === 'verify' && 'Check your email inbox and enter the 6-digit passcode we sent you.'}
            {step === 'password' && 'Choose a new password after your email has been verified.'}
            {step === 'success' && 'Your password has been reset successfully. You can go back to the login page now.'}
          </p>
        </section>

        <section className="forgot-password-card">
          {successMsg && (
            <div className="forgot-password-success" role="status" aria-live="polite">
              <span className="forgot-password-success-icon" aria-hidden="true">
                <ShieldCheck size={18} strokeWidth={2.3} />
              </span>
              <span>{successMsg}</span>
            </div>
          )}

          <ErrorBanner message={error} onDismiss={() => setError(null)} />

          {(step === 'request' || step === 'verify' || step === 'password') && (
            <div className="login-field">
              <label className="login-label" htmlFor="forgot-email">Email Address</label>
              <div className={`login-input-wrap${emailErr ? ' has-error' : ''}`}>
                <Mail size={20} strokeWidth={2} className="login-input-icon" aria-hidden="true" />
                <input
                  id="forgot-email"
                  type="email"
                  className="login-input"
                  placeholder="Enter your email"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onBlur={validateEmail}
                  disabled={step !== 'request'}
                />
              </div>
              <div className="login-field-error">{emailErr}</div>
            </div>
          )}

          {(step === 'verify' || step === 'password') && (
            <div className="login-field">
              <label className="login-label" htmlFor="forgot-code">6-Digit Passcode</label>
              <div className={`login-input-wrap${codeErr ? ' has-error' : ''}`}>
                <KeyRound size={20} strokeWidth={2} className="login-input-icon" aria-hidden="true" />
                <input
                  id="forgot-code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  className="login-input"
                  placeholder="Enter 6-digit passcode"
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onBlur={validateCode}
                  disabled={step === 'password'}
                />
              </div>
              <div className="login-field-error">{codeErr}</div>
            </div>
          )}

          {step === 'password' && (
            <>
              <div className="login-field">
                <label className="login-label" htmlFor="forgot-password">New Password</label>
                <div className={`login-input-wrap${passwordErr ? ' has-error' : ''}`}>
                  <Lock size={20} strokeWidth={2} className="login-input-icon" aria-hidden="true" />
                  <input
                    id="forgot-password"
                    type="password"
                    className="login-input"
                    placeholder="Enter new password"
                    autoComplete="new-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onBlur={validatePasswords}
                  />
                </div>
                <div className="login-field-error">{passwordErr}</div>
              </div>

              <div className="login-field">
                <label className="login-label" htmlFor="forgot-confirm-password">Confirm Password</label>
                <div className={`login-input-wrap${confirmErr ? ' has-error' : ''}`}>
                  <Lock size={20} strokeWidth={2} className="login-input-icon" aria-hidden="true" />
                  <input
                    id="forgot-confirm-password"
                    type="password"
                    className="login-input"
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    onBlur={validatePasswords}
                  />
                </div>
                <div className="login-field-error">{confirmErr}</div>
              </div>
            </>
          )}

          {step === 'request' && (
            <button type="button" className="login-submit-btn" disabled={loading} onClick={handleRequestCode}>
              {loading && <Spinner />}
              <span>{loading ? 'Sending Passcode...' : 'Send Passcode'}</span>
              {!loading && <ArrowRight size={20} strokeWidth={2.3} />}
            </button>
          )}

          {step === 'verify' && (
            <button type="button" className="login-submit-btn" disabled={loading} onClick={handleVerifyCode}>
              {loading && <Spinner />}
              <span>{loading ? 'Verifying...' : 'Verify Passcode'}</span>
              {!loading && <ArrowRight size={20} strokeWidth={2.3} />}
            </button>
          )}

          {step === 'password' && (
            <button type="button" className="login-submit-btn" disabled={loading} onClick={handleResetPassword}>
              {loading && <Spinner />}
              <span>{loading ? 'Resetting Password...' : 'Save New Password'}</span>
              {!loading && <ArrowRight size={20} strokeWidth={2.3} />}
            </button>
          )}

          {step === 'success' && (
            <div className="forgot-password-success-actions">
              <button type="button" className="forgot-password-login-btn" onClick={goToLogin}>
                Click here to Login
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}