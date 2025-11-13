export default function Postcard({ post, onLike }) {
  return (
    <div className="card">
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
        <img src={post.authorAvatar || "/images/user.jpg"} style={{width:44,height:44,borderRadius:8,objectFit:"cover"}} alt="author"/>
        <div>
          <div style={{fontWeight:600}}>{post.anonymous ? "Anonymous" : post.author}</div>
          <div style={{fontSize:12,color:"var(--muted)"}}>{new Date(post.createdAt).toLocaleString()}</div>
        </div>
      </div>

      {post.media && post.media.map((m,i)=> <img key={i} className="post-img" src={m} alt={`media-${i}`}/>)}
      <p style={{marginTop:8,color:"var(--text)"}}>{post.body}</p>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8}}>
        <div style={{fontSize:12,color:"var(--muted)"}}></div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <button className="btn" onClick={onLike}>❤️ {post.likes||0}</button>
        </div>
      </div>
    </div>
  );
}
