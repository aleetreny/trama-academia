import {load} from 'cheerio';
import {clean} from './domain.mjs';
export function programmeText(html){
 const $=load(html);$('script,style,nav,header,footer,[hidden],[aria-hidden="true"]').remove();
 return clean(($('main').length?$('main'):$('body')).text());
}
export function hasResearchComponent(text){
 return /thesis|dissertation|research project|research.oriented|research skills|master[’']?s?\s+(?:degree\s+)?project|mémoire|stage de recherche|masterarbeit|trabajo.*fin.*m[aá]ster|projet.*recherche/i.test(text);
}
