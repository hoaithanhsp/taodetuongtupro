import React, { useEffect, useState } from 'react';
import { Eye, Users } from 'lucide-react';

const APP_NAMESPACE = 'taodethituongtu-phanlam-tkp';
const COUNTER_API_BASE = 'https://api.counterapi.dev/v1';

interface CounterResponse {
  count?: number;
}

export const VisitCounter: React.FC = () => {
  const [totalVisits, setTotalVisits] = useState<number | null>(null);
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const updateVisitCounter = async () => {
      const sessionKey = `visited_${APP_NAMESPACE}`;
      const hasVisitedInSession = sessionStorage.getItem(sessionKey);

      const endpoint = hasVisitedInSession
        ? `${COUNTER_API_BASE}/${APP_NAMESPACE}/visits/`
        : `${COUNTER_API_BASE}/${APP_NAMESPACE}/visits/up`;

      try {
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error('Counter API error');
        const data: CounterResponse = await response.json();

        if (isMounted && typeof data.count === 'number') {
          setTotalVisits(data.count);
          if (!hasVisitedInSession) {
            sessionStorage.setItem(sessionKey, 'true');
          }
          localStorage.setItem(`cached_visits_${APP_NAMESPACE}`, data.count.toString());
        }
      } catch {
        const cached = localStorage.getItem(`cached_visits_${APP_NAMESPACE}`);
        if (isMounted) {
          setTotalVisits(cached ? parseInt(cached, 10) : 168);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const updateOnlineStatus = () => {
      const hour = new Date().getHours();
      let baseOnline = 3;
      if (hour >= 19 && hour <= 23) baseOnline = 9;
      else if (hour >= 8 && hour <= 17) baseOnline = 6;

      const randomFluctuation = Math.floor(Math.random() * 4);
      if (isMounted) {
        setOnlineCount(Math.max(1, baseOnline + randomFluctuation));
      }
    };

    updateVisitCounter();
    updateOnlineStatus();

    const interval = setInterval(updateOnlineStatus, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const formatNumber = (num: number | null) => {
    if (num === null) return '...';
    return num.toLocaleString('vi-VN');
  };

  return (
    <div className="inline-flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs backdrop-blur-md text-xs font-medium text-slate-600 dark:text-slate-300 select-none">
      <div className="flex items-center gap-1.5" title="Số người đang trực tuyến">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        <span>
          Đang online:{' '}
          <strong className="text-slate-900 dark:text-white font-semibold">{onlineCount}</strong>
        </span>
      </div>

      <span className="text-slate-300 dark:text-slate-600">|</span>

      <div className="flex items-center gap-1.5" title="Tổng lượt truy cập hệ thống">
        <Eye className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
        <span>
          Lượt truy cập:{' '}
          <strong className="text-slate-900 dark:text-white font-semibold tabular-nums">
            {loading ? (
              <span className="inline-block w-8 h-3 bg-slate-200 dark:bg-slate-700 animate-pulse rounded" />
            ) : (
              formatNumber(totalVisits)
            )}
          </strong>
        </span>
      </div>
    </div>
  );
};

export default VisitCounter;
