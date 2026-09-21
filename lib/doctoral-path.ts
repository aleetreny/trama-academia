export const SITUATIONS = [
  ['grado','Estudio o he terminado el grado'],
  ['master','Curso o he terminado un máster'],
  ['trabajo','Trabajo y quiero investigar'],
  ['preparado','Ya investigo y busco doctorado'],
] as const;
export const AIMS = [['decidir','Decidir si quiero investigar'],['experiencia','Ganar experiencia investigadora'],['solicitar','Solicitar un doctorado']] as const;
export const MOBILITY = [['espana','Priorizar España'],['europa','Considerar también Europa'],['duda','Aún no sé si puedo mudarme']] as const;
export const PATH_FIELDS = [['all','Explorar las cinco áreas'],['Ciencia de datos','Ciencia de datos'],['Machine learning','IA y aprendizaje automático'],['Estadística','Estadística'],['Informática','Informática'],['Matemáticas aplicadas','Matemáticas aplicadas']] as const;
export type PathProfile = {situation:typeof SITUATIONS[number][0];aim:typeof AIMS[number][0];mobility:typeof MOBILITY[number][0];field:typeof PATH_FIELDS[number][0]};
export const defaultProfile:PathProfile = {situation:'grado',aim:'decidir',mobility:'duda',field:'all'};
export type PathAction = {id:string;title:string;body:string;href:string;link:string};
export type PathSearch = {title:string;body:string;href:string};
export const PATH_ACTIONS:Record<string,PathAction> = {
  question:{id:'question',title:'Elige una pregunta que quieras entender',body:'Escoge dos artículos de un grupo del área. Resume su pregunta, método y una limitación. El objetivo es descubrir si disfrutas el trabajo, no decidir ya el tema definitivo de tu tesis.',href:'/doctorado-en-espana#decidir',link:'Valorar la decisión'},
  interview:{id:'interview',title:'Habla con quien ya está haciendo una tesis',body:'Pregunta cómo es una semana normal, qué apoyo recibe, qué hace cuando un experimento falla y qué cambiaría del grupo. Busca más de una perspectiva.',href:'/doctorado-en-espana#grupo',link:'Preparar la conversación'},
  tfg:{id:'tfg',title:'Acerca tu TFG a un grupo de investigación',body:'Busca una pregunta acotada, una persona que pueda supervisarte y un resultado reproducible. Consulta también estancias que admitan estudiantes de grado; sus requisitos varían.',href:'/doctorado-en-espana#experiencia',link:'Construir experiencia'},
  master:{id:'master',title:'Comprueba qué máster te acerca a investigar',body:'Contrasta acceso al doctorado, carácter oficial, asignaturas metodológicas, TFM y grupos disponibles. Un título con “IA” en el nombre no acredita un itinerario investigador.',href:'/doctorado-en-espana#master',link:'Elegir un máster'},
  tfm:{id:'tfm',title:'Convierte el TFM en una muestra de investigación',body:'Explica la pregunta, tu contribución, la validación y las limitaciones. Un informe cuidado y código reproducible pueden mostrar mejor tu trabajo que una lista de herramientas.',href:'/doctorado-en-espana#experiencia',link:'Preparar una muestra'},
  bridge:{id:'bridge',title:'Traduce tu experiencia profesional a evidencia',body:'Distingue lo que ya sabes hacer de lo que necesitas aprender. Prepara un pequeño proyecto con una pregunta evaluable, sin publicar datos ni código confidenciales de tu empresa.',href:'/doctorado-en-espana#escenarios',link:'Volver desde el trabajo'},
  time:{id:'time',title:'Pon tiempo y presupuesto a la transición',body:'Anota disponibilidad, ahorro necesario, cuidados y límites de movilidad. Consulta dedicación parcial y compatibilidades por separado: que el programa la permita no implica que una ayuda la financie.',href:'/doctorado-en-espana#condiciones',link:'Valorar las condiciones'},
  access:{id:'access',title:'Confirma tu vía de acceso con la escuela doctoral',body:'Envía tu titulación y expediente a la escuela. Si el título es extranjero, pregunta por el procedimiento concreto. Admisión, equivalencia de títulos y financiación son trámites distintos.',href:'/doctorado-en-espana#acceso',link:'Revisar el acceso'},
  sample:{id:'sample',title:'Termina una muestra breve y reproducible',body:'Replica un resultado pequeño o compara dos métodos con una evaluación clara. Documenta decisiones y límites. No necesitas prometer una publicación para mostrar capacidad de investigación.',href:'/doctorado-en-espana#experiencia',link:'Elegir una experiencia útil'},
  groups:{id:'groups',title:'Haz una lista corta de grupos y direcciones',body:'Lee su trabajo reciente y busca encaje metodológico, recursos y supervisión. Guarda oportunidades concretas en Mi selección y apunta por qué te interesa cada grupo.',href:'/doctorado-en-espana#grupo',link:'Evaluar un grupo'},
  funding:{id:'funding',title:'Revisa cómo se sostendría la tesis',body:'Para cada opción, distingue contrato o beca, quién solicita, años cubiertos, matrícula, renovación y elegibilidad. Una plaza académica y una ayuda pueden tener calendarios diferentes.',href:'/doctorado-en-espana#financiacion',link:'Entender FPU, proyectos y otras vías'},
  application:{id:'application',title:'Prepara una candidatura concreta',body:'Adapta CV, carta y muestra de investigación al proyecto. Pide referencias con tiempo y confirma su fecha de entrega. Contactar a un supervisor no sustituye el formulario oficial.',href:'/doctorado-en-espana#candidatura',link:'Ver documentos y ejemplo de correo'},
  compare:{id:'compare',title:'Compara España con un destino posible',body:'Contrasta acceso, contrato, duración financiada, coste de vida y supervisión. Tu residencia actual no determina por sí sola tu derecho a trabajar o solicitar una ayuda en otro país.',href:'/guia?pais1=ES&pais2=GB',link:'Comparar países'},
  location:{id:'location',title:'Define qué significa quedarte en España',body:'Decide si puedes cambiar de ciudad, viajar puntualmente o necesitas un grupo cercano. No presupongas que una tesis computacional puede hacerse en remoto.',href:'/doctorado-en-espana#escenarios',link:'Ajustar el plan a tu situación'},
};
export function pathActions(profile:PathProfile):PathAction[] {
  const bySituation = {grado:['tfg','master'],master:['tfm','access'],trabajo:['bridge','time','access'],preparado:['access','groups']}[profile.situation];
  const byAim = {decidir:['question','interview'],experiencia:['sample','groups'],solicitar:['groups','funding','application']}[profile.aim];
  return [...new Set([...byAim,...bySituation,profile.mobility==='europa'?'compare':'location',...(profile.aim==='solicitar'?[]:['funding'])])].map(id=>PATH_ACTIONS[id]);
}
export function pathSearches(profile:PathProfile):PathSearch[] {
  const country=profile.mobility==='espana'?'ES':null;
  const query=(stage:string,kind?:string)=>{
    const params=new URLSearchParams({etapa:stage});
    if(country)params.set('pais',country);
    if(profile.field!=='all')params.set('campo',profile.field);
    const subjects:Record<string,string>={'Machine learning':'ml','Estadística':'statistics','Matemáticas aplicadas':'applied-math'};
    const subject=subjects[profile.field];
    if(subject)params.set('disciplina',subject);
    if(kind)params.set('tipo',kind);
    return params.toString();
  };
  const opportunities:PathSearch = profile.aim==='solicitar'||profile.situation==='preparado'
    ? {title:'Plazas doctorales',body:'Vacantes para trabajar en un proyecto. Comprueba acceso, contrato y condiciones de cada oferta.',href:'/explorar?'+query('doctorado','position')}
    : profile.situation==='grado'
      ? {title:'Primeras experiencias de investigación',body:'Oportunidades clasificadas para grado. Lee los requisitos de curso, matrícula y expediente.',href:'/explorar?'+query('grado')}
      : {title:'Opciones en la etapa de máster',body:'Programas y experiencias del catálogo. La etapa organiza la búsqueda; no confirma que puedas solicitar.',href:'/explorar?'+query('master')};
  // Broad funding schemes often have no field tag. Do not silently discard them.
  const funding=new URLSearchParams({etapa:profile.situation==='grado'&&profile.aim!=='solicitar'?'master':'doctorado'});
  if(country)funding.set('pais',country);
  return [opportunities,{title:'Becas y ayudas para tu siguiente paso',body:'Búsqueda por etapa'+(country?' y destino España':'')+'. Conservamos las ayudas generales sin filtro temático.',href:'/financiacion?'+funding.toString()},
    {title:profile.situation==='grado'?'Másteres con investigación':'Estancias de investigación',body:profile.situation==='grado'?'Revisa el TFM, los grupos y la vía de acceso que proporciona cada título.':'Planifica con las ediciones documentadas, aunque su plazo ya haya cerrado.',href:profile.situation==='grado'?'/explorar?'+query('master','master-programme'):'/programas?'+new URLSearchParams({...(country?{pais:country}:{}),tipo:'research-stay'}).toString()}];
}
export function profileLabel<K extends keyof PathProfile>(key:K,value:PathProfile[K]) {
  const choices={situation:SITUATIONS,aim:AIMS,mobility:MOBILITY,field:PATH_FIELDS}[key];
  return choices.find(([id])=>id===value)?.[1]||value;
}
export const PATH_KEY='trama:doctoral-path:v1';
export type PathData={version:1;profile:PathProfile;completed:string[]};
export type PathSnapshot={ready:boolean;configured:boolean;data:PathData;warning:string|null};
export const emptyPath:PathSnapshot={ready:false,configured:false,data:{version:1,profile:defaultProfile,completed:[]},warning:null};
export function parsePath(raw:string|null):PathData {
  if(raw===null)return {version:1,profile:{...defaultProfile},completed:[]};
  const data=JSON.parse(raw);
  if(data?.version!==1||!data.profile||!Array.isArray(data.completed)||data.completed.length>Object.keys(PATH_ACTIONS).length)throw new Error('Invalid path');
  const choices={situation:SITUATIONS,aim:AIMS,mobility:MOBILITY,field:PATH_FIELDS};
  for(const key of Object.keys(choices) as (keyof PathProfile)[])if(!choices[key].some(([id])=>id===data.profile[key]))throw new Error('Invalid profile');
  if(!data.completed.every((id:unknown)=>typeof id==='string'&&Object.hasOwn(PATH_ACTIONS,id)))throw new Error('Invalid actions');
  return {version:1,profile:{situation:data.profile.situation,aim:data.profile.aim,mobility:data.profile.mobility,field:data.profile.field},completed:[...new Set<string>(data.completed)]};
}
type PathStorage=Pick<Storage,'getItem'|'setItem'>;
export function createPathStore(storage:()=>PathStorage) {
  let snapshot=emptyPath;
  let pendingProfile:Partial<PathProfile>={},pendingCompleted:Record<string,boolean>={};
  const listeners=new Set<()=>void>();
  const readWarning='No se puede leer el plan guardado. Puedes usarlo durante esta visita; los datos anteriores no se sobrescribirán.';
  const writeWarning='El navegador no permite guardar el plan. Tus cambios se conservan solo durante esta visita; puedes descargarlo.';
  const notify=()=>listeners.forEach(listener=>listener());
  const merge=(data:PathData):PathData=>({version:1,profile:{...data.profile,...pendingProfile},completed:Object.keys(PATH_ACTIONS).filter(id=>pendingCompleted[id]??data.completed.includes(id))});
  const pending=()=>Object.keys(pendingProfile).length>0||Object.keys(pendingCompleted).length>0;
  function read(){try{const raw=storage().getItem(PATH_KEY);snapshot={ready:true,configured:raw!==null||pending(),data:merge(parsePath(raw)),warning:pending()?writeWarning:null};}catch{snapshot={...snapshot,ready:true,warning:readWarning};}notify();}
  function save(){
    let data=snapshot.data,readable=true,warning:string|null=null;
    try{data=parsePath(storage().getItem(PATH_KEY));}catch{readable=false;warning=readWarning;}
    data=merge(data);
    if(readable){try{storage().setItem(PATH_KEY,JSON.stringify(data));pendingProfile={};pendingCompleted={};}catch{warning=writeWarning;}}
    snapshot={ready:true,configured:true,data,warning};notify();
  }
  return {
    getSnapshot:()=>snapshot,subscribe:(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener);};},
    initialize:()=>{if(!snapshot.ready)read();},reload:read,
    change:(patch:Partial<PathProfile>)=>{const candidate={...snapshot.data,profile:{...snapshot.data.profile,...patch}};parsePath(JSON.stringify(candidate));pendingProfile={...pendingProfile,...patch};save();},
    complete:(id:string,done:boolean)=>{if(!Object.hasOwn(PATH_ACTIONS,id))throw new Error('Unknown action');pendingCompleted[id]=done;save();},
    reset:()=>{pendingProfile={...defaultProfile};pendingCompleted=Object.fromEntries(Object.keys(PATH_ACTIONS).map(id=>[id,false]));save();},
  };
}
