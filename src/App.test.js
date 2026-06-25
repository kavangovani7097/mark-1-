import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('./supabase', () => ({
  supabaseUrl: 'https://test.supabase.co',
  supabaseAnonKey: 'test-anon-key',
  supabase: {
    auth: {
      signInWithOtp: jest.fn(),
      verifyOtp: jest.fn(),
    },
    from: jest.fn(),
  },
}));

import { supabase } from './supabase';
import App from './App';

const mockSessions = [
  {
    id: 'session-1',
    sport: 'Badminton',
    session_type: 'Small Group',
    scheduled_at: new Date().toISOString(),
    venue: 'Satellite',
    city: 'Ahmedabad',
    max_players: 6,
    slots_remaining: 3,
  },
  {
    id: 'session-2',
    sport: 'Cricket',
    session_type: 'Small Group',
    scheduled_at: new Date(Date.now() + 86400000).toISOString(),
    venue: 'Navrangpura',
    city: 'Ahmedabad',
    max_players: 10,
    slots_remaining: 5,
  },
  {
    id: 'session-3',
    sport: 'Football',
    session_type: '1-on-1',
    scheduled_at: new Date().toISOString(),
    venue: 'Bandra',
    city: 'Mumbai',
    max_players: 2,
    slots_remaining: 1,
  },
];

jest.mock('./supabase', () => ({
  supabaseUrl: 'https://test.supabase.co',
  supabaseAnonKey: 'test-anon-key',
  supabase: {
    auth: {
      signInWithOtp: jest.fn(),
      verifyOtp: jest.fn(),
    },
    from: jest.fn(),
  },
}));


beforeEach(() => {
  localStorage.clear();
  window.google = {
    maps: {
      places: {
        Autocomplete: jest.fn(function Autocomplete() {
          this.addListener = jest.fn();
          this.getPlace = jest.fn(() => ({}));
        }),
      },
      event: {
        clearInstanceListeners: jest.fn(),
      },
    },
  };
  supabase.auth.signInWithOtp.mockResolvedValue({ error: null });
  supabase.auth.verifyOtp.mockResolvedValue({
    data: { user: { id: 'test-user-id' } },
    error: null,
  });
  global.fetch = jest.fn((url) => {
    if (String(url).includes('/rest/v1/sessions')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockSessions),
      });
    }
    if (
      String(url).includes('/rest/v1/instant_requests') ||
      String(url).includes('/rest/v1/instant_matches') ||
      String(url).includes('/rest/v1/messages')
    ) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
      });
    }
    return Promise.reject(new Error(`Unhandled fetch: ${url}`));
  });
  supabase.from.mockImplementation((table) => {
    if (table === 'sessions') {
      return {
        insert: jest.fn().mockResolvedValue({ error: null }),
      };
    }
    return {};
  });
});

async function sendOtp() {
  await userEvent.type(screen.getByPlaceholderText('Phone number'), '5551234567');
  await userEvent.click(screen.getByRole('button', { name: 'Send OTP' }));
  await screen.findByRole('button', { name: 'Verify' });
}

async function verifyOtp() {
  await sendOtp();
  await userEvent.click(screen.getByRole('button', { name: 'Verify' }));
  await screen.findByText('Tell us about you');
}

async function goToHomeScreen() {
  await verifyOtp();
  await userEvent.type(screen.getByPlaceholderText('First Name'), 'Alex');
  await userEvent.type(screen.getByPlaceholderText('Age'), '25');
  await userEvent.selectOptions(screen.getByRole('combobox'), 'Mumbai');
  await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
  await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
  await screen.findByRole('button', { name: 'Live Sessions' });
  await screen.findByRole('heading', { name: 'Badminton' });
}

