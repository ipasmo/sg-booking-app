import { useEffect, useMemo, useState } from 'react';
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
import { fetchMyBookings } from '@/lib/api';
import { announce } from '@/lib/utils';
import ScreenHeader from '@/components/ScreenHeader';
import ErrorBanner from '@/components/ErrorBanner';
import Spinner from '@/components/Spinner';
import { formatDateShort } from '@/lib/utils';
import pageBackground from '@/assets/select_sport_bk.png';
import indoorCricketCard from '@/assets/card_indoor_cricket.png';
import cricketFacilityImage from '@/assets/cricket_facility.png';
import cricketCard from '@/assets/card_cricket.png';
import cricketGear from '@/assets/cricket_gear.png';
import type { BookingHistoryItem } from '@/types';

const FACILITY_IMAGES = {
  'bowling-lane': cricketFacilityImage,
  'nets-2': indoorCricketCard,
  'nets-3': cricketCard,
  'nets-4': indoorCricketCard,
  'indoor-court': cricketGear,
  'outdoor-field': cricketFacilityImage,
} as const;

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

function currentSingaporeDateTimeKey(): string {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Singapore',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date()).map((part) => [part.type, part.value]));

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

function bookingDateTimeKey(item: BookingHistoryItem): string {
  return `${item.slotDate}T${item.slotTime.slice(0, 5)}`;
}

function to12Hour(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const isPm = h >= 12;
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(hour12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${isPm ? 'PM' : 'AM'}`;
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = (h * 60 + m + minutes) % (24 * 60);
  const nextH = Math.floor(total / 60);
  const nextM = total % 60;
  return `${String(nextH).padStart(2, '0')}:${String(nextM).padStart(2, '0')}`;
}

function formatDateForCard(date: string): string {
  return formatDateShort(date);
}

function mapHistoryToCard(item: BookingHistoryItem): BookingCard {
  const isCoaching = item.bookingType === 'coaching';
  const isPast = bookingDateTimeKey(item) < currentSingaporeDateTimeKey();
  const start = item.slotTime.slice(0, 5);
  const end = addMinutes(start, item.durationMins);
  const statusLabel = item.status === 'cash_pending' ? 'Pending Cash' : isPast ? 'Completed' : 'Upcoming';
  const fallbackTitle = isCoaching ? 'Coaching Session' : 'Cricket Net 2';
  const fallbackLocation = 'Kallang, Singapore';
  const fallbackTags: [string, string] = isCoaching ? ['Coaching', 'Package'] : ['Indoor', 'Net Lane'];

  return {
    id: item.receiptId,
    title: item.facilityTitle ?? fallbackTitle,
    location: item.facilityAddress ?? fallbackLocation,
    dateText: formatDateForCard(item.slotDate),
    timeText: `${to12Hour(start)} - ${to12Hour(end)} (${item.durationMins} min)`,
    amount: `S$${item.grandTotal.toFixed(2)}`,
    statusLabel,
    statusType: isPast ? 'completed' : 'upcoming',
    tags: item.facilityTag ? [isCoaching ? 'Coaching' : 'Facility', item.facilityTag] : fallbackTags,
    image: item.facilityImageKey ? FACILITY_IMAGES[item.facilityImageKey] : isCoaching ? cricketGear : indoorCricketCard,
  };
}

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

export default function ViewBookingsScreen() {
  const { navigate, state } = useApp();
  const [tab, setTab] = useState<BookingTab>('upcoming');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyItems, setHistoryItems] = useState<BookingHistoryItem[]>([]);

  useEffect(() => {
    if (!state.authToken) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchMyBookings(state.authToken)
      .then((response) => {
        if (cancelled) return;
        setHistoryItems(response.bookings);
      })
      .catch((err) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Unable to load bookings right now.';
        setError(msg);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [state.authToken]);

  const activeList = useMemo(() => {
    const currentKey = currentSingaporeDateTimeKey();
    return historyItems
      .filter((item) => tab === 'upcoming'
        ? bookingDateTimeKey(item) >= currentKey
        : bookingDateTimeKey(item) < currentKey)
      .map(mapHistoryToCard);
  }, [historyItems, tab]);

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

        <ErrorBanner message={error} onDismiss={() => setError(null)} />

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

          {loading ? (
            <div className="bookings-list-v2">
              <Spinner />
            </div>
          ) : activeList.length === 0 ? (
            <div className="bookings-list-v2">
              <p>{tab === 'upcoming' ? 'No upcoming bookings yet.' : 'No previous bookings yet.'}</p>
            </div>
          ) : (
            <div className="bookings-list-v2">
              {activeList.map((booking) => (
                <BookingCardView key={booking.id} booking={booking} showActions={tab === 'upcoming'} />
              ))}
            </div>
          )}
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