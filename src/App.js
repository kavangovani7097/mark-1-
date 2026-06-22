import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase, supabaseUrl, supabaseAnonKey } from './supabase';
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

function App() {
  const [phone, setPhone] = useState('');
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
  const inputRefs = useRef([]);

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
    const { data, error } =
      (await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp.join(''),
        type: 'sms',
      })) ?? {};

    if (error) {
      setOtpError(error.message);
    } else if (data?.user) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        phone: formattedPhone,
      });

      if (profileError) {
        setOtpError(profileError.message);
      }
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
    setStep('home');
  };

  const handleOpenCreateSession = () => {
    setStep('createSession');
  };

  const handleOpenProfile = () => {
    setStep('profile');
  };

  const handleBackToHome = () => {
    setStep('home');
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
        </header>

        <main className="profile__main">
          <div className="profile__identity">
            <h1 className="profile__name">{firstName}</h1>
            <p className="profile__city">{city}</p>
          </div>

          <div className="profile__stats">
            <div className="profile__stat">
              <span className="profile__stat-value">0</span>
              <span className="profile__stat-label">Sessions Played</span>
            </div>
            <div className="profile__stat">
              <span className="profile__stat-value">0</span>
              <span className="profile__stat-label">Sessions Hosted</span>
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

          <button type="button" className="login__button profile__edit">
            Edit Profile
          </button>
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
              <input
                type="text"
                className="login__input"
                placeholder="Where are you playing?"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
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

  if (step === 'home') {
    return (
      <div className="home">
        <header className="home__header">
          <span className="home__brand">MARK 1</span>
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
      </div>
    );
  }

  if (step === 'sports') {
    return (
      <div className="login">
        <div className="login__content login__content--wide">
          <h1 className="login__logo">MARK 1</h1>
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
          <h1 className="login__logo">MARK 1</h1>
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
          <h1 className="login__logo">MARK 1</h1>
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
        <h1 className="login__logo">MARK 1</h1>
        <p className="login__tagline">Find your people. Play your sport.</p>

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
          {loginError && <p className="login__error">{loginError}</p>}
        </form>
      </div>
    </div>
  );
}

export default App;
