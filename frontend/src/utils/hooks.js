import { useCallback, useEffect, useRef, useState } from "react";
import { errMsg } from "./api";

// Run `fn` now and then every `ms` milliseconds (paused while the tab is hidden).
export function usePolling(fn, ms, deps = []) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    let alive = true;
    const tick = () => { if (alive && !document.hidden) ref.current(); };
    tick();
    const id = setInterval(tick, ms);
    return () => { alive = false; clearInterval(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ms, ...deps]);
}

// Load data once (and on demand). `loader` must return a promise resolving to the data to store.
export function useLoad(loader, initial = null) {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const ref = useRef(loader);
  ref.current = loader;

  const reload = useCallback(async () => {
    try {
      setError("");
      setData(await ref.current());
    } catch (e) {
      setError(errMsg(e, "Failed to load data"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);
  return { data, loading, error, reload, setData };
}
