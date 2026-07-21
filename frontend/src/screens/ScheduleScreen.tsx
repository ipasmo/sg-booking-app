import { useEffect, useMemo, useRef } from 'react';
import { Clock3, Lightbulb, MapPin, Orbit } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { fetchSlots } from '@/lib/api';
import { DURATIONS } from '@/lib/constants';
import { rollingDates, toISO, announce } from '@/lib/utils';
import Spinner from '@/components/Spinner';
import ErrorBanner from '@/components/ErrorBanner';
import ScreenHeader from '@/components/ScreenHeader';
import prevArrow from '@/assets/date-prev.svg';
import nextArrow from '@/assets/date-next.svg';
import scheduleBackground from '@/assets/select_sport_bk.png';
import indoorCricketCard from '@/assets/card_indoor_cricket.png';

const SPORT_LABELS = {
  cricket: 'Cricket',
  'indoor-cricket': 'Indoor Cricket',
  pickleball: 'Pickleball',
  soccer: 'Soccer',
  volleyball: 'Volleyball',
  badminton: 'Badminton',
  basketball: 'Basketball',
  kabaddi: 'Kabaddi',
} as const;

const FACILITY_RATE_PER_HOUR = 45;

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

function formatDurationLabel(minutes: number): string {
  return `${minutes} min`;
}

