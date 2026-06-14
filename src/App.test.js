import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

test('renders login page', () => {
  render(<App />);
  expect(screen.getByText('MARK 1')).toBeInTheDocument();
  expect(screen.getByText('Find your people. Play your sport.')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('Phone number')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Send OTP' })).toBeInTheDocument();
});

test('shows OTP screen after sending code', async () => {
  render(<App />);

  await userEvent.type(screen.getByPlaceholderText('Phone number'), '5551234567');
  await userEvent.click(screen.getByRole('button', { name: 'Send OTP' }));

  expect(screen.getByText('Enter the 6-digit code sent to 5551234567')).toBeInTheDocument();
  expect(screen.getAllByRole('textbox')).toHaveLength(6);
  expect(screen.getByRole('button', { name: 'Verify' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Resend OTP' })).toBeInTheDocument();
});

test('shows onboarding screen after verifying OTP', async () => {
  render(<App />);

  await userEvent.type(screen.getByPlaceholderText('Phone number'), '5551234567');
  await userEvent.click(screen.getByRole('button', { name: 'Send OTP' }));
  await userEvent.click(screen.getByRole('button', { name: 'Verify' }));

  expect(screen.getByText('Tell us about you')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('First Name')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('Age')).toBeInTheDocument();
  expect(screen.getByRole('combobox')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
});

test('shows sports selection screen after onboarding', async () => {
  render(<App />);

  await userEvent.type(screen.getByPlaceholderText('Phone number'), '5551234567');
  await userEvent.click(screen.getByRole('button', { name: 'Send OTP' }));
  await userEvent.click(screen.getByRole('button', { name: 'Verify' }));
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
