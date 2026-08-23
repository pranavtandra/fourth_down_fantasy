import { NextRequest,NextResponse } from "next/server";

export const revalidate=86400;
function key(value:string){return value.toLowerCase().replace(/[^a-z0-9 ]/g,"").replace(/\b(jr|sr|ii|iii|iv)\b/g,"").replace(/\s+/g," ").trim()}
function parse(line:string){const cells:string[]=[];let cell="",quoted=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"')quoted=!quoted;else if(c===','&&!quoted){cells.push(cell);cell=""}else cell+=c}cells.push(cell);return cells}
export async function GET(request:NextRequest){
  const player=request.nextUrl.searchParams.get("player")?.trim();if(!player)return NextResponse.json({connected:false,records:[]},{status:400});
  try{
    const seasons=Array.from({length:16},(_,i)=>2009+i);
    const responses=await Promise.all(seasons.map(season=>fetch(`https://github.com/nflverse/nflverse-data/releases/download/injuries/injuries_${season}.csv`,{next:{revalidate:86400}})));
    const texts=await Promise.all(responses.map(r=>r.ok?r.text():""));const records:any[]=[];
    for(const text of texts){const lines=text.split(/\r?\n/);const header=parse(lines.shift()||"");const ix=(n:string)=>header.indexOf(n);for(const line of lines){if(!line)continue;const row=parse(line);if(key(row[ix("full_name")]||"")!==key(player))continue;records.push({season:Number(row[ix("season")]),week:Number(row[ix("week")]),team:row[ix("team")],primary:row[ix("report_primary_injury")]||row[ix("practice_primary_injury")]||"Not specified",secondary:row[ix("report_secondary_injury")]||row[ix("practice_secondary_injury")]||null,gameStatus:row[ix("report_status")]||null,practiceStatus:row[ix("practice_status")]||null,updated:row[ix("date_modified")]||null})}}
    const dedup=new Map<string,any>();for(const record of records){const id=`${record.season}-${record.week}-${record.primary}-${record.secondary||""}`;const old=dedup.get(id);if(!old||String(record.updated)>String(old.updated))dedup.set(id,record)}
    return NextResponse.json({connected:true,coverage:"2009–2024",player,records:[...dedup.values()].sort((a,b)=>b.season-a.season||b.week-a.week),source:"https://github.com/nflverse/nflverse-data/releases/tag/injuries"},{headers:{"Cache-Control":"public, s-maxage=86400, stale-while-revalidate=172800"}})
  }catch{return NextResponse.json({connected:false,coverage:"2009–2024",player,records:[]},{status:200})}
}
