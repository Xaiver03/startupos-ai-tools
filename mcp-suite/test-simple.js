// Simple test for universal CRUD tools
const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;

function test(name, condition) {
  if (condition) {
    console.log(`✓ ${name}`);
    passed++;
  } else {
    console.log(`✗ ${name}`);
    failed++;
  }
}

console.log('=== MCP Universal CRUD Tools - Simple Test ===\n');

// Test file existence
test('Shared resources.js exists', fs.existsSync('packages/shared/dist/resources.js'));
test('Universal crud.js exists', fs.existsSync('packages/core/dist/tools/universal-crud.js'));
test('Core index.js exists', fs.existsSync('packages/core/dist/index.js'));

// Test exports
const resources = require('./packages/shared/dist/resources.js');
test('RESOURCES exported', !!resources.RESOURCES);
test('getResource function exported', typeof resources.getResource === 'function');
test('assertCrud function exported', typeof resources.assertCrud === 'function');

// Test resource count
const resourceCount = Object.keys(resources.RESOURCES).length;
test(`Resource count >= 120 (actual: ${resourceCount})`, resourceCount >= 120);

// Test sample resources
test('accounts resource exists', !!resources.RESOURCES['accounts']);
test('journal-entries resource exists', !!resources.RESOURCES['journal-entries']);
test('employees resource exists', !!resources.RESOURCES['employees']);
test('annual-bonus resource exists', !!resources.RESOURCES['annual-bonus']);

// Test universal CRUD tools
const crudTools = require('./packages/core/dist/tools/universal-crud.js');
test('createUniversalCrudTools exported', typeof crudTools.createUniversalCrudTools === 'function');

console.log(`\n=== Summary ===`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Coverage: ${Math.round(passed * 100 / (passed + failed))}%`);

process.exit(failed > 0 ? 1 : 0);
