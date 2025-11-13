import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Postcard from "../components/Postcard";

const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";
const AVATARS = Array.from({ length: 8 }, (_, i) => `/images/avatars/avatar${i + 1}.jpg`);

export default function UserPage() {
  const [profile, setProfile] = useState(null);
  const [myPosts, setMyPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingAvatar, setSavingAvatar] = useState(false);

  // read username safely (client-only)
  const getUsername = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("nits_user") || null;
  };

  const username = getUsername() || "anonymous";

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setLoading(true);
      try {
        // load all posts, then filter by author
        const r = await fetch(`${API}/api/posts`);
        const j = await r.json();
        const posts = j.posts || [];
        const mine = posts.filter((p) => p.author === username);
        if (mounted) setMyPosts(mine);

        // load profile (avatar) if possible
        if (username && username !== "anonymous") {
          try {
            const r2 = await fetch(`${API}/api/profile/${encodeURIComponent(username)}`);
            const j2 = await r2.json();
            if (mounted) setProfile(j2.profile || null);
            // ensure localStorage has avatar too
            if (j2.profile && j2.profile.avatar && typeof window !== "undefined") {
              localStorage.setItem("nits_avatar", j2.profile.avatar);
            }
          } catch (e) {
            // ignore profile fetch error
          }
        } else {
          // if anonymous, try to get avatar from localStorage
          if (typeof window !== "undefined") {
            const a = localStorage.getItem("nits_avatar");
            if (a) setProfile({ avatar: a });
          }
        }
      } catch (err) {
        console.error("Failed to load user data", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();
    return () => { mounted = false; };
  }, [username]);

  // deletePost: only author or admin (server checks Authorization header)
  async function deletePost(id) {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    try {
      const res = await fetch(`${API}/api/posts/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": username
        },
      });
      const data = await res.json();
      if (data.ok) {
        setMyPosts((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert(data.error || "Could not delete post");
      }
    } catch (err) {
      console.error("Delete failed", err);
      alert("Server error. Try again later.");
    }
  }

  // pickAvatar: choose one of the provided avatars and save to server + localStorage
  async function pickAvatar(a) {
    if (!username || username === "anonymous") {
      alert("Set a username first (login) to save an avatar.");
      return;
    }
    setSavingAvatar(true);
    try {
      localStorage.setItem("nits_avatar", a);
      const r = await fetch(`${API}/api/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": username },
        body: JSON.stringify({ avatar: a }),
      });
      const j = await r.json();
      if (j.ok) {
        setProfile(j.profile || { avatar: a });
        alert("Avatar updated");
      } else {
        alert("Profile update failed");
      }
    } catch (err) {
      console.error("Avatar save error", err);
      alert("Could not save avatar (network)");
    } finally {
      setSavingAvatar(false);
    }
  }

  return (
    <>
      <Navbar onSearch={(q) => (window.location.href = `/search?q=${encodeURIComponent(q)}`)} />
      <div className="container" style={{ paddingTop: 18 }}>
        <h3 style={{ marginBottom: 12 }}>Your profile & uploads — {username}</h3>

        <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 18 }}>
          <div style={{ minWidth: 120 }}>
            <div style={{ fontSize: 13, marginBottom: 8 }}>Current avatar</div>
            <img
              src={profile && profile.avatar ? profile.avatar : (typeof window !== "undefined" ? localStorage.getItem("nits_avatar") || "/images/user.jpg" : "/images/user.jpg")}
              alt="avatar"
              style={{ width: 108, height: 108, borderRadius: 12, objectFit: "cover", border: "1px solid rgba(255,255,255,0.04)" }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, marginBottom: 8 }}>Choose from official avatars</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {AVATARS.map((a) => (
                <div
                  key={a}
                  onClick={() => pickAvatar(a)}
                  style={{
                    cursor: "pointer",
                    padding: 6,
                    borderRadius: 8,
                    border: profile && profile.avatar === a ? "2px solid #60a5fa" : "1px solid rgba(255,255,255,0.03)",
                    background: profile && profile.avatar === a ? "rgba(96,165,250,0.06)" : "transparent",
                  }}
                >
                  <img src={a} alt="avatar" style={{ width: "100%", borderRadius: 8 }} />
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10 }}>
              <button className="btn" onClick={() => {
                // quick logout / clear localStorage
                localStorage.removeItem("nits_user");
                localStorage.removeItem("nits_avatar");
                localStorage.removeItem("nits_role");
                window.location.href = "/login";
              }}>
                Logout
              </button>
            </div>
          </div>
        </div>

        <hr style={{ border: "none", height: 1, background: "rgba(255,255,255,0.03)", margin: "12px 0 18px" }} />

        <div>
          <h4 style={{ marginTop: 0 }}>Your posts</h4>
          {loading ? (
            <div className="card">Loading your posts…</div>
          ) : myPosts.length === 0 ? (
            <div className="card">You haven't posted yet.</div>
          ) : (
            <div className="grid">
              {myPosts.map((p) => (
                <div key={p.id} style={{ position: "relative" }}>
                  <Postcard post={p} onLike={() => { /* likes handled elsewhere */ }} />
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button className="btn" onClick={() => deletePost(p.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
