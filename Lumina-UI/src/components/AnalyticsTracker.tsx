'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const startTimeRef = useRef<number>(Date.now());
  const sessionIdRef = useRef<string>('');

  useEffect(() => {
    // Ignore internal admin routes to keep patient visitor traffic clean
    if (pathname && pathname.startsWith('/admin')) {
      return;
    }

    // 1. Initialize or retrieve session ID
    let sid = '';
    try {
      sid = sessionStorage.getItem('lumina_analytics_session_id') || '';
      if (!sid) {
        sid = `vis-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        sessionStorage.setItem('lumina_analytics_session_id', sid);
      }
    } catch {
      sid = `vis-${Date.now()}`;
    }
    sessionIdRef.current = sid;

    const deviceType =
      typeof window !== 'undefined' && window.innerWidth < 768
        ? 'mobile'
        : typeof window !== 'undefined' && window.innerWidth < 1024
        ? 'tablet'
        : 'desktop';

    // 2. Track Page View
    const trackEvent = (eventType: string, extra: Record<string, unknown> = {}) => {
      try {
        const payload = {
          event_type: eventType,
          page_path: pathname || '/',
          session_id: sessionIdRef.current,
          referrer: typeof document !== 'undefined' ? document.referrer : '',
          device_type: deviceType,
          ...extra,
        };

        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
          const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
          navigator.sendBeacon('/api/analytics/track', blob);
        } else {
          fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: true,
          }).catch(() => {});
        }
      } catch {
        // fail silently
      }
    };

    trackEvent('page_view');

    // 3. Global Click Listener for Interactive Elements
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const clickable = target.closest('button, a, [data-testid], input[type="submit"]');
      if (clickable) {
        const testId = clickable.getAttribute('data-testid');
        const id = clickable.id;
        const text = (clickable.textContent || '').trim().slice(0, 80);
        const ariaLabel = clickable.getAttribute('aria-label');

        const label = text || ariaLabel || testId || id || 'Interactive Button';

        trackEvent('click', {
          element_id: testId || id || clickable.tagName.toLowerCase(),
          element_text: label,
        });
      }
    };

    document.addEventListener('click', handleClick, { passive: true });

    // 4. Track Session Duration / Time Spent
    const sendDurationPing = () => {
      const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
      if (durationSeconds > 1) {
        trackEvent('session_end', { duration_seconds: durationSeconds });
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        sendDurationPing();
      }
    };

    window.addEventListener('beforeunload', sendDurationPing);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('click', handleClick);
      window.removeEventListener('beforeunload', sendDurationPing);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      sendDurationPing();
    };
  }, [pathname]);

  return null;
}
