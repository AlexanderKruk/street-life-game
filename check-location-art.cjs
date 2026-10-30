// Main-location imagery, separate from catalog-event illustrations.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost/street-life-game/',pretendToBeVisual:true});
for(const key of ['window','document','localStorage','HTMLElement','Node','Event','MouseEvent'])global[key]=dom.window[key];
Object.defineProperty(global,'navigator',{value:dom.window.navigator});
global.IS_REACT_ACT_ENVIRONMENT=true;
window.scrollTo=()=>{};
window.setInterval=()=>1;window.clearInterval=()=>{};
const esbuild=require('./tests/helpers/build.cjs');
esbuild.buildSync({legacyEventDialogs:true,entryPoints:['src/App.tsx'],bundle:true,define:{'import.meta.env':'{}'},platform:'node',format:'cjs',outfile:'location-art-app.cjs',external:['react','react-dom','react/jsx-runtime']});
const gameCode=esbuild.buildSync({legacyEventDialogs:true,stdin:{contents:"export {locations} from './src/game'; export {locationName} from './src/locationText';",resolveDir:process.cwd(),loader:'ts'},bundle:true,platform:'node',format:'cjs',write:false}).outputFiles[0].text;
const gameModule={exports:{}};new Function('module','exports',gameCode)(gameModule,gameModule.exports);
const {locations,locationName}=gameModule.exports;
const React=require('react');
const {render,screen,fireEvent,cleanup}=require('@testing-library/react');
const App=require('./location-art-app.cjs').default;
const manifest=require('./src/imageManifest.json');
function setup(locationId){
 cleanup();localStorage.clear();require('./test-fixtures/finished-encounters.cjs')(localStorage);
 localStorage.setItem('street-life-save-v3',JSON.stringify({day:3,minutes:600,money:50,hunger:70,thirst:70,energy:70,health:90,hygiene:70,mood:50,intoxication:0,locationId}));
 localStorage.setItem('street-life-screen','location');
 localStorage.setItem('street-life-discovered-v1',JSON.stringify(locations.map(place=>place.id)));
 localStorage.setItem('street-life-effects-v1','[]');
 render(React.createElement(App));
}
try{
 const seen=new Set();
 for(const place of locations){
  setup(place.id);
  const image=document.querySelector('.location-surface .location-hero-image,.location-surface .street-art img,.location-surface .shop-hero-image');
  assert(image,`${locationName(place.id)} has a main-tab image`);
  assert(!seen.has(image.src),`${locationName(place.id)} does not reuse another place's image`);seen.add(image.src);
  assert(!image.src.includes('/event-'),'place imagery is independent of event scenes');
  if(place.id !== 'shop'){
   const header=image.closest('.location-summary.location-hero');
   assert(header && header.querySelector('h2')?.textContent===locationName(place.id),`${locationName(place.id)} keeps its title over the artwork, including Street`);
   assert.equal(document.querySelector('.location-surface > .street-art'),null,'Street artwork is not detached from its caption');
  }
  if(!['shop','work','support'].includes(place.id))assert(document.querySelector('.location-actions-title'),'every location action heading uses balanced spacing');
  if(!['street','shop'].includes(place.id)){
   assert(image.closest(`[data-location-id="${place.id}"]`),'image belongs to the current location header');
   assert(image.src.includes('/location-'));
   for(const width of [480,768,1024,1400])assert(image.srcset.includes(`-${width}.webp ${width}w`));
   assert.equal(image.sizes,'(min-width: 760px) 760px, 100vw');
   const original=image.src.split('/').pop().replace('-480.webp','.webp');
   for(const variant of manifest[original].variants)assert(fs.statSync('public/assets/'+variant.file).size>0);
  }
  assert.equal(document.querySelectorAll('.bottom-nav button').length,6,'five classic tabs plus Story');
  assert(screen.getByRole('button',{name:'Story'}),'Story is available alongside every classic location');
  assert(!screen.queryByRole('dialog'),'decorative location art does not open a modal');
 }
 assert.equal(seen.size,locations.length);
 setup('station');const stationImage=document.querySelector('.location-hero-image').src;
 for(const label of [/Try to sleep/,/Sit and recover/,/Charge phone/])assert(screen.getByRole('button',{name:label}));
 fireEvent.click(screen.getByRole('button',{name:/^Inventory/}));assert(!document.querySelector('.location-hero-image'));
 fireEvent.click(document.querySelector('.nav-item.home'));assert.equal(document.querySelector('.location-hero-image').src,stationImage);
 fireEvent(window,new window.Event('pagehide'));cleanup();render(React.createElement(App));
 assert.equal(document.querySelector('.location-hero-image').src,stationImage,'station art survives reload');
 console.log('PASS: every location has distinct main-tab imagery; responsive assets, Station actions, navigation and reload.');
}finally{cleanup();dom.window.close();}
