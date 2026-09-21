import test from 'node:test';
import assert from 'node:assert/strict';
import {spainDoctoralGuide as guide} from '../../data/spain-doctoral-guide.ts';
import {PATH_ACTIONS} from '../../lib/doctoral-path.ts';

const sourceIds = new Set(guide.sources.map(source => source.id));
const sectionIds = new Set(guide.sections.map(section => section.id));

test('doctoral guide evidence resolves to dated sources and distinguishes editorial advice', () => {
  assert.equal(sourceIds.size, guide.sources.length, 'Source IDs must be unique');
  assert.equal(sectionIds.size, guide.sections.length, 'Section IDs must be unique');
  for (const source of guide.sources) {
    assert.ok(source.title.trim() && source.publisher.trim() && source.scope.trim(), source.id);
    assert.equal(new URL(source.url).protocol, 'https:', source.id);
    assert.match(source.checkedAt, /^\d{4}-\d{2}-\d{2}$/u, source.id);
    assert.ok(Number.isFinite(Date.parse(source.checkedAt)), source.id);
    assert.ok(source.checkedAt <= guide.reviewedAt, 'Guide review cannot predate a claimed source check');
  }
  for (const section of guide.sections) {
    for (const block of section.blocks) {
      assert.ok(block.editorial || block.sourceIds?.length, `Unattributed factual block in ${section.id}`);
      for (const id of block.sourceIds ?? []) assert.ok(sourceIds.has(id), `Missing ${section.id} source: ${id}`);
      if (block.kind === 'template') assert.equal(block.editorial, true, 'TRAMA templates must be marked as advice');
    }
  }
});

test('personal pathway actions keep working when guide sections change', () => {
  for (const action of Object.values(PATH_ACTIONS)) {
    const target = new URL(action.href, 'https://trama.invalid');
    if (target.pathname !== '/doctorado-en-espana') continue;
    assert.ok(target.hash, `Pathway action ${action.id} needs a specific guide section`);
    assert.ok(sectionIds.has(decodeURIComponent(target.hash.slice(1))), `Broken action ${action.id}: ${action.href}`);
  }
});

test('guide comparisons retain a heading for every cell and no empty reading blocks', () => {
  for (const section of guide.sections) {
    assert.ok(section.title.trim() && section.summary.trim(), section.id);
    assert.ok(section.blocks.length, `Empty section ${section.id}`);
    for (const block of section.blocks) {
      if (block.kind === 'table') {
        assert.ok(block.columns.length >= 2 && block.rows.length, section.id);
        assert.ok(block.columns.every(column => column.trim()), section.id);
        for (const row of block.rows) {
          assert.equal(row.length, block.columns.length, `Missing table header/cell in ${section.id}`);
          assert.ok(row.every(cell => cell.trim()), section.id);
        }
      } else if ('items' in block) {
        assert.ok(block.items.length && block.items.every(item => item.trim()), section.id);
      } else {
        assert.ok(block.text.trim(), section.id);
      }
    }
  }
});
