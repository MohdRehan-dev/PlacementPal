import { useCallback, useEffect, useState } from "react";
import { useApp } from "./context";
export function useResource(path, key) {
  const { request, user, demo } = useApp();
  const [data, setData] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const refresh = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      setData((await request(path))[key]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [path, key, user, demo]);
  useEffect(() => {
    refresh();
  }, [refresh]);
  return { data, loading, error, refresh };
}
