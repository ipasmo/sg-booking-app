import { useApp } from '@/context/AppContext';
import Header from '@/components/Header';
import HomeScreen from '@/screens/HomeScreen';
import SportSelectScreen from '@/screens/SportSelectScreen';
import SportEventsScreen from '@/screens/SportEventsScreen';
import SportFacilityScreen from '@/screens/SportFacilityScreen';
import SlotBookingScreen from '@/screens/SlotBookingScreen';
import TermsScreen from '@/screens/TermsScreen';
import LoginScreen from '@/screens/LoginScreen';
import CheckoutScreen from '@/screens/CheckoutScreen';
import BookingConfirmationScreen from '@/screens/BookingConfirmationScreen';
import BookingsScreen from '@/screens/BookingsScreen';

export default function App() {
  const { state } = useApp();
  const isImmersiveScreen = state.screen === 'home' || state.screen === 'sport-select' || state.screen === 'sport-events' || state.screen === 'facility-select' || state.screen === 'schedule' || state.screen === 'terms' || state.screen === 'login' || state.screen === 'checkout' || state.screen === 'booking-confirmation' || state.screen === 'bookings';
  const topAlignedImmersive = state.screen === 'schedule' || state.screen === 'terms' || state.screen === 'checkout' || state.screen === 'booking-confirmation' || state.screen === 'bookings';

  return (
    <div className={`app-shell${isImmersiveScreen ? ' home-mode' : ''}${topAlignedImmersive ? ' immersive-top' : ''}`}>
      {/* ARIA live region for screen-reader announcements */}
      <div id="a11y-live" className="a11y-live" aria-live="polite" aria-atomic="true" />

      {!isImmersiveScreen && <Header />}

      {state.screen === 'home'     && <HomeScreen />}
      {state.screen === 'sport-select' && <SportSelectScreen />}
      {state.screen === 'sport-events' && <SportEventsScreen />}
      {state.screen === 'facility-select' && <SportFacilityScreen />}
      {state.screen === 'schedule' && <SlotBookingScreen />}
      {state.screen === 'terms' && <TermsScreen />}
      {state.screen === 'login'    && <LoginScreen />}
      {state.screen === 'checkout' && <CheckoutScreen />}
      {state.screen === 'booking-confirmation'  && <BookingConfirmationScreen />}
      {state.screen === 'bookings' && <BookingsScreen />}
    </div>
  );
}
