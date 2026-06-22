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

const sessionsOrderMock = jest
  .fn()
  .mockResolvedValue({ data: mockSessions, error: null });

const sessionsSelectMock = jest.fn().mockReturnValue({
  order: sessionsOrderMock,
});

const sessionsInsertMock = jest.fn().mockResolvedValue({ error: null });

const sessionsTableMock = {
  select: sessionsSelectMock,
  insert: sessionsInsertMock,
};

export const supabase = {
  auth: {
    signInWithOtp: jest.fn().mockResolvedValue({ error: null }),
    verifyOtp: jest.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    }),
  },
  from: jest.fn((table) => {
    if (table === 'sessions') {
      return sessionsTableMock;
    }
    return {
      upsert: jest.fn().mockResolvedValue({ error: null }),
    };
  }),
};
