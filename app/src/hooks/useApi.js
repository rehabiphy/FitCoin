import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

/**
 * Loads data for a screen and reloads it whenever the screen comes back into focus.
 *   const { data, loading, error, reload, setData } = useApi(() => api.thing(id), [id]);
 * `loading` is only true for the first load, so refreshes don't flash spinners.
 */
export default function useApi(fetcher, deps = [], { focus = true } = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const mounted = useRef(true);
  const loadedOnce = useRef(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fetcher, deps);

  const reload = useCallback(async () => {
    if (loadedOnce.current) {
      setRefreshing(true);
    }
    try {
      const result = await run();
      if (mounted.current) {
        setData(result);
        setError(null);
      }
      return result;
    } catch (err) {
      if (mounted.current) {
        setError(err);
      }
      return null;
    } finally {
      loadedOnce.current = true;
      if (mounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [run]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Without focus refresh, load once per dependency change
  useEffect(() => {
    if (!focus) {
      reload();
    }
  }, [focus, reload]);

  useFocusEffect(
    useCallback(() => {
      if (focus) {
        reload();
      }
    }, [focus, reload]),
  );

  return { data, error, loading, refreshing, reload, setData };
}