export default function ScheduleScreen() {
  const { state, dispatch, navigate, goBack } = useApp();
  const dateStripWrapRef = useRef<HTMLDivElement | null>(null);

  // Fetch slots whenever the selected date changes
  useEffect(() => {
    if (!state.selectedDate) return;

    dispatch({ type: 'SET_SLOTS_LOADING' });
    fetchSlots(state.selectedDate)
      .then(res => dispatch({ type: 'SET_SLOTS', payload: res.slots }))
      .catch(err =>
        dispatch({ type: 'SET_SLOTS_ERROR', payload: err.message ?? 'Failed to load slots.' })
      );
  }, [state.selectedDate, dispatch]);

  const isCoaching = state.bookingType === 'coaching';
  const canContinue = !!state.selectedDate && !!state.selectedTime;
  const selectedSportLabel = state.selectedSport ? SPORT_LABELS[state.selectedSport] : 'Cricket';

  function moveDateWindow(direction: 'prev' | 'next') {
    const wrap = dateStripWrapRef.current;
    if (!wrap) return;
    const distance = direction === 'next' ? 420 : -420;
    wrap.scrollBy({ left: distance, behavior: 'smooth' });
  }

  function handleDateSelect(dateStr: string, dateObj: Date) {
    dispatch({ type: 'SET_DATE', payload: dateStr });
    announce(
      `Date selected: ${dateObj.toLocaleDateString('en-SG', {
        weekday: 'long', day: 'numeric', month: 'long',
      })}`
    );
  }

  function handleSlotSelect(time: string) {
    dispatch({ type: 'SET_TIME', payload: time });
    announce(`Time ${time} selected`);
  }

  function handleContinue() {
    if (!canContinue) return;
    navigate('terms');
  }

  const dates = useMemo(() => rollingDates(180, -45), []);
  const todayIso = useMemo(() => toISO(new Date()), []);

  useEffect(() => {
    if (!state.selectedDate) {
      dispatch({ type: 'SET_DATE', payload: todayIso });
    }
  }, [state.selectedDate, dispatch, todayIso]);

  useEffect(() => {
    if (!isCoaching && state.priceSubtotal === 0) {
      dispatch({ type: 'SET_DURATION', payload: state.durationMins });
    }
  }, [dispatch, isCoaching, state.durationMins, state.priceSubtotal]);

  // Scroll to today on every mount so the user always starts in context.
  useEffect(() => {
    const wrap = dateStripWrapRef.current;
    if (!wrap) return;
    // Each date-card is min-width 66px + 10px gap = 76px per slot.
    // Offset starts 45 days in the past, so scroll 45 × 76 to reach today.
    wrap.scrollLeft = 45 * 76;
  }, []);

  const selectedEndTime = state.selectedTime ? addMinutes(state.selectedTime, state.durationMins) : null;
  const selectedDateText = state.selectedDate
    ? new Date(`${state.selectedDate}T00:00:00`).toLocaleDateString('en-SG', {
      day: 'numeric', month: 'short', year: 'numeric', weekday: 'short',
    })
    : 'Not selected';
  const durationPrice = (FACILITY_RATE_PER_HOUR * (state.durationMins / 60)).toFixed(2);

  return (
    <div className="page-container page-container--immersive screen-fade-enter">
      <div className="schedule-phone" style={{ backgroundImage: `url(${scheduleBackground})` }}>
        <ScreenHeader onBack={goBack} backAriaLabel="Back" />

        <section className="schedule-venue-card">
          <img src={indoorCricketCard} alt={`${selectedSportLabel} facility`} className="schedule-venue-image" />
          <div className="schedule-venue-meta">
            <h1>{selectedSportLabel} Net 2</h1>
            <div className="schedule-venue-location">
              <MapPin size={14} strokeWidth={2.3} />
              <span>Kallang, Singapore</span>
            </div>
            <div className="schedule-venue-price">S${FACILITY_RATE_PER_HOUR} <small>/ hour</small></div>
            <div className="schedule-venue-tags" aria-hidden="true">
              <span><Orbit size={13} strokeWidth={2.3} />Indoor</span>
              <span><Lightbulb size={13} strokeWidth={2.3} />Floodlights</span>
            </div>
          </div>
        </section>

        <section className="schedule-section">
          <h2 className="schedule-heading">1. Select Date</h2>
          <div className="date-strip-shell schedule-date-shell">
            <button
              type="button"
              className="date-inline-nav prev schedule-date-nav"
              onClick={() => moveDateWindow('prev')}
              aria-label="Show previous dates"
              title="Show previous dates"
            >
              <img src={prevArrow} className="date-inline-nav-icon" alt="Previous dates" />
            </button>

            <div ref={dateStripWrapRef} className="date-strip-wrap schedule-date-wrap">
              <div className="date-strip">
                {dates.map((d) => {
                  const ds = toISO(d);
                  const sel = ds === state.selectedDate;
                  return (
                    <div
                      key={ds}
                      className={`date-card schedule-date-card${sel ? ' selected' : ''}${ds === todayIso ? ' today' : ''}`}
                      role="button"
                      tabIndex={0}
                      aria-pressed={sel}
                      onClick={() => handleDateSelect(ds, d)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleDateSelect(ds, d);
                        }
                      }}
                    >
                      <div className="day-name">{ds === todayIso ? 'Today' : d.toLocaleDateString('en-SG', { weekday: 'short' })}</div>
                      <div className="month-lbl">{d.toLocaleDateString('en-SG', { month: 'short' })}</div>
                      <div className="day-num">{d.getDate()}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              className="date-inline-nav next schedule-date-nav"
              onClick={() => moveDateWindow('next')}
              aria-label="Show next dates"
              title="Show next dates"
            >
              <img src={nextArrow} className="date-inline-nav-icon" alt="Next dates" />
            </button>
          </div>

          <div className="schedule-legend" aria-hidden="true">
            <span><i className="dot available" />Available</span>
            <span><i className="dot few" />Few Slots</span>
            <span><i className="dot full" />Fully Booked</span>
            <span><i className="dot unavailable" />Unavailable</span>
          </div>
        </section>

        <section className="schedule-section">
          <h2 className="schedule-heading">2. Select Time Slot</h2>
          {state.selectedDate && state.slotsLoading && (
            <div className="no-slots schedule-no-slots">
              <Spinner variant="muted" />
              <div style={{ marginTop: 14 }}>Loading available slots...</div>
            </div>
          )}

          {state.selectedDate && !state.slotsLoading && state.slotsError && (
            <ErrorBanner
              message={state.slotsError}
              onDismiss={() => dispatch({ type: 'CLEAR_SLOTS_ERROR' })}
            />
          )}

          {state.selectedDate && !state.slotsLoading && !state.slotsError && state.slots.length === 0 && (
            <div className="no-slots schedule-no-slots">
              <div className="no-slots-icon">No slots</div>
              <div>No available slots on this date. Please try another day.</div>
            </div>
          )}

          {state.selectedDate && !state.slotsLoading && state.slots.length > 0 && (
            <div className="schedule-slot-grid">
              {state.slots.map((s, index) => {
                const sel = !s.booked && state.selectedTime === s.time;
                const mood = s.booked ? 'full' : index % 4 === 2 ? 'few' : 'available';
                return (
                  <div
                    key={s.key}
                    className={`schedule-slot${s.booked ? ' booked' : ''}${sel ? ' selected' : ''} ${mood}`}
                    role="button"
                    tabIndex={s.booked ? -1 : 0}
                    aria-disabled={s.booked}
                    aria-pressed={sel}
                    onClick={!s.booked ? () => handleSlotSelect(s.time) : undefined}
                    onKeyDown={!s.booked
                      ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleSlotSelect(s.time);
                        }
                      }
                      : undefined
                    }
                  >
                    <div className="schedule-slot-main">{to12Hour(s.time)}</div>
                    <div className="schedule-slot-sub">- {to12Hour(addMinutes(s.time, 60))}</div>
                    <i className={`schedule-slot-dot ${mood}`} aria-hidden="true" />
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {!isCoaching && (
          <section className="schedule-section">
            <h2 className="schedule-heading">3. Select Duration</h2>
            <div className="schedule-duration-grid">
              {DURATIONS.map((d) => {
                const selected = state.durationMins === d.value;
                const amount = (FACILITY_RATE_PER_HOUR * (d.value / 60)).toFixed(2);
                return (
                  <button
                    type="button"
                    key={d.value}
                    className={`schedule-duration-card${selected ? ' selected' : ''}`}
                    aria-pressed={selected}
                    onClick={() => {
                      dispatch({ type: 'SET_DURATION', payload: d.value });
                      announce(`Duration set to ${d.label}`);
                    }}
                  >
                    <Clock3 size={20} strokeWidth={2.2} />
                    <span>{formatDurationLabel(d.value)}</span>
                    <strong>S${amount}</strong>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <section className="schedule-booking-summary">
          <div>
            <small>Facility</small>
            <strong>{selectedSportLabel} Net 2</strong>
          </div>
          <div>
            <small>Date &amp; Time</small>
            <strong>
              {selectedDateText}
              {state.selectedTime && selectedEndTime ? `, ${to12Hour(state.selectedTime)} - ${to12Hour(selectedEndTime)}` : ''}
            </strong>
          </div>
          <div>
            <small>Duration</small>
            <strong>{formatDurationLabel(state.durationMins)}</strong>
          </div>
        </section>

        <section className="schedule-footer">
          <div className="schedule-total">
            <small>Total Amount</small>
            <strong>S${durationPrice}</strong>
            <span>(Incl. taxes)</span>
          </div>
          <button
            className="schedule-continue-btn"
            disabled={!canContinue}
            onClick={handleContinue}
          >
            Continue to Book <span aria-hidden="true">&#8594;</span>
          </button>
        </section>
      </div>
    </div>
  );
}
