import Link from "next/link";
import { useState, useEffect } from "react";

export default function Navbar({ onSearch }) {
  const [q, setQ] = useState("");
  const [avatar, setAvatar] = useState("/images/user.jpg");

  useEffect(()=> {
    if (typeof window !== "undefined") {
      const a = localStorage.getItem("nits_avatar");
      if (a) setAvatar(a);
      else {
        const name = localStorage.getItem("nits_user");
        if (name) {
          fetch(`${process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000"}/api/profile/${encodeURIComponent(name)}`)
            .then(r => r.json())
            .then(j => { if (j.profile && j.profile.avatar) { setAvatar(j.profile.avatar); localStorage.setItem("nits_avatar", j.profile.avatar); } })
            .catch(()=>{});
        }
      }
    }
  }, []);

  return (
    <header className="header container">
      <div className="nav-left">
        <img src="/images/logo.png" className="logo" alt="logo"/>
        <div>
          <h2 style={{margin:0}}>NITS Community</h2>
          <div style={{fontSize:12,color:"var(--muted)"}}>Hello — express freely, stay anonymous.</div>
        </div>
      </div>

      <div style={{display:"flex",gap:10,alignItems:"center"}}>
        <input className="search" placeholder="Search users or posts..." value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') onSearch(q); }}/>
        <div className="nav-links">
          <Link href="/photodump"><button className="btn">Photo Dump</button></Link>
          <Link href="/creative"><button className="btn">Creative</button></Link>
          <Link href="/confessions"><button className="btn">Confessions</button></Link>
          <Link href="/gossip"><button className="btn">Gossip</button></Link>
          <Link href="/advice"><button className="btn">Advice</button></Link>
          <Link href="/user"><img src={avatar} className="user-avatar" alt="user"/></Link>
        </div>
      </div>
    </header>
  );
}
