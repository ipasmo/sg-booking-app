import { useApp } from '@/context/AppContext';

export default function Header() {
  const { state, goBack } = useApp();
  const showBack = state.screen !== 'home' && state.screen !== 'success';

  return (
    <header className="app-header">
      <div className="logo">
        <div className="logo-icon">PB</div>
        <div>
          <span className="logo-name">Pickleball SG</span>
          <span className="logo-sub">by SportyGo</span>
        </div>
      </div>
      {showBack && (
        <button className="back-btn" onClick={goBack}>
          &#8592; Back
        </button>
      )}
    </header>
  );
}
