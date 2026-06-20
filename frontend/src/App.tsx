import { useState, useEffect } from "react";
import { Login } from "./components/Login";
import { StallPicker } from "./components/StallPicker";
import { Menu } from "./components/Menu";
import { AdminDashboard } from "./components/AdminDashboard";

type AppView = "login" | "stall-picker" | "menu" | "admin";

function App() {
  const [view, setView] = useState<AppView>("login");
  const [token, setToken] = useState<string | null>(null);
  const [_userId, setUserId] = useState<string | null>(null);
  const [_role, setRole] = useState<string | null>(null);
  const [selectedStallId, setSelectedStallId] = useState<string | null>(null);
  const [selectedStallName, setSelectedStallName] = useState<string | null>(null);

  useEffect(() => {
    // Check for stored auth on mount
    const storedToken = localStorage.getItem("token");
    const storedUserId = localStorage.getItem("userId");
    const storedRole = localStorage.getItem("role");

    if (storedToken && storedUserId && storedRole) {
      setToken(storedToken);
      setUserId(storedUserId);
      setRole(storedRole);
      setView(storedRole === "admin" ? "admin" : "stall-picker");
    }
  }, []);

  const handleLogin = (newToken: string, newUserId: string, newRole: string) => {
    setToken(newToken);
    setUserId(newUserId);
    setRole(newRole);
    localStorage.setItem("token", newToken);
    localStorage.setItem("userId", newUserId);
    localStorage.setItem("role", newRole);
    setView(newRole === "admin" ? "admin" : "stall-picker");
  };

  const handleSelectStall = (stallId: string, stallName: string) => {
    setSelectedStallId(stallId);
    setSelectedStallName(stallName);
    setView("menu");
  };

  const handleBackToStallPicker = () => {
    setSelectedStallId(null);
    setSelectedStallName(null);
    setView("stall-picker");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    setToken(null);
    setUserId(null);
    setRole(null);
    setView("login");
  };

  const profileLabel = _role ? `${_role[0].toUpperCase()}${_role.slice(1)}` : "User";

  const appHeader = (
    <header className="app-header">
      <div className="header-content">
        <div className="header-brand">
          <img src="/images/TUP logo.png" alt="TUP Logo" className="brand-logo" />
          <div className="brand-title">
            <span className="brand-subtitle">TUP</span>
            <h2>FoodHub</h2>
          </div>
        </div>

        <nav className="app-nav" aria-label="Primary navigation">
          <a href="#home" className="nav-link">
            Home
          </a>
          <a href="#trends" className="nav-link">
            Trends
          </a>
          <a href="#about" className="nav-link">
            About
          </a>
        </nav>

        <div className="header-actions">
          <span className="profile-chip">{profileLabel}</span>
          <button className="profile-button" type="button">
            Profile
          </button>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </header>
  );

  return (
    <div className="app-container">
      {view === "login" && <Login onLogin={handleLogin} />}

      {view === "stall-picker" && token && (
        <div className="app-with-header">
          {appHeader}
          <main className="app-main">
            <StallPicker token={token} onSelectStall={handleSelectStall} />
          </main>
        </div>
      )}

      {view === "menu" && token && selectedStallId && selectedStallName && (
        <div className="app-with-header">
          {appHeader}
          <main className="app-main">
            <Menu
              token={token}
              stallId={selectedStallId}
              stallName={selectedStallName}
              onBack={handleBackToStallPicker}
            />
          </main>
        </div>
      )}

      {view === "admin" && token && (
        <div className="app-with-header">
          {appHeader}
          <main className="app-main">
            <AdminDashboard token={token} />
          </main>
        </div>
      )}
    </div>
  );
}

export default App;