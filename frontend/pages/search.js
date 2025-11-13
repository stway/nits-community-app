import Navbar from "../components/Navbar";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

export default function Search(){
  const r = useRouter();
  const q = r.query.q || "";
  const [posts,setPosts]=useState([]);
  useEffect(()=>{
    let mounted = true;
    if (!q) return;
    (async ()=>{
      try {
        const res = await fetch(`${API}/api/posts?q=${encodeURIComponent(q)}`);
        const j = await res.json();
        if (mounted) setPosts(j.posts||[]);
      } catch(e){}
    })();
    return () => { mounted = false; };
  }, [q]);
  return (<>
    <Navbar onSearch={s=>r.push(`/search?q=${encodeURIComponent(s)}`)}/>
    <div className="container"><h3>Search results for "{q}"</h3>
      <div className="grid">{posts.map(p=> (<div key={p.id} className="card"><p>{p.body}</p></div>))}</div>
    </div>
  </>);
}
