import test from 'node:test';
import assert from 'node:assert/strict';
import {programmeText} from './programme-evidence.mjs';

const call='<section class="solution-area-base"><div class="w-layout-grid grid-64"><div class="rich-text-block-9 w-richtext"><h3>Introduction</h3><p>Doctoral research call.</p><h3>Scientific Scope</h3><p>Data and computer sciences.</p><h3>Eligibility</h3><p>Master degree and Danish host.</p><h3>Funding and Fellowship Benefits</h3><p>Salary and tuition.</p><h3>Application Requirements</h3><p>Research proposal.</p><h3>Important Dates</h3><p>20 February 2026.</p><nav>Unrelated award 999 EUR</nav><p hidden>Hidden award 888 EUR</p></div></div></section>';
const page=(section=call,title='DARA Open Fellowship Call - Winter 2025/26')=>'<body class="body-4-base-inverse"><div class="page-wrap-3"><main class="main-wrap-8"><section class="hero-area"><h2 class="heading-two">'+title+'</h2></section></main>'+section+'<section><h1>Subscribe to our newsletter</h1><p>Unrelated scholarship 777 EUR.</p></section></div></body>';

test('DARA call reads its visible sibling body without newsletter, navigation or hidden awards',()=>{
 const text=programmeText(page());
 assert.match(text,/DARA Open Fellowship Call - Winter 2025\/26/);
 assert.match(text,/Data and computer sciences/);
 assert.match(text,/Master degree and Danish host/);
 assert.match(text,/Salary and tuition/);
 assert.doesNotMatch(text,/newsletter|Unrelated|Hidden|999|888|777/);
});

test('DARA recovery rejects ambiguous, hidden, unlabelled or unrelated sibling content',()=>{
 for(const html of [page(call+call),page(call.replace('<section class=', '<section hidden class=')),page(call.replace('Scientific Scope','Related programmes')),page(call,'Other university call'),page('<nav>'+call+'</nav>'),page(call.replace('<div class="rich-text-block-9', '<div aria-hidden="true" class="rich-text-block-9'))]){
  assert.doesNotMatch(programmeText(html),/Master degree and Danish host|Salary and tuition/);
 }
});
