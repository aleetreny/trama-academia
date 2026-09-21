import test from 'node:test';
import assert from 'node:assert/strict';
import {hasResearchComponent} from './programme-evidence.mjs';

test('computer memory is not evidence of a French dissertation',()=>{
 for(const text of [
  "Systèmes d'exploitation — 4 ECTS Gestion mémoire et ordonnancement : 12h",
  'Architecture des ordinateurs : hiérarchie de la mémoire, mémoire cache et mémoire virtuelle.',
  'Allocation de mémoire. Mémoire partagée et mémoire distribuée.',
 ])assert.equal(hasResearchComponent(text),false,text);
 assert.equal(hasResearchComponent('Gestion mémoire et ordonnancement. Mémoire de fin d’études : 30 ECTS.'),true);
 assert.equal(hasResearchComponent('Les étudiants rédigent un mémoire de master et le soutiennent devant un jury.'),true);
});
