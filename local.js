/**
 * local.js
 * Small localStorage-backed API for a Todo list application.
 * Exposes a single global `localTodoApi` with synchronous methods.
 *
 * Methods:
 * - isAvailable(): boolean
 * - getAll(): Todo[]
 * - saveAll(todos): boolean
 * - add(todoData): Todo
 * - update(id, updates): Todo|null
 * - remove(id): boolean
 * - clearCompleted(): number (removed count)
 * - clearAll(): boolean
 * - find(id): Todo|null
 * - count(): number
 *
 * Todo shape (example):
 * { id: string, title: string, completed: boolean, createdAt: number, updatedAt: number }
 */
(function (global) {
	'use strict';

	var STORAGE_KEY = 'binding-demo.todos.v1';

	function isLocalStorageAvailable() {
		try {
			var testKey = '__ls_test__';
			localStorage.setItem(testKey, testKey);
			localStorage.removeItem(testKey);
			return true;
		} catch (e) {
			return false;
		}
	}

	function readRaw() {
		if (!isLocalStorageAvailable()) return [];
		try {
			var raw = localStorage.getItem(STORAGE_KEY);
			if (!raw) return [];
			var parsed = JSON.parse(raw);
			return Array.isArray(parsed) ? parsed : [];
		} catch (e) {
			// If parsing fails, return empty list and log error
			console.error('localTodoApi: failed to read todos from localStorage', e);
			return [];
		}
	}

	function writeRaw(todos) {
		if (!isLocalStorageAvailable()) return false;
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
			// notify listeners that todos changed
			try {
				var ev = new CustomEvent('localTodoApi:changed', { detail: { todos: todos } });
				global.dispatchEvent(ev);
			} catch (e) {
				// ignore CustomEvent errors on very old browsers
			}
			return true;
		} catch (e) {
			console.error('localTodoApi: failed to write todos to localStorage', e);
			return false;
		}
	}

	function generateId() {
		// simple unique id: timestamp + random suffix
		return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
	}

	function now() { return Date.now(); }

	// Public API
	var api = {
		isAvailable: isLocalStorageAvailable,

		getAll: function () {
			return readRaw();
		},

		saveAll: function (todos) {
			if (!Array.isArray(todos)) throw new TypeError('saveAll expects an array');
			return writeRaw(todos);
		},

		add: function (todoData) {
			var todos = readRaw();
			var id = generateId();
			var item = {
				id: id,
				title: (todoData && todoData.title) ? String(todoData.title) : '',
				completed: !!(todoData && todoData.completed),
				createdAt: now(),
				updatedAt: now()
			};
			// copy optional fields
			if (todoData && typeof todoData === 'object') {
				for (var k in todoData) {
					if (Object.prototype.hasOwnProperty.call(todoData, k)) {
						if (!(k in item)) item[k] = todoData[k];
					}
				}
			}
			todos.push(item);
			writeRaw(todos);
			return item;
		},

		update: function (id, updates) {
			if (!id) return null;
			var todos = readRaw();
			var idx = todos.findIndex(function (t) { return t.id === id; });
			if (idx === -1) return null;
			var item = Object.assign({}, todos[idx]);
			if (updates && typeof updates === 'object') {
				for (var key in updates) {
					if (Object.prototype.hasOwnProperty.call(updates, key)) {
						if (key === 'id' || key === 'createdAt') continue; // don't overwrite id/createdAt
						item[key] = updates[key];
					}
				}
			}
			item.updatedAt = now();
			todos[idx] = item;
			writeRaw(todos);
			return item;
		},

		remove: function (id) {
			if (!id) return false;
			var todos = readRaw();
			var lenBefore = todos.length;
			todos = todos.filter(function (t) { return t.id !== id; });
			var changed = todos.length !== lenBefore;
			if (changed) writeRaw(todos);
			return changed;
		},

		clearCompleted: function () {
			var todos = readRaw();
			var before = todos.length;
			todos = todos.filter(function (t) { return !t.completed; });
			var removed = before - todos.length;
			if (removed > 0) writeRaw(todos);
			return removed;
		},

		clearAll: function () {
			if (!isLocalStorageAvailable()) return false;
			try {
				localStorage.removeItem(STORAGE_KEY);
				try { global.dispatchEvent(new CustomEvent('localTodoApi:changed', { detail: { todos: [] } })); } catch (e) {}
				return true;
			} catch (e) {
				console.error('localTodoApi: failed to clear todos', e);
				return false;
			}
		},

		find: function (id) {
			if (!id) return null;
			var todos = readRaw();
			return todos.find(function (t) { return t.id === id; }) || null;
		},

		count: function () {
			return readRaw().length;
		}
	};

	// expose on global
	global.localTodoApi = api;

})(window);
