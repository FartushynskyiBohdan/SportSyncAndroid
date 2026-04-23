// In-memory SSE hub: maps user_id → Set<Response>.
// Each Response is an Express res kept open with SSE headers so we can
// push JSON events whenever something relevant happens for that user.

const clients = new Map();
const HEARTBEAT_MS = 25_000;

function subscribe(userId, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write('retry: 5000\n\n');
  res.write(': connected\n\n');

  let set = clients.get(userId);
  if (!set) {
    set = new Set();
    clients.set(userId, set);
  }
  set.add(res);

  const heartbeat = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      // Socket might already be dead; cleanup runs on close.
    }
  }, HEARTBEAT_MS);

  const cleanup = () => {
    clearInterval(heartbeat);
    const current = clients.get(userId);
    if (current) {
      current.delete(res);
      if (current.size === 0) clients.delete(userId);
    }
  };

  res.on('close', cleanup);
  res.on('error', cleanup);
}

function publish(userId, event, data) {
  const set = clients.get(userId);
  if (!set || set.size === 0) return;
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of set) {
    try {
      res.write(payload);
    } catch {
      // Broken connection will be evicted via the close handler.
    }
  }
}

module.exports = { subscribe, publish };
