const fs=require("fs/promises"),sync=require("fs"),ts=require("typescript"),path=require("path"),Module=require("module");
const file=path.join(__dirname,"..","app","api","backtest","route.ts"),source=sync.readFileSync(file,"utf8");
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
const loaded=new Module(file,module),baseRequire=loaded.require.bind(loaded);loaded.filename=file;loaded.paths=module.paths;
loaded.require=id=>id==="next/server"?{NextResponse:{json:async data=>({json:async()=>data})}}:baseRequire(id);loaded._compile(js,file);
(async()=>{const response=await loaded.exports.GENERATE(),data=await response.json();if(!data.connected)throw new Error(data.message||"Backtest generation failed");const dir=path.join(__dirname,"..","app","data");await fs.mkdir(dir,{recursive:true});await fs.writeFile(path.join(dir,"backtest.json"),JSON.stringify({...data,generatedAt:new Date().toISOString()},null,2)+"\n");console.log(`Generated ${data.summary.sample} validation samples across ${data.summary.seasons} seasons.`)})().catch(error=>{console.error(error);process.exit(1)});
