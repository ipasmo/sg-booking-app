import { CalendarDays, GraduationCap, House, MessageCircle, User } from 'lucide-react';
import type { Screen } from '@/types';

type SportsBottomNavItem = 'home' | 'bookings' | 'academy' | 'messages' | 'profile';

type SportsBottomNavProps = {
  onNavigate: (target: Screen) => void;
  activeItem?: SportsBottomNavItem;
};

export default function SportsBottomNav({
  onNavigate,
  activeItem = 'home',
}: SportsBottomNavProps) {
  return (
    <nav className="sport-events-bottom-nav" aria-label="Bottom navigation">
      <button
        type="button"
        className={`sport-events-nav-item${activeItem === 'home' ? ' active' : ''}`}
        onClick={() => onNavigate('home')}
      >
        <House size={23} strokeWidth={2.1} />
        <span>Home</span>
      </button>

      <button
        type="button"
        className={`sport-events-nav-item${activeItem === 'bookings' ? ' active' : ''}`}
        onClick={() => onNavigate('schedule')}
      >
        <CalendarDays size={23} strokeWidth={2.1} />
        <span>Bookings</span>
      </button>

      <button
        type="button"
        className={`sport-events-nav-item${activeItem === 'academy' ? ' active' : ''}`}
        onClick={() => onNavigate('schedule')}
      >
        <GraduationCap size={23} strokeWidth={2.1} />
        <span>Academy</span>
      </button>

      <button
        type="button"
        className={`sport-events-nav-item${activeItem === 'messages' ? ' active' : ''}`}
        onClick={() => onNavigate('schedule')}
      >
        <MessageCircle size={23} strokeWidth={2.1} />
        <span>Messages</span>
      </button>

      <button
        type="button"
        className={`sport-events-nav-item${activeItem === 'profile' ? ' active' : ''}`}
        onClick={() => onNavigate('login')}
      >
        <User size={23} strokeWidth={2.1} />
        <span>Profile</span>
      </button>
    </nav>
  );
}
