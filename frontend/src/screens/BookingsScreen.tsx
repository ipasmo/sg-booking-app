import { useMemo, useState } from 'react';
import {
  CalendarDays,
  Clock3,
  Compass,
  Copy,
  GraduationCap,
  Headphones,
  Home,
  MapPin,
  User,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { announce } from '@/lib/utils';
import ScreenHeader from '@/components/ScreenHeader';
import pageBackground from '@/assets/select_sport_bk.png';
import indoorCricketCard from '@/assets/card_indoor_cricket.png';
import cricketFacilityImage from '@/assets/cricket_facility.png';
import cricketCard from '@/assets/card_cricket.png';
import cricketGear from '@/assets/cricket_gear.png';

type BookingTab = 'upcoming' | 'previous';

type BookingCard = {
  id: string;
  title: string;
  location: string;
  dateText: string;
  timeText: string;
  amount: string;
  statusLabel: string;
  statusType: 'upcoming' | 'completed';
  tags: [string, string];
  image: string;
};

const UPCOMING_BOOKINGS: BookingCard[] = [
  {
    id: 'SG2505241827',
    title: 'Cricket Net 2',
    location: 'Kallang, Singapore',
    dateText: '24 May 2025, Sat',
    timeText: '06:00 PM - 07:00 PM (60 min)',
    amount: 'S$45.00',
    statusLabel: 'Upcoming',
    statusType: 'upcoming',
    tags: ['Indoor', 'Net Lane'],
    image: indoorCricketCard,
  },
  {
    id: 'SG2505312890',
    title: 'Outdoor Cricket Field',
    location: 'Yishun, Singapore',
    dateText: '31 May 2025, Sat',
    timeText: '04:00 PM - 06:00 PM (120 min)',
    amount: 'S$100.00',
    statusLabel: 'Upcoming',
    statusType: 'upcoming',
    tags: ['Outdoor', 'Field'],
    image: cricketFacilityImage,
  },
];

const PREVIOUS_BOOKINGS: BookingCard[] = [
  {
    id: 'SG2505188772',
    title: 'Cricket Net 3',
    location: 'Kallang, Singapore',
    dateText: '18 May 2025, Sun',
    timeText: '08:00 PM - 09:00 PM (60 min)',
    amount: 'S$45.00',
    statusLabel: 'Completed',
    statusType: 'completed',
    tags: ['Indoor', 'Net Lane'],
    image: cricketCard,
  },
  {
    id: 'SG2505108128',
    title: 'Indoor Cricket Court',
    location: 'Kallang, Singapore',
    dateText: '10 May 2025, Sat',
    timeText: '07:00 PM - 09:00 PM (120 min)',
    amount: 'S$140.00',
    statusLabel: 'Completed',
    statusType: 'completed',
    tags: ['Indoor', 'Court'],
    image: cricketGear,
  },
];

function BookingCardView({ booking, showActions }: { booking: BookingCard; showActions: boolean }) {
  function copyId() {
    navigator.clipboard.writeText(booking.id).catch(() => undefined);
    announce('Booking ID copied.');
  }

  return (
    <article className="bookings-card-v2">
      <div className="bookings-card-main-v2">
        <img src={booking.image} alt={booking.title} className="bookings-card-image-v2" />

        <div className="bookings-card-info-v2">
          <div className="bookings-card-row-v2">
            <h3>{booking.title}</h3>
            <span className={`bookings-status-v2 ${booking.statusType}`}>{booking.statusLabel}</span>
          </div>

          <p><MapPin size={14} strokeWidth={2.1} />{booking.location}</p>
          <p><CalendarDays size={14} strokeWidth={2.1} />{booking.dateText}</p>
          <p><Clock3 size={14} strokeWidth={2.1} />{booking.timeText}</p>

          <div className="bookings-tags-v2">
            <span>{booking.tags[0]}</span>
            <span>{booking.tags[1]}</span>
          </div>
        </div>

        <div className="bookings-card-price-v2">
          <strong>{booking.amount}</strong>
          <small>(Incl. taxes)</small>
        </div>
      </div>

      <div className="bookings-card-footer-v2">
        <div className="bookings-id-v2">
          <small>Booking ID</small>
          <strong>{booking.id}</strong>
          <button type="button" className="bookings-copy-btn-v2" onClick={copyId} aria-label="Copy booking id">
            <Copy size={16} strokeWidth={2.3} />
          </button>
        </div>

        {showActions ? (
          <div className="bookings-actions-v2">
            <button type="button" className="bookings-action-btn-v2">Reschedule</button>
            <button type="button" className="bookings-action-btn-v2 danger">Cancel Booking</button>
          </div>
        ) : (
          <div className="bookings-actions-v2">
            <button type="button" className="bookings-action-btn-v2 ghost">View Details</button>
          </div>
        )}
      </div>
    </article>
  );
}

export default function BookingsScreen() {
  const { navigate } = useApp();
  const [tab, setTab] = useState<BookingTab>('upcoming');

  const activeList = useMemo(() => (tab === 'upcoming' ? UPCOMING_BOOKINGS : PREVIOUS_BOOKINGS), [tab]);

  return (
    <div className="page-container page-container--immersive screen-fade-enter">
      <div className="bookings-phone" style={{ backgroundImage: `url(${pageBackground})` }}>
        <ScreenHeader
          onBack={() => navigate('home')}
          backAriaLabel="Back to home"
          rightSlot={(
            <button type="button" className="bookings-calendar-btn-v2" aria-label="Calendar">
              <CalendarDays size={20} strokeWidth={2.2} />
            </button>
          )}
        />

        <section className="bookings-title-v2">
          <h1>My Bookings</h1>
          <p>Manage your facility bookings</p>
        </section>

        <section className="bookings-tabs-v2" aria-label="Bookings filter tabs">
          <button
            type="button"
            className={`bookings-tab-v2${tab === 'upcoming' ? ' active' : ''}`}
            onClick={() => setTab('upcoming')}
          >
            Upcoming Bookings
          </button>
          <button
            type="button"
            className={`bookings-tab-v2${tab === 'previous' ? ' active' : ''}`}
            onClick={() => setTab('previous')}
          >
            Previous Bookings
          </button>
        </section>

        <section className="bookings-section-v2">
          <header>
            <h2>
              <CalendarDays size={18} strokeWidth={2.2} />
              {tab === 'upcoming' ? 'Upcoming Bookings' : 'Previous Bookings'}
            </h2>
            <span>{activeList.length}</span>
          </header>

          <div className="bookings-list-v2">
            {activeList.map((booking) => (
              <BookingCardView key={booking.id} booking={booking} showActions={tab === 'upcoming'} />
            ))}
          </div>
        </section>

        <section className="bookings-help-v2">
          <div>
            <strong>
              <Headphones size={18} strokeWidth={2.2} />
              Need help with your booking?
            </strong>
            <p>Contact our support team for assistance.</p>
          </div>
          <button type="button">Contact Support</button>
        </section>

        <nav className="bookings-bottom-nav-v2" aria-label="Bottom navigation">
          <button type="button" className="bookings-nav-item-v2" onClick={() => navigate('home')}>
            <Home size={22} strokeWidth={2.1} />
            <span>Home</span>
          </button>
          <button type="button" className="bookings-nav-item-v2">
            <Compass size={22} strokeWidth={2.1} />
            <span>Explore</span>
          </button>
          <button type="button" className="bookings-nav-item-v2 active">
            <CalendarDays size={22} strokeWidth={2.1} />
            <span>My Bookings</span>
          </button>
          <button type="button" className="bookings-nav-item-v2">
            <GraduationCap size={22} strokeWidth={2.1} />
            <span>Academy</span>
          </button>
          <button type="button" className="bookings-nav-item-v2" onClick={() => navigate('login')}>
            <User size={22} strokeWidth={2.1} />
            <span>Profile</span>
          </button>
        </nav>

        <div className="bookings-safe-space-v2" aria-hidden="true" />
      </div>
    </div>
  );
}
