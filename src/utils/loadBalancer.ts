import { QueueWindow, QueueTicket, LoadBalanceStats } from '@/types';

export function calculateWindowLoad(
  window: QueueWindow,
  tickets: QueueTicket[]
): number {
  const windowTickets = tickets.filter(
    (t) => t.assignedWindowId === window.id && t.status === 'waiting'
  );
  const activeBonus = window.status === 'active' ? 0 : 100;
  const pausedBonus = window.status === 'paused' ? 200 : 0;

  const load =
    windowTickets.length * 10 +
    window.servingCount * 5 +
    window.averageWaitTime / 60 +
    activeBonus +
    pausedBonus;

  return load;
}

export function findLeastLoadedWindow(
  windows: QueueWindow[],
  tickets: QueueTicket[]
): QueueWindow | undefined {
  const activeWindows = windows.filter((w) => w.status === 'active');
  if (activeWindows.length === 0) {
    console.warn('[LoadBalancer] 没有可用的活跃窗口');
    return undefined;
  }

  let minLoad = Infinity;
  let leastLoaded: QueueWindow | undefined;

  for (const window of activeWindows) {
    const load = calculateWindowLoad(window, tickets);
    console.log(`[LoadBalancer] 窗口 ${window.windowNo} 负载值: ${load}`);

    if (load < minLoad) {
      minLoad = load;
      leastLoaded = window;
    }
  }

  if (leastLoaded) {
    console.log(`[LoadBalancer] 推荐窗口: ${leastLoaded.windowNo}，负载值: ${minLoad}`);
  }

  return leastLoaded;
}

export function redistributeTickets(
  windows: QueueWindow[],
  tickets: QueueTicket[]
): Map<string, string> {
  const redistributions = new Map<string, string>();
  const activeWindows = windows.filter((w) => w.status === 'active');
  if (activeWindows.length < 2) return redistributions;

  const windowLoads = new Map<string, number>();
  const windowTickets = new Map<string, QueueTicket[]>();

  for (const window of activeWindows) {
    const loads = tickets.filter(
      (t) => t.assignedWindowId === window.id && t.status === 'waiting'
    );
    windowLoads.set(window.id, calculateWindowLoad(window, tickets));
    windowTickets.set(window.id, loads);
  }

  let maxLoadWindow = activeWindows[0];
  let minLoadWindow = activeWindows[0];

  for (const window of activeWindows) {
    const load = windowLoads.get(window.id) || 0;
    if (load > (windowLoads.get(maxLoadWindow.id) || 0)) {
      maxLoadWindow = window;
    }
    if (load < (windowLoads.get(minLoadWindow.id) || 0)) {
      minLoadWindow = window;
    }
  }

  const loadDiff =
    (windowLoads.get(maxLoadWindow.id) || 0) - (windowLoads.get(minLoadWindow.id) || 0);

  if (loadDiff > 20) {
    const ticketsToMove = windowTickets.get(maxLoadWindow.id) || [];
    if (ticketsToMove.length > 0) {
      const ticket = ticketsToMove[ticketsToMove.length - 1];
      redistributions.set(ticket.id, minLoadWindow.id);
      console.log(
        `[LoadBalancer] 跨窗口调剂: 将 ${ticket.ticketNo} 从 ${maxLoadWindow.windowNo} 调剂到 ${minLoadWindow.windowNo}`
      );
    }
  }

  return redistributions;
}

export function getLoadBalanceStats(
  windows: QueueWindow[],
  tickets: QueueTicket[]
): LoadBalanceStats {
  const waitingTickets = tickets.filter((t) => t.status === 'waiting');
  const activeWindows = windows.filter((w) => w.status === 'active');

  const windowLoads = activeWindows.map((window) => {
    const windowWaiting = waitingTickets.filter(
      (t) => t.assignedWindowId === window.id
    );
    return {
      windowId: window.id,
      windowName: window.name,
      load: calculateWindowLoad(window, tickets),
      waitingCount: windowWaiting.length,
      status: window.status
    };
  });

  const sortedWindows = [...windowLoads].sort((a, b) => a.load - b.load);
  const recommendedWindow = sortedWindows[0];

  const avgWaitTime =
    activeWindows.length > 0
      ? activeWindows.reduce((sum, w) => sum + w.averageWaitTime, 0) /
        activeWindows.length
      : 0;

  console.log('[LoadBalancer] 负载均衡统计', {
    totalWaiting: waitingTickets.length,
    totalWindows: windows.length,
    activeWindows: activeWindows.length,
    avgWaitTime,
    recommendedWindow: recommendedWindow?.windowName
  });

  return {
    totalWaiting: waitingTickets.length,
    totalWindows: windows.length,
    activeWindows: activeWindows.length,
    averageWaitTime: avgWaitTime,
    recommendedWindowId: recommendedWindow?.windowId,
    windowLoads
  };
}

export function getLoadLevel(load: number): 'low' | 'medium' | 'high' | 'critical' {
  if (load < 15) return 'low';
  if (load < 30) return 'medium';
  if (load < 50) return 'high';
  return 'critical';
}