test('renders login page', () => {
  render(<App />);
  expect(screen.getByRole('img', { name: 'Squadr' })).toBeInTheDocument();
  expect(screen.getByText('Find your crew. Play your sport.')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('Phone number')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Send OTP' })).toBeInTheDocument();
});

test('shows OTP screen after sending code', async () => {
  render(<App />);
  await sendOtp();

  expect(screen.getByText('Enter the 6-digit code sent to 5551234567')).toBeInTheDocument();
  expect(screen.getAllByRole('textbox')).toHaveLength(6);
  expect(screen.getByRole('button', { name: 'Verify' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Resend OTP' })).toBeInTheDocument();
});

test('shows onboarding screen after verifying OTP', async () => {
  render(<App />);
  await verifyOtp();

  expect(screen.getByText('Tell us about you')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('First Name')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('Age')).toBeInTheDocument();
  expect(screen.getByRole('combobox')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
});

test('shows sports selection screen after onboarding', async () => {
  render(<App />);
  await verifyOtp();
  await userEvent.type(screen.getByPlaceholderText('First Name'), 'Alex');
  await userEvent.type(screen.getByPlaceholderText('Age'), '25');
  await userEvent.selectOptions(screen.getByRole('combobox'), 'Mumbai');
  await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

  expect(screen.getByText('What do you play?')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Badminton' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Pickleball' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Bowling' })).toBeInTheDocument();
  expect(screen.getByPlaceholderText("Don't see your sport? Add it")).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: 'Tennis' }));
  expect(screen.getByRole('button', { name: 'Tennis' })).toHaveClass('login__sport-card--selected');

  await userEvent.type(
    screen.getByPlaceholderText("Don't see your sport? Add it"),
    'Squash{enter}'
  );
  expect(screen.getByRole('button', { name: 'Squash' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Squash' })).toHaveClass('login__sport-card--selected');
});

test('shows home screen after completing onboarding', async () => {
  render(<App />);
  await goToHomeScreen();

  expect(screen.getByRole('button', { name: 'Profile' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Live Sessions' })).toHaveClass('home__tab--active');
  expect(screen.getByRole('button', { name: 'Find Players' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Badminton' })).toBeInTheDocument();
  expect(screen.getAllByText('SMALL GROUP')).toHaveLength(2);
  expect(screen.getByText('1-ON-1')).toBeInTheDocument();
  expect(screen.getByText('Satellite, Ahmedabad')).toBeInTheDocument();
  expect(screen.getByText('3 slots left')).toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: 'Join' })).toHaveLength(3);
  expect(screen.getByRole('button', { name: 'Create new session' })).toBeInTheDocument();
});

test('shows create session screen from home fab', async () => {
  render(<App />);
  await goToHomeScreen();

  await userEvent.click(screen.getByRole('button', { name: 'Create new session' }));

  expect(screen.getByRole('heading', { name: 'Create Session' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Go back' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Badminton' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '1-on-1' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Small Group' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Large Group' })).toBeInTheDocument();
  expect(await screen.findByPlaceholderText('Where are you playing?')).toBeInTheDocument();
  expect(screen.queryByPlaceholderText('Max players')).not.toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: 'Small Group' }));
  expect(screen.getByPlaceholderText('Max players')).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: 'Go back' }));
  expect(screen.getByRole('button', { name: 'Live Sessions' })).toBeInTheDocument();
});

test('shows profile screen from home profile icon', async () => {
  render(<App />);
  await goToHomeScreen();
  await userEvent.click(screen.getByRole('button', { name: 'Profile' }));

  expect(screen.getByRole('button', { name: 'Go back' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Alex' })).toBeInTheDocument();
  expect(screen.getByText('Mumbai')).toBeInTheDocument();
  expect(screen.getByText('Sessions Played')).toBeInTheDocument();
  expect(screen.getByText('Sessions Hosted')).toBeInTheDocument();
  expect(screen.queryByText('Would Play Again %')).not.toBeInTheDocument();
  expect(screen.getByText('My Crew')).toBeInTheDocument();
  expect(
    screen.getByText('Play with someone to add them to your crew')
  ).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Edit Profile' })).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: 'Go back' }));
  expect(screen.getByRole('button', { name: 'Live Sessions' })).toBeInTheDocument();
});

test('shows selected sports as pills on profile', async () => {
  render(<App />);
  await verifyOtp();
  await userEvent.type(screen.getByPlaceholderText('First Name'), 'Alex');
  await userEvent.type(screen.getByPlaceholderText('Age'), '25');
  await userEvent.selectOptions(screen.getByRole('combobox'), 'Mumbai');
  await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
  await userEvent.click(screen.getByRole('button', { name: 'Tennis' }));
  await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
  await screen.findByRole('button', { name: 'Live Sessions' });
  await userEvent.click(screen.getByRole('button', { name: 'Profile' }));

  expect(screen.getByText('Tennis')).toBeInTheDocument();
});

test('shows find players tab with filters and player cards', async () => {
  render(<App />);
  await goToHomeScreen();

  await userEvent.click(screen.getByRole('button', { name: 'Find Players' }));

  expect(screen.getByRole('combobox', { name: 'Filter by sport' })).toBeInTheDocument();
  expect(screen.getByRole('group', { name: 'Filter by session type' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '1-on-1' })).toBeDisabled();
  expect(screen.getByRole('button', { name: '1-on-1' })).toHaveAttribute(
    'title',
    'Unlock after 4 group sessions'
  );
  expect(screen.getByRole('heading', { name: 'Priya' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Rohan' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Meera' })).toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: 'Invite to Play' })).toHaveLength(3);
  expect(screen.getByText('24 sessions')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Create new session' })).not.toBeInTheDocument();

  await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Filter by sport' }), 'Yoga');
  expect(screen.queryByRole('heading', { name: 'Priya' })).not.toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Meera' })).toBeInTheDocument();
});

test('opens session detail when tapping a session card', async () => {
  render(<App />);
  await goToHomeScreen();

  await userEvent.click(screen.getByRole('heading', { name: 'Badminton' }));

  expect(screen.getByRole('button', { name: 'Go back' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Badminton' })).toBeInTheDocument();
  expect(screen.getByText('SMALL GROUP')).toBeInTheDocument();
  expect(screen.getByText('Satellite, Ahmedabad')).toBeInTheDocument();
  expect(screen.getByText('3 of 6 slots remaining')).toBeInTheDocument();
  expect(screen.getByText("Who's Coming")).toBeInTheDocument();
  expect(screen.getByText('Group Chat')).toBeInTheDocument();
  expect(screen.getByText('No messages yet.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Join Session' })).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: 'Go back' }));
  expect(screen.getByRole('button', { name: 'Live Sessions' })).toBeInTheDocument();
});

test('does not open session detail when tapping join on card', async () => {
  render(<App />);
  await goToHomeScreen();

  await userEvent.click(screen.getAllByRole('button', { name: 'Join' })[0]);

  expect(screen.queryByRole('button', { name: 'Join Session' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Live Sessions' })).toBeInTheDocument();
});
