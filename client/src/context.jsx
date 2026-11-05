import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";
import { demoRequest, loadDemo } from "./demo";
const api = axios.create({ baseURL: "/api", timeout: 60000 });
const Context = createContext(null);
export const useApp = () => useContext(Context);
export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [demo, setDemo] = useState(false);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState(null);
  const notify = (message, error = false) => setToast({ message, error });
  useEffect(() => {
    if (toast) {
      const id = setTimeout(() => setToast(null), 4500);
      return () => clearTimeout(id);
    }
  }, [toast]);
  useEffect(() => {
    const role = sessionStorage.getItem("placementpal-demo-role");
    if (role) {
      const data = loadDemo();
      setUser({
        ...data.student,
        role,
        name:
          role === "admin"
            ? data.officer?.name || "Placement Officer"
            : data.student.name,
        ...(role === "admin"
          ? {
              _id: "demo-officer",
              email: "admin@placementpal.demo",
              phone: data.officer?.phone || "",
            }
          : {}),
      });
      setDemo(true);
      setReady(true);
      return;
    }
    api
      .get("/auth/me")
      .then(({ data }) => setUser(data.user))
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);
  async function request(path, options = {}) {
    if (demo) return demoRequest(path, options, user);
    try {
      const { data } = await api.request({
        url: path,
        method: options.method || "GET",
        data: options.body,
      });
      return data;
    } catch (error) {
      if (error.response?.status === 401 && !path.startsWith("/auth/"))
        setUser(null);
      throw new Error(
        error.response?.data?.message ||
          (error.response
            ? "Request failed."
            : "Cannot reach the API. Try again."),
      );
    }
  }

  function enterDemo(role = "student") {
    const data = loadDemo();
    sessionStorage.setItem("placementpal-demo-role", role);
    setDemo(true);
    setUser({
      ...data.student,
      role,
      name:
        role === "admin"
          ? data.officer?.name || "Placement Officer"
          : data.student.name,
      ...(role === "admin"
        ? {
            _id: "demo-officer",
            email: "admin@placementpal.demo",
            phone: data.officer?.phone || "",
          }
        : {}),
    });
  }
  async function logout() {
    if (!demo) await request("/auth/logout", { method: "POST", body: {} });
    sessionStorage.removeItem("placementpal-demo-role");
    setDemo(false);
    setUser(null);
  }
  return (
    <Context.Provider
      value={{ user, setUser, demo, ready, request, notify, enterDemo, logout }}
    >
      {children}
      {toast && (
        <div className={`toast ${toast.error ? "error" : ""}`} role="status">
          {toast.message}
          <button
            onClick={() => setToast(null)}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      )}
    </Context.Provider>
  );
}
