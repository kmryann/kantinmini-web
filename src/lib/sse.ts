type SSEListener = (data: { event: string; payload: unknown }) => void;

class SSEBroadcaster {
  private listeners: Set<SSEListener> = new Set();

  subscribe(listener: SSEListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  broadcast(event: string, payload: unknown) {
    for (const listener of this.listeners) {
      try {
        listener({ event, payload });
      } catch (err) {
        console.error("Error in SSE listener:", err);
      }
    }
  }
}

const globalForSSE = globalThis as unknown as {
  sseBroadcaster: SSEBroadcaster | undefined;
};

export const sseBroadcaster =
  globalForSSE.sseBroadcaster ?? new SSEBroadcaster();

if (process.env.NODE_ENV !== "production") {
  globalForSSE.sseBroadcaster = sseBroadcaster;
}
