import {readFileSync} from 'node:fs';
import {clean} from './domain.mjs';
const corrections=JSON.parse(readFileSync(new URL('../../data/opportunity-corrections.json',import.meta.url),'utf8'));
export function applyReviewedCorrection(record,text){
 const correction=corrections.find(c=>c.id===record.id);if(!correction)return record;
 if(record.url!==correction.url||clean(record.title)!==clean(correction.title)||!correction.requiredText.every(s=>clean(text).includes(s)))throw new Error('reviewed_correction_evidence_changed');
 return {...record,...structuredClone(correction.patch),evidence:{...record.evidence,checks:[...(record.evidence?.checks||[]),'Reviewed institutional identity and deadline: '+correction.reviewedAt]}};
}
