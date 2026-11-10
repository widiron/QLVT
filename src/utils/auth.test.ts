import test from 'node:test';
import assert from 'node:assert/strict';
import { ROLE_PERMISSIONS, checkUserPermission } from './auth';

test('ADMIN has access to all permissions', () => {
  assert.equal(checkUserPermission('ADMIN', undefined, 'SYSTEM_SETTINGS'), true);
  assert.equal(checkUserPermission('ADMIN', undefined, 'MANAGE_USERS'), true);
  assert.equal(checkUserPermission('ADMIN', undefined, 'CANCEL_RECEIPTS'), true);
  assert.equal(checkUserPermission('ADMIN', undefined, 'MANAGE_STOCK_IN'), true);
  assert.equal(checkUserPermission('ADMIN', undefined, 'MANAGE_STOCK_OUT'), true);
});

test('WAREHOUSE_STAFF (combining stock-in and stock-out) has both IN and OUT permissions', () => {
  assert.equal(checkUserPermission('WAREHOUSE_STAFF', undefined, 'VIEW_DASHBOARD'), true);
  assert.equal(checkUserPermission('WAREHOUSE_STAFF', undefined, 'MANAGE_STOCK_IN'), true);
  assert.equal(checkUserPermission('WAREHOUSE_STAFF', undefined, 'MANAGE_STOCK_OUT'), true);
  assert.equal(checkUserPermission('WAREHOUSE_STAFF', undefined, 'MANAGE_PRODUCTS'), true);
  assert.equal(checkUserPermission('WAREHOUSE_STAFF', undefined, 'MANAGE_SUPPLIERS'), true);
  assert.equal(checkUserPermission('WAREHOUSE_STAFF', undefined, 'MANAGE_CUSTOMERS'), true);
  assert.equal(checkUserPermission('WAREHOUSE_STAFF', undefined, 'CANCEL_RECEIPTS'), false);
  assert.equal(checkUserPermission('WAREHOUSE_STAFF', undefined, 'SYSTEM_SETTINGS'), false);
  assert.equal(checkUserPermission('WAREHOUSE_STAFF', undefined, 'MANAGE_USERS'), false);
});

test('ACCOUNTANT can view reports and partners but cannot create stock in/out directly', () => {
  assert.equal(checkUserPermission('ACCOUNTANT', undefined, 'VIEW_REPORTS'), true);
  assert.equal(checkUserPermission('ACCOUNTANT', undefined, 'MANAGE_SUPPLIERS'), true);
  assert.equal(checkUserPermission('ACCOUNTANT', undefined, 'MANAGE_CUSTOMERS'), true);
  assert.equal(checkUserPermission('ACCOUNTANT', undefined, 'MANAGE_STOCK_IN'), false);
  assert.equal(checkUserPermission('ACCOUNTANT', undefined, 'MANAGE_STOCK_OUT'), false);
  assert.equal(checkUserPermission('ACCOUNTANT', undefined, 'CANCEL_RECEIPTS'), false);
});

test('WAREHOUSE_MANAGER can cancel receipts and manage in/out but cannot change system settings or manage users', () => {
  assert.equal(checkUserPermission('WAREHOUSE_MANAGER', undefined, 'CANCEL_RECEIPTS'), true);
  assert.equal(checkUserPermission('WAREHOUSE_MANAGER', undefined, 'MANAGE_STOCK_IN'), true);
  assert.equal(checkUserPermission('WAREHOUSE_MANAGER', undefined, 'MANAGE_STOCK_OUT'), true);
  assert.equal(checkUserPermission('WAREHOUSE_MANAGER', undefined, 'SYSTEM_SETTINGS'), false);
  assert.equal(checkUserPermission('WAREHOUSE_MANAGER', undefined, 'MANAGE_USERS'), false);
});

test('Custom user permissions override default role permissions if specified', () => {
  assert.equal(checkUserPermission('WAREHOUSE_STAFF', ['CANCEL_RECEIPTS'], 'CANCEL_RECEIPTS'), true);
  assert.equal(checkUserPermission('WAREHOUSE_STAFF', ['CANCEL_RECEIPTS'], 'MANAGE_STOCK_IN'), false);
});
