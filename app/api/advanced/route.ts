import { NextResponse } from "next/server";

export const revalidate = 86400;

function csvRows(text:string){
  const rows:string[][]=[];let row:string[]=[];let cell="";let quoted=false;
  for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++}else quoted=!quoted}else if(c===','&&!quoted){row.push(cell);cell=""}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.length>1)rows.push(row);row=[];cell=""}else cell+=c}
  return rows;
}

export async function GET(){
  try{
    const url="https://github.com/nflverse/nflverse-data/releases/download/stats_player/stats_player_week_2025.csv";
    const response=await fetch(url,{next:{revalidate:86400}});if(!response.ok)throw new Error("stats unavailable");
    const rows=csvRows(await response.text());const header=rows.shift()||[];const ix=(name:string)=>header.indexOf(name);const num=(row:string[],name:string)=>Number(row[ix(name)]||0);
    const out:Record<string,any>={};
    for(const row of rows){const pos=row[ix("position")];if(!["QB","RB","WR","TE"].includes(pos)||row[ix("season_type")]!=="REG")continue;const name=row[ix("player_display_name")];if(!name)continue;const p=out[name]||={name,pos,team:row[ix("team")],games:0,carries:0,rushYds:0,rushTd:0,targets:0,receptions:0,recYds:0,recTd:0,airYds:0,yac:0,passAtt:0,passYds:0,passTd:0,interceptions:0,sacks:0,rushFirstDowns:0,recFirstDowns:0,explosiveRuns:0,explosiveCatches:0,ppr:0,targetShareTotal:0,airShareTotal:0,woprTotal:0,cpoeTotal:0,cpoeGames:0,rushEpa:0,recEpa:0,passEpa:0,epa:0};
      p.games++;p.carries+=num(row,"carries");p.rushYds+=num(row,"rushing_yards");p.rushTd+=num(row,"rushing_tds");p.targets+=num(row,"targets");p.receptions+=num(row,"receptions");p.recYds+=num(row,"receiving_yards");p.recTd+=num(row,"receiving_tds");p.airYds+=num(row,"receiving_air_yards");p.yac+=num(row,"receiving_yards_after_catch");p.passAtt+=num(row,"attempts");p.passYds+=num(row,"passing_yards");p.passTd+=num(row,"passing_tds");p.interceptions+=num(row,"passing_interceptions");p.sacks+=num(row,"sacks_suffered");p.rushFirstDowns+=num(row,"rushing_first_downs");p.recFirstDowns+=num(row,"receiving_first_downs");p.explosiveRuns+=num(row,"rushing_20");p.explosiveCatches+=num(row,"receiving_20");p.ppr+=num(row,"fantasy_points_ppr");p.targetShareTotal+=num(row,"target_share");p.airShareTotal+=num(row,"air_yards_share");p.woprTotal+=num(row,"wopr");const cpoe=num(row,"passing_cpoe");if(num(row,"attempts")>0){p.cpoeTotal+=cpoe;p.cpoeGames++}p.rushEpa+=num(row,"rushing_epa");p.recEpa+=num(row,"receiving_epa");p.passEpa+=num(row,"passing_epa");p.epa=p.rushEpa+p.recEpa+p.passEpa;
    }
    for(const p of Object.values(out) as any[]){p.targetShare=p.games?p.targetShareTotal/p.games:0;p.airShare=p.games?p.airShareTotal/p.games:0;p.wopr=p.games?p.woprTotal/p.games:0;p.cpoe=p.cpoeGames?p.cpoeTotal/p.cpoeGames:0;delete p.targetShareTotal;delete p.airShareTotal;delete p.woprTotal;delete p.cpoeTotal;delete p.cpoeGames}
    return NextResponse.json({connected:true,season:2025,updatedAt:new Date().toISOString(),source:url,players:out},{headers:{"Cache-Control":"public, s-maxage=86400, stale-while-revalidate=172800"}});
  }catch{return NextResponse.json({connected:false,season:2025,players:{}},{status:200})}
}
