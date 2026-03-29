interface UserState {
  stage: string | null;
}

const state: Record<string, UserState> = {};

export const getUserState = (user: string) => {
  if (!state[user]) {
    state[user] = { stage: null };
  }
  return state[user];
};

export const setUserState = (user: string, stage: string | null) => {
  state[user] = { stage };
};