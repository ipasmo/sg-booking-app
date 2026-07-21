import { ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import { useApp, useSelectBookingType } from '@/context/AppContext';
import { announce } from '@/lib/utils';
import selectSportBackground from '@/assets/select_sport_bk.png';
import logoImage from '@/assets/logo.png';
import cricketCard from '@/assets/card_cricket.png';
import indoorCricketCard from '@/assets/card_indoor_cricket.png';
import pickleballCard from '@/assets/card_pickle_ball.png';
import soccerCard from '@/assets/card_soccer.png';
import volleyballCard from '@/assets/card_volley_ball.png';
import badmintonCard from '@/assets/card_badminton.png';
import basketballCard from '@/assets/card_basket_ball.png';
import kabaddiCard from '@/assets/card_kabaddi.png';
import type { SportId } from '@/types';

type SportTile = {
  id: SportId;
  label: string;
  image: string;
};

const SPORTS: SportTile[] = [
  {
    id: 'cricket',
    label: 'Cricket',
    image: cricketCard,
  },
  {
    id: 'indoor-cricket',
    label: 'Indoor Cricket',
    image: indoorCricketCard,
  },
  {
    id: 'pickleball',
    label: 'Pickleball',
    image: pickleballCard,
  },
  {
    id: 'soccer',
    label: 'Soccer',
    image: soccerCard,
  },
  {
    id: 'volleyball',
    label: 'Volleyball',
    image: volleyballCard,
  },
  {
    id: 'badminton',
    label: 'Badminton',
    image: badmintonCard,
  },
  {
    id: 'basketball',
    label: 'Basketball',
    image: basketballCard,
  },
  {
    id: 'kabaddi',
    label: 'Kabaddi',
    image: kabaddiCard,
  },
];

export default function SportSelectScreen() {
  const { navigate, dispatch } = useApp();
  const selectType = useSelectBookingType();

  function handleSportSelect(sport: SportTile) {
    selectType('court');
    dispatch({ type: 'SET_SELECTED_SPORT', payload: sport.id });
    announce(`${sport.label} selected.`);
    navigate('sport-events');
  }

  return (
    <div className="page-container page-container--immersive screen-fade-enter">
      <div
        className="sport-select-phone"
        style={{ backgroundImage: `url(${selectSportBackground})` }}
      >
        <div className="sport-top-nav">
          <button
            type="button"
            className="sport-back-btn"
            aria-label="Back to home"
            onClick={() => navigate('home')}
          >
            <ChevronLeft size={18} strokeWidth={2.8} />
          </button>
        </div>

        <div className="sport-events-logo-wrap">
          <img src={logoImage} alt="SportyGo" className="sport-events-logo" />
        </div>

        <div className="sport-steps" aria-hidden="true">
          <span className="sport-step active" />
          <span className="sport-step" />
          <span className="sport-step" />
        </div>

        <div className="sport-heading">
          <h1>
            <span className="gold">Choose</span> Your Sport
          </h1>
          <p>Select the sport you love to get started</p>
        </div>

        <div className="sport-grid" role="list" aria-label="Sports">
          {SPORTS.map((sport) => (
            <button
              type="button"
              key={sport.id}
              className="sport-card"
              role="listitem"
              aria-label={`Select ${sport.label}`}
              onClick={() => handleSportSelect(sport)}
            >
              <img src={sport.image} alt={sport.label} className="sport-card-img" />
              <span className="sport-card-label">{sport.label}</span>
            </button>
          ))}
        </div>

        <button type="button" className="sport-info-banner" aria-label="Explore and switch sports anytime">
          <span className="sport-info-icon" aria-hidden="true">
            <ShieldCheck size={20} strokeWidth={2.1} />
          </span>
          <span className="sport-info-text">
            <strong>Not sure which one to choose?</strong>
            <small>You can explore and switch sports anytime.</small>
          </span>
          <ChevronRight size={18} strokeWidth={2.4} className="sport-info-arrow" aria-hidden="true" />
        </button>

      </div>
    </div>
  );
}