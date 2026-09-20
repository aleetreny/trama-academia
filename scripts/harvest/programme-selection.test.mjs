import test from 'node:test';
import assert from 'node:assert/strict';
import {selectProgrammeSeeds} from './programme-selection.mjs';
const seeds=[{url:'https://example.edu/one',title:'Reviewed title'},{url:'https://example.edu/two',title:'Another programme'}];
test('a selected batch rechecks only its known identities and never imports unreviewed draft facts',()=>{
 const selected=selectProgrammeSeeds(seeds,[{url:'https://example.edu/one?utm_source=duplicate',title:'Unreviewed changed facts'}]);
 assert.deepEqual(selected,[seeds[0]]);assert.deepEqual(selectProgrammeSeeds(seeds,undefined),seeds);
});
test('unknown or empty selections fail before harvesting instead of silently producing a successful empty edition',()=>{
 assert.throws(()=>selectProgrammeSeeds(seeds,[]),/empty_programme_selection/);
 assert.throws(()=>selectProgrammeSeeds(seeds,['https://example.edu/missing']),/unknown_programme_selection/);
});
