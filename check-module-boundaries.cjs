const assert=require('node:assert/strict');const fs=require('node:fs');const ts=require('typescript');
const {metafile}=require('esbuild').buildSync({entryPoints:['src/App.tsx'],bundle:true,write:false,metafile:true,format:'esm',define:{'import.meta.env':'{}'},external:['react','react-dom','react/jsx-runtime']});
const graph=new Map(Object.entries(metafile.inputs).filter(([name])=>name.startsWith('src/')).map(([name,info])=>[name,info.imports.filter(edge=>!edge.external&&edge.path.startsWith('src/')).map(edge=>edge.path)]));
const visiting=new Set(),done=new Set();
function walk(name,chain=[]){assert(!visiting.has(name),'Runtime import cycle: '+[...chain,name].join(' → '));if(done.has(name))return;visiting.add(name);for(const child of graph.get(name)??[])walk(child,[...chain,name]);visiting.delete(name);done.add(name)}
for(const name of graph.keys())walk(name);
const domains=[...graph.keys()].filter(name=>/(?:Controller|Session|Sessions|encounterQueue)\.ts$/.test(name));
for(const name of domains){
 for(const target of graph.get(name))assert(!target.endsWith('.tsx'),`${name}: gameplay imports presentation at runtime: ${target}`);
 const ast=ts.createSourceFile(name,fs.readFileSync(name,'utf8'),ts.ScriptTarget.Latest,true);
 function check(node){
  if(ts.isIdentifier(node)&&node.text==='localStorage')assert.fail(name+': persistence belongs to the game owner');
  if(ts.isCallExpression(node)){const target=ts.isPropertyAccessExpression(node.expression)?node.expression.name.text:ts.isIdentifier(node.expression)?node.expression.text:'';assert(target!=='setInterval',name+': do not create another gameplay clock')}
  ts.forEachChild(node,check);
 }
 check(ast);
}
const source=fs.readFileSync('src/App.tsx','utf8');const ast=ts.createSourceFile('App.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let clocks=0;
function checkApp(node){
 if(ts.isFunctionDeclaration(node)&&node.name)assert(!['actImpl','hospitalVisitImpl','callAmbulanceImpl','socialSupportImpl','takeDayWorkImpl','askForMoneyImpl','searchStreetBottles','finishTrashSearchImpl','walkCity','streetActionImpl'].includes(node.name.text),'App: keep gameplay commands in their domain controller');
 if(ts.isCallExpression(node)&&ts.isPropertyAccessExpression(node.expression)&&node.expression.name.text==='setInterval')clocks++;
 ts.forEachChild(node,checkApp);
}
checkApp(ast);assert.equal(clocks,1,'App keeps one shared gameplay clock');
console.log(`PASS: ${graph.size} runtime modules are acyclic; ${domains.length} domain modules keep state/commands separate from presentation, persistence and shared clock.`);
