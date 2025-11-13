import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/router";

export default function SplashPage() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [username, setUsername] = useState(null);

  useEffect(() => {
    // only run on client
    if (typeof window === "undefined") return;

    const seen = localStorage.getItem("nits_seen_splash");
    const user = localStorage.getItem("nits_user");
    setUsername(user);

    // if already seen, go straight to feed or login
    if (seen) {
      if (user) router.replace("/photodump");
      else router.replace("/login");
      return;
    }

    // show splash (first visit)
    setShow(true);

    // after splash duration, mark seen and redirect
    const t = setTimeout(() => {
      localStorage.setItem("nits_seen_splash", "1");
      setShow(false);
      setTimeout(() => {
        if (user) router.replace("/photodump");
        else router.replace("/login");
      }, 240); // small delay to allow exit animation
    }, 2200); // 2.2s visible

    return () => clearTimeout(t);
  }, [router]);

  return (
    <div style={{
      height: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(180deg,#0f172a 0%, #0b1220 100%)",
      color: "#fff",
      padding: 20,
      boxSizing: "border-box"
    }}>
      <AnimatePresence>
        {show && (
          <motion.div
            key="splash"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{
              width: "min(720px, 92vw)",
              maxWidth: 720,
              borderRadius: 16,
              padding: 28,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
              background: "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.02))",
              boxShadow: "0 10px 40px rgba(2,6,23,0.7)"
            }}
          >
            <motion.img
              src="/logo.png"
              alt="NITS Community"
              initial={{ scale: 0.8, rotate: -6 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, ease: "anticipate" }}
              style={{ width: 120, height: 120, borderRadius: 24, objectFit: "cover" }}
            />

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.45 }}
              style={{ textAlign: "center" }}
            >
              <h1 style={{ margin: 0, fontSize: 20, letterSpacing: 0.2 }}>Hello{username ? `, ${username}` : ""} ✨</h1>
              <p style={{ margin: "8px 0 0", color: "#a5b4cc" }}>
                Let’s connect :) (UNOFFICIAL WEBPAGE)
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              style={{ marginTop: 6, display: "flex", gap: 8 }}
            >
              <div style={{
                height: 8, width: 40, borderRadius: 8, background: "linear-gradient(90deg,#6366f1,#06b6d4)"
              }} />
              <div style={{
                height: 8, width: 16, borderRadius: 8, background: "rgba(255,255,255,0.06)"
              }} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
