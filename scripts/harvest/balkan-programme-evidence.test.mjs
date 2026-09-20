import test from 'node:test';
import assert from 'node:assert/strict';
import {programmeText,hasResearchComponent} from './programme-evidence.mjs';
import {fieldsFrom} from './domain.mjs';

test('Belgrade degree context and master dissertation remain separate from table numbers',()=>{
 const degree='МАСТЕР СТУДИЈЕ МАТЕМАТИКА Математика - 1 година, 60 ЕСПБ';
 assert.equal(hasResearchComponent(degree+' Дипломски мастер рад001210'),true);
 for(const t of ['Дипломски мастер рад001210',degree+' Стручна пракса',degree+' Дипломски рад',degree+' Дипломски мастер радови'])assert.equal(hasResearchComponent(t),false);
 assert.equal(hasResearchComponent(programmeText('<nav>'+degree+' Дипломски мастер рад001210</nav><main>Први циклус</main>')),false);
});
test('Banja Luka second-cycle thesis requires its compulsory curriculum and research row',()=>{
 const degree='РАЧУНАРСТВО И ИНФОРМАТИКА II ЦИКЛУС';
 const work='Студијски истраживачки рад 2 10 8 A 18. Завршни рад 2 20 16 A';
 const legend='A Обавезни предмет на студијском програму';
 assert.equal(hasResearchComponent([degree,work,legend].join(' ')),true);
 for(const t of [work,degree+' '+work,degree+' '+legend,work+' '+legend,[degree,work.replace('16 A','16 B'),legend].join(' ')])assert.equal(hasResearchComponent(t),false);
});
test('Sarajevo MIS requires the actual master award and own dissertation requirement',()=>{
 const degree='II ciklusa studija (master studij)';
 const award='zvanje: magistar menadžmenta, smjer Menadžment i informacioni sistemi';
 const work='Izrada projekta i master rada';
 assert.equal(hasResearchComponent([degree,award,work].join(' ')),true);
 for(const t of [work,degree+' '+work,award+' '+work,[degree.replace('II','I'),award,work].join(' ')])assert.equal(hasResearchComponent(t),false);
});
test('Serbian applied subjects and Montenegrin CS title do not classify generic mathematics or partial words',()=>{
 for(const t of ['Дискретна оптимизација','Одабрана поглавља нумеричке анализе'])assert.deepEqual(fieldsFrom(t),['Matemáticas aplicadas']);
 assert.deepEqual(fieldsFrom('RAČUNARSKE NAUKE'.normalize('NFD')),['Informática']);
 for(const t of ['Математика','Дискретна математика','рачунарске','računarske','računarske naukex','нумеричке анализеx'])assert.deepEqual(fieldsFrom(t),[]);
});
