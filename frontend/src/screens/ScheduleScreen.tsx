import { useEffect, useMemo, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { fetchSlots } from '@/lib/api';
import { DURATIONS } from '@/lib/constants';
import { rollingDates, toISO, announce } from '@/lib/utils';
import StepBar from '@/components/StepBar';
import Spinner from '@/components/Spinner';
import ErrorBanner from '@/components/ErrorBanner';
import prevArrow from '@/assets/date-prev.svg';
import nextArrow from '@/assets/date-next.svg';

export default function ScheduleScreen() {
  const { state, dispatch, navigate } = useApp();
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
    if (state.isLoggedIn) {
      navigate('checkout');
    } else {
      dispatch({ type: 'SET_SCREEN', payload: 'login' });
    }
  }

  const dates = useMemo(() => rollingDates(180, -45), []);
  const todayIso = useMemo(() => toISO(new Date()), []);

  // Scroll to today on every mount so the user always starts in context.
  useEffect(() => {
    const wrap = dateStripWrapRef.current;
    if (!wrap) return;
    // Each date-card is min-width 66px + 10px gap = 76px per slot.
    // Offset starts 45 days in the past, so scroll 45 × 76 to reach today.
    wrap.scrollLeft = 45 * 76;
  }, []);

  return (
    <div className="screen-enter">
      <StepBar current={1} />

      <div className="section-title">Choose Date &amp; Time</div>
      <div className="section-sub">
        {isCoaching
          ? 'Pick your date and time for the coaching session (60 min fixed).'
          : 'Pick your date, duration, and preferred time.'}
      </div>

      {/* ── Duration pills (court only) ── */}
      {!isCoaching && (
        <div>
          <div className="slot-label">Session Duration</div>
          <div className="pill-row">
            {DURATIONS.map(d => (
              <button
                type="button"
                key={d.value}
                className={`pill${state.durationMins === d.value ? ' selected' : ''}`}
                aria-pressed={state.durationMins === d.value}
                onClick={() => {
                  dispatch({ type: 'SET_DURATION', payload: d.value });
                  announce(`Duration set to ${d.label}`);
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Date strip ── */}
      <div className="slot-label">Select Date</div>
      <div className="date-strip-shell">
        <button
          type="button"
          className="date-inline-nav prev"
          onClick={() => moveDateWindow('prev')}
          aria-label="Show previous dates"
          title="Show previous dates"
        >
          <img src={prevArrow} className="date-inline-nav-icon" alt="Previous dates" />
        </button>

        <div ref={dateStripWrapRef} className="date-strip-wrap">
          <div className="date-strip">
          {dates.map((d) => {
            const ds  = toISO(d);
            const sel = ds === state.selectedDate;
            return (
              <div
                key={ds}
                className={`date-card${sel ? ' selected' : ''}${ds === todayIso ? ' today' : ''}`}
                role="button"
                tabIndex={0}
                aria-pressed={sel}
                onClick={() => handleDateSelect(ds, d)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleDateSelect(ds, d); } }}
              >
                <div className="day-name">{d.toLocaleDateString('en-SG', { weekday: 'short' })}</div>
                <div className="day-num">{d.getDate()}</div>
                <div className="month-lbl">{d.toLocaleDateString('en-SG', { month: 'short' })}</div>
              </div>
            );
          })}
          </div>
        </div>

        <button
          type="button"
          className="date-inline-nav next"
          onClick={() => moveDateWindow('next')}
          aria-label="Show next dates"
          title="Show next dates"
        >
          <img src={nextArrow} className="date-inline-nav-icon" alt="Next dates" />
        </button>
      </div>

      {/* ── Time slots ── */}
      <div className="slot-label">Available Times</div>
      {!state.selectedDate && (
        <div className="no-slots">
          <div className="no-slots-icon">📅</div>
          <div>Select a date above to see available times.</div>
        </div>
      )}

      {state.selectedDate && state.slotsLoading && (
        <div className="no-slots">
          <Spinner variant="muted" />
          <div style={{ marginTop: 14 }}>Loading available slots…</div>
        </div>
      )}

      {state.selectedDate && !state.slotsLoading && state.slotsError && (
        <ErrorBanner
          message={state.slotsError}
          onDismiss={() => dispatch({ type: 'CLEAR_SLOTS_ERROR' })}
        />
      )}

      {state.selectedDate && !state.slotsLoading && !state.slotsError && state.slots.length === 0 && (
        <div className="no-slots">
          <div className="no-slots-icon">😔</div>
          <div>No available slots on this date. Please try another day.</div>
        </div>
      )}

      {state.selectedDate && !state.slotsLoading && state.slots.length > 0 && (
        <div className="slot-grid">
          {state.slots.map(s => {
            const sel = !s.booked && state.selectedTime === s.time;
            return (
              <div
                key={s.key}
                className={`slot${s.booked ? ' booked' : ''}${sel ? ' selected' : ''}`}
                role="button"
                tabIndex={s.booked ? -1 : 0}
                aria-disabled={s.booked}
                aria-pressed={sel}
                onClick={!s.booked ? () => handleSlotSelect(s.time) : undefined}
                onKeyDown={!s.booked
                  ? e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSlotSelect(s.time); } }
                  : undefined
                }
              >
                {s.time}
                <div className="slot-sub">{s.booked ? 'Booked' : 'Available'}</div>
              </div>
            );
          })}
        </div>
      )}

      <button
        className="btn-primary"
        disabled={!canContinue}
        onClick={handleContinue}
      >
        Continue to Checkout →
      </button>
    </div>
  );
}
