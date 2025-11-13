import { useState } from "react";

const API = "http://localhost:4000"; // backend server URL
const AVATARS = Array.from({ length: 8 }, (_, i) => `/images/avatars/avatar${i + 1}.jpg`);

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [loading, setLoading] = useState(false);

  // --- LOGIN FUNCTION ---
  async function handleLogin() {
    if (!username) {
      alert("Please enter a username");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (data.success) {
        // ✅ Save user data in browser localStorage
        localStorage.setItem("nits_user", data.username);
        localStorage.setItem("nits_role", data.role || "user");
        localStorage.setItem("nits_avatar", selectedAvatar);

        // Optionally send avatar to backend for storage
        try {
          await fetch(`${API}/api/profile`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: data.username },
            body: JSON.stringify({ avatar: selectedAvatar }),
          });
        } catch (e) {
          console.warn("Profile update failed:", e);
        }

        // Redirect to homepage
        window.location.href = "/";
      } else {
        alert("Login failed. Check your credentials.");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Unable to login. Check server connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", textAlign: "center", color: "white" }}>
      <h1 style={{ marginBottom: 20 }}>Welcome to NITS Community 👋</h1>
      <p>Login or stay anonymous. Choose an avatar!</p>

      {/* Username */}
      <input
        type="text"
        placeholder="Enter username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{
          width: "100%",
          padding: 10,
          borderRadius: 8,
          border: "1px solid #444",
          marginTop: 10,
        }}
      />

      {/* Password field appears ONLY for admin */}
      {username === "neelakshi_admin" && (
        <input
          type="password"
          placeholder="Enter admin password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 8,
            border: "1px solid #444",
            marginTop: 10,
          }}
        />
      )}

      {/* Avatar selection grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 10,
          marginTop: 20,
        }}
      >
        {AVATARS.map((src, i) => (
          <div
            key={i}
            onClick={() => setSelectedAvatar(src)}
            style={{
              border: selectedAvatar === src ? "2px solid #60a5fa" : "2px solid transparent",
              padding: 4,
              borderRadius: 10,
              cursor: "pointer",
              backgroundColor: selectedAvatar === src ? "#1e293b" : "transparent",
            }}
          >
            <img src={src} alt={`Avatar ${i + 1}`} style={{ width: "100%", borderRadius: 10 }} />
          </div>
        ))}
      </div>

      {/* Login button */}
      <button
        onClick={handleLogin}
        disabled={loading}
        style={{
          marginTop: 20,
          backgroundColor: "#2563eb",
          color: "white",
          padding: "10px 20px",
          border: "none",
          borderRadius: 10,
          cursor: "pointer",
          fontSize: 16,
        }}
      >
        {loading ? "Logging in..." : "Continue"}
      </button>
    </div>
  );
}
