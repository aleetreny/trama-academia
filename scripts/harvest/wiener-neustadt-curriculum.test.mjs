import test from 'node:test';
import assert from 'node:assert/strict';
import {programmeText,hasResearchComponent} from './programme-evidence.mjs';

const course=(title,credits)=>`<div class="course py-2 d-flex justify-content-between"><div class="pr-3 break-word font-size--small">${title}</div><div class="font-size--small">${credits}</div></div>`;
const section=content=>`<div class="study-program-detail"><h1>Master MedTech</h1><section class="curriculum" id="curriculum"><h2>Studienplan</h2>${content}</section></div>`;

test('Wiener Neustadt curriculum keeps thesis and numeric ECTS in separate cells',()=>{
 const text=programmeText(section(course('Master Tutorial','2')+course('Master Thesis','28')));
 assert.match(text,/Master Tutorial 2 Master Thesis 28/);
 assert.equal(hasResearchComponent(text),true);
});

test('lookalike cards, ambiguous curriculum IDs and nonnumeric cells are not restored',()=>{
 for(const html of [course('Master Thesis','28'),section(course('Master Thesis','unverified')),section(course('Master Thesis','28'))+'<div id="curriculum"></div>'])assert.equal(hasResearchComponent(programmeText(html)),false);
});

test('hidden or sidebar curriculum rows cannot provide thesis evidence',()=>{
 for(const attributes of ['hidden','aria-hidden="true"','style="display:none"','style="display: none"'])assert.equal(hasResearchComponent(programmeText(section(`<div ${attributes}>${course('Master Thesis','28')}</div>`))),false);
 assert.equal(hasResearchComponent(programmeText(section(`<aside>${course('Master Thesis','28')}</aside>`))),false);
});
