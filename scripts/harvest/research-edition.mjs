const METRICS=['volume','impactTotal','impactEligible','top10'];
const TYPES=['article','conference-paper','data-paper','software-paper'];
export function retainCompletedSubjects(previous,definitions){
 if(!TYPES.every(type=>previous?.workTypes?.includes(type)))return [];
 return (previous.subjects||[]).filter(subject=>definitions.some(known=>known.id===subject.id&&known.filter===subject.filter)&&METRICS.every(metric=>subject.metrics?.[metric]?.complete===true));
}
