import test from 'node:test';
import assert from 'node:assert/strict';
import {programmeText,hasResearchComponent} from './programme-evidence.mjs';
import {fieldsFrom} from './domain.mjs';

const degree='Diplomski sveučilišni studij Primijenjena matematika Trajanje studija Dvije akademske godine (tj. četiri semestra), 120 ECTS bodova Akademski naziv koji se stječe završetkom studija Magistar/Magistra matematike';
const course=code=>`4. semestar, 2. godina ECTS Obvezni predmeti Eng. raz. Opterećenje Sem INFO 10.0 Diplomski rad (${code}) - 1 (1S) 4 INFO`;

test('Zagreb compulsory dissertations require the explicit second-cycle degree context',()=>{
 for(const code of [61488,61504,61613,61544])assert.equal(hasResearchComponent(degree+' '+course(code)),true);
 assert.equal(hasResearchComponent((degree+' '+course(61488)).normalize('NFD')),true);
 for(const text of [course(61488),'Diplomski rad',degree,degree.replace('Diplomski','Preddiplomski')+' '+course(61488),degree.replace('120 ECTS','180 ECTS')+' '+course(61488),degree.replace('Magistar/Magistra','Prvostupnik/Prvostupnica')+' '+course(61488),degree+' '+course(61488).replace('Obvezni predmeti','Izborni predmeti')])assert.equal(hasResearchComponent(text),false);
});

test('Croatian curriculum evidence cannot be borrowed from navigation or hidden content',()=>{
 assert.equal(hasResearchComponent(programmeText(`<nav>${degree}</nav><main>${course(61488)}</main>`)),false);
 assert.equal(hasResearchComponent(programmeText(`<main>${degree}<div hidden>${course(61488)}</div></main>`)),false);
});

test('Croatian applied mathematics title preserves subject and word boundaries',()=>{
 assert.deepEqual(fieldsFrom('Primijenjena matematika'),['Matemáticas aplicadas']);
 for(const text of ['Matematika','Neprimijenjena matematika','Primijenjena matematikaabc'])assert.deepEqual(fieldsFrom(text),[]);
});
test('FOI and Rijeka require their degree-qualified compulsory dissertation rows',()=>{
 const foi='Sveučilišni diplomski studijski programi obvezno 69575 Diplomski rad 4 24 69576 Stručna praksa 4 6';
 const rijeka='Sveučilišni diplomski studij Diskretna matematika i primjene Sveučilišni magistar matematike Semestar: 4 MODUL KOLEGIJ NOSITELJ P V S ECTS STATUS4 Seminar diplomskog rada 0 0 30 4 O Diplomski rad 4 O';
 assert.equal(hasResearchComponent(foi),true);assert.equal(hasResearchComponent(rijeka),true);
 for(const text of [foi.replace('Sveučilišni diplomski','Sveučilišni preddiplomski'),foi.replace('obvezno','izborni'),foi.replace('69575 Diplomski rad 4 24 ',''),rijeka.replace(' Diplomski rad 4 O',''),rijeka.replace('Sveučilišni magistar matematike','Sveučilišni prvostupnik matematike')])assert.equal(hasResearchComponent(text),false);
});
test('Sarajevo second-cycle dissertation is not borrowed from a bare diploma-work mention',()=>{
 const text='Stručni naziv koji se stiče je Magistar matematike Pravila studiranja na II ciklusu studija u IV semestru se radi magistarski rad.';
 assert.equal(hasResearchComponent(text),true);
 for(const value of ['magistarski rad',text.replace('II ciklusu','I ciklusu'),text.replace('se radi','se ne radi')])assert.equal(hasResearchComponent(value),false);
});
test('Ljubljana requires the affirmative preparation, submission and public defence of the masters dissertation',()=>{
 const text='skladno s pravili pripravljeno in oddano magistrsko delo ter uspešno opravljen javni zagovor magistrskega dela';
 assert.equal(hasResearchComponent(text),true);
 for(const value of ['magistrsko delo','javni zagovor',text.replace('magistrsko delo','diplomsko delo'),text.replace('pripravljeno','ni pripravljeno')])assert.equal(hasResearchComponent(value),false);
});
