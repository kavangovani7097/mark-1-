import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase, supabaseUrl, supabaseAnonKey } from './supabase';
import SquadrLogo from './SquadrLogo';
import VenueAutocomplete from './VenueAutocomplete';
import {
  acceptRequest,
  createInstantRequest,
  deleteUserData,
  fetchMatches,
  fetchMessages,
  fetchMyParticipations,
  fetchMyRatings,
  fetchOpenRequests,
  haversineDistance,
  joinSession,
  reverseGeocode,
  sendMessage,
  submitRating,
  updateRequestStatus,
  updateUserLocation,
} from './instantPlay';
import {
  createSessionInvites,
  fetchFriendRequests,
  fetchDiscoverablePlayers,
  fetchPendingInvites,
  findUserBySquadrId,
  generateSquadrId,
  sendFriendRequest,
  updateFriendRequestStatus,
  updateInviteStatus,
  upsertUser,
} from './friends';
import SplashScreen from './SplashScreen';
import LandingPage from './LandingPage';
import Toast from './Toast';
import {
  CountUpStat,
  IndexTag,
  LoadingPulse,
  PanelEyebrow,
  RevealItem,
  RevealList,
  SectionDivider,
  StepIndicator,
} from './uiPolish';
import './App.css';

const PWA_INSTALLED_KEY = 'squadr_pwa_installed';
const PWA_ANDROID_DISMISSED_KEY = 'squadr_pwa_prompt_dismissed';
const PWA_IOS_DISMISSED_KEY = 'squadr_ios_prompt_dismissed';

const LEGAL_TERMS_URL = 'https://squadr.in/legal.html#terms';
const LEGAL_PRIVACY_URL = 'https://squadr.in/legal.html#privacy';
const LEGAL_COMMUNITY_URL = 'https://squadr.in/legal.html#community';

const isStandalonePwa = () =>
  (typeof window.matchMedia === 'function' &&
    window.matchMedia('(display-mode: standalone)').matches) ||
  window.navigator.standalone === true;

const isIosSafari = () => {
  const { userAgent, platform, maxTouchPoints } = window.navigator;
  const isIOS =
    /iPad|iPhone|iPod/.test(userAgent) ||
    (platform === 'MacIntel' && maxTouchPoints > 1);
  if (!isIOS) return false;
  return !/CriOS|FxiOS|EdgiOS|OPiOS/.test(userAgent);
};
const SPLASH_MS = process.env.NODE_ENV === 'test' ? 0 : 1500;

const EMPTY_OTP = ['', '', '', '', '', ''];

const formatPhone = (phone) => {
  const trimmed = phone.trim();
  if (trimmed.startsWith('+')) return trimmed;
  return `+${trimmed.replace(/\D/g, '')}`;
};

const formatSessionTime = (isoString) => {
  const date = new Date(isoString);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  if (date.toDateString() === now.toDateString()) {
    return `Today, ${timeStr}`;
  }
  if (date.toDateString() === tomorrow.toDateString()) {
    return `Tomorrow, ${timeStr}`;
  }

  return `${date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })}, ${timeStr}`;
};

const datetimeLocalToISO = (value) => {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  const match = trimmed.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/
  );
  if (!match) return null;

  const [, year, month, day, hour, minute, second = '0'] = match;
  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second)
  );

  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

const mapSessionFromDb = (row) => ({
  id: row.id,
  sport: row.sport,
  sessionType: row.session_type,
  time: formatSessionTime(row.scheduled_at),
  location: row.city ? `${row.venue}, ${row.city}` : row.venue,
  slotsLeft: row.slots_remaining,
  maxPlayers: row.max_players,
  venue: row.venue,
  city: row.city,
  scheduledAt: row.scheduled_at,
  attendees: [],
  chatPreview: [],
});

const CITIES = [
  'Ahmedabad',
  'Surat',
  'Vadodara',
  'Mumbai',
  'Delhi',
  'Bangalore',
  'Pune',
];

const DEFAULT_SPORTS = [
  'Badminton',
  'Cricket',
  'Football',
  'Tennis',
  'Swimming',
  'Table Tennis',
  'Volleyball',
  'Pickleball',
  'Board Games',
  'Cycling',
  'Yoga',
  'Gym',
  'Bowling',
];

const SESSION_TYPES = ['1-on-1', 'Small Group', 'Large Group'];

const GROUP_SESSIONS_TO_UNLOCK_ONE_ON_ONE = 4;

const PLAYER_COUNT_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const INSTANT_SEARCH_SECONDS = 15 * 60;

