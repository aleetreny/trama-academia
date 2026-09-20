import test from 'node:test';
import assert from 'node:assert/strict';
import {fieldsFrom} from './domain.mjs';
import {hasResearchComponent} from './programme-evidence.mjs';

test('Romanian programme outcomes identify computing and applied mathematical research',()=>{
 assert.deepEqual(fieldsFrom('Domeniu de doctorat: Calculatoare și tehnologia informației'),['Informática']);
 for(const phrase of ['matematică aplicată','matematici aplicate','modelarea matematică','analiză și sinteză a modelelor matematice','construiește modele matematice adecvate']){
  assert.deepEqual(fieldsFrom(phrase),['Matemáticas aplicadas']);
  assert.deepEqual(fieldsFrom(phrase.normalize('NFD')),['Matemáticas aplicadas']);
 }
 for(const phrase of ['Matematică: algebră și geometrie','Administrarea calculatoarelor','modele de afaceri','tehnologia informației în administrație'])assert.deepEqual(fieldsFrom(phrase),[]);
});
test('Greek regulations must name the postgraduate dissertation explicitly',()=>{
 const excerpt='Η γλώσσα συγγραφής της μεταπτυχιακής διπλωματικής εργασίας είναι η Ελληνική.';
 assert.equal(hasResearchComponent(excerpt),true);
 assert.equal(hasResearchComponent(excerpt.normalize('NFD')),true);
 for(const phrase of ['προπτυχιακής διπλωματικής εργασίας','διδακτορικής διατριβής','διπλωματικής εργασίας','μεταπτυχιακής πρακτικής άσκησης'])assert.equal(hasResearchComponent(phrase),false);
});
test('fragmented TUI dissertation text requires the complete assigned master course record',()=>{
 const excerpt='1.5 Ciclul de studii\n\u200B\n1\n Master\n1.6 Programul de studii\nSecuritatea spatiului cibernetic\n2.1 Denumirea disciplinei/Cod\nElaborare proiect de diserta\nț\nie / SSC.PA.206';
 assert.equal(hasResearchComponent(excerpt),true);
 for(const text of [excerpt.replace('Master','Licență'),excerpt.replace('SSC.PA.206','SSC.PA.205'),excerpt.replace('Securitatea spatiului cibernetic','Alt program'),'Master 2 4 Elaborare proiect de diserta ț ie SSC.PA.206','Elaborare proiect de diserta ț ie / SSC.PA.206'])assert.equal(hasResearchComponent(text),false);
});
