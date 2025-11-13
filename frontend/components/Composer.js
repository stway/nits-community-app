import { useState, useEffect, useRef } from "react";

export default function Composer({ apiBase, section, onPosted }) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const tokenRef = useRef("anonymous");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const t = localStorage.getItem("nits_user");
      if (t) tokenRef.current = t;
    }
    return undefined;
  }, []);

  async function uploadFiles() {
    if (files.length === 0) return [];
    const form = new FormData();
    for (const f of files) form.append("files", f);
    const r = await fetch(`${apiBase}/api/uploads`, {
      method: "POST",
      headers: { Authorization: tokenRef.current },
      body: form,
    });
    const j = await r.json();
    // normalize to objects with url and public_id if server returns such
    return (j.files || []).map(f => {
      if (typeof f === "string") return f;
      return f.url || f.secure_url || f;
    });
  }

  async function submit() {
    const media = await uploadFiles();
    const payload = { type: section, body: text, media, anonymous: true };
    const r = await fetch(`${apiBase}/api/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: tokenRef.current },
      body: JSON.stringify(payload),
    });
    const j = await r.json();
    setText("");
    setFiles([]);
    if (onPosted) onPosted(j.post);
  }

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <textarea
        placeholder={`Write in ${section}...`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ width: "100%", minHeight: 80, borderRadius: 8, padding: 8 }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, alignItems: "center" }}>
        <input type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files))} />
        <button className="btn" onClick={submit}>Post</button>
      </div>
    </div>
  );
}
