const path = require('node:path');
const assert = require('node:assert/strict');
const { runtime } = require('./helpers/runtime.cjs');

(async () => {
  const r = runtime(), { vue } = r;
  const { useSelection } = await r.importFile(path.resolve(__dirname, '../index.js'));
  const items = vue.ref([{ id: 0, disabled: false }, { id: '0', disabled: false }, { id: 2, disabled: true }]);
  const s = useSelection({ items, multiple: true, getKey: item => item.id, isDisabled: item => item.disabled });
  assert.equal(s.allSelected.value, false);
  assert.equal(s.selectableCount.value, 2);
  assert.equal(s.toggle(0), true); assert.equal(s.indeterminate.value, true);
  assert.equal(s.select(0), false); assert.equal(s.select(2), false); assert.equal(s.select('missing'), false);
  assert.equal(s.selectAll(), true); assert.equal(s.allSelected.value, true);
  assert.equal(s.selectedCount.value, 2); assert.equal(s.selectAll(), false);
  assert.equal(s.selectedItems.value[0], items.value[0]);
  assert.equal(Object.isFrozen(s.selectedKeys.value), true);
  assert.equal(Object.isFrozen(s.selectedItems.value), true);
  assert.equal(Object.isFrozen(items.value[0]), false);
  items.value[0].disabled = true;
  assert.equal(s.deselect(0), false); assert.equal(s.isSelected(0), true);
  items.value = [{ id: 3, disabled: false }];
  assert.equal(s.selectedCount.value, 2); assert.equal(s.selectedItems.value.length, 0);
  assert.equal(s.allSelected.value, false); assert.equal(s.indeterminate.value, false);
  s.selectAll(); assert.equal(s.selectedCount.value, 3);
  items.value = []; assert.equal(s.allSelected.value, false); assert.equal(s.indeterminate.value, false);
  assert.equal(s.selectAll(), false); assert.equal(s.clear(), true); assert.equal(s.clear(), false);
  const initial = [1, 1, 2];
  const one = useSelection({ items: () => [1, 2, 3], defaultSelectedKeys: initial });
  initial.push(3); assert.deepEqual(Array.from(one.selectedKeys.value), [1]);
  assert.equal(one.selectAll(), false); one.select(2); assert.deepEqual(Array.from(one.selectedKeys.value), [2]);
  one.toggle(2); assert.equal(one.selectedCount.value, 0);
  one.setSelectedKeys([3, 2]); assert.deepEqual(Array.from(one.selectedKeys.value), [3]);
  const copied = [2]; one.setSelectedKeys(copied); copied.push(1); assert.equal(one.selectedCount.value, 1);
  const list = vue.reactive(['a', 'b']);
  const direct = useSelection({ items: list, multiple: true });
  list.push('c'); direct.selectAll(); assert.equal(direct.selectedCount.value, 3);
  for (const options of [{}, { items: [NaN] }, { items: [{}] }, { items: [1, 1] }, { items: [], multiple: 1 }, { items: [], getKey: 'id' }]) {
    assert.throws(() => useSelection(options), /useSelection/);
  }
  assert.throws(() => one.setSelectedKeys([Infinity]), /useSelection/);
  assert.throws(() => one.setSelectedKeys(null), /useSelection/);
  const dynamic = vue.ref([1]); const checked = useSelection({ items: dynamic });
  dynamic.value = [1, 1]; assert.throws(() => checked.selectableCount.value, /重复键/);
  console.log('PASS selection: single/multiple, typed stable keys, disabled items, all/partial/empty, reactive lists, cross-list retention, immutable snapshots and invalid config');
})().catch(error => { console.error(error); process.exitCode = 1; });
