import test from 'node:test';
import assert from 'node:assert/strict';
import {programmeText,hasResearchComponent} from './programme-evidence.mjs';
import {fieldsFrom} from './domain.mjs';

test('Italian learning alias requires the complete technical term',()=>{
 assert.deepEqual(fieldsFrom('ricerca operativa ottimizzazione apprendimento automatico'),['Machine learning','Matemáticas aplicadas']);
 for(const text of ['apprendimento','apprendimento automaticox'])assert.deepEqual(fieldsFrom(text),[]);
});
test('Cagliari master final report requires supervision and an explicit research route',()=>{
 const degree='Corso di Laurea Magistrale';
 const report='La prova finale consiste nella discussione di una relazione relativa ad un lavoro individuale, svolto dal laureando sotto la supervisione di almeno un docente';
 const review="un'analisi critica dello stato dell'arte";
 const original='lo sviluppo di metodologie e tecniche con un certo grado di originalità';
 assert.equal(hasResearchComponent([degree,report,review,original].join(' ')),true);
 for(const text of [[degree,report,review],[degree,review,original],[report,review,original]])assert.equal(hasResearchComponent(text.join(' ')),false);
 assert.equal(hasResearchComponent(programmeText('<main>Corso di Laurea</main><nav>'+[degree,report,review,original].join(' ')+'</nav>')),false);
});

test('Modena original autonomous final thesis requires master level and both explicit statements',()=>{
 const degree='Corso di Laurea Magistrale';
 const original='La prova finale è una occasione in cui viene richiesto agli studenti di svolgere un lavoro originale in forte autonomia.';
 const thesis='Anche la redazione di una tesi per la prova finale e la relativa esposizione';
 assert.equal(hasResearchComponent([degree,original,thesis].join(' ')),true);
 for(const text of [[degree,original],[degree,thesis],[original,thesis],['Corso di Laurea',original,thesis],[degree,original.replace('originale','professionale'),thesis]])assert.equal(hasResearchComponent(text.join(' ')),false);
 assert.equal(hasResearchComponent(programmeText(`<main>${degree} ${thesis}</main><nav>${original}</nav>`)),false);
});
