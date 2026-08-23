export const runtime = "edge";

type XPost = { id:string; text:string; created_at?:string };

export async function GET(request:Request){
  const player=(new URL(request.url).searchParams.get("player")||"").trim();
  const searchUrl=`https://x.com/search?q=${encodeURIComponent(`from:UnderdogNFL "${player}"`)}&src=typed_query&f=live`;
  if(!player) return Response.json({connected:false,posts:[],searchUrl,error:"Player is required"},{status:400});
  const token=process.env.X_BEARER_TOKEN;
  if(!token) return Response.json({connected:false,posts:[],searchUrl,message:"Connect an X API bearer token to enable automatic updates."});
  const query=`from:UnderdogNFL ("${player}" OR "${player.split(" ").at(-1)}") -is:retweet`;
  const endpoint=new URL("https://api.x.com/2/tweets/search/recent");
  endpoint.searchParams.set("query",query);
  endpoint.searchParams.set("max_results","10");
  endpoint.searchParams.set("tweet.fields","created_at");
  try{
    const response=await fetch(endpoint,{headers:{Authorization:`Bearer ${token}`}});
    if(!response.ok) return Response.json({connected:false,posts:[],searchUrl,message:`X API returned ${response.status}.`},{status:200});
    const payload=await response.json() as {data?:XPost[]};
    const posts=(payload.data||[]).map(post=>({...post,url:`https://x.com/UnderdogNFL/status/${post.id}`}));
    return Response.json({connected:true,posts,searchUrl,source:"@UnderdogNFL"},{headers:{"Cache-Control":"public, s-maxage=300, stale-while-revalidate=600"}});
  }catch{
    return Response.json({connected:false,posts:[],searchUrl,message:"The news service is temporarily unavailable."});
  }
}
