import {load} from 'cheerio';
import {programmeText} from './programme-evidence.mjs';

// University of Latvia Foundation publishes each scholarship as an Inertia
// detail record. Never flatten all props: they also contain unrelated awards,
// account state and historical recipient collections.
export function inertiaScholarshipText(html,finalUrl,scholarshipId,locale){
 const $=load(html),nodes=$('#app[data-page]');
 if(nodes.length!==1)throw new Error('inertia_scholarship_page_missing');
 let page;try{page=JSON.parse(nodes.attr('data-page'));}catch{throw new Error('inertia_scholarship_json_invalid');}
 const scholarship=page?.props?.scholarship,id=String(scholarshipId??'');
 const current=new URL(finalUrl),route=new URL(page?.url||'/',current);
 if(!/^[1-9]\d*$/.test(id)||page?.component!=='Public/Scholarships/Detail'||String(scholarship?.id)!==id||route.origin!==current.origin||route.pathname.replace(/\/$/,'')!==current.pathname.replace(/\/$/,'')||route.pathname.replace(/\/$/,'')!=='/scholarships/'+id)throw new Error('inertia_scholarship_identity_mismatch');
 if(![1,true].includes(scholarship.published))throw new Error('inertia_scholarship_unpublished');
 const language=locale??page.props.appLocale;
 if(!['lv','en'].includes(language))throw new Error('inertia_scholarship_language_unsupported');
 const localized=value=>typeof value==='string'?value:typeof value?.[language]==='string'?value[language]:'';
 const parts=['name','intro','excerpt','positions','amount','submission_date'].map(key=>localized(scholarship[key]));
 if(!parts[0])throw new Error('inertia_scholarship_translation_missing');
 for(const item of scholarship.apply||[])parts.push(localized(item.name));
 for(const item of scholarship.contents||[]){
  if(item.type==='text'&&item.post_type==='scholarships'&&String(item.post_id)===id)parts.push(localized(item.title),localized(item.content));
 }
 return parts.map(part=>programmeText('<main>'+part+'</main>')).filter(Boolean).join(' ');
}
