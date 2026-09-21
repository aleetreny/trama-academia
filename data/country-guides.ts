import guides from './country-guides.json';
export const GUIDE_VERIFIED='2026-09-21';
export const GUIDE_ROWS=[
 ['model','Modelo y relación con la institución'],
 ['admission','Acceso y selección'],
 ['duration','Duración académica'],
 ['pay','Financiación y relación laboral'],
 ['fees','Matrícula y otros costes'],
 ['supervision','Formación, supervisión y seguimiento'],
 ['assessment','Evaluación y defensa'],
 ['watch','Antes de aceptar']
] as const;
export type GuideKey=typeof GUIDE_ROWS[number][0];
export type GuideSource={title:string;url:string;scope:string;checkedAt:string;sourceUpdated:string|null;contentHash?:string;accessNote?:string};
export type CountryGuide={code:string;name:string;scope:string;checkedAt:string;facts:Record<GuideKey,string>;sources:GuideSource[];factSources:Partial<Record<GuideKey,number[]>>};
export const countryGuides=guides as CountryGuide[];
