import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
} from 'react';
import type { Action, AppState, Screen, BookingType, PayMethod } from '@/types';
import { calcPricing } from '@/lib/pricing';
import { PLATFORM_FEE } from '@/lib/constants';

// ─────────────────────────────────────────────────────────────
// Initial state
// ─────────────────────────────────────────────────────────────
const initialState: AppState = {
  screen:           'home',
  bookingType:      null,
  selectedDate:     null,
  selectedTime:     null,
  durationMins:     60,
  selectedSport:    null,
  packageOption:    null,
  isLoggedIn:       false,
  customerEmail:    '',
  authToken:        null,
  payMethod:        null,
  slots:            [],
  slotsLoading:     false,
  slotsError:       null,
  priceSubtotal:    0,
  platformFee:      PLATFORM_FEE,
  tax:              0,
  grandTotal:       0,
  receiptId:        '',
  paymentStatus:    null,
  whatsAppMockSent: false,
  paymentError:     null,
  postLoginRedirect: null,

};

// ─────────────────────────────────────────────────────────────
// Reducer
// ─────────────────────────────────────────────────────────────
function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_SCREEN':
      return { ...state, screen: action.payload };

    case 'SET_BOOKING_TYPE': {
      const isCoaching = action.payload === 'coaching';
      return {
        ...state,
        bookingType:   action.payload,
        durationMins:  isCoaching ? 60 : state.durationMins,
        packageOption: isCoaching ? null : state.packageOption,
      };
    }

    case 'SET_SELECTED_SPORT':
      return { ...state, selectedSport: action.payload };

    case 'SET_DATE':
      return { ...state, selectedDate: action.payload, selectedTime: null, slots: [], slotsError: null };

    case 'SET_TIME':
      return { ...state, selectedTime: action.payload };

    case 'SET_DURATION': {
      const pricing = calcPricing('court', action.payload, null);
      return { ...state, durationMins: action.payload, ...pricing };
    }

    case 'SET_PACKAGE': {
      const pricing = calcPricing('coaching', state.durationMins, action.payload);
      return { ...state, packageOption: action.payload, ...pricing };
    }

    case 'SET_PAY_METHOD':
      return { ...state, payMethod: action.payload, paymentError: null };

    case 'SET_LOGGED_IN':
      return {
        ...state,
        isLoggedIn:    true,
        customerEmail: action.payload.email,
        authToken:     action.payload.token,
      };

    case 'SET_SLOTS_LOADING':
      return { ...state, slotsLoading: true, slotsError: null };

    case 'SET_SLOTS':
      return { ...state, slots: action.payload, slotsLoading: false, slotsError: null };

    case 'SET_SLOTS_ERROR':
      return { ...state, slotsLoading: false, slotsError: action.payload };

    case 'CLEAR_SLOTS_ERROR':
      return { ...state, slotsError: null };

    case 'SET_PRICING':
      return { ...state, ...action.payload };

    case 'SET_RECEIPT':
      return { ...state, receiptId: action.payload };

    case 'SET_PAYMENT_STATUS':
      return { ...state, paymentStatus: action.payload, paymentError: null };

    case 'SET_PAYMENT_ERROR':
      return { ...state, paymentError: action.payload };

    case 'SET_POST_LOGIN_REDIRECT':
      return { ...state, postLoginRedirect: action.payload };

    case 'MARK_WHATSAPP_SENT':
      return { ...state, whatsAppMockSent: true };

    case 'RESET':
      return {
        ...initialState,
        // Preserve login session across bookings
        isLoggedIn:    state.isLoggedIn,
        customerEmail: state.customerEmail,
        authToken:     state.authToken,
      };

    default:
      return state;
  }
}

// ─────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────
interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  navigate: (target: Screen) => void;
  goBack: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

// ─────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const navigate = useCallback(
    (target: Screen) => {
      // Navigation guards
      if (target === 'schedule' && !state.bookingType)           return;
      if (target === 'terms' && (!state.selectedDate || !state.selectedTime)) return;
      if (target === 'success' && state.screen !== 'checkout')    return; // only via payment flow
      if (target === 'checkout' && !state.isLoggedIn) {
        dispatch({ type: 'SET_POST_LOGIN_REDIRECT', payload: 'checkout' });
        dispatch({ type: 'SET_SCREEN', payload: 'login' });
        return;
      }
      if (target === 'bookings' && !state.isLoggedIn) {
        dispatch({ type: 'SET_POST_LOGIN_REDIRECT', payload: 'bookings' });
        dispatch({ type: 'SET_SCREEN', payload: 'login' });
        return;
      }
      if (target === 'checkout' && (!state.selectedDate || !state.selectedTime)) return;

      dispatch({ type: 'SET_SCREEN', payload: target });
    },
    [state.bookingType, state.isLoggedIn, state.selectedDate, state.selectedTime, state.screen]
  );

  const goBack = useCallback(() => {
    const order: Screen[] = ['home', 'sport-select', 'sport-events', 'facility-select', 'schedule', 'terms', 'login', 'checkout', 'success', 'bookings'];
    const idx = order.indexOf(state.screen);
    if (idx <= 0) return;

    let prev = order[idx - 1];
    // Skip login screen when already logged in
    if (prev === 'login' && state.isLoggedIn) {
      prev = order[Math.max(0, idx - 2)];
    }
    dispatch({ type: 'SET_SCREEN', payload: prev });
  }, [state.screen, state.isLoggedIn]);

  return (
    <AppContext.Provider value={{ state, dispatch, navigate, goBack }}>
      {children}
    </AppContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────
export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}

// Typed convenience for selecting booking type
export function useSelectBookingType() {
  const { dispatch } = useApp();
  return useCallback(
    (type: BookingType) => dispatch({ type: 'SET_BOOKING_TYPE', payload: type }),
    [dispatch]
  );
}

// Typed convenience for selecting pay method
export function useSelectPayMethod() {
  const { dispatch } = useApp();
  return useCallback(
    (method: PayMethod) => dispatch({ type: 'SET_PAY_METHOD', payload: method }),
    [dispatch]
  );
}
