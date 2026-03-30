import { redis } from "../config/redis";

const PREFIX = "user:";

export const getUserState = async (user: string) => {
  const data = await redis.get(`${PREFIX}${user}`);

  if (!data) return null;

  return JSON.parse(data);
};

export const setUserState = async (user: string, state: any) => {
  const key = `${PREFIX}${user}`;

  await redis.set(key, JSON.stringify(state), "EX", 3600); // ⏱ 1 hora

  const saved = await redis.get(key);
};