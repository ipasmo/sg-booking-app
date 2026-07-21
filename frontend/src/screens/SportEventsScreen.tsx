import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  GraduationCap,
  House,
  MessageCircle,
  ShoppingBag,
  User,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { announce } from '@/lib/utils';
import sportEventsBackground from '@/assets/sport_events_bk.png';
import logoImage from '@/assets/logo.png';
import cricketBanner from '@/assets/cricket_banner.png';
import cricketCard from '@/assets/card_cricket.png';
import indoorCricketCard from '@/assets/card_indoor_cricket.png';
import pickleballCard from '@/assets/card_pickle_ball.png';
import soccerCard from '@/assets/card_soccer.png';
import volleyballCard from '@/assets/card_volley_ball.png';
import kabaddiCard from '@/assets/card_kabaddi.png';
import badmintonCard from '@/assets/card_badminton.png';
import basketballCard from '@/assets/card_basket_ball.png';
import imgCricketFacility from '@/assets/cricket_facility.png';
import imgCricketAcademy from '@/assets/cricket_academy.png';
import imgCricketCoach from '@/assets/cricket_coach.png';
import imgCricketGear from '@/assets/cricket_gear.png';
import type { SportId } from '@/types';

type EventCard = {
  id: string;
  title: string;
  description: string;
  image: string;
  icon: 'calendar' | 'academy' | 'coach' | 'shop';
};

const SPORT_ASSETS: Record<SportId, { label: string; banner: string; card: string }> = {
  cricket: { label: 'Cricket', banner: cricketBanner, card: cricketCard },
  'indoor-cricket': { label: 'Indoor Cricket', banner: indoorCricketCard, card: indoorCricketCard },
  pickleball: { label: 'Pickleball', banner: pickleballCard, card: pickleballCard },
  soccer: { label: 'Soccer', banner: soccerCard, card: soccerCard },
  volleyball: { label: 'Volleyball', banner: volleyballCard, card: volleyballCard },
  badminton: { label: 'Badminton', banner: badmintonCard, card: badmintonCard },
  basketball: { label: 'Basketball', banner: basketballCard, card: basketballCard },
  kabaddi: { label: 'Kabaddi', banner: kabaddiCard, card: kabaddiCard },
};

const FEATURE_IMAGES = [imgCricketFacility, imgCricketAcademy, imgCricketCoach, imgCricketGear];

function buildEventCards(sportName: string): EventCard[] {
  return [
    {
      id: 'book-facility',
      title: 'Book a Facility',
      description: `Find and book top ${sportName.toLowerCase()} venues near you.`,
      image: FEATURE_IMAGES[0],
      icon: 'calendar',
    },
    {
      id: 'join-academy',
      title: `Join ${sportName} Academy`,
      description: `Learn from expert coaches and take your ${sportName.toLowerCase()} game to the next level.`,
      image: FEATURE_IMAGES[1],
      icon: 'academy',
    },
    {
      id: 'coach-session',
      title: 'Book a One on One Session with Coach',
      description: `Get personalized ${sportName.toLowerCase()} coaching to improve your skills faster.`,
      image: FEATURE_IMAGES[2],
      icon: 'coach',
    },
    {
      id: 'purchase-gear',
      title: 'Purchase Gear',
      description: `Shop the best ${sportName.toLowerCase()} gear and equipment.`,
      image: FEATURE_IMAGES[3],
      icon: 'shop',
    },
  ];
}

function FeatureIcon({ kind }: { kind: EventCard['icon'] }) {
  if (kind === 'calendar') return <CalendarDays size={22} strokeWidth={2.1} />;
  if (kind === 'academy') return <GraduationCap size={22} strokeWidth={2.1} />;
  if (kind === 'coach') return <User size={22} strokeWidth={2.1} />;
  return <ShoppingBag size={22} strokeWidth={2.1} />;
}

export default function SportEventsScreen() {
  const { navigate, state } = useApp();
  const selectedSport = state.selectedSport ?? 'cricket';
  const selectedSportMeta = SPORT_ASSETS[selectedSport];
  const eventCards = buildEventCards(selectedSportMeta.label);

  function handleCardAction(cardId: string, title: string) {
    announce(`${title} selected.`);
    if (cardId === 'book-facility') {
      navigate('facility-select');
      return;
    }
    navigate('schedule');
  }

  return (
    <div className="page-container page-container--immersive screen-fade-enter">
      <div
        className="sport-events-phone"
        style={{ backgroundImage: `url(${sportEventsBackground})` }}
      >

        <div className="sport-events-topbar">
          <button
            type="button"
            className="sport-events-back"
            aria-label="Back to sport list"
            onClick={() => navigate('sport-select')}
          >
            <ChevronLeft size={21} strokeWidth={2.8} />
          </button>
        </div>

        <div className="sport-events-logo-wrap">
          <img src={logoImage} alt="SportyGo" className="sport-events-logo" />
        </div>

        <section className="sport-events-hero">
          <div className="sport-events-hero-left" aria-hidden="true">
            <img src={selectedSportMeta.banner} alt="" className="sport-events-hero-banner" />
          </div>
          <div className="sport-events-hero-right">
            <h1>{selectedSportMeta.label}</h1>
            <div className="sport-events-hero-lines">
              <span className="red">Play.</span>
              <span className="white">Learn.</span>
              <span className="gold">Grow.</span>
            </div>
            <p>Everything you need for your {selectedSportMeta.label.toLowerCase()} journey, all in one place.</p>
          </div>
        </section>

        <div className="sport-events-grid" role="list" aria-label={`${selectedSportMeta.label} features`}>
          {eventCards.map((card) => (
            <button
              type="button"
              key={card.id}
              className="sport-event-card"
              role="listitem"
              aria-label={card.title}
              onClick={() => handleCardAction(card.id, card.title)}
            >
              <img src={card.image} alt={card.title} className="sport-event-card-image" />
              <div className="sport-event-card-meta">
                <span className="sport-event-card-icon" aria-hidden="true">
                  <FeatureIcon kind={card.icon} />
                </span>
                <span className="sport-event-card-title">{card.title}</span>
              </div>
              <p className="sport-event-card-desc">{card.description}</p>
              <ArrowRight size={24} strokeWidth={2.5} className="sport-event-card-arrow" aria-hidden="true" />
            </button>
          ))}
        </div>

        <nav className="sport-events-bottom-nav" aria-label="Bottom navigation">
          <button type="button" className="sport-events-nav-item active" onClick={() => navigate('home')}>
            <House size={23} strokeWidth={2.1} />
            <span>Home</span>
          </button>
          <button type="button" className="sport-events-nav-item" onClick={() => navigate('schedule')}>
            <CalendarDays size={23} strokeWidth={2.1} />
            <span>Bookings</span>
          </button>
          <button type="button" className="sport-events-nav-item" onClick={() => navigate('schedule')}>
            <GraduationCap size={23} strokeWidth={2.1} />
            <span>Academy</span>
          </button>
          <button type="button" className="sport-events-nav-item" onClick={() => navigate('schedule')}>
            <MessageCircle size={23} strokeWidth={2.1} />
            <span>Messages</span>
          </button>
          <button type="button" className="sport-events-nav-item" onClick={() => navigate('login')}>
            <User size={23} strokeWidth={2.1} />
            <span>Profile</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
