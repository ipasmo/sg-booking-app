import { useApp } from '@/context/AppContext';
import Header from '@/components/Header';
import HomeScreen from '@/screens/HomeScreen';
import SportSelectScreen from '@/screens/SportSelectScreen';
import SportEventsScreen from '@/screens/SportEventsScreen';
import SportFacilityScreen from '@/screens/SportFacilityScreen';
import ScheduleScreen from '@/screens/ScheduleScreen';
import LoginScreen from '@/screens/LoginScreen';
import CheckoutScreen from '@/screens/CheckoutScreen';
import SuccessScreen from '@/screens/SuccessScreen';

export default function App() {
  const { state } = useApp();
  const isImmersiveScreen = state.screen === 'home' || state.screen === 'sport-select' || state.screen === 'sport-events' || state.screen === 'facility-select';

  return (
    <div className={`app-shell${isImmersiveScreen ? ' home-mode' : ''}`}>
      {/* ARIA live region for screen-reader announcements */}
      <div id="a11y-live" className="a11y-live" aria-live="polite" aria-atomic="true" />

      {!isImmersiveScreen && <Header />}

      {state.screen === 'home'     && <HomeScreen />}
      {state.screen === 'sport-select' && <SportSelectScreen />}
      {state.screen === 'sport-events' && <SportEventsScreen />}
      {state.screen === 'facility-select' && <SportFacilityScreen />}
      {state.screen === 'schedule' && <ScheduleScreen />}
      {state.screen === 'login'    && <LoginScreen />}
      {state.screen === 'checkout' && <CheckoutScreen />}
      {state.screen === 'success'  && <SuccessScreen />}
    </div>
  );
}
