import { useState, useRef } from 'react';
import './App.css';

const EMPTY_OTP = ['', '', '', '', '', ''];

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
  const inputRefs = useRef([]);

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!phone.trim()) return;
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

  const handleVerify = (e) => {
    e.preventDefault();
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
    // Sports submission will be wired up later
  };

  const handleResend = () => {
    setOtp(EMPTY_OTP);
    inputRefs.current[0]?.focus();
  };

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
        </form>
      </div>
    </div>
  );
}

export default App;
