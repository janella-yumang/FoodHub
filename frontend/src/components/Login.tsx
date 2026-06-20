import { useState } from "react";

interface LoginProps {
  onLogin: (token: string, userId: string, role: string) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [name, setName] = useState("");
  const [userType, setUserType] = useState<"student" | "vendor">("student");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const data = await response.json() as { token: string; user: { _id: string; role: string } };
      onLogin(data.token, data.user._id, data.user.role);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role: userType }),
      });

      if (!response.ok) {
        throw new Error("Registration failed");
      }

      const data = await response.json() as { token: string; user: { _id: string; role: string } };
      onLogin(data.token, data.user._id, data.user.role);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
          <img src="/images/TUP logo.png" alt="TUP Logo" className="logo-img" />
        </div>

        <h1 className="login-title">{showRegister ? "Create Account" : "Welcome!"}</h1>

        <form onSubmit={showRegister ? handleRegister : handleLogin} className="login-form">
          {showRegister && (
            <div className="form-group">
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
          )}

          <div className="form-group">
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          {showRegister && (
            <div className="form-group register-type">
              <label>Account Type:</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="userType"
                    value="student"
                    checked={userType === "student"}
                    onChange={(e) => setUserType(e.target.value as "student")}
                    disabled={isLoading}
                  />
                  <span>Student (Food Buyer)</span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="userType"
                    value="vendor"
                    checked={userType === "vendor"}
                    onChange={(e) => setUserType(e.target.value as "vendor")}
                    disabled={isLoading}
                  />
                  <span>Vendor (Food Stall)</span>
                </label>
              </div>
            </div>
          )}

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? "Loading..." : showRegister ? "Register" : "Login"}
          </button>
        </form>

        <div className="login-footer">
          <button
            type="button"
            className="link-button"
            onClick={() => {
              setShowRegister(!showRegister);
              setError(null);
            }}
          >
            {showRegister ? "Already have an account? Login" : "Need an account? Register"}
          </button>
        </div>

        <p className="support-text">For support email to admin@tup.edu.np</p>
      </div>
    </div>
  );
}
