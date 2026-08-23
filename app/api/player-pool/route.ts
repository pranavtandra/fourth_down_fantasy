import { NextResponse } from "next/server";

type SleeperPlayer = { player_id?:string; full_name?:string; first_name?:string; last_name?:string; position?:string; team?:string|null; search_rank?:number; depth_chart_order?:number|null; depth_chart_position?:string|number|null; injury_status?:string|null; age?:number|null };
export const revalidate = 86400;

export async function GET(){
  try{
    const positions=["QB","RB","WR","TE"];
    const responses=await Promise.all(positions.map(position=>fetch(`https://api.sleeper.app/v1/players/nfl?position=${position}&active=true`,{next:{revalidate:86400}})));
    if(responses.some(response=>!response.ok))throw new Error("Player feed unavailable");
    const maps=await Promise.all(responses.map(response=>response.json() as Promise<Record<string,SleeperPlayer>>));
    const all=maps.flatMap(Object.values).filter(player=>player.team&&positions.includes(player.position||"")&&(player.full_name||player.first_name));
    const normalize=(player:SleeperPlayer)=>({playerId:player.player_id,name:player.full_name||`${player.first_name||""} ${player.last_name||""}`.trim(),pos:player.position,team:player.team,searchRank:player.search_rank,depthOrder:player.depth_chart_order??null,depthPosition:player.depth_chart_position??null,injuryStatus:player.injury_status??null,age:player.age??null});
    const players=all.sort((a,b)=>(a.search_rank??9999)-(b.search_rank??9999)).slice(0,260).map(normalize);
    const depthCharts:Record<string,Record<string,ReturnType<typeof normalize>[]>>={};
    for(const raw of all){const team=raw.team as string,pos=raw.position as string;depthCharts[team]??={};depthCharts[team][pos]??=[];depthCharts[team][pos].push(normalize(raw))}
    for(const team of Object.values(depthCharts))for(const group of Object.values(team))group.sort((a,b)=>(a.depthOrder??99)-(b.depthOrder??99)||(a.searchRank??9999)-(b.searchRank??9999));
    return NextResponse.json({connected:true,updatedAt:new Date().toISOString(),players,depthCharts},{headers:{"Cache-Control":"public, s-maxage=86400, stale-while-revalidate=172800"}});
  }catch{return NextResponse.json({connected:false,updatedAt:null,players:[]},{status:200})}
}
