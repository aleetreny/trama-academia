import test from 'node:test';
import assert from 'node:assert/strict';
import {createInstitutionMatcher} from './research-match.mjs';

test('a joint degree does not inherit the institution hosting its website',()=>{
 const match=createInstitutionMatcher([{id:'a',name:'University A',aliases:['Uni A'],country:'IT',domains:['a.edu'],officialUrl:'https://a.edu'}]);
 for(const separator of [' · ',' / ',' — ',' & '])assert.equal(match({institution:'University A'+separator+'University B',country:'IT',url:'https://a.edu/joint-degree'}),null);
 assert.equal(match({institution:'Uni A',country:'IT',url:'https://a.edu/degree'}).method,'name-country');
 assert.equal(match({institution:'School of Computing',country:'IT',url:'https://a.edu/degree'}).method,'official-domain-country');
});
