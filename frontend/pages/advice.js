import Navbar from "../components/Navbar";
import Composer from "../components/Composer";
import Postcard from "../components/Postcard";
import { useEffect, useState } from "react";
const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

export default function Advice(){
  const [posts,setPosts]=useState([]);
  useEffect(()=>{
    let mounted = true;
    async function load(){
      try {
        const r = await fetch(`${API}/api/posts?type=advice`);
        const j = await r.json();
        if (mounted) setPosts(j.posts || []);
      } catch(e){}
    }
    load();
    return () => { mounted = false; };
  }, []);

  async function like(id){
    await fetch(`${API}/api/posts/${id}/like`, { method:"POST", headers:{ Authorization: (typeof window !== "undefined" ? localStorage.getItem("nits_user") : "anonymous") || "anonymous" }});
    const r = await fetch(`${API}/api/posts?type=advice`);
    const j = await r.json();
    setPosts(j.posts || []);
  }

  return (
    <>
      <Navbar onSearch={q=>window.location.href=`/search?q=${encodeURIComponent(q)}`} />
      <div className="container">
        <div className="section-hero" style={{backgroundImage:"url(/images/advice.jpg)",backgroundSize:"cover"}}>Advice</div>
        <Composer apiBase={API} section="advice" onPosted={async ()=>{ const r = await fetch(`${API}/api/posts?type=advice`); const j = await r.json(); setPosts(j.posts||[]); }} />
        <div className="grid" style={{marginTop:12}}>{posts.map(p=> <Postcard key={p.id} post={p} onLike={()=>like(p.id)}/> )}</div>
      </div>
    </>
  );
}
