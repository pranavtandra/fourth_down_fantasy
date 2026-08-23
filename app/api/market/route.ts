import {NextResponse} from "next/server";

export const revalidate=21600;
type MarketRow={name:string;adp:number};

export async function GET(request:Request){
  const url=new URL(request.url),teams=Math.max(8,Math.min(16,Number(url.searchParams.get("teams"))||12));
  const scoring=url.searchParams.get("scoring")==="standard"?"standard":"ppr";
  try{
    const [ffc,fc]=await Promise.allSettled([
      fetch(`https://fantasyfootballcalculator.com/api/v1/adp/${scoring}?teams=${teams}&year=2026`,{signal:AbortSignal.timeout(6500),next:{revalidate:21600}}).then(r=>{if(!r.ok)throw new Error("FFC");return r.json()}),
      fetch(`https://api.fantasycalc.com/values/current?isDynasty=false&numQbs=1&numTeams=${teams}&ppr=${scoring==="ppr"?1:0}`,{signal:AbortSignal.timeout(6500),next:{revalidate:21600}}).then(r=>{if(!r.ok)throw new Error("FantasyCalc");return r.json()})
    ]);
    const markets:Record<string,MarketRow[]>={};
    if(ffc.status==="fulfilled")markets.ffc=(ffc.value.players||[]).map((p:any)=>({name:p.name,adp:Number(p.adp)})).filter((p:MarketRow)=>p.name&&p.adp>0);
    if(fc.status==="fulfilled")markets.fantasycalc=(fc.value||[]).map((p:any)=>({name:p.player?.name,adp:Number(p.overallRank)})).filter((p:MarketRow)=>p.name&&p.adp>0&&p.adp<=300);
    if(!Object.keys(markets).length)throw new Error("No market completed");
    return NextResponse.json({connected:true,markets,updatedAt:new Date().toISOString(),sources:{ffc:"Fantasy Football Calculator 2026 redraft ADP",fantasycalc:"FantasyCalc current redraft market rank"}},{headers:{"Cache-Control":"public, s-maxage=21600, stale-while-revalidate=86400"}});
  }catch{return NextResponse.json({connected:false,markets:{},message:"Live market feeds are temporarily unavailable."},{status:503})}
}
