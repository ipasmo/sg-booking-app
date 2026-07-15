import { useApp, useSelectBookingType } from '@/context/AppContext';
import { announce } from '@/lib/utils';
import homeBackground from '@/assets/home_bk.jpeg';

export default function HomeScreen() {
  const { navigate } = useApp();
  const selectType = useSelectBookingType();

  function handleGetStarted() {
    // Keep existing booking flow intact by selecting a default type before scheduling.
    selectType('court');
    announce('Get Started selected. Court rental preselected.');
    navigate('schedule');
  }

  function handleLogin() {
    announce('Log in selected');
    navigate('login');
  }

  return (
    <div className="home-splash screen-enter">
      <div className="home-splash-frame" role="img" aria-label="SportyGo home background image">
        <img src={homeBackground} alt="SportyGo Play Learn Grow home screen" className="home-splash-image" />

        {/* Transparent hotspots keep the visual identical to the reference image. */}
        <button
          type="button"
          className="home-hotspot home-hotspot-start"
          aria-label="Get Started"
          onClick={handleGetStarted}
        />

        <button
          type="button"
          className="home-hotspot home-hotspot-login"
          aria-label="Log In"
          onClick={handleLogin}
        />
      </div>
    </div>
  );
}
