interface UserState {
  stage: string | null;
  ticketId?: string;
  media?: any
}

const state: Record<string, UserState> = {};

export const getUserState = (user: string): UserState => {
  if (!state[user]) {
    state[user] = { stage: null };
  }
  return state[user];
};

export const setUserState = (user: string, newState: UserState | null) => {
  if (!newState) {
    state[user] = { stage: null };
    return;
  }

  state[user] = newState;
};