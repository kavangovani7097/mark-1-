import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase, supabaseUrl, supabaseAnonKey } from './supabase';
import SquadrLogo from './SquadrLogo';
import VenueAutocomplete from './VenueAutocomplete';
import {
  acceptRequest,
  createInstantRequest,
  fetchMatches,
  fetchMessages,
  fetchOpenRequests,
  sendMessage,
  updateRequestStatus,
} from './instantPlay';
import './App.css';

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

const SAMPLE_PLAYERS = [
  {
    id: 1,
    firstName: 'Priya',
    city: 'Ahmedabad',
    sports: ['Badminton', 'Tennis'],
    sessionsPlayed: 24,
    sessionTypes: ['Small Group', 'Large Group'],
  },
  {
    id: 2,
    firstName: 'Rohan',
    city: 'Mumbai',
    sports: ['Football', 'Cricket'],
    sessionsPlayed: 18,
    sessionTypes: ['Small Group', 'Large Group', '1-on-1'],
  },
  {
    id: 3,
    firstName: 'Meera',
    city: 'Pune',
    sports: ['Yoga', 'Swimming'],
    sessionsPlayed: 12,
    sessionTypes: ['Small Group'],
  },
];

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

function App() {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [step, setStep] = useState('login');
  const [otp, setOtp] = useState(EMPTY_OTP);
  const [firstName, setFirstName] = useState('');
  const [age, setAge] = useState('');
  const [city, setCity] = useState('');
  const [sports, setSports] = useState(DEFAULT_SPORTS);
  const [selectedSports, setSelectedSports] = useState([]);
  const [customSport, setCustomSport] = useState('');
  const [activeTab, setActiveTab] = useState('live');
  const [createSessionSport, setCreateSessionSport] = useState('');
  const [createSessionType, setCreateSessionType] = useState('');
  const [sessionDateTime, setSessionDateTime] = useState('');
  const [venue, setVenue] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('');
  const [findSportFilter, setFindSportFilter] = useState('');
  const [findSessionTypeFilter, setFindSessionTypeFilter] = useState('');
  const [groupSessionsPlayed] = useState(0);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [loginError, setLoginError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [createSessionError, setCreateSessionError] = useState('');

  const [openToPlay, setOpenToPlay] = useState(false);
  const [instantSport, setInstantSport] = useState('');
  const [instantPlayersNeeded, setInstantPlayersNeeded] = useState(null);
  const [instantLocationPref, setInstantLocationPref] = useState('');
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

  const inputRefs = useRef([]);
  const fileInputRef = useRef(null);
  const closedRequestRef = useRef(false);

  useEffect(() => {
    const storedPic = loadStoredProfilePic();
    if (storedPic) setProfilePic(storedPic);

    const stored = loadStoredProfile();
    if (!stored) return;

    if (stored.first_name) setFirstName(stored.first_name);
    if (stored.age != null) setAge(String(stored.age));
    if (stored.city) setCity(stored.city);
    if (Array.isArray(stored.sports)) setSelectedSports(stored.sports);
  }, []);

  const routeAfterAuth = useCallback(() => {
    const stored = loadStoredProfile();
    if (stored?.first_name) {
      setFirstName(stored.first_name);
      if (stored.age != null) setAge(String(stored.age));
      if (stored.city) setCity(stored.city);
      if (Array.isArray(stored.sports)) setSelectedSports(stored.sports);
      setStep('home');
    } else {
      setStep('onboarding');
    }
  }, []);

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      try {
        const { data } = (await supabase.auth.getSession()) ?? {};
        if (!active) return;

        if (data?.session) {
          routeAfterAuth();
        } else {
          setStep('login');
        }
      } catch {
        if (active) setStep('login');
      }
    };

    restoreSession();
    return () => {
      active = false;
    };
  }, [routeAfterAuth]);

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
    if (step === 'home') {
      fetchSessions();
    }
  }, [step, fetchSessions]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phone.trim()) return;

    setLoginError('');
    const formattedPhone = formatPhone(phone);
    const { error } =
      (await supabase.auth.signInWithOtp({ phone: formattedPhone })) ?? {};

    if (error) {
      setLoginError(error.message);
    }

    setStep('otp');
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
    setStep('sports');
  };

  const toggleSport = (name) => {
    setSelectedSports((prev) =>
      prev.includes(name)
        ? prev.filter((sport) => sport !== name)
        : [...prev, name]
    );
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
    const profileData = {
      first_name: firstName,
      age: parseInt(age, 10),
      city,
      sports: selectedSports,
    };

    saveStoredProfile(profileData);
    setStep('home');
  };

  const handleOpenCreateSession = () => {
    setStep('createSession');
  };

  const handleOpenProfile = () => {
    setEditingProfile(false);
    setStep('profile');
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

    saveStoredProfile({
      first_name: firstName,
      age: age === '' ? null : parseInt(age, 10),
      city,
      sports: selectedSports,
    });
    setEditingProfile(false);
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
    setActiveTab('live');
    setSessions([]);
    setSelectedSessionId(null);
    setLoginError('');
    setOtpError('');
    setIncomingRequest(null);
    setDismissedRequestIds([]);
    resetInstantFlow();
    setStep('login');
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

    const { error } =
      (await supabase.from('sessions').insert({
        sport: createSessionSport,
        session_type: createSessionType,
        scheduled_at: scheduledAt,
        venue,
        max_players: parsedMaxPlayers,
        slots_remaining: slotsRemaining,
        city,
      })) ?? {};

    if (error) {
      setCreateSessionError(error.message);
    } else {
      setCreateSessionSport('');
      setCreateSessionType('');
      setSessionDateTime('');
      setVenue('');
      setMaxPlayers('');
    }

    setStep('home');
  };

  const showMaxPlayers =
    createSessionType === 'Small Group' || createSessionType === 'Large Group';

  const isOneOnOneUnlocked =
    groupSessionsPlayed >= GROUP_SESSIONS_TO_UNLOCK_ONE_ON_ONE;

  const filteredPlayers = SAMPLE_PLAYERS.filter((player) => {
    if (findSportFilter && !player.sports.includes(findSportFilter)) {
      return false;
    }
    if (
      findSessionTypeFilter &&
      !player.sessionTypes.includes(findSessionTypeFilter)
    ) {
      return false;
    }
    return true;
  });

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
    resetInstantFlow();
    setStep('instantSport');
  };

  const handleInstantSelectSport = (sport) => {
    setInstantSport(sport);
    setStep('instantCount');
  };

  const handleInstantSelectCount = (count) => {
    setInstantPlayersNeeded(count);
    setStep('instantLocation');
  };

  const proceedBroadcast = useCallback(async () => {
    setInstantError('');

    try {
      const request = await createInstantRequest({
        sport: instantSport,
        playersNeeded: instantPlayersNeeded,
        locationPref: instantLocationPref,
        requesterName: firstName,
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
  }, [instantSport, instantPlayersNeeded, instantLocationPref, firstName]);

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
    if (!openToPlay || step !== 'home') return undefined;

    let active = true;
    const poll = async () => {
      try {
        const requests = await fetchOpenRequests();
        if (!active) return;

        const match = requests.find(
          (request) =>
            request.requester_name !== firstName &&
            (!request.sport || selectedSports.includes(request.sport)) &&
            request.id !== activeRequestId &&
            !dismissedRequestIds.includes(request.id)
        );

        if (match) {
          setIncomingRequest((prev) => prev ?? match);
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

  if (step === 'sessionDetail' && selectedSession) {
    return (
      <div className="session-detail">
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

          <button type="button" className="login__button session-detail__join">
            Join Session
          </button>
        </main>
      </div>
    );
  }

  if (step === 'profile') {
    const sessionsPlayedCount = sessions.filter(
      (session) => session.city && city && session.city === city
    ).length;

    return (
      <div className="profile">
        <header className="profile__header">
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

              <button type="submit" className="login__button">
                Save
              </button>
            </form>
          ) : (
            <>
              <div className="profile__identity">
                <h1 className="profile__name">{firstName}</h1>
                <p className="profile__meta">
                  {age && <span className="profile__age">{age}</span>}
                  <span className="profile__city">{city}</span>
                </p>
              </div>

              <div className="profile__stats">
                <div className="profile__stat">
                  <span className="profile__stat-value">
                    {sessionsPlayedCount}
                  </span>
                  <span className="profile__stat-label">Sessions Played</span>
                </div>
                <div className="profile__stat">
                  <span className="profile__stat-value">0</span>
                  <span className="profile__stat-label">Rating</span>
                </div>
              </div>

              {selectedSports.length > 0 && (
                <div className="profile__sports">
                  {selectedSports.map((sport) => (
                    <span key={sport} className="profile__sport-pill">
                      {sport}
                    </span>
                  ))}
                </div>
              )}

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
            </>
          )}
        </main>
      </div>
    );
  }

  if (step === 'createSession') {
    return (
      <div className="create">
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

  if (step === 'instantSport') {
    return (
      <div className="create">
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
          <p className="instant__step">Step 1 of 3</p>
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

  if (step === 'instantCount') {
    return (
      <div className="create">
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
          <p className="instant__step">Step 2 of 3</p>
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

  if (step === 'instantLocation') {
    return (
      <div className="create">
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
              <p className="instant__step">Step 3 of 3</p>
              <h2 className="instant__question">Where do you want to play?</h2>
              <VenueAutocomplete
                value={instantLocationPref}
                onVenueChange={(val) => setInstantLocationPref(val)}
                onAddressChange={() => {}}
                placeholder="Where do you want to play?"
              />
            </section>

            <div className="instant__summary">
              <span className="instant__summary-item">{instantSport}</span>
              <span className="instant__summary-item">
                {instantPlayersNeeded} player
                {instantPlayersNeeded === 1 ? '' : 's'}
              </span>
            </div>

            <button
              type="submit"
              className="login__button create__submit"
              disabled={!instantLocationPref.trim()}
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
      <div className="create">
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
            <span className="instant-search__pulse-ring" />
            <span className="instant-search__pulse-core" />
          </div>

          <h1 className="instant-search__title">Searching...</h1>
          <p className="instant-search__subtitle">
            Looking for {instantSport} players near {instantLocationPref}
          </p>

          <div className="instant-search__counter">
            <span className="instant-search__counter-value">
              {instantMatches.length}
            </span>
            <span className="instant-search__counter-label">
              of {instantPlayersNeeded} players joined
            </span>
          </div>

          <div className="instant-search__timer" aria-label="Time remaining">
            {formatCountdown(searchSecondsLeft)}
          </div>

          {instantMatches.length > 0 && (
            <div className="instant-search__players">
              {instantMatches.map((entry) => (
                <span key={entry.id} className="instant-search__player">
                  {entry.player_name}
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
      <div className="chat">
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
                  {name}
                </span>
              ))}
            </div>
          </div>
        </header>

        <main className="chat__messages">
          {chatMessages.length === 0 ? (
            <p className="chat__empty">Say hello to your new crew!</p>
          ) : (
            chatMessages.map((message) => {
              const isMine = message.sender_name === firstName;
              return (
                <div
                  key={message.id}
                  className={`chat__message${isMine ? ' chat__message--mine' : ''}`}
                >
                  {!isMine && (
                    <span className="chat__message-author">
                      {message.sender_name}
                    </span>
                  )}
                  <p className="chat__message-text">{message.text}</p>
                </div>
              );
            })
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

  if (step === 'home') {
    return (
      <div className="home">
        <header className="home__header">
          <SquadrLogo size="small" />
          <div className="home__header-actions">
            <button
              type="button"
              className={`home__toggle${openToPlay ? ' home__toggle--on' : ''}`}
              onClick={() => setOpenToPlay((prev) => !prev)}
              aria-pressed={openToPlay}
              aria-label="Open to Play"
            >
              <span className="home__toggle-text">Open to Play</span>
              <span className="home__toggle-track" aria-hidden="true">
                <span className="home__toggle-thumb" />
              </span>
            </button>
            <button
              type="button"
              className="home__profile"
              aria-label="Profile"
              onClick={handleOpenProfile}
            >
              <svg
                className="home__profile-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                aria-hidden="true"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M5 20c0-3.314 3.134-6 7-6s7 2.686 7 6" />
              </svg>
            </button>
          </div>
        </header>

        <nav className="home__tabs" aria-label="Home sections">
          <button
            type="button"
            className={`home__tab${activeTab === 'live' ? ' home__tab--active' : ''}`}
            onClick={() => setActiveTab('live')}
          >
            Live Sessions
          </button>
          <button
            type="button"
            className={`home__tab${activeTab === 'find' ? ' home__tab--active' : ''}`}
            onClick={() => setActiveTab('find')}
          >
            Find Players
          </button>
        </nav>

        <main className="home__main">
          {activeTab === 'live' ? (
            <div className="home__sessions">
              {sessionsLoading ? (
                <p className="home__loading">Loading sessions...</p>
              ) : sessions.length === 0 ? (
                <p className="home__empty">
                  No sessions near you yet. Be the first to create one!
                </p>
              ) : (
                sessions.map((session) => (
                  <article
                    key={session.id}
                    className="home__session-card home__session-card--clickable"
                    onClick={() => handleOpenSession(session.id)}
                  >
                    <div className="home__session-top">
                      <div className="home__session-heading">
                        <span className="home__session-type">
                          {session.sessionType.toUpperCase()}
                        </span>
                        <h2 className="home__session-sport">{session.sport}</h2>
                      </div>
                      <button
                        type="button"
                        className="home__session-join"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Join
                      </button>
                    </div>
                    <p className="home__session-detail">{session.time}</p>
                    <p className="home__session-detail">{session.location}</p>
                    <p className="home__session-detail">
                      {session.slotsLeft} slots left
                    </p>
                  </article>
                ))
              )}
            </div>
          ) : (
            <div className="find">
              <button
                type="button"
                className="find__instant-btn"
                onClick={handleOpenInstantFind}
              >
                <span className="find__instant-bolt" aria-hidden="true">
                  ⚡
                </span>
                Find Players Now
              </button>

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

              <div className="find__players">
                {filteredPlayers.map((player) => (
                  <article key={player.id} className="find__player-card">
                    <div className="find__player-top">
                      <div className="find__player-heading">
                        <h2 className="find__player-name">{player.firstName}</h2>
                        <p className="find__player-city">{player.city}</p>
                      </div>
                      <button type="button" className="find__invite-btn">
                        Invite to Play
                      </button>
                    </div>
                    <div className="find__player-sports">
                      {player.sports.map((sport) => (
                        <span key={sport} className="find__sport-pill">
                          {sport}
                        </span>
                      ))}
                    </div>
                    <p className="find__player-sessions">
                      {player.sessionsPlayed} sessions
                    </p>
                  </article>
                ))}
              </div>
            </div>
          )}
        </main>

        {activeTab === 'live' && (
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
                {incomingRequest.requester_name}
              </h2>
              <p className="incoming__sport">{incomingRequest.sport}</p>
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
          <h1 className="login__logo">
            <SquadrLogo size="large" />
          </h1>
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
          />
          <button type="submit" className="login__button">
            Send OTP
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
              />
              <button type="submit" className="login__button">
                Send Magic Link
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
            >
              Continue with Email
            </button>
          )}

          <button
            type="button"
            className="login__button login__button--secondary login__button--google"
            onClick={handleGoogleLogin}
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
        </div>

        {loginError && <p className="login__error login__error--auth">{loginError}</p>}
      </div>
    </div>
  );
}

export default App;
