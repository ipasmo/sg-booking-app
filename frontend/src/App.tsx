import { useApp } from '@/context/AppContext';
import Header from '@/components/Header';
import HomeScreen from '@/screens/HomeScreen';
import ScheduleScreen from '@/screens/ScheduleScreen';
import LoginScreen from '@/screens/LoginScreen';
import CheckoutScreen from '@/screens/CheckoutScreen';
import SuccessScreen from '@/screens/SuccessScreen';

export default function App() {
  const { state } = useApp();

  return (
    <div className="app-shell">
      {/* ARIA live region for screen-reader announcements */}
      <div id="a11y-live" className="a11y-live" aria-live="polite" aria-atomic="true" />

      <Header />

      {state.screen === 'home'     && <HomeScreen />}
      {state.screen === 'schedule' && <ScheduleScreen />}
      {state.screen === 'login'    && <LoginScreen />}
      {state.screen === 'checkout' && <CheckoutScreen />}
      {state.screen === 'success'  && <SuccessScreen />}
    </div>
  );
}