const formatCountdown = (totalSeconds) => {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const secondsUntil = (isoString) => {
  if (!isoString) return INSTANT_SEARCH_SECONDS;
  const diff = Math.floor((new Date(isoString).getTime() - Date.now()) / 1000);
  if (Number.isNaN(diff)) return INSTANT_SEARCH_SECONDS;
  return Math.max(0, diff);
};

const isRequestJoinable = (request, { sport, excludeName }) => {
  if (!request) return false;
  if (sport && request.sport !== sport) return false;
  if (excludeName && request.requester_name === excludeName) return false;
  if (request.status === 'cancelled') return false;
  if (request.expires_at && new Date(request.expires_at).getTime() <= Date.now()) {
    return false;
  }
  return true;
};

const PROFILE_STORAGE_KEY = 'mark1_profile';
const PROFILE_PIC_STORAGE_KEY = 'mark1_profile_pic';

const loadStoredProfile = () => {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const saveStoredProfile = (profile) => {
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
};

const loadStoredProfilePic = () => {
  try {
    return localStorage.getItem(PROFILE_PIC_STORAGE_KEY) || null;
  } catch {
    return null;
  }
};

const getInitials = (name) => {
  if (!name || !name.trim()) return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
};

const capitalize = (name) => {
  if (!name) return '';
  return name.charAt(0).toUpperCase() + name.slice(1);
};

const isDisplayablePlayerName = (name) => {
  const trimmed = name?.trim();
  if (!trimmed) return false;
  return trimmed.toLowerCase() !== 'player';
};

const bottomNavSvgProps = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

function BottomNavIcon({ type }) {
  switch (type) {
    case 'home':
      return (
        <svg {...bottomNavSvgProps} aria-hidden="true">
          <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z" />
          <path d="M9 21V12h6v9" />
        </svg>
      );
    case 'instant':
      return (
        <svg {...bottomNavSvgProps} aria-hidden="true">
          <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
        </svg>
      );
    case 'friends':
      return (
        <svg {...bottomNavSvgProps} aria-hidden="true">
          <circle cx="9" cy="7" r="3" />
          <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
          <circle cx="17" cy="7" r="3" />
          <path d="M21 21v-2a4 4 0 0 0-3-3.87" />
        </svg>
      );
    case 'profile':
      return (
        <svg {...bottomNavSvgProps} aria-hidden="true">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
        </svg>
      );
    default:
      return null;
  }
}

const instantFlowSvgBase = {
  viewBox: '0 0 24 24',
  fill: 'none',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

function InstantLightningIcon({ size = 20 }) {
  return (
    <svg
      {...instantFlowSvgBase}
      width={size}
      height={size}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
    </svg>
  );
}

function LocationPinIcon({ size = 24, stroke = '#7B2D42' }) {
  return (
    <svg
      {...instantFlowSvgBase}
      width={size}
      height={size}
      stroke={stroke}
      aria-hidden="true"
    >
      <path d="M12 21s7-4.35 7-11a7 7 0 1 0-14 0c0 6.65 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function SearchIcon({ size = 24, stroke = '#7B2D42' }) {
  return (
    <svg
      {...instantFlowSvgBase}
      width={size}
      height={size}
      stroke={stroke}
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

const AVAILABILITY_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const AVAILABILITY_WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const AVAILABILITY_WEEKENDS = ['Sat', 'Sun'];
const TIME_SLOTS = [
  { id: 'Morning', label: 'Morning', sub: '6–10am' },
  { id: 'Afternoon', label: 'Afternoon', sub: '12–4pm' },
  { id: 'Evening', label: 'Evening', sub: '5–10pm' },
];
const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

const PROFILE_BADGES = [
  {
    id: 'early-adopter',
    emoji: '🌟',
    name: 'Early Adopter',
    hint: 'Joined before launch',
    isEarned: () => true,
  },
  {
    id: 'first-session',
    emoji: '🏅',
    name: 'First Session',
    hint: 'Play your first session',
    isEarned: ({ sessionsPlayed }) => sessionsPlayed >= 1,
  },
  {
    id: 'on-fire',
    emoji: '🔥',
    name: 'On Fire',
    hint: 'Play 5 sessions',
    isEarned: ({ sessionsPlayed }) => sessionsPlayed >= 5,
  },
  {
    id: 'squad-legend',
    emoji: '💎',
    name: 'Squad Legend',
    hint: 'Play 20 sessions',
    isEarned: ({ sessionsPlayed }) => sessionsPlayed >= 20,
  },
  {
    id: 'five-star',
    emoji: '⭐',
    name: '5-Star Player',
    hint: 'Reach a 4.5 rating',
    isEarned: ({ rating }) => rating >= 4.5,
  },
  {
    id: 'social-butterfly',
    emoji: '🤝',
    name: 'Social Butterfly',
    hint: 'Add 5 friends',
    isEarned: ({ friendsCount }) => friendsCount >= 5,
  },
];

const formatAvailabilitySummary = (availability) => {
  if (!availability || typeof availability !== 'object') return null;

  const hasAny = AVAILABILITY_DAYS.some((day) => availability[day]?.length > 0);
  if (!hasAny) return null;

  const collectSlots = (days) => {
    const set = new Set();
    days.forEach((day) => {
      (availability[day] || []).forEach((slot) => set.add(slot));
    });
    return TIME_SLOTS.filter((slot) => set.has(slot.id)).map((slot) => slot.id);
  };

  const parts = [];
  const weekdaySlots = collectSlots(AVAILABILITY_WEEKDAYS);
  const weekendDaysActive = AVAILABILITY_WEEKENDS.filter(
    (day) => availability[day]?.length > 0
  );

  if (weekdaySlots.length > 0) {
    const slotText = weekdaySlots.map((slot) => `${slot}s`).join(' & ');
    parts.push(`Weekday ${slotText}`);
  }

  if (weekendDaysActive.length > 0) {
    parts.push('Weekends');
  }

  return parts.join(' · ');
};

const normalizeAvailability = (value) => {
  if (!value || typeof value !== 'object') return {};
  const normalized = {};
  AVAILABILITY_DAYS.forEach((day) => {
    if (Array.isArray(value[day]) && value[day].length > 0) {
      normalized[day] = value[day].filter((slot) =>
        TIME_SLOTS.some((item) => item.id === slot)
      );
    }
  });
  return normalized;
};

const normalizeSkillLevels = (value) => {
  if (!value || typeof value !== 'object') return {};
  const normalized = {};
  Object.entries(value).forEach(([sport, level]) => {
    if (SKILL_LEVELS.includes(level)) {
      normalized[sport] = level;
    }
  });
  return normalized;
};

function App() {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [step, setStep] = useState('splash');
  const [splashExiting, setSplashExiting] = useState(false);
  const [otp, setOtp] = useState(EMPTY_OTP);
  const [firstName, setFirstName] = useState('');
  const [age, setAge] = useState('');
  const [city, setCity] = useState('');
  const [sports, setSports] = useState(DEFAULT_SPORTS);
  const [selectedSports, setSelectedSports] = useState([]);
  const [customSport, setCustomSport] = useState('');
  const [activeTab, setActiveTab] = useState('home');
  const [createSessionSport, setCreateSessionSport] = useState('');
  const [createSessionType, setCreateSessionType] = useState('');
  const [sessionDateTime, setSessionDateTime] = useState('');
  const [venue, setVenue] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('');
  const [findSportFilter, setFindSportFilter] = useState('');
  const [findSessionTypeFilter, setFindSessionTypeFilter] = useState('');
  const [findPlayers, setFindPlayers] = useState([]);
  const [findPlayersLoading, setFindPlayersLoading] = useState(false);
  const [groupSessionsPlayed] = useState(0);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [loginError, setLoginError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [onboardingError, setOnboardingError] = useState('');
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [emailCooldown, setEmailCooldown] = useState(0);
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [createSessionError, setCreateSessionError] = useState('');

  const [openToPlay, setOpenToPlay] = useState(false);
  const [instantSport, setInstantSport] = useState('');
  const [instantPlayersNeeded, setInstantPlayersNeeded] = useState(null);
  const [instantLocationPref, setInstantLocationPref] = useState('');
  const [instantLocationMode, setInstantLocationMode] = useState(null);
  const [instantLocationLabel, setInstantLocationLabel] = useState('');
  const [userLat, setUserLat] = useState(null);
  const [userLng, setUserLng] = useState(null);
  const [radiusKm, setRadiusKm] = useState(10);
  const [instantLocationLoading, setInstantLocationLoading] = useState(false);
  const [instantLocationError, setInstantLocationError] = useState('');
  const [openToPlayLat, setOpenToPlayLat] = useState(null);
  const [openToPlayLng, setOpenToPlayLng] = useState(null);
  const [activeRequestId, setActiveRequestId] = useState(null);
  const [isRequester, setIsRequester] = useState(false);
  const [activeRequesterName, setActiveRequesterName] = useState('');
  const [existingRequests, setExistingRequests] = useState([]);
  const [instantMatches, setInstantMatches] = useState([]);
  const [searchSecondsLeft, setSearchSecondsLeft] = useState(INSTANT_SEARCH_SECONDS);
  const [instantError, setInstantError] = useState('');
  const [incomingRequest, setIncomingRequest] = useState(null);
  const [dismissedRequestIds, setDismissedRequestIds] = useState([]);
  const [chatRoomId, setChatRoomId] = useState(null);
  const [chatJoinedAt, setChatJoinedAt] = useState(null);
  const [chatRequesterName, setChatRequesterName] = useState('');
  const [chatPlayers, setChatPlayers] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');

  const [editingProfile, setEditingProfile] = useState(false);
  const [profilePic, setProfilePic] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [squadrId, setSquadrId] = useState('');
  const [friendsTab, setFriendsTab] = useState('friends');
  const [friendRequests, setFriendRequests] = useState([]);
  const [invitedFriends, setInvitedFriends] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [addFriendQuery, setAddFriendQuery] = useState('');
  const [addFriendResult, setAddFriendResult] = useState(null);
  const [addFriendSearched, setAddFriendSearched] = useState(false);
  const [addFriendStatus, setAddFriendStatus] = useState('');

  const [toast, setToast] = useState(null);
  const [joinedSessionIds, setJoinedSessionIds] = useState([]);
  const [joiningSessionId, setJoiningSessionId] = useState(null);
  const [myParticipationIds, setMyParticipationIds] = useState([]);
  const [myRatedIds, setMyRatedIds] = useState([]);

  // TODO: re-enable Pro gating — use: const [isPro, setIsPro] = useState(false);
  const [, setIsPro] = useState(false);
  const isPro = true;
  const [proPlan, setProPlan] = useState('yearly');

  const [availability, setAvailability] = useState({});
  const [skillLevels, setSkillLevels] = useState({});

  const inputRefs = useRef([]);
  const fileInputRef = useRef(null);
  const otpCooldownRef = useRef(null);
  const emailCooldownRef = useRef(null);
  const closedRequestRef = useRef(false);
  const postSplashRouteRef = useRef('landing');
  const stepRef = useRef(step);
  const deferredPromptRef = useRef(null);

  const [canAndroidInstall, setCanAndroidInstall] = useState(false);
  const [showAndroidInstallBanner, setShowAndroidInstallBanner] = useState(false);
  const [showIosInstallBanner, setShowIosInstallBanner] = useState(false);
  const [pwaBannerVisible, setPwaBannerVisible] = useState(false);

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  const startCooldown = useCallback((setter, ref, seconds = 60) => {
    if (ref.current) {
      clearInterval(ref.current);
    }
    setter(seconds);
    ref.current = setInterval(() => {
      setter((prev) => {
        if (prev <= 1) {
          clearInterval(ref.current);
          ref.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    const otpRef = otpCooldownRef.current;
    const emailRef = emailCooldownRef.current;

    return () => {
      if (otpRef) clearInterval(otpRef);
      if (emailRef) clearInterval(emailRef);
    };
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      deferredPromptRef.current = event;
      setCanAndroidInstall(true);
    };

    const handleAppInstalled = () => {
      localStorage.setItem(PWA_INSTALLED_KEY, 'true');
      deferredPromptRef.current = null;
      setCanAndroidInstall(false);
      setShowAndroidInstallBanner(false);
      setPwaBannerVisible(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (step !== 'home') {
      setPwaBannerVisible(false);
      return undefined;
    }

    if (isStandalonePwa()) return undefined;
    if (localStorage.getItem(PWA_INSTALLED_KEY) === 'true') return undefined;

    const androidEligible =
      canAndroidInstall &&
      localStorage.getItem(PWA_ANDROID_DISMISSED_KEY) !== 'true';
    const iosEligible =
      !androidEligible &&
      isIosSafari() &&
      localStorage.getItem(PWA_IOS_DISMISSED_KEY) !== 'true';

    if (!androidEligible && !iosEligible) {
      setShowAndroidInstallBanner(false);
      setShowIosInstallBanner(false);
      return undefined;
    }

    setShowAndroidInstallBanner(androidEligible);
    setShowIosInstallBanner(iosEligible);

    const timer = window.setTimeout(() => setPwaBannerVisible(true), 2000);
    return () => {
      window.clearTimeout(timer);
      setPwaBannerVisible(false);
    };
  }, [step, canAndroidInstall]);

  useEffect(() => {
    const storedPic = loadStoredProfilePic();
    if (storedPic) setProfilePic(storedPic);

    const stored = loadStoredProfile();
    if (!stored) return;

    if (stored.first_name) setFirstName(stored.first_name);
    if (stored.age != null) setAge(String(stored.age));
    if (stored.city) setCity(stored.city);
    if (Array.isArray(stored.sports)) setSelectedSports(stored.sports);
    if (stored.squadr_id) setSquadrId(stored.squadr_id);
    if (stored.isPro) setIsPro(true);
    if (stored.availability) setAvailability(normalizeAvailability(stored.availability));
    if (stored.skillLevels) setSkillLevels(normalizeSkillLevels(stored.skillLevels));
  }, []);

  const hydrateProfileFromStorage = useCallback((stored) => {
    if (stored.first_name) setFirstName(stored.first_name);
    if (stored.age != null) setAge(String(stored.age));
    if (stored.city) setCity(stored.city);
    if (Array.isArray(stored.sports)) setSelectedSports(stored.sports);
    if (stored.squadr_id) setSquadrId(stored.squadr_id);
    if (stored.isPro) setIsPro(true);
    if (stored.availability) {
      setAvailability(normalizeAvailability(stored.availability));
    }
    if (stored.skillLevels) {
      setSkillLevels(normalizeSkillLevels(stored.skillLevels));
    }
  }, []);

  const getPostAuthStep = useCallback(() => {
    const stored = loadStoredProfile();
    if (stored?.first_name) {
      hydrateProfileFromStorage(stored);
      return 'home';
    }
    return 'onboarding';
  }, [hydrateProfileFromStorage]);

  const applyPostSplashRoute = useCallback(() => {
    setStep(postSplashRouteRef.current);
  }, []);

  const handleGetStarted = useCallback(() => {
    setStep('login');
  }, []);

  const routeAfterAuth = useCallback(() => {
    const nextStep = getPostAuthStep();
    if (stepRef.current === 'splash') {
      postSplashRouteRef.current = nextStep;
      return;
    }
    setStep(nextStep);
  }, [getPostAuthStep]);

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      try {
        const { data } = (await supabase.auth.getSession()) ?? {};
        if (!active) return;

        if (data?.session) {
          postSplashRouteRef.current = getPostAuthStep();
        } else {
          postSplashRouteRef.current = 'landing';
        }

        if (stepRef.current !== 'splash') {
          applyPostSplashRoute();
        }
      } catch {
        postSplashRouteRef.current = 'landing';
        if (stepRef.current !== 'splash') {
          setStep(postSplashRouteRef.current);
        }
      }
    };

    restoreSession();
    return () => {
      active = false;
    };
  }, [getPostAuthStep, applyPostSplashRoute]);

  useEffect(() => {
    if (step !== 'splash') return undefined;

    if (SPLASH_MS === 0) {
      applyPostSplashRoute();
      return undefined;
    }

    const exitTimer = setTimeout(
      () => setSplashExiting(true),
      Math.max(SPLASH_MS - 300, 0)
    );
    const doneTimer = setTimeout(() => applyPostSplashRoute(), SPLASH_MS);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [step, applyPostSplashRoute]);

  useEffect(() => {
    const { data } =
      supabase.auth.onAuthStateChange((event, session) => {
        // Phone OTP is handled by its own verify flow; route here for the
        // Google OAuth redirect callback and email magic-link sign-ins.
        if (
          event === 'SIGNED_IN' &&
          session &&
          session.user?.app_metadata?.provider !== 'phone'
        ) {
          routeAfterAuth();
        }
      }) ?? {};

    return () => {
      data?.subscription?.unsubscribe?.();
    };
  }, [routeAfterAuth]);

  const fetchSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/sessions?select=*&order=scheduled_at.asc`,
        {
          headers: {
            apikey: supabaseAnonKey,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      console.log('Sessions fetch response:', {
        status: response.status,
        ok: response.ok,
        data,
      });

      if (!response.ok) {
        setSessions([]);
      } else {
        setSessions((Array.isArray(data) ? data : []).map(mapSessionFromDb));
      }
    } catch (err) {
      console.log('Sessions fetch error:', err);
      setSessions([]);
    }

    setSessionsLoading(false);
  }, []);

  useEffect(() => {
    if (step === 'profile') {
      setActiveTab('profile');
      setStep('home');
    }
  }, [step]);

  useEffect(() => {
    if (step === 'home') {
      fetchSessions();
    }
  }, [step, fetchSessions]);

  useEffect(() => {
    if (step !== 'home' || !squadrId) return undefined;

    let active = true;
    const loadInvites = async () => {
      try {
        const invites = await fetchPendingInvites(squadrId);
        if (active) setPendingInvites(invites);
      } catch {
        // ignore — invites simply won't show
      }
    };

    loadInvites();
    return () => {
      active = false;
    };
  }, [step, squadrId]);

  useEffect(() => {
    if (step !== 'home' || !firstName) return undefined;

    let active = true;
    const loadHistory = async () => {
      try {
        const [participations, ratings] = await Promise.all([
          fetchMyParticipations(firstName),
          fetchMyRatings(firstName),
        ]);
        if (!active) return;

        setMyParticipationIds(
          participations.map((row) => row.session_id).filter(Boolean)
        );
        setMyRatedIds(ratings.map((row) => row.session_id).filter(Boolean));
      } catch {
        // ignore — rating prompts simply won't show
      }
    };

    loadHistory();
    return () => {
      active = false;
    };
  }, [step, firstName]);

  useEffect(() => {
    if (step !== 'home' || activeTab !== 'instant' || !isPro) return undefined;

    let active = true;
    const loadFindPlayers = async () => {
      setFindPlayersLoading(true);
      try {
        const players = await fetchDiscoverablePlayers({
          excludeSquadrId: squadrId || undefined,
        });
        if (active) setFindPlayers(players);
      } catch {
        if (active) setFindPlayers([]);
      } finally {
        if (active) setFindPlayersLoading(false);
      }
    };

    loadFindPlayers();
    return () => {
      active = false;
    };
  }, [step, activeTab, isPro, squadrId]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phone.trim()) return;

    setLoginError('');
    const formattedPhone = formatPhone(phone);
    const { error } =
      (await supabase.auth.signInWithOtp({ phone: formattedPhone })) ?? {};

    if (error) {
      setLoginError(error.message);
    } else {
      startCooldown(setOtpCooldown, otpCooldownRef);
      setStep('otp');
    }
  };

  const handleContinueWithEmail = () => {
    setLoginError('');
    setEmailSent(false);
    setShowEmailLogin(true);
  };

  const handleSendMagicLink = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoginError('');
    setEmailSent(false);
    const { error } =
      (await supabase.auth.signInWithOtp({ email: email.trim() })) ?? {};

    if (error) {
      setLoginError(error.message);
    } else {
      setEmailSent(true);
      startCooldown(setEmailCooldown, emailCooldownRef);
    }
  };

  const handleGoogleLogin = async () => {
    setLoginError('');
    const { error } =
      (await supabase.auth.signInWithOAuth({ provider: 'google' })) ?? {};

    if (error) {
      setLoginError(error.message);
    }
  };

  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasted[i] || '';
    }
    setOtp(newOtp);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setOtpError('');

    const formattedPhone = formatPhone(phone);
    const { error } =
      (await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp.join(''),
        type: 'sms',
      })) ?? {};

    if (error) {
      setOtpError(error.message);
    }

    setStep('onboarding');
  };

  const handleOnboardingContinue = (e) => {
    e.preventDefault();
    if (!firstName.trim() || !age.trim() || !city) {
      setOnboardingError('Please fill in your first name, age, and city.');
      return;
    }
    setOnboardingError('');
    setStep('sports');
  };

  const handleAgeChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      setAge('');
      return;
    }
    setAge(String(Math.min(99, parseInt(raw, 10))));
  };

  const toggleSport = (name) => {
    setSelectedSports((prev) => {
      if (prev.includes(name)) {
        setSkillLevels((levels) => {
          const next = { ...levels };
          delete next[name];
          return next;
        });
        return prev.filter((sport) => sport !== name);
      }

      setSkillLevels((levels) => ({
        ...levels,
        [name]: levels[name] || 'Beginner',
      }));
      return [...prev, name];
    });
  };

  const toggleAvailabilitySlot = (day, slotId) => {
    setAvailability((prev) => {
      const daySlots = prev[day] || [];
      const nextSlots = daySlots.includes(slotId)
        ? daySlots.filter((item) => item !== slotId)
        : [...daySlots, slotId];

      const next = { ...prev };
      if (nextSlots.length > 0) {
        next[day] = nextSlots;
      } else {
        delete next[day];
      }
      return next;
    });
  };

  const setSkillLevel = (sport, level) => {
    setSkillLevels((prev) => ({ ...prev, [sport]: level }));
  };

  const addCustomSport = () => {
    const trimmed = customSport.trim();
    if (!trimmed) return;

    const existing = sports.find(
      (sport) => sport.toLowerCase() === trimmed.toLowerCase()
    );
    const sportName = existing || trimmed;

    if (!existing) {
      setSports((prev) => [...prev, sportName]);
    }

    setSelectedSports((prev) =>
      prev.includes(sportName) ? prev : [...prev, sportName]
    );
    setCustomSport('');
  };

  const handleCustomSportKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomSport();
    }
  };

  const handleSportsContinue = () => {
    const newSquadrId = squadrId || generateSquadrId();
    if (!squadrId) setSquadrId(newSquadrId);

    const profileData = {
      first_name: firstName,
      age: parseInt(age, 10),
      city,
      sports: selectedSports,
      squadr_id: newSquadrId,
      isPro: false,
      availability: {},
      skillLevels: {},
    };

    saveStoredProfile(profileData);

    upsertUser({
      name: firstName,
      squadrId: newSquadrId,
      city,
      sports: selectedSports,
    }).catch(() => {
      // ignore — profile still saved locally
    });

    setStep('home');
  };

  const handleOpenCreateSession = () => {
    setInvitedFriends([]);
    setStep('createSession');
  };

  const handleBackToHome = () => {
    setEditingProfile(false);
    setStep('home');
  };

  const handleEditProfile = () => {
    setEditingProfile(true);
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = typeof reader.result === 'string' ? reader.result : '';
      if (!base64) return;
      setProfilePic(base64);
      try {
        localStorage.setItem(PROFILE_PIC_STORAGE_KEY, base64);
      } catch {
        // ignore storage quota errors
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e) => {
    if (e) e.preventDefault();

    const ensuredSquadrId = squadrId || generateSquadrId();
    if (!squadrId) setSquadrId(ensuredSquadrId);

    saveStoredProfile({
      first_name: firstName,
      age: age === '' ? null : parseInt(age, 10),
      city,
      sports: selectedSports,
      squadr_id: ensuredSquadrId,
      isPro,
      availability,
      skillLevels,
    });

    upsertUser({
      name: firstName,
      squadrId: ensuredSquadrId,
      city,
      sports: selectedSports,
    }).catch(() => {
      // ignore — profile still saved locally
    });

    setEditingProfile(false);
  };

  const loadFriendRequests = useCallback(async () => {
    if (!squadrId) return;
    try {
      const rows = await fetchFriendRequests(squadrId);
      setFriendRequests(rows);
    } catch {
      // ignore — friends simply won't load
    }
  }, [squadrId]);

  useEffect(() => {
    if (
      (step === 'home' &&
        (activeTab === 'friends' || activeTab === 'profile')) ||
      step === 'createSession'
    ) {
      if (squadrId) loadFriendRequests();
    }
  }, [step, activeTab, squadrId, loadFriendRequests]);

  const handleCopySquadrId = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(squadrId);
      }
      showToast('Copied!');
    } catch {
      showToast('Could not copy', 'error');
    }
  };

  const handleOpenAddFriend = () => {
    setShowAddFriend(true);
    setAddFriendQuery('');
    setAddFriendResult(null);
    setAddFriendSearched(false);
    setAddFriendStatus('');
  };

  const handleCloseAddFriend = () => {
    setShowAddFriend(false);
    setAddFriendQuery('');
    setAddFriendResult(null);
    setAddFriendSearched(false);
    setAddFriendStatus('');
  };

  const handleSearchFriend = async (e) => {
    if (e) e.preventDefault();
    const query = addFriendQuery.trim();
    if (!query) return;

    setAddFriendStatus('');
    setAddFriendSearched(false);
    try {
      const user = await findUserBySquadrId(query);
      setAddFriendResult(user);
    } catch {
      setAddFriendResult(null);
    } finally {
      setAddFriendSearched(true);
    }
  };

  const handleSendFriendRequest = async () => {
    if (!addFriendResult) return;

    try {
      await sendFriendRequest({
        senderSquadrId: squadrId,
        senderName: firstName,
        receiverSquadrId: addFriendResult.squadr_id,
        receiverName: addFriendResult.name,
      });
      showToast('Request sent!');
      handleCloseAddFriend();
      loadFriendRequests();
    } catch {
      setAddFriendStatus('Could not send request. Try again.');
    }
  };

  const handleAcceptFriend = async (request) => {
    setFriendRequests((prev) =>
      prev.map((item) =>
        item.id === request.id ? { ...item, status: 'accepted' } : item
      )
    );
    try {
      await updateFriendRequestStatus(request.id, 'accepted');
    } catch {
      loadFriendRequests();
    }
  };

  const handleDeclineFriend = async (request) => {
    setFriendRequests((prev) =>
      prev.filter((item) => item.id !== request.id)
    );
    try {
      await updateFriendRequestStatus(request.id, 'declined');
    } catch {
      loadFriendRequests();
    }
  };

  const resetAppState = () => {
    setPhone('');
    setEmail('');
    setShowEmailLogin(false);
    setEmailSent(false);
    setOtp(EMPTY_OTP);
    setFirstName('');
    setAge('');
    setCity('');
    setSports(DEFAULT_SPORTS);
    setSelectedSports([]);
    setCustomSport('');
    setProfilePic(null);
    setEditingProfile(false);
    setShowDeleteConfirm(false);
    setActiveTab('home');
    setSessions([]);
    setSelectedSessionId(null);
    setLoginError('');
    setOtpError('');
    setIncomingRequest(null);
    setDismissedRequestIds([]);
    setJoinedSessionIds([]);
    setMyParticipationIds([]);
    setMyRatedIds([]);
    setToast(null);
    setSquadrId('');
    setFriendsTab('friends');
    setFriendRequests([]);
    setInvitedFriends([]);
    setPendingInvites([]);
    setShowAddFriend(false);
    setAddFriendQuery('');
    setAddFriendResult(null);
    setAddFriendSearched(false);
    setAddFriendStatus('');
    resetInstantFlow();
    setIsPro(false);
    setProPlan('yearly');
    setAvailability({});
    setSkillLevels({});
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore — still clear local state
    }

    try {
      localStorage.removeItem(PROFILE_STORAGE_KEY);
      localStorage.removeItem(PROFILE_PIC_STORAGE_KEY);
    } catch {
      // ignore
    }

    resetAppState();
    setStep('login');
  };

  const handleDeleteAccount = async () => {
    const playerName = firstName;
    setShowDeleteConfirm(false);

    try {
      await deleteUserData(playerName);
    } catch {
      // ignore — still clear local state
    }

    try {
      localStorage.removeItem(PROFILE_STORAGE_KEY);
      localStorage.removeItem(PROFILE_PIC_STORAGE_KEY);
    } catch {
      // ignore
    }

    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }

    resetAppState();
    setStep('login');
  };

  const handleJoinSession = async (session) => {
    if (
      !session ||
      session.slotsLeft <= 0 ||
      joinedSessionIds.includes(session.id) ||
      joiningSessionId === session.id
    ) {
      return;
    }

    setJoiningSessionId(session.id);
    try {
      await joinSession({
        sessionId: session.id,
        playerName: firstName,
        slotsRemaining: session.slotsLeft,
      });

      setJoinedSessionIds((prev) => [...prev, session.id]);
      setMyParticipationIds((prev) =>
        prev.includes(session.id) ? prev : [...prev, session.id]
      );
      setSessions((prev) =>
        prev.map((item) =>
          item.id === session.id
            ? { ...item, slotsLeft: Math.max(0, item.slotsLeft - 1) }
            : item
        )
      );
      showToast("You've joined!");
    } catch {
      showToast('Could not join. Please try again.', 'error');
    } finally {
      setJoiningSessionId(null);
    }
  };

  const handleRateSession = async (sessionId, rating) => {
    setMyRatedIds((prev) =>
      prev.includes(sessionId) ? prev : [...prev, sessionId]
    );
    try {
      await submitRating({ sessionId, raterName: firstName, rating });
    } catch {
      // ignore — optimistically dismissed
    }
  };

  const handleOpenSession = (sessionId) => {
    setSelectedSessionId(sessionId);
    setStep('sessionDetail');
  };

  const handleBackFromSession = () => {
    setSelectedSessionId(null);
    setStep('home');
  };

  const selectedSession = sessions.find(
    (session) => session.id === selectedSessionId
  );

  const selectCreateSport = (name) => {
    setCreateSessionSport(name);
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    setCreateSessionError('');

    const scheduledAt = datetimeLocalToISO(sessionDateTime);
    if (!scheduledAt) {
      setCreateSessionError('Please select a date and time.');
      return;
    }

    const isOneOnOne = createSessionType === '1-on-1';
    const parsedMaxPlayers = isOneOnOne ? 2 : parseInt(maxPlayers, 10);
    const slotsRemaining = isOneOnOne ? 1 : parsedMaxPlayers;

    const insertQuery = supabase.from('sessions').insert({
      sport: createSessionSport,
      session_type: createSessionType,
      scheduled_at: scheduledAt,
      venue,
      max_players: parsedMaxPlayers,
      slots_remaining: slotsRemaining,
      city,
    });

    const { data, error } =
      (await (insertQuery && typeof insertQuery.select === 'function'
        ? insertQuery.select()
        : insertQuery)) ?? {};

    if (error) {
      setCreateSessionError(error.message);
    } else {
      const newSessionId = Array.isArray(data) ? data[0]?.id : data?.id;
      if (newSessionId && invitedFriends.length > 0) {
        try {
          await createSessionInvites(newSessionId, invitedFriends);
        } catch {
          // ignore — session still created
        }
      }

      setCreateSessionSport('');
      setCreateSessionType('');
      setSessionDateTime('');
      setVenue('');
      setMaxPlayers('');
      setInvitedFriends([]);
    }

    setStep('home');
  };

  const toggleInviteFriend = (friend) => {
    setInvitedFriends((prev) =>
      prev.some((item) => item.squadrId === friend.squadrId)
        ? prev.filter((item) => item.squadrId !== friend.squadrId)
        : [...prev, friend]
    );
  };

  const handleAcceptInvite = async (invite) => {
    const session = sessions.find((item) => item.id === invite.session_id);
    setPendingInvites((prev) => prev.filter((item) => item.id !== invite.id));

    try {
      await updateInviteStatus(invite.id, 'accepted');
      if (session) {
        await joinSession({
          sessionId: session.id,
          playerName: firstName,
          slotsRemaining: session.slotsLeft,
        });
        setJoinedSessionIds((prev) =>
          prev.includes(session.id) ? prev : [...prev, session.id]
        );
        setSessions((prev) =>
          prev.map((item) =>
            item.id === session.id
              ? { ...item, slotsLeft: Math.max(0, item.slotsLeft - 1) }
              : item
          )
        );
      }
      showToast("You've joined!");
    } catch {
      showToast('Could not accept invite. Please try again.', 'error');
    }
  };

  const handleDeclineInvite = async (invite) => {
    setPendingInvites((prev) => prev.filter((item) => item.id !== invite.id));
    try {
      await updateInviteStatus(invite.id, 'declined');
    } catch {
      // ignore — already removed from view
    }
  };

  const showMaxPlayers =
    createSessionType === 'Small Group' || createSessionType === 'Large Group';

  const isOneOnOneUnlocked =
    isPro || groupSessionsPlayed >= GROUP_SESSIONS_TO_UNLOCK_ONE_ON_ONE;

  const handleFindSessionTypeFilter = (type) => {
    if (type === '1-on-1' && !isOneOnOneUnlocked) {
      return;
    }
    setFindSessionTypeFilter((prev) => (prev === type ? '' : type));
  };

  const handleResend = () => {
    setOtp(EMPTY_OTP);
    inputRefs.current[0]?.focus();
  };

  const resetInstantFlow = useCallback(() => {
    setInstantSport('');
    setInstantPlayersNeeded(null);
    setInstantLocationPref('');
    setInstantLocationMode(null);
    setInstantLocationLabel('');
    setUserLat(null);
    setUserLng(null);
    setRadiusKm(10);
    setInstantLocationLoading(false);
    setInstantLocationError('');
    setActiveRequestId(null);
    setIsRequester(false);
    setActiveRequesterName('');
    setExistingRequests([]);
    setInstantMatches([]);
    setSearchSecondsLeft(INSTANT_SEARCH_SECONDS);
    setInstantError('');
    closedRequestRef.current = false;
  }, []);

  const enterGroupChat = useCallback(({ roomId, requesterName }) => {
    setChatRoomId(roomId);
    setChatJoinedAt(new Date().toISOString());
    setChatRequesterName(requesterName);
    setChatPlayers(requesterName ? [requesterName] : []);
    setChatMessages([]);
    setChatInput('');
    setStep('groupChat');
  }, []);

  const handleOpenInstantFind = () => {
    if (!isPro) {
      setStep('pro');
      return;
    }
    resetInstantFlow();
    setStep('instantLocation');
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setInstantLocationError('Geolocation is not supported on this device.');
      return;
    }

    setInstantLocationMode('current');
    setInstantLocationLoading(true);
    setInstantLocationError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        try {
          const areaName = await reverseGeocode(lat, lng);
          setUserLat(lat);
          setUserLng(lng);
          setInstantLocationLabel(areaName);
          setInstantLocationPref(areaName);
        } catch {
          setUserLat(lat);
          setUserLng(lng);
          setInstantLocationLabel('Nearby area');
          setInstantLocationPref('Nearby area');
        } finally {
          setInstantLocationLoading(false);
        }
      },
      () => {
        setInstantLocationLoading(false);
        setInstantLocationError('Could not get your location. Try setting it manually.');
        setInstantLocationMode(null);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const handleSelectManualLocation = () => {
    setInstantLocationMode('manual');
    setInstantLocationError('');
    setInstantLocationLabel('');
    setInstantLocationPref('');
    setUserLat(null);
    setUserLng(null);
  };

  const handleManualVenueChange = (val) => {
    setInstantLocationPref(val);
    setInstantLocationLabel(val);
    if (!val.trim()) {
      setUserLat(null);
      setUserLng(null);
    }
  };

  const handleManualCoordsChange = (coords) => {
    if (!coords) {
      setUserLat(null);
      setUserLng(null);
      return;
    }

    setUserLat(coords.lat);
    setUserLng(coords.lng);
  };

  const handleInstantLocationContinue = () => {
    if (userLat == null || userLng == null) return;
    setStep('instantSport');
  };

  const handleOpenPro = () => {
    setProPlan('yearly');
    setStep('pro');
  };

  const handleActivatePro = () => {
    setIsPro(true);

    const stored = loadStoredProfile() || {};
    saveStoredProfile({
      ...stored,
      first_name: firstName,
      age: age === '' ? null : parseInt(age, 10),
      city,
      sports: selectedSports,
      squadr_id: squadrId || stored.squadr_id,
      isPro: true,
      availability,
      skillLevels,
    });

    showToast('Pro Activated!');
    setStep('home');
  };

  const handleProMaybeLater = () => {
    setStep('home');
  };

  const handleInstantSelectSport = (sport) => {
    setInstantSport(sport);
    setStep('instantRadius');
  };

  const handleInstantRadiusContinue = () => {
    setStep('instantCount');
  };

  const handleInstantSelectCount = (count) => {
    setInstantPlayersNeeded(count);
    setStep('instantBroadcast');
  };

  const handleOpenToPlayToggle = () => {
    const next = !openToPlay;

    if (!next) {
      setOpenToPlay(false);
      return;
    }

    if (!navigator.geolocation) {
      showToast('Geolocation is not supported on this device.', 'error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setOpenToPlayLat(lat);
        setOpenToPlayLng(lng);
        setOpenToPlay(true);

        if (squadrId) {
          try {
            await updateUserLocation({ squadrId, lat, lng });
          } catch {
            // ignore — polling still uses local coords
          }
        }
      },
      () => {
        showToast('Could not get your location for Open to Play.', 'error');
        setOpenToPlay(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const proceedBroadcast = useCallback(async () => {
    setInstantError('');

    try {
      const request = await createInstantRequest({
        sport: instantSport,
        playersNeeded: instantPlayersNeeded,
        locationPref: instantLocationLabel || instantLocationPref,
        requesterName: firstName,
        lat: userLat,
        lng: userLng,
        radiusKm,
      });

      if (!request?.id) {
        setInstantError('Could not start search. Please try again.');
        return;
      }

      closedRequestRef.current = false;
      setActiveRequestId(request.id);
      setIsRequester(true);
      setActiveRequesterName(firstName);
      setExistingRequests([]);
      setInstantMatches([]);
      setSearchSecondsLeft(INSTANT_SEARCH_SECONDS);
      setStep('instantSearching');
    } catch {
      setInstantError('Could not start search. Please try again.');
    }
  }, [
    instantSport,
    instantPlayersNeeded,
    instantLocationPref,
    instantLocationLabel,
    userLat,
    userLng,
    radiusKm,
    firstName,
  ]);

  const handleBroadcastRequest = async (e) => {
    e.preventDefault();
    setInstantError('');

    // Before broadcasting, look for an existing open request for the same
    // sport so two searchers get matched instead of both waiting.
    try {
      const requests = await fetchOpenRequests();
      const matchingOpen = requests.filter((request) =>
        isRequestJoinable(request, {
          sport: instantSport,
          excludeName: firstName,
        })
      );

      if (matchingOpen.length > 0) {
        setExistingRequests(matchingOpen);
        setStep('instantExisting');
        return;
      }
    } catch {
      // ignore lookup errors and fall through to broadcasting a new request
    }

    await proceedBroadcast();
  };

  const joinRequest = useCallback(
    async (request) => {
      if (!request?.id) return;

      setActiveRequestId(request.id);
      setIsRequester(false);
      setActiveRequesterName(request.requester_name);
      setInstantSport(request.sport);
      setInstantLocationPref(request.location_pref || '');
      setInstantPlayersNeeded(request.players_needed);
      setExistingRequests([]);
      setInstantMatches([]);
      setSearchSecondsLeft(secondsUntil(request.expires_at));

      try {
        await acceptRequest({ requestId: request.id, playerName: firstName });
      } catch {
        // ignore — chat poll will reconcile the roster
      }

      // Acceptors join the (already open) chat room immediately.
      enterGroupChat({
        roomId: request.id,
        requesterName: request.requester_name,
      });
    },
    [firstName, enterGroupChat]
  );

  const handleJoinExisting = (request) => {
    joinRequest(request);
  };

  const handleCancelSearch = useCallback(async () => {
    // Only the original requester cancels the underlying request; an accepter
    // simply leaves their own waiting screen.
    if (isRequester && activeRequestId) {
      try {
        await updateRequestStatus(activeRequestId, 'cancelled');
      } catch {
        // ignore — still return home
      }
    }
    resetInstantFlow();
    setStep('home');
  }, [isRequester, activeRequestId, resetInstantFlow]);

  const handleAcceptIncoming = async () => {
    if (!incomingRequest) return;

    const request = incomingRequest;
    setIncomingRequest(null);
    setDismissedRequestIds((prev) => [...prev, request.id]);

    // Join and wait — the chat only opens once the group is full.
    await joinRequest(request);
  };

  const handleDeclineIncoming = () => {
    if (incomingRequest) {
      setDismissedRequestIds((prev) => [...prev, incomingRequest.id]);
    }
    setIncomingRequest(null);
  };

  const handleSendChat = async (e) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text || !chatRoomId) return;

    setChatInput('');
    try {
      await sendMessage({ roomId: chatRoomId, senderName: firstName, text });
      const msgs = await fetchMessages(chatRoomId, chatJoinedAt);
      setChatMessages(msgs);
    } catch {
      // ignore — next poll will reconcile
    }
  };

  const handleLeaveChat = () => {
    setChatRoomId(null);
    setChatJoinedAt(null);
    setChatRequesterName('');
    setChatPlayers([]);
    setChatMessages([]);
    setChatInput('');
    resetInstantFlow();
    setStep('home');
  };

  useEffect(() => {
    if (!openToPlay || !isPro || step !== 'home') return undefined;

    let active = true;
    const poll = async () => {
      try {
        const requests = await fetchOpenRequests();
        if (!active) return;

        const match = requests.find((request) => {
          if (request.requester_name === firstName) return false;
          if (request.sport && !selectedSports.includes(request.sport)) return false;
          if (request.id === activeRequestId) return false;
          if (dismissedRequestIds.includes(request.id)) return false;
          if (
            request.lat == null ||
            request.lng == null ||
            openToPlayLat == null ||
            openToPlayLng == null
          ) {
            return false;
          }

          const distance = haversineDistance(
            openToPlayLat,
            openToPlayLng,
            request.lat,
            request.lng
          );
          const maxRadius = request.radius_km ?? 10;
          return distance <= maxRadius;
        });

        if (match) {
          const distanceKm = haversineDistance(
            openToPlayLat,
            openToPlayLng,
            match.lat,
            match.lng
          );
          setIncomingRequest((prev) =>
            prev ?? { ...match, distanceKm }
          );
        }
      } catch {
        // ignore polling errors
      }
    };

    poll();
    const interval = setInterval(poll, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [
    openToPlay,
    openToPlayLat,
    openToPlayLng,
    isPro,
    step,
    firstName,
    selectedSports,
    activeRequestId,
    dismissedRequestIds,
  ]);

  useEffect(() => {
    if (step !== 'instantSearching' || !activeRequestId) return undefined;

    let active = true;
    const poll = async () => {
      try {
        const matches = await fetchMatches(activeRequestId);
        if (!active) return;

        setInstantMatches(matches);

        // Open the chat as soon as the FIRST player accepts. The request
        // stays open ('searching') so later players can still join the room.
        if (matches.length >= 1) {
          enterGroupChat({
            roomId: activeRequestId,
            requesterName: activeRequesterName || firstName,
          });
        }
      } catch {
        // ignore polling errors
      }
    };

    poll();
    const interval = setInterval(poll, 3000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [step, activeRequestId, activeRequesterName, firstName, enterGroupChat]);

  useEffect(() => {
    if (step !== 'instantSearching') return undefined;

    const interval = setInterval(() => {
      setSearchSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  useEffect(() => {
    if (step === 'instantSearching' && searchSecondsLeft === 0) {
      handleCancelSearch();
    }
  }, [step, searchSecondsLeft, handleCancelSearch]);

  useEffect(() => {
    if (step !== 'groupChat' || !chatRoomId) return undefined;

    let active = true;
    const poll = async () => {
      try {
        const [msgs, matches] = await Promise.all([
          fetchMessages(chatRoomId, chatJoinedAt),
          fetchMatches(chatRoomId),
        ]);
        if (!active) return;

        setChatMessages(msgs);
        setInstantMatches(matches);
        setChatPlayers((prev) => {
          const names = [
            chatRequesterName,
            ...matches.map((entry) => entry.player_name),
          ].filter(Boolean);
          const unique = [...new Set(names)];
          return unique.length ? unique : prev;
        });

        // The requester closes the request once the group is full so no extra
        // players can join beyond the requested size.
        if (
          isRequester &&
          instantPlayersNeeded &&
          matches.length >= instantPlayersNeeded &&
          !closedRequestRef.current
        ) {
          closedRequestRef.current = true;
          try {
            await updateRequestStatus(chatRoomId, 'matched');
          } catch {
            // ignore — capacity is best-effort
          }
        }
      } catch {
        // ignore polling errors
      }
    };

    poll();
    const interval = setInterval(poll, 3000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [
    step,
    chatRoomId,
    chatJoinedAt,
    chatRequesterName,
    isRequester,
    instantPlayersNeeded,
  ]);

  const instantSportOptions =
    selectedSports.length > 0 ? selectedSports : DEFAULT_SPORTS;

  const toastNode = toast ? (
    <Toast
      message={toast.message}
      type={toast.type}
      onDismiss={() => setToast(null)}
    />
  ) : null;

  const hidePwaInstallBanner = useCallback(() => {
    setPwaBannerVisible(false);
    setShowAndroidInstallBanner(false);
    setShowIosInstallBanner(false);
  }, []);

  const handleDismissAndroidInstall = useCallback(() => {
    localStorage.setItem(PWA_ANDROID_DISMISSED_KEY, 'true');
    hidePwaInstallBanner();
  }, [hidePwaInstallBanner]);

  const handleDismissIosInstall = useCallback(() => {
    localStorage.setItem(PWA_IOS_DISMISSED_KEY, 'true');
    hidePwaInstallBanner();
  }, [hidePwaInstallBanner]);

  const handleAndroidInstall = useCallback(async () => {
    const prompt = deferredPromptRef.current;
    if (!prompt) return;

    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === 'accepted') {
        localStorage.setItem(PWA_INSTALLED_KEY, 'true');
      }
    } catch {
      // ignore — user may have cancelled
    } finally {
      deferredPromptRef.current = null;
      setCanAndroidInstall(false);
      hidePwaInstallBanner();
    }
  }, [hidePwaInstallBanner]);

  const renderPwaInstallBanner = () => {
    if (!pwaBannerVisible) return null;

    if (showAndroidInstallBanner) {
      return (
        <div
          className="pwa-install pwa-install--android pwa-install--visible"
          role="dialog"
          aria-label="Install SQUADR app"
        >
          <button
            type="button"
            className="pwa-install__dismiss"
            onClick={handleDismissAndroidInstall}
            aria-label="Dismiss install prompt"
          >
            ×
          </button>
          <p className="pwa-install__text">
            Add SQUADR to your Home Screen for the best experience
          </p>
          <button
            type="button"
            className="pwa-install__action"
            onClick={handleAndroidInstall}
          >
            Install App
          </button>
        </div>
      );
    }

    if (showIosInstallBanner) {
      return (
        <div
          className="pwa-install pwa-install--ios pwa-install--visible"
          role="dialog"
          aria-label="Install SQUADR on your home screen"
        >
          <button
            type="button"
            className="pwa-install__dismiss"
            onClick={handleDismissIosInstall}
            aria-label="Dismiss install prompt"
          >
            ×
          </button>
          <div className="pwa-install__ios-header">
            <img
              src={`${process.env.PUBLIC_URL}/logo192.png`}
              alt=""
              className="pwa-install__icon"
              width={40}
              height={40}
            />
            <span className="pwa-install__ios-title">Install SQUADR</span>
          </div>
          <ol className="pwa-install__ios-steps">
            <li>
              Tap the <span className="pwa-install__ios-em">···</span> (three dots) in the
              bottom right of Safari
            </li>
            <li>Tap Share</li>
            <li>Tap View More</li>
            <li>Tap Add to Home Screen</li>
          </ol>
          <svg
            className="pwa-install__arrow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 5v14" />
            <path d="m19 12-7 7-7-7" />
          </svg>
        </div>
      );
    }

    return null;
  };

  const renderBottomNav = () => (
    <nav className="bottom-nav" aria-label="Main navigation">
      {[
        { id: 'home', icon: 'home', label: 'Home' },
        { id: 'instant', icon: 'instant', label: 'Instant' },
        { id: 'friends', icon: 'friends', label: 'Friends' },
        { id: 'profile', icon: 'profile', label: 'Profile' },
      ].map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`bottom-nav__item${
            activeTab === tab.id ? ' bottom-nav__item--active' : ''
          }`}
          aria-current={activeTab === tab.id ? 'page' : undefined}
          onClick={() => setActiveTab(tab.id)}
        >
          <span className="bottom-nav__icon">
            <BottomNavIcon type={tab.icon} />
          </span>
          <span className="bottom-nav__label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );

  if (step === 'splash') {
    return (
      <>
        <SplashScreen exiting={splashExiting} />
        {toastNode}
      </>
    );
  }

  if (step === 'landing') {
    return (
      <>
        <LandingPage
          onGetStarted={handleGetStarted}
          termsUrl={LEGAL_TERMS_URL}
          privacyUrl={LEGAL_PRIVACY_URL}
          communityUrl={LEGAL_COMMUNITY_URL}
        />
        {toastNode}
      </>
    );
  }

  if (step === 'sessionDetail' && selectedSession) {
    return (
      <div className="session-detail app-screen">
        <header className="session-detail__header">
          <button
            type="button"
            className="create__back"
            onClick={handleBackFromSession}
            aria-label="Go back"
          >
            <svg
              className="create__back-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        </header>

        <main className="session-detail__main">
          <RevealList>
          <RevealItem index={0}>
          <span className="session-detail__type-pill">
            {selectedSession.sessionType.toUpperCase()}
          </span>
          <h1 className="session-detail__title">{selectedSession.sport}</h1>

          <p className="session-detail__info">{selectedSession.time}</p>
          <p className="session-detail__info">{selectedSession.location}</p>
          <p className="session-detail__slots">
            {selectedSession.slotsLeft} of {selectedSession.maxPlayers} slots
            remaining
          </p>
          </RevealItem>

          <SectionDivider tag="01" />

          <RevealItem index={1}>
          <section className="session-detail__section">
            <h2 className="session-detail__section-title">Who&apos;s Coming</h2>
            <div className="session-detail__avatars">
              {selectedSession.attendees.map((name) => (
                <div
                  key={name}
                  className="session-detail__avatar"
                  aria-label={name}
                  title={name}
                >
                  {name.charAt(0)}
                </div>
              ))}
              {Array.from({
                length: Math.max(0, 3 - selectedSession.attendees.length),
              }).map((_, index) => (
                <div
                  key={`placeholder-${index}`}
                  className="session-detail__avatar session-detail__avatar--empty"
                  aria-hidden="true"
                />
              ))}
            </div>
          </section>
          </RevealItem>

          <SectionDivider tag="02" />

          <RevealItem index={2}>
          <section className="session-detail__section">
            <h2 className="session-detail__section-title">Group Chat</h2>
            <div className="session-detail__chat">
              {selectedSession.chatPreview.length > 0 ? (
                selectedSession.chatPreview.map((msg) => (
                  <div key={`${msg.author}-${msg.message}`} className="session-detail__message">
                    <span className="session-detail__message-author">{msg.author}</span>
                    <p className="session-detail__message-text">{msg.message}</p>
                  </div>
                ))
              ) : (
                <p className="session-detail__chat-empty">No messages yet.</p>
              )}
            </div>
          </section>
          </RevealItem>

          <RevealItem index={3}>
          <button type="button" className="login__button session-detail__join">
            Join Session
          </button>
          </RevealItem>
          </RevealList>
        </main>
      </div>
    );
  }

  if (step === 'home' && activeTab === 'profile') {
    const sessionsPlayedCount = sessions.filter(
      (session) => session.city && city && session.city === city
    ).length;

    const acceptedFriends = friendRequests.filter(
      (request) =>
        request.status === 'accepted' &&
        (request.sender_squadr_id === squadrId ||
          request.receiver_squadr_id === squadrId)
    );

    const availabilitySummary = formatAvailabilitySummary(availability);
    const profileRating = 0;
    const badgeContext = {
      sessionsPlayed: sessionsPlayedCount,
      rating: profileRating,
      friendsCount: acceptedFriends.length,
    };

    return (
      <div className="home home--with-nav app-tab-panel">
        <header className="home__header home__header--nav profile--tab profile__header">
          <h1 className="profile__tab-title">Profile</h1>
          <button
            type="button"
            className="profile__logout"
            onClick={handleLogout}
          >
            Log out
          </button>
        </header>

        <main className="profile__main">
          <div className="profile__avatar-wrap">
            <div className="profile__avatar">
              {profilePic ? (
                <img
                  src={profilePic}
                  alt={firstName || 'Profile'}
                  className="profile__avatar-img"
                />
              ) : (
                <span className="profile__avatar-initials">
                  {getInitials(firstName)}
                </span>
              )}
            </div>
            {editingProfile && (
              <>
                <button
                  type="button"
                  className="profile__avatar-upload"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {profilePic ? 'Change Photo' : 'Upload Photo'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="profile__file-input"
                  onChange={handleProfilePicChange}
                />
              </>
            )}
          </div>

          {editingProfile ? (
            <form className="login__form profile__edit-form" onSubmit={handleSaveProfile}>
              <input
                type="text"
                className="login__input"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name"
              />
              <input
                type="number"
                className="login__input"
                placeholder="Age"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                min="1"
                inputMode="numeric"
              />
              <select
                className={`login__select${city ? '' : ' login__select--placeholder'}`}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                aria-label="City"
              >
                <option value="" disabled>
                  City
                </option>
                {CITIES.map((cityName) => (
                  <option key={cityName} value={cityName}>
                    {cityName}
                  </option>
                ))}
              </select>

              <div className="login__sports-grid profile__edit-sports">
                {sports.map((name) => {
                  const isSelected = selectedSports.includes(name);
                  return (
                    <button
                      key={name}
                      type="button"
                      className={`login__sport-card${isSelected ? ' login__sport-card--selected' : ''}`}
                      onClick={() => toggleSport(name)}
                      aria-pressed={isSelected}
                      aria-label={name}
                    >
                      <span className="login__sport-name">{name}</span>
                    </button>
                  );
                })}
              </div>

              {selectedSports.length > 0 && (
                <div className="profile__skill-section">
                  <h3 className="profile__edit-label">Skill level</h3>
                  {selectedSports.map((sport) => (
                    <div key={sport} className="profile__skill-row">
                      <span className="profile__skill-sport">{sport}</span>
                      <div className="profile__skill-options" role="group" aria-label={`${sport} skill level`}>
                        {SKILL_LEVELS.map((level) => (
                          <button
                            key={level}
                            type="button"
                            className={`profile__skill-btn${
                              (skillLevels[sport] || 'Beginner') === level
                                ? ' profile__skill-btn--selected'
                                : ''
                            }`}
                            onClick={() => setSkillLevel(sport, level)}
                            aria-pressed={(skillLevels[sport] || 'Beginner') === level}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="profile__availability-section">
                <h3 className="profile__edit-label">When do you usually play?</h3>
                <div className="profile__availability-grid">
                  {AVAILABILITY_DAYS.map((day) => (
                    <div key={day} className="profile__availability-day">
                      <span className="profile__availability-day-label">{day}</span>
                      <div className="profile__availability-slots">
                        {TIME_SLOTS.map((slot) => {
                          const isSelected = (availability[day] || []).includes(
                            slot.id
                          );
                          return (
                            <button
                              key={slot.id}
                              type="button"
                              className={`profile__availability-slot${
                                isSelected
                                  ? ' profile__availability-slot--selected'
                                  : ''
                              }`}
                              onClick={() => toggleAvailabilitySlot(day, slot.id)}
                              aria-pressed={isSelected}
                              aria-label={`${day} ${slot.label}`}
                            >
                              <span className="profile__availability-slot-label">
                                {slot.label}
                              </span>
                              <span className="profile__availability-slot-sub">
                                {slot.sub}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" className="login__button">
                Save
              </button>
            </form>
          ) : (
            <>
              <div className="profile__identity">
                <h1 className="profile__name">
                  {capitalize(firstName)}
                  {isPro && (
                    <span className="profile__pro-badge">Pro</span>
                  )}
                </h1>
                {squadrId && (
                  <button
                    type="button"
                    className="profile__squadr-id"
                    onClick={handleCopySquadrId}
                    aria-label={`Copy SQUADR ID ${squadrId}`}
                  >
                    <span className="profile__squadr-id-text">{squadrId}</span>
                    <svg
                      className="profile__squadr-id-copy"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <rect x="9" y="9" width="11" height="11" rx="2" />
                      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
                    </svg>
                  </button>
                )}
                <p className="profile__meta">
                  {age && <span className="profile__age">{age}</span>}
                  <span className="profile__city">{city}</span>
                </p>
                {availabilitySummary && (
                  <p className="profile__availability-summary">
                    {availabilitySummary}
                  </p>
                )}
              </div>

              <SectionDivider tag="01" />

              <div className="profile__stats">
                <div className="profile__stat">
                  <IndexTag index={1} className="profile__stat-tag" />
                  <CountUpStat
                    value={sessionsPlayedCount}
                    className="profile__stat-value"
                  />
                  <span className="profile__stat-label">Sessions Played</span>
                </div>
                <div className="profile__stat">
                  <IndexTag index={2} className="profile__stat-tag" />
                  <CountUpStat value={profileRating} className="profile__stat-value" />
                  <span className="profile__stat-label">Rating</span>
                </div>
              </div>

              <SectionDivider tag="02" />

              <section className="profile__section profile__section--badges">
                <h2 className="profile__section-title">Badges</h2>
                <RevealList className="profile__badges">
                  {PROFILE_BADGES.map((badge, index) => {
                    const earned = badge.isEarned(badgeContext);
                    return (
                      <RevealItem key={badge.id} index={index}>
                        <span
                          className={`profile__badge${
                            earned ? '' : ' profile__badge--locked'
                          }`}
                          title={earned ? badge.name : badge.hint}
                        >
                          {!earned && (
                            <svg
                              className="profile__badge-lock"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              aria-hidden="true"
                            >
                              <rect x="5" y="11" width="14" height="10" rx="2" />
                              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                            </svg>
                          )}
                          <span className="profile__badge-emoji" aria-hidden="true">
                            {badge.emoji}
                          </span>
                          <span className="profile__badge-name">{badge.name}</span>
                          {!earned && (
                            <span className="profile__badge-hint">{badge.hint}</span>
                          )}
                        </span>
                      </RevealItem>
                    );
                  })}
                </RevealList>
              </section>

              {selectedSports.length > 0 && (
                <>
                  <SectionDivider />
                  <div className="profile__sports">
                  {selectedSports.map((sport) => (
                    <span key={sport} className="profile__sport-pill">
                      {sport}
                      {skillLevels[sport] && (
                        <span className="profile__sport-skill">
                          {' '}
                          · {skillLevels[sport]}
                        </span>
                      )}
                    </span>
                  ))}
                </div>
                </>
              )}

              <SectionDivider tag="03" />

              <section className="profile__section">
                <h2 className="profile__section-title">My Crew</h2>
                <p className="profile__empty">
                  Play with someone to add them to your crew
                </p>
              </section>

              <button
                type="button"
                className="login__button profile__edit"
                onClick={handleEditProfile}
              >
                Edit Profile
              </button>

              <button
                type="button"
                className="profile__delete"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete Account
              </button>

              <p className="profile__legal legal-links legal-links--footer">
                <a
                  href={LEGAL_TERMS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Terms
                </a>
                {' · '}
                <a
                  href={LEGAL_PRIVACY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Privacy
                </a>
                {' · '}
                <a
                  href={LEGAL_COMMUNITY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Community
                </a>
              </p>
            </>
          )}
        </main>

        {showDeleteConfirm && (
          <div className="confirm" role="dialog" aria-modal="true">
            <div className="confirm__card">
              <h2 className="confirm__title">Delete account?</h2>
              <p className="confirm__text">
                Are you sure? This will delete all your data permanently.
              </p>
              <div className="confirm__actions">
                <button
                  type="button"
                  className="confirm__cancel"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="confirm__delete"
                  onClick={handleDeleteAccount}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {showAddFriend && (
          <div className="confirm" role="dialog" aria-modal="true">
            <div className="confirm__card add-friend__card">
              <h2 className="confirm__title">Add Friend</h2>
              <form className="add-friend__form" onSubmit={handleSearchFriend}>
                <input
                  type="text"
                  className="login__input"
                  placeholder="Enter SQUADR ID"
                  value={addFriendQuery}
                  onChange={(e) => setAddFriendQuery(e.target.value)}
                  autoComplete="off"
                />
                <button type="submit" className="login__button">
                  Search
                </button>
              </form>

              {addFriendSearched &&
                (addFriendResult ? (
                  <div className="add-friend__result">
                    <div className="friends__avatar">
                      {getInitials(addFriendResult.name)}
                    </div>
                    <div className="add-friend__result-info">
                      <span className="friends__name">
                        {capitalize(addFriendResult.name)}
                      </span>
                      {addFriendResult.city && (
                        <span className="add-friend__result-city">
                          {addFriendResult.city}
                        </span>
                      )}
                    </div>
                    {addFriendResult.squadr_id === squadrId ? (
                      <span className="add-friend__hint">That's you!</span>
                    ) : (
                      <button
                        type="button"
                        className="friends__accept"
                        onClick={handleSendFriendRequest}
                      >
                        Send Request
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="add-friend__empty">
                    No player found with that SQUADR ID
                  </p>
                ))}

              {addFriendStatus && (
                <p className="add-friend__error">{addFriendStatus}</p>
              )}

              <button
                type="button"
                className="confirm__cancel add-friend__close"
                onClick={handleCloseAddFriend}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {toastNode}
        {renderPwaInstallBanner()}
        {renderBottomNav()}
      </div>
    );
  }

  if (step === 'home' && activeTab === 'friends') {
    const acceptedFriends = friendRequests.filter(
      (request) =>
        request.status === 'accepted' &&
        (request.sender_squadr_id === squadrId ||
          request.receiver_squadr_id === squadrId)
    );

    const pendingIncoming = friendRequests.filter(
      (request) =>
        request.status === 'pending' &&
        request.receiver_squadr_id === squadrId
    );

    const friendDisplayName = (request) =>
      request.sender_squadr_id === squadrId
        ? request.receiver_name
        : request.sender_name;

    return (
      <div className="home home--with-nav app-tab-panel">
        <main className="home__main friends-tab">
          <div className="profile__section-head">
            <h1 className="friends-tab__title">Friends</h1>
            <button
              type="button"
              className="friends__add-btn"
              onClick={handleOpenAddFriend}
            >
              + Add Friend
            </button>
          </div>

          <div className="friends__tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={friendsTab === 'friends'}
              className={`friends__tab${
                friendsTab === 'friends' ? ' friends__tab--active' : ''
              }`}
              onClick={() => setFriendsTab('friends')}
            >
              Friends
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={friendsTab === 'requests'}
              className={`friends__tab${
                friendsTab === 'requests' ? ' friends__tab--active' : ''
              }`}
              onClick={() => setFriendsTab('requests')}
            >
              Requests
              {pendingIncoming.length > 0 && (
                <span className="friends__badge">
                  {pendingIncoming.length}
                </span>
              )}
            </button>
          </div>

          {friendsTab === 'friends' ? (
            acceptedFriends.length === 0 ? (
              <p className="profile__empty">
                No friends yet. Add someone by their SQUADR ID.
              </p>
            ) : (
              <RevealList className="friends__list">
                {acceptedFriends.map((request, index) => {
                  const name = friendDisplayName(request);
                  return (
                    <RevealItem key={request.id} index={index}>
                      <div className="friends__card">
                        <div className="friends__avatar">
                          {getInitials(name)}
                        </div>
                        <span className="friends__name">
                          {capitalize(name)}
                        </span>
                      </div>
                    </RevealItem>
                  );
                })}
              </RevealList>
            )
          ) : pendingIncoming.length === 0 ? (
            <p className="profile__empty">No pending requests</p>
          ) : (
            <RevealList className="friends__list">
              {pendingIncoming.map((request, index) => (
                <RevealItem key={request.id} index={index}>
                  <div className="friends__card">
                    <div className="friends__avatar">
                      {getInitials(request.sender_name)}
                    </div>
                    <span className="friends__name">
                      {capitalize(request.sender_name)}
                    </span>
                    <div className="friends__actions">
                      <button
                        type="button"
                        className="friends__decline"
                        onClick={() => handleDeclineFriend(request)}
                      >
                        Decline
                      </button>
                      <button
                        type="button"
                        className="friends__accept"
                        onClick={() => handleAcceptFriend(request)}
                      >
                        Accept
                      </button>
                    </div>
                  </div>
                </RevealItem>
              ))}
            </RevealList>
          )}
        </main>

        {showAddFriend && (
          <div className="confirm" role="dialog" aria-modal="true">
            <div className="confirm__card add-friend__card">
              <h2 className="confirm__title">Add Friend</h2>
              <form className="add-friend__form" onSubmit={handleSearchFriend}>
                <input
                  type="text"
                  className="login__input"
                  placeholder="Enter SQUADR ID"
                  value={addFriendQuery}
                  onChange={(e) => setAddFriendQuery(e.target.value)}
                  autoComplete="off"
                />
                <button type="submit" className="login__button">
                  Search
                </button>
              </form>

              {addFriendSearched &&
                (addFriendResult ? (
                  <div className="add-friend__result">
                    <div className="friends__avatar">
                      {getInitials(addFriendResult.name)}
                    </div>
                    <div className="add-friend__result-info">
                      <span className="friends__name">
                        {capitalize(addFriendResult.name)}
                      </span>
                      {addFriendResult.city && (
                        <span className="add-friend__result-city">
                          {addFriendResult.city}
                        </span>
                      )}
                    </div>
                    {addFriendResult.squadr_id === squadrId ? (
                      <span className="add-friend__hint">That's you!</span>
                    ) : (
                      <button
                        type="button"
                        className="friends__accept"
                        onClick={handleSendFriendRequest}
                      >
                        Send Request
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="add-friend__empty">
                    No player found with that SQUADR ID
                  </p>
                ))}

              {addFriendStatus && (
                <p className="add-friend__error">{addFriendStatus}</p>
              )}

              <button
                type="button"
                className="confirm__cancel add-friend__close"
                onClick={handleCloseAddFriend}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {toastNode}
        {renderPwaInstallBanner()}
        {renderBottomNav()}
      </div>
    );
  }

  if (step === 'createSession') {
    const inviteFriendOptions = friendRequests
      .filter(
        (request) =>
          request.status === 'accepted' &&
          (request.sender_squadr_id === squadrId ||
            request.receiver_squadr_id === squadrId)
      )
      .map((request) =>
        request.sender_squadr_id === squadrId
          ? { squadrId: request.receiver_squadr_id, name: request.receiver_name }
          : { squadrId: request.sender_squadr_id, name: request.sender_name }
      );

    return (
      <div className="create app-screen">
        <header className="create__header">
          <button
            type="button"
            className="create__back"
            onClick={handleBackToHome}
            aria-label="Go back"
          >
            <svg
              className="create__back-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 className="create__title">Create Session</h1>
          <span className="create__header-spacer" aria-hidden="true" />
        </header>

        <main className="create__main">
          <form className="create__form" onSubmit={handleCreateSession}>
            <section className="create__section">
              <h2 className="create__label">Sport</h2>
              <div className="login__sports-grid create__sports-grid">
                {DEFAULT_SPORTS.map((name) => {
                  const isSelected = createSessionSport === name;
                  return (
                    <button
                      key={name}
                      type="button"
                      className={`login__sport-card${isSelected ? ' login__sport-card--selected' : ''}`}
                      onClick={() => selectCreateSport(name)}
                      aria-pressed={isSelected}
                      aria-label={name}
                    >
                      <span className="login__sport-name">{name}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="create__section">
              <h2 className="create__label">Session type</h2>
              <div className="create__type-grid">
                {SESSION_TYPES.map((type) => {
                  const isSelected = createSessionType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      className={`create__type-option${isSelected ? ' create__type-option--selected' : ''}`}
                      onClick={() => setCreateSessionType(type)}
                      aria-pressed={isSelected}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="create__section">
              <h2 className="create__label">Date &amp; time</h2>
              <input
                type="datetime-local"
                className="login__input login__input--datetime"
                value={sessionDateTime}
                onChange={(e) => setSessionDateTime(e.target.value)}
              />
            </section>

            <section className="create__section">
              <h2 className="create__label">Venue</h2>
              <VenueAutocomplete
                value={venue}
                onVenueChange={setVenue}
                onAddressChange={() => {}}
              />
            </section>

            {showMaxPlayers && (
              <section className="create__section">
                <h2 className="create__label">Max players</h2>
                <input
                  type="number"
                  className="login__input"
                  placeholder="Max players"
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(e.target.value)}
                  min="2"
                  inputMode="numeric"
                />
              </section>
            )}

            <section className="create__section">
              <h2 className="create__label">Invite Friends</h2>
              {inviteFriendOptions.length === 0 ? (
                <p className="create__invite-empty">
                  Add friends to invite them to your sessions.
                </p>
              ) : (
                <div className="invite-friends">
                  {inviteFriendOptions.map((friend) => {
                    const isSelected = invitedFriends.some(
                      (item) => item.squadrId === friend.squadrId
                    );
                    return (
                      <button
                        key={friend.squadrId}
                        type="button"
                        className={`invite-friends__card${
                          isSelected ? ' invite-friends__card--selected' : ''
                        }`}
                        onClick={() => toggleInviteFriend(friend)}
                        aria-pressed={isSelected}
                      >
                        <span className="invite-friends__avatar">
                          {getInitials(friend.name)}
                        </span>
                        <span className="invite-friends__name">
                          {capitalize(friend.name)}
                        </span>
                        {isSelected && (
                          <svg
                            className="invite-friends__check"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            aria-hidden="true"
                          >
                            <path d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            <button type="submit" className="login__button create__submit">
              Create Session
            </button>
            {createSessionError && (
              <p className="login__error">{createSessionError}</p>
            )}
          </form>
        </main>
      </div>
    );
  }

  if (step === 'instantLocation') {
    const locationReady =
      userLat != null && userLng != null && !instantLocationLoading;

    return (
      <div className="create app-screen">
        <header className="create__header">
          <button
            type="button"
            className="create__back"
            onClick={() => {
              resetInstantFlow();
              setStep('home');
            }}
            aria-label="Go back"
          >
            <svg
              className="create__back-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 className="create__title">Find Players</h1>
          <span className="create__header-spacer" aria-hidden="true" />
        </header>

        <main className="create__main">
          <StepIndicator step={1} total={5} />
          <h2 className="instant__question">Where are you playing?</h2>

          <div className="instant__location-cards">
            <button
              type="button"
              className={`instant__location-card${
                instantLocationMode === 'current'
                  ? ' instant__location-card--selected'
                  : ''
              }`}
              onClick={handleUseCurrentLocation}
              disabled={instantLocationLoading}
            >
              <span className="instant__location-card-icon" aria-hidden="true">
                <LocationPinIcon />
              </span>
              <span className="instant__location-card-title">Use Current Location</span>
              {instantLocationMode === 'current' && instantLocationLoading && (
                <LoadingPulse compact label="Finding location..." />
              )}
              {instantLocationMode === 'current' &&
                !instantLocationLoading &&
                locationReady && (
                  <span className="instant__location-status instant__location-status--success">
                    {instantLocationLabel} ✓
                  </span>
                )}
            </button>

            <button
              type="button"
              className={`instant__location-card${
                instantLocationMode === 'manual'
                  ? ' instant__location-card--selected'
                  : ''
              }`}
              onClick={handleSelectManualLocation}
            >
              <span className="instant__location-card-icon" aria-hidden="true">
                <SearchIcon />
              </span>
              <span className="instant__location-card-title">Set Manually</span>
            </button>
          </div>

          {instantLocationMode === 'manual' && (
            <div className="instant__manual-location">
              <VenueAutocomplete
                value={instantLocationPref}
                onVenueChange={handleManualVenueChange}
                onAddressChange={(address) => {
                  if (address) {
                    setInstantLocationLabel(instantLocationPref || address);
                  }
                }}
                onCoordsChange={handleManualCoordsChange}
                placeholder="Search for a venue or area"
              />
              {locationReady && (
                <p className="instant__location-status instant__location-status--success">
                  {instantLocationLabel || instantLocationPref} ✓
                </p>
              )}
            </div>
          )}

          {instantLocationError && (
            <p className="login__error">{instantLocationError}</p>
          )}

          <button
            type="button"
            className="login__button create__submit"
            disabled={!locationReady}
            onClick={handleInstantLocationContinue}
          >
            Continue
          </button>
        </main>
      </div>
    );
  }

  if (step === 'instantSport') {
    return (
      <div className="create app-screen">
        <header className="create__header">
          <button
            type="button"
            className="create__back"
            onClick={() => setStep('instantLocation')}
            aria-label="Go back"
          >
            <svg
              className="create__back-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 className="create__title">Find Players</h1>
          <span className="create__header-spacer" aria-hidden="true" />
        </header>

        <main className="create__main">
          <StepIndicator step={2} total={5} />
          <h2 className="instant__question">What do you want to play?</h2>
          <div className="login__sports-grid create__sports-grid">
            {instantSportOptions.map((name) => {
              const isSelected = instantSport === name;
              return (
                <button
                  key={name}
                  type="button"
                  className={`login__sport-card${isSelected ? ' login__sport-card--selected' : ''}`}
                  onClick={() => handleInstantSelectSport(name)}
                  aria-pressed={isSelected}
                  aria-label={name}
                >
                  <span className="login__sport-name">{name}</span>
                </button>
              );
            })}
          </div>
        </main>
      </div>
    );
  }

  if (step === 'instantRadius') {
    return (
      <div className="create app-screen">
        <header className="create__header">
          <button
            type="button"
            className="create__back"
            onClick={() => setStep('instantSport')}
            aria-label="Go back"
          >
            <svg
              className="create__back-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 className="create__title">Find Players</h1>
          <span className="create__header-spacer" aria-hidden="true" />
        </header>

        <main className="create__main">
          <StepIndicator step={3} total={5} />
          <h2 className="instant__question">How far should we search?</h2>
          <div className="instant__radius">
            <p className="instant__radius-value">{radiusKm} km radius</p>
            <input
              type="range"
              className="instant__radius-slider"
              min="5"
              max="40"
              step="1"
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              aria-label="Search radius in kilometers"
            />
            <div className="instant__radius-labels">
              <span>5 km</span>
              <span>40 km</span>
            </div>
          </div>
          <button
            type="button"
            className="login__button create__submit"
            onClick={handleInstantRadiusContinue}
          >
            Continue
          </button>
        </main>
      </div>
    );
  }

  if (step === 'instantCount') {
    return (
      <div className="create app-screen">
        <header className="create__header">
          <button
            type="button"
            className="create__back"
            onClick={() => setStep('instantRadius')}
            aria-label="Go back"
          >
            <svg
              className="create__back-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 className="create__title">Find Players</h1>
          <span className="create__header-spacer" aria-hidden="true" />
        </header>

        <main className="create__main">
          <StepIndicator step={4} total={5} />
          <h2 className="instant__question">How many players do you need?</h2>
          <div className="instant__count-grid">
            {PLAYER_COUNT_OPTIONS.map((count) => {
              const isSelected = instantPlayersNeeded === count;
              return (
                <button
                  key={count}
                  type="button"
                  className={`instant__count-option${isSelected ? ' instant__count-option--selected' : ''}`}
                  onClick={() => handleInstantSelectCount(count)}
                  aria-pressed={isSelected}
                >
                  {count}
                </button>
              );
            })}
          </div>
        </main>
      </div>
    );
  }

  if (step === 'instantBroadcast') {
    return (
      <div className="create app-screen">
        <header className="create__header">
          <button
            type="button"
            className="create__back"
            onClick={() => setStep('instantCount')}
            aria-label="Go back"
          >
            <svg
              className="create__back-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 className="create__title">Find Players</h1>
          <span className="create__header-spacer" aria-hidden="true" />
        </header>

        <main className="create__main">
          <form className="create__form" onSubmit={handleBroadcastRequest}>
            <section className="create__section">
              <StepIndicator step={5} total={5} />
              <h2 className="instant__question">Ready to broadcast?</h2>
              <p className="instant__broadcast-location">
                {instantLocationLabel || instantLocationPref}
              </p>
            </section>

            <div className="instant__summary">
              <span className="instant__summary-item">{instantSport}</span>
              <span className="instant__summary-item">{radiusKm} km radius</span>
              <span className="instant__summary-item">
                {instantPlayersNeeded} player
                {instantPlayersNeeded === 1 ? '' : 's'}
              </span>
            </div>

            <button
              type="submit"
              className="login__button create__submit"
              disabled={userLat == null || userLng == null}
            >
              Broadcast Request
            </button>
            {instantError && <p className="login__error">{instantError}</p>}
          </form>
        </main>
      </div>
    );
  }

  if (step === 'instantExisting') {
    return (
      <div className="create app-screen">
        <header className="create__header">
          <button
            type="button"
            className="create__back"
            onClick={() => setStep('instantBroadcast')}
            aria-label="Go back"
          >
            <svg
              className="create__back-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 className="create__title">Players Found</h1>
          <span className="create__header-spacer" aria-hidden="true" />
        </header>

        <main className="create__main">
          <p className="instant__found-intro">
            Others are already looking for {instantSport}. Join one instead of
            waiting on your own.
          </p>

          <div className="existing__list">
            {existingRequests.map((request) => (
              <article key={request.id} className="existing__card">
                <div className="existing__info">
                  <h2 className="existing__name">{request.requester_name}</h2>
                  <p className="existing__meta">
                    {request.sport}
                    {request.location_pref ? ` · ${request.location_pref}` : ''}
                  </p>
                  <p className="existing__needed">
                    Needs {request.players_needed} player
                    {request.players_needed === 1 ? '' : 's'}
                  </p>
                </div>
                <button
                  type="button"
                  className="existing__join"
                  onClick={() => handleJoinExisting(request)}
                >
                  Join instead
                </button>
              </article>
            ))}
          </div>

          <button
            type="button"
            className="login__button instant__broadcast-new"
            onClick={proceedBroadcast}
          >
            Broadcast a new request
          </button>
          {instantError && <p className="login__error">{instantError}</p>}
        </main>
      </div>
    );
  }

  if (step === 'instantSearching') {
    return (
      <div className="instant-search">
        <div className="instant-search__content">
          <div className="instant-search__pulse" aria-hidden="true">
            <span className="instant-search__pulse-dot" />
          </div>

          <h1 className="instant-search__title">Searching...</h1>
          <p className="instant-search__subtitle">
            Looking for {instantSport} players within {radiusKm} km of{' '}
            {instantLocationLabel || instantLocationPref}
          </p>

          <div className="instant-search__counter-wrap">
            <div className="instant-search__counter">
              <span className="instant-search__counter-value">
                {instantMatches.length}
              </span>
              <span className="instant-search__counter-label">
                of {instantPlayersNeeded} players joined
              </span>
            </div>
          </div>

          <div className="instant-search__timer" aria-label="Time remaining">
            {formatCountdown(searchSecondsLeft)}
          </div>

          {instantMatches.length > 0 && (
            <div className="instant-search__players">
              {instantMatches.map((entry) => (
                <span key={entry.id} className="instant-search__player">
                  {capitalize(entry.player_name)}
                </span>
              ))}
            </div>
          )}

          <button
            type="button"
            className="instant-search__cancel"
            onClick={handleCancelSearch}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (step === 'groupChat') {
    return (
      <div className="chat app-screen">
        <header className="chat__header">
          <button
            type="button"
            className="create__back"
            onClick={handleLeaveChat}
            aria-label="Go back"
          >
            <svg
              className="create__back-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div className="chat__header-info">
            <h1 className="chat__title">Group Chat</h1>
            <div className="chat__players">
              {chatPlayers.map((name) => (
                <span key={name} className="chat__player-pill">
                  {capitalize(name)}
                </span>
              ))}
            </div>
          </div>
        </header>

        <main className="chat__messages">
          {chatMessages.length === 0 ? (
            <p className="chat__empty">Say hello to your new crew!</p>
          ) : (
            <RevealList>
            {chatMessages.map((message, index) => {
              const isMine = message.sender_name === firstName;
              return (
                <RevealItem key={message.id} index={index}>
                <div
                  className={`chat__message${isMine ? ' chat__message--mine' : ''}`}
                >
                  {!isMine && (
                    <span className="chat__message-author">
                      {capitalize(message.sender_name)}
                    </span>
                  )}
                  <p className="chat__message-text">{message.text}</p>
                </div>
                </RevealItem>
              );
            })}
            </RevealList>
          )}
        </main>

        <form className="chat__composer" onSubmit={handleSendChat}>
          <input
            type="text"
            className="login__input chat__input"
            placeholder="Type a message"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            aria-label="Message"
          />
          <button
            type="submit"
            className="chat__send"
            disabled={!chatInput.trim()}
          >
            Send
          </button>
        </form>
      </div>
    );
  }

  if (step === 'pro') {
    const proFeatures = [
      '⚡ Instant Mode — find players right now',
      '🎯 Priority matching — shown first to nearby players',
      '🔒 Private sessions — invite only',
      '🏆 Pro badge on profile',
      '📊 Session stats and history',
      '1-on-1 unlocked immediately',
    ];

    return (
      <div className="pro app-screen">
        <header className="create__header">
          <button
            type="button"
            className="create__back"
            onClick={handleProMaybeLater}
            aria-label="Go back"
          >
            <svg
              className="create__back-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <span className="create__header-spacer" aria-hidden="true" />
          <span className="create__header-spacer" aria-hidden="true" />
        </header>

        <main className="pro__main">
          <div className="pro__logo">
            <SquadrLogo size="large" />
          </div>

          <h1 className="pro__headline">Play More. Wait Less.</h1>
          <p className="pro__subheadline">
            Unlock Instant Mode and premium features
          </p>

          <div className="pro__pricing">
            <button
              type="button"
              className={`pro__plan${proPlan === 'monthly' ? ' pro__plan--selected' : ''}`}
              onClick={() => setProPlan('monthly')}
              aria-pressed={proPlan === 'monthly'}
            >
              <span className="pro__plan-label">Monthly</span>
              <span className="pro__plan-price">₹149</span>
              <span className="pro__plan-period">/month</span>
              <span className="pro__plan-note">Billed monthly</span>
            </button>

            <button
              type="button"
              className={`pro__plan pro__plan--recommended${proPlan === 'yearly' ? ' pro__plan--selected' : ''}`}
              onClick={() => setProPlan('yearly')}
              aria-pressed={proPlan === 'yearly'}
            >
              <span className="pro__plan-badge">Save 44%</span>
              <span className="pro__plan-label">Yearly</span>
              <span className="pro__plan-price">₹999</span>
              <span className="pro__plan-period">/year</span>
              <span className="pro__plan-note">Best value</span>
            </button>
          </div>

          <ul className="pro__features">
            {proFeatures.map((feature) => (
              <li key={feature} className="pro__feature">
                {feature}
              </li>
            ))}
          </ul>

          <button
            type="button"
            className="login__button pro__continue"
            onClick={handleActivatePro}
          >
            Continue
          </button>

          <button
            type="button"
            className="pro__later"
            onClick={handleProMaybeLater}
          >
            Maybe Later
          </button>
        </main>
      </div>
    );
  }

  if (step === 'home') {
    const now = Date.now();
    const sessionsToRate = sessions.filter(
      (session) =>
        myParticipationIds.includes(session.id) &&
        !myRatedIds.includes(session.id) &&
        session.scheduledAt &&
        new Date(session.scheduledAt).getTime() < now
    );

    const expiryCutoff = new Date(Date.now() - 20 * 60 * 1000);
    const visibleSessions = sessions.filter(
      (session) =>
        !session.scheduledAt || new Date(session.scheduledAt) >= expiryCutoff
    );

    const invitedCards = pendingInvites
      .map((invite) => ({
        invite,
        session: sessions.find((item) => item.id === invite.session_id),
      }))
      .filter(
        ({ session }) =>
          session &&
          (!session.scheduledAt ||
            new Date(session.scheduledAt) >= expiryCutoff)
      );

    const invitedSessionIds = new Set(
      invitedCards.map(({ session }) => session.id)
    );
    const sessionsWithoutInvites = visibleSessions.filter(
      (session) => !invitedSessionIds.has(session.id)
    );

    return (
      <div className="home home--with-nav app-tab-panel">
        <header className="home__header home__header--nav">
          <SquadrLogo size="small" />
          <div className="home__header-actions">
            <button
              type="button"
              className={`home__toggle${openToPlay ? ' home__toggle--on' : ''}`}
              onClick={handleOpenToPlayToggle}
              aria-pressed={openToPlay}
              aria-label="Open to Play"
            >
              <span className="home__toggle-text">Open to Play</span>
              <span className="home__toggle-track" aria-hidden="true">
                <span className="home__toggle-thumb" />
              </span>
            </button>
          </div>
        </header>

        {(activeTab === 'home' || activeTab === 'instant') && (
          <div className="home__tabs-wrap">
            <div className="home__tabs" role="tablist" aria-label="Home views">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'home'}
                className={`home__tab${activeTab === 'home' ? ' home__tab--active' : ''}`}
                onClick={() => setActiveTab('home')}
              >
                Scheduled Sessions
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'instant'}
                className={`home__tab${activeTab === 'instant' ? ' home__tab--active' : ''}`}
                onClick={() => setActiveTab('instant')}
              >
                Instant Matching
              </button>
            </div>
            <p className="home__section-eyebrow">
              {activeTab === 'home' ? 'YOUR SESSIONS' : 'INSTANT MATCHING'}
            </p>
          </div>
        )}

        <main className="home__main home__main--panels">
          {(activeTab === 'home' || activeTab === 'instant') && (
            <div className="home__panels">
              <div
                className={`home__panels-track${
                  activeTab === 'instant' ? ' home__panels-track--instant' : ''
                }`}
              >
                <div className="home__panel">
                  <RevealList className="home__sessions">
              {invitedCards.map(({ invite, session }, index) => (
                <RevealItem key={`invite-${invite.id}`} index={index}>
                <article
                  className="home__session-card home__session-card--invited"
                >
                  <IndexTag index={index + 1} className="home__session-index" />
                  <div className="home__session-top">
                    <div className="home__session-heading">
                      <span className="home__session-badge">Invited</span>
                      <h2 className="home__session-sport">{session.sport}</h2>
                    </div>
                  </div>
                  <p className="home__session-detail">{session.time}</p>
                  <p className="home__session-detail">{session.location}</p>
                  <div className="home__invite-actions">
                    <button
                      type="button"
                      className="friends__decline"
                      onClick={() => handleDeclineInvite(invite)}
                    >
                      Decline
                    </button>
                    <button
                      type="button"
                      className="friends__accept"
                      onClick={() => handleAcceptInvite(invite)}
                    >
                      Accept
                    </button>
                  </div>
                </article>
                </RevealItem>
              ))}

              {sessionsToRate.map((session, index) => (
                <RevealItem key={`rate-${session.id}`} index={index}>
                <article className="rate-card">
                  <div className="rate-card__info">
                    <span className="rate-card__title">Rate your crew</span>
                    <span className="rate-card__sub">
                      {session.sport} · {session.location}
                    </span>
                    <span className="rate-card__question">Would play again?</span>
                  </div>
                  <div className="rate-card__actions">
                    <button
                      type="button"
                      className="rate-card__btn"
                      aria-label="Would play again"
                      onClick={() => handleRateSession(session.id, true)}
                    >
                      👍
                    </button>
                    <button
                      type="button"
                      className="rate-card__btn"
                      aria-label="Would not play again"
                      onClick={() => handleRateSession(session.id, false)}
                    >
                      👎
                    </button>
                  </div>
                </article>
                </RevealItem>
              ))}

              {sessionsLoading ? (
                <LoadingPulse label="Loading sessions..." />
              ) : sessionsWithoutInvites.length === 0 &&
                invitedCards.length === 0 ? (
                <div className="home__empty">
                  <svg
                    className="home__empty-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                  </svg>
                  <p>No upcoming sessions near you. Be the first to create one!</p>
                </div>
              ) : (
                sessionsWithoutInvites.map((session, index) => {
                  const isFull = session.slotsLeft <= 0;
                  const hasJoined = joinedSessionIds.includes(session.id);
                  const isJoining = joiningSessionId === session.id;
                  const sessionNumber =
                    invitedCards.length + sessionsToRate.length + index + 1;
                  return (
                    <RevealItem key={session.id} index={index}>
                    <article
                      className="home__session-card home__session-card--clickable"
                      onClick={() => handleOpenSession(session.id)}
                    >
                      <IndexTag
                        index={sessionNumber}
                        className="home__session-index"
                      />
                      <div className="home__session-top">
                        <div className="home__session-heading">
                          <span className="home__session-type">
                            {session.sessionType.toUpperCase()}
                          </span>
                          <h2 className="home__session-sport">
                            {session.sport}
                          </h2>
                        </div>
                        <button
                          type="button"
                          className="home__session-join"
                          disabled={isFull || hasJoined || isJoining}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleJoinSession(session);
                          }}
                        >
                          {isFull
                            ? 'Full'
                            : hasJoined
                            ? 'Joined'
                            : isJoining
                            ? 'Joining...'
                            : 'Join'}
                        </button>
                      </div>
                      <p className="home__session-detail">{session.time}</p>
                      <p className="home__session-detail">
                        {session.location}
                      </p>
                      <p className="home__session-detail">
                        {session.slotsLeft} slots left
                      </p>
                    </article>
                    </RevealItem>
                  );
                })
              )}
                  </RevealList>
                </div>
                <div className="home__panel">
            <div className="find">
              {!isPro ? (
                <div className="pro-lock">
                  <svg
                    className="pro-lock__icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <rect x="5" y="11" width="14" height="10" rx="2" />
                    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                  </svg>
                  <p className="pro-lock__text">
                    Instant Mode is a SQUADR Pro feature
                  </p>
                  <button
                    type="button"
                    className="login__button pro-lock__upgrade"
                    onClick={handleOpenPro}
                  >
                    Upgrade to Pro
                  </button>
                  <ul className="pro-lock__teasers">
                    <li>⚡ Find players in real-time</li>
                    <li>🎯 Priority matching</li>
                    <li>🏆 Pro badge on your profile</li>
                  </ul>
                </div>
              ) : (
                <button
                  type="button"
                  className="find__instant-btn"
                  onClick={handleOpenInstantFind}
                >
                  <span className="find__instant-bolt" aria-hidden="true">
                    <InstantLightningIcon />
                  </span>
                  Find Players Now
                </button>
              )}

              <div className="find__filters">
                <select
                  className={`login__select find__sport-select${findSportFilter ? '' : ' login__select--placeholder'}`}
                  value={findSportFilter}
                  onChange={(e) => setFindSportFilter(e.target.value)}
                  aria-label="Filter by sport"
                >
                  <option value="">Sport</option>
                  {DEFAULT_SPORTS.map((sport) => (
                    <option key={sport} value={sport}>
                      {sport}
                    </option>
                  ))}
                </select>

                <div className="find__type-filters" role="group" aria-label="Filter by session type">
                  {SESSION_TYPES.map((type) => {
                    const isLocked = type === '1-on-1' && !isOneOnOneUnlocked;
                    const isActive = findSessionTypeFilter === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        className={`find__type-filter${isActive ? ' find__type-filter--active' : ''}${isLocked ? ' find__type-filter--locked' : ''}`}
                        onClick={() => handleFindSessionTypeFilter(type)}
                        disabled={isLocked}
                        aria-pressed={isActive}
                        title={isLocked ? 'Unlock after 4 group sessions' : undefined}
                      >
                        {isLocked && (
                          <svg
                            className="find__lock-icon"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            aria-hidden="true"
                          >
                            <rect x="5" y="11" width="14" height="10" rx="2" />
                            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                          </svg>
                        )}
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>

              <RevealList className="find__players">
                {(() => {
                  const visibleFindPlayers = findPlayers.filter((player) => {
                    if (!isDisplayablePlayerName(player.name)) return false;
                    if (!findSportFilter) return true;
                    const sports = Array.isArray(player.sports) ? player.sports : [];
                    return sports.includes(findSportFilter);
                  });

                  if (findPlayersLoading) {
                    return <LoadingPulse label="Searching..." />;
                  }

                  if (visibleFindPlayers.length === 0) {
                    return (
                      <p className="find__empty">
                        No players found. Try adjusting your filters.
                      </p>
                    );
                  }

                  return visibleFindPlayers.map((player, index) => (
                    <RevealItem key={player.squadr_id} index={index}>
                    <article className="find__player-card">
                      <div className="find__player-top">
                        <div className="find__player-heading">
                          <h2 className="find__player-name">
                            {capitalize(player.name.trim().split(' ')[0])}
                          </h2>
                          {player.city && (
                            <p className="find__player-city">{player.city}</p>
                          )}
                        </div>
                        <button type="button" className="find__invite-btn">
                          Invite to Play
                        </button>
                      </div>
                      {Array.isArray(player.sports) && player.sports.length > 0 && (
                        <div className="find__player-sports">
                          {player.sports.map((sport) => (
                            <span key={sport} className="find__sport-pill">
                              {sport}
                            </span>
                          ))}
                        </div>
                      )}
                    </article>
                    </RevealItem>
                  ));
                })()}
              </RevealList>
            </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {(activeTab === 'home' || activeTab === 'instant') && (
          <PanelEyebrow>
            {activeTab === 'home' ? 'YOUR SESSIONS' : 'INSTANT MATCHING'}
          </PanelEyebrow>
        )}

        {activeTab === 'home' && (
          <button
            type="button"
            className="home__fab"
            aria-label="Create new session"
            onClick={handleOpenCreateSession}
          >
            +
          </button>
        )}

        {incomingRequest && (
          <div className="incoming" role="dialog" aria-modal="true">
            <div className="incoming__card">
              <span className="incoming__badge">Wants to play now</span>
              <h2 className="incoming__name">
                {capitalize(incomingRequest.requester_name)}
              </h2>
              <p className="incoming__sport">{incomingRequest.sport}</p>
              {incomingRequest.distanceKm != null && (
                <p className="incoming__distance">
                  📍 {incomingRequest.distanceKm.toFixed(1)} km away
                </p>
              )}
              {incomingRequest.location_pref && (
                <p className="incoming__location">
                  {incomingRequest.location_pref}
                </p>
              )}
              <p className="incoming__needed">
                Needs {incomingRequest.players_needed} player
                {incomingRequest.players_needed === 1 ? '' : 's'}
              </p>

              <div className="incoming__actions">
                <button
                  type="button"
                  className="incoming__decline"
                  onClick={handleDeclineIncoming}
                >
                  Decline
                </button>
                <button
                  type="button"
                  className="incoming__accept"
                  onClick={handleAcceptIncoming}
                >
                  Accept
                </button>
              </div>
            </div>
          </div>
        )}

        {toastNode}
        {renderPwaInstallBanner()}
        {renderBottomNav()}
      </div>
    );
  }

  if (step === 'sports') {
    return (
      <div className="login">
        <div className="login__content login__content--wide">
          <h1 className="login__logo">
            <SquadrLogo size="large" />
          </h1>
          <h2 className="login__title">What do you play?</h2>

          <div className="login__sports-grid">
            {sports.map((name) => {
              const isSelected = selectedSports.includes(name);
              return (
                <button
                  key={name}
                  type="button"
                  className={`login__sport-card${isSelected ? ' login__sport-card--selected' : ''}`}
                  onClick={() => toggleSport(name)}
                  aria-pressed={isSelected}
                  aria-label={name}
                >
                  <span className="login__sport-name">{name}</span>
                </button>
              );
            })}
          </div>

          <input
            type="text"
            className="login__input login__input--custom-sport"
            placeholder="Don't see your sport? Add it"
            value={customSport}
            onChange={(e) => setCustomSport(e.target.value)}
            onKeyDown={handleCustomSportKeyDown}
          />

          <button type="button" className="login__button" onClick={handleSportsContinue}>
            Continue
          </button>
        </div>
      </div>
    );
  }

  if (step === 'onboarding') {
    return (
      <div className="login">
        <div className="login__content">
          <div className="login__topbar">
            <button
              type="button"
              className="login__back"
              onClick={() => setStep('otp')}
              aria-label="Go back"
            >
              <svg
                className="login__back-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          </div>
          <h1 className="login__logo">
            <SquadrLogo size="large" />
          </h1>
          <h2 className="login__title">Tell us about you</h2>

          <form className="login__form" onSubmit={handleOnboardingContinue}>
            <input
              type="text"
              className="login__input"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                if (onboardingError) setOnboardingError('');
              }}
              autoComplete="given-name"
              required
            />
            <input
              type="number"
              className="login__input"
              placeholder="Age"
              value={age}
              onChange={(e) => {
                handleAgeChange(e);
                if (onboardingError) setOnboardingError('');
              }}
              min="1"
              max="99"
              inputMode="numeric"
              required
            />
            <select
              className={`login__select${city ? '' : ' login__select--placeholder'}`}
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                if (onboardingError) setOnboardingError('');
              }}
              aria-label="City"
              required
            >
              <option value="" disabled>
                City
              </option>
              {CITIES.map((cityName) => (
                <option key={cityName} value={cityName}>
                  {cityName}
                </option>
              ))}
            </select>
            {onboardingError && (
              <p className="login__error">{onboardingError}</p>
            )}
            <button type="submit" className="login__button">
              Continue
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (step === 'otp') {
    return (
      <div className="login">
        <div className="login__content">
          <h1 className="login__logo">
            <SquadrLogo size="large" />
          </h1>
          <p className="login__otp-message">
            Enter the 6-digit code sent to {phone}
          </p>

          <form className="login__form" onSubmit={handleVerify}>
            <div className="login__otp-inputs">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  className="login__otp-input"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  onPaste={handleOtpPaste}
                  aria-label={`Digit ${index + 1}`}
                />
              ))}
            </div>
            <button type="submit" className="login__button">
              Verify
            </button>
            {otpError && <p className="login__error">{otpError}</p>}
          </form>

          <button type="button" className="login__link" onClick={handleResend}>
            Resend OTP
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login">
      <div className="login__content">
        <div className="login__brand">
          <div className="login__logo-glow">
            <h1 className="login__logo">
              <SquadrLogo size="large" />
            </h1>
          </div>
          <p className="login__tagline">Find your crew. Play your sport.</p>
        </div>

        <form className="login__form" onSubmit={handleSendOtp}>
          <input
            type="tel"
            className="login__input"
            placeholder="Phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            disabled={!termsAccepted}
          />
          <button
            type="submit"
            className="login__button"
            disabled={!termsAccepted || otpCooldown > 0}
          >
            {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : 'Send OTP'}
          </button>
        </form>

        <div className="login__divider" aria-hidden="true">
          <span>or</span>
        </div>

        <div className="login__alts">
          {showEmailLogin ? (
            <form className="login__form" onSubmit={handleSendMagicLink}>
              <input
                type="email"
                className="login__input"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={!termsAccepted}
              />
              <button
                type="submit"
                className="login__button"
                disabled={!termsAccepted || emailCooldown > 0}
              >
                {emailCooldown > 0
                  ? `Resend in ${emailCooldown}s`
                  : 'Send Magic Link'}
              </button>
              {emailSent && (
                <p className="login__hint">
                  Check your email for the magic link.
                </p>
              )}
            </form>
          ) : (
            <button
              type="button"
              className="login__button login__button--secondary"
              onClick={handleContinueWithEmail}
              disabled={!termsAccepted}
            >
              Continue with Email
            </button>
          )}

          <button
            type="button"
            className="login__button login__button--secondary login__button--google"
            onClick={handleGoogleLogin}
            disabled={!termsAccepted}
          >
            <svg
              className="login__google-icon"
              viewBox="0 0 18 18"
              aria-hidden="true"
            >
              <path
                fill="#4285F4"
                d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
              />
              <path
                fill="#34A853"
                d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
              />
              <path
                fill="#FBBC05"
                d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"
              />
              <path
                fill="#EA4335"
                d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z"
              />
            </svg>
            Continue with Google
          </button>

          <label className="login__terms">
            <input
              type="checkbox"
              className="login__terms-checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
            />
            <span className="login__terms-label legal-links">
              I agree to the{' '}
              <a
                href={LEGAL_TERMS_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                Terms of Service
              </a>
              ,{' '}
              <a
                href={LEGAL_PRIVACY_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                Privacy Policy
              </a>
              {' and '}
              <a
                href={LEGAL_COMMUNITY_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                Community Guidelines
              </a>
            </span>
          </label>
        </div>

        {loginError && <p className="login__error login__error--auth">{loginError}</p>}
      </div>
      {toastNode}
    </div>
  );
}

export default App;
