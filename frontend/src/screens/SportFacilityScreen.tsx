import { ArrowRight, CalendarDays, Clock3, MapPin, ShieldCheck, Star } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { announce } from '@/lib/utils';
import ScreenHeader from '@/components/ScreenHeader';
import SportsBottomNav from '@/components/SportsBottomNav';
import selectSportBackground from '@/assets/select_sport_bk.png';
import cricketFacility from '@/assets/cricket_facility.png';
import cricketGear from '@/assets/cricket_gear.png';
import cricketCoach from '@/assets/cricket_coach.png';
import cricketAcademy from '@/assets/cricket_academy.png';
import indoorCricketCard from '@/assets/card_indoor_cricket.png';
import cricketCard from '@/assets/card_cricket.png';
import type { SportId } from '@/types';

type FacilityCard = {
  id: string;
  title: string;
  price: string;
  image: string;
  tag: string;
  icon: 'lane' | 'net' | 'court' | 'field' | 'academy' | 'gear';
};

const SPORT_LABELS: Record<SportId, string> = {
  cricket: 'Cricket',
  'indoor-cricket': 'Indoor Cricket',
  pickleball: 'Pickleball',
  soccer: 'Soccer',
  volleyball: 'Volleyball',
  badminton: 'Badminton',
  basketball: 'Basketball',
  kabaddi: 'Kabaddi',
};

const FACILITY_IMAGES = [cricketGear, indoorCricketCard, cricketFacility, cricketCard, cricketCoach, cricketAcademy];

function buildFacilityCards(sportLabel: string): FacilityCard[] {
  return [
    {
      id: 'bowling-lane',
      title: `${sportLabel} Bowling Machine Lane`,
      price: 'S$60',
      image: FACILITY_IMAGES[0],
      tag: 'Per Hour',
      icon: 'lane',
    },
    {
      id: 'net-2',
      title: `${sportLabel} Net 2`,
      price: 'S$45',
      image: FACILITY_IMAGES[1],
      tag: 'Per Hour',
      icon: 'net',
    },
    {
      id: 'net-3',
      title: `${sportLabel} Net 3`,
      price: 'S$45',
      image: FACILITY_IMAGES[2],
      tag: 'Per Hour',
      icon: 'net',
    },
    {
      id: 'net-4',
      title: `${sportLabel} Net 4`,
      price: 'S$45',
      image: FACILITY_IMAGES[3],
      tag: 'Per Hour',
      icon: 'net',
    },
    {
      id: 'indoor-court',
      title: `${sportLabel} Indoor Court`,
      price: 'S$140',
      image: FACILITY_IMAGES[4],
      tag: 'Per Hour',
      icon: 'court',
    },
    {
      id: 'outdoor-field',
      title: `${sportLabel} Outdoor Field`,
      price: 'S$100',
      image: FACILITY_IMAGES[5],
      tag: 'Per Hour',
      icon: 'field',
    },
  ];
}

function FacilityIcon({ kind }: { kind: FacilityCard['icon'] }) {
  if (kind === 'lane') return <Star size={20} strokeWidth={2.3} />;
  if (kind === 'net') return <MapPin size={20} strokeWidth={2.3} />;
  if (kind === 'court') return <CalendarDays size={20} strokeWidth={2.3} />;
  if (kind === 'field') return <ShieldCheck size={20} strokeWidth={2.3} />;
  if (kind === 'academy') return <Star size={20} strokeWidth={2.3} />;
  return <Clock3 size={20} strokeWidth={2.3} />;
}

export default function SportFacilityScreen() {
  const { navigate, state } = useApp();
  const sportLabel = SPORT_LABELS[state.selectedSport ?? 'cricket'];
  const facilityCards = buildFacilityCards(sportLabel);

  function handleFacilitySelect(title: string) {
    announce(`${title} selected.`);
    navigate('schedule');
  }

  return (
    <div className="page-container page-container--immersive screen-fade-enter">
      <div
        className="sports-screen-shell"
        style={{ backgroundImage: `url(${selectSportBackground})` }}
      >
        <ScreenHeader onBack={() => navigate('sport-events')} backAriaLabel="Back to sport events" />

        <section className="facility-select-hero">
          <h1>
            Book a <span className="gold">Facility</span>
          </h1>
          <p>
            Choose from our range of premium {sportLabel.toLowerCase()} facilities and book in just a few steps.
          </p>
        </section>

        <div className="facility-select-grid" role="list" aria-label={`${sportLabel} facilities`}>
          {facilityCards.map((card) => (
            <button
              type="button"
              key={card.id}
              className="facility-select-card"
              role="listitem"
              aria-label={card.title}
              onClick={() => handleFacilitySelect(card.title)}
            >
              <div className="facility-select-card-media">
                <img src={card.image} alt={card.title} className="facility-select-card-image" />
                <span className="facility-select-card-badge" aria-hidden="true">
                  <FacilityIcon kind={card.icon} />
                </span>
              </div>

              <div className="facility-select-card-body">
                <div className="facility-select-card-title">{card.title}</div>
                <div className="facility-select-card-price">
                  {card.price}
                  <small>/ hour</small>
                </div>
              </div>

              <div className="facility-select-card-footer">
                <span>
                  <Clock3 size={15} strokeWidth={2.4} />
                  {card.tag}
                </span>
                <ArrowRight size={22} strokeWidth={2.6} className="facility-select-card-arrow" aria-hidden="true" />
              </div>
            </button>
          ))}
        </div>

        <div className="facility-select-note">
          <span className="facility-select-note-icon" aria-hidden="true">
            <ShieldCheck size={26} strokeWidth={2.1} />
          </span>
          <span className="facility-select-note-text">
            <strong>All facilities are hourly bookings.</strong>
            <small>Select a facility to check availability and book.</small>
          </span>
        </div>

        <SportsBottomNav onNavigate={navigate} activeItem="home" />
      </div>
    </div>
  );
}