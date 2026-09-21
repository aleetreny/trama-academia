import test from 'node:test';
import assert from 'node:assert/strict';
import {readRecurringFilters,recurringDefaults,recurringQuery,selectRecurringRecords} from '../../lib/recurrence.ts';

const records=[
 {id:'school',title:'Escuela de Estadística',institution:'Universidad',country:'ME',stage:'doctorado',eligibleStages:['master','doctorado'],entry:'Máster avanzado',recurrence:{category:'summer-school',calendar:'2026 cerrada',editionState:'past'}},
 {id:'internship',title:'Prácticas de estadística',institution:'Centro',country:'CH',stage:'grado',eligibleStages:['grado','master'],entry:'Grado en curso',recurrence:{category:'research-stay',calendar:'2027 anunciada',editionState:'announced'}},
 {id:'grant',title:'Beca doctoral',institution:'Fondo',country:'CH',stage:'doctorado',entry:'Doctorado',recurrence:{category:'funding',calendar:'Consultar fuente',editionState:'unknown'}}
];

test('recurring directory preserves closed and announced editions instead of treating them as open positions',()=>{
 assert.equal(selectRecurringRecords(records,recurringDefaults).length,3);
 assert.deepEqual(selectRecurringRecords(records,{...recurringDefaults,category:'summer-school'}).map(record=>record.id),['school']);
});
test('recurring shared filters combine eligible stage, country and accent-insensitive search',()=>{
 const filters={...recurringDefaults,stage:'master',country:'CH',q:'estadistica practicas',category:'research-stay',page:2};
 assert.deepEqual(readRecurringFilters(recurringQuery(filters),['ME','CH']),filters);
 assert.deepEqual(selectRecurringRecords(records,filters).map(record=>record.id),['internship']);
 assert.deepEqual(selectRecurringRecords(records,{...recurringDefaults,stage:'grado'}).map(record=>record.id),['internship']);
});
test('unknown recurring URL filters and unsafe page numbers fall back safely',()=>{
 assert.deepEqual(readRecurringFilters(new URLSearchParams('tipo=toString&pais=XX&etapa=unknown&pagina=Infinity'),['CH']),recurringDefaults);
 assert.equal(readRecurringFilters(new URLSearchParams('pagina=-2'),['CH']).page,1);
 assert.equal(readRecurringFilters(new URLSearchParams('q='+'x'.repeat(500)),['CH']).q.length,200);
});
