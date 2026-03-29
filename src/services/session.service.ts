const sessions: Record<
  string,
  { history: { role: string; content: string }[]; lastUpdate: number }
> = {};

export class SessionService {
  getSession(userId: string) {
    const now = Date.now();

    if (
      sessions[userId] &&
      now - sessions[userId].lastUpdate < 24 * 60 * 60 * 1000
    ) {
      return sessions[userId];
    }

    sessions[userId] = { history: [], lastUpdate: now };
    return sessions[userId];
  }

  updateSession(userId: string, role: string, content: string) {
    const session = this.getSession(userId);
    session.history.push({ role, content });
    session.lastUpdate = Date.now();

    // limitar memoria para no crecer infinito
    if (session.history.length > 20) {
      session.history.splice(0, 10);
    }
  }
}

export default new SessionService();