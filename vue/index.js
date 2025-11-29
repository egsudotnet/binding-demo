(function () {
    'use strict';

    const { createApp, reactive, ref, computed } = Vue;
    
    var app = createApp({
        setup() {
            const newTodo = reactive({ title: '', label: '', description: '', startDate: '', dueDate: '', status: 'todo' });
            const todos = reactive([]);
            const editingId = ref(null);
            const editingDraft = reactive({ title: '', label: '', description: '', startDate: '', dueDate: '', status: 'todo' });

            function load() {
                if (window.localTodoApi && window.localTodoApi.isAvailable()) {
                    const data = window.localTodoApi.getAll() || [];
                    todos.splice(0, todos.length, ...data);
                }
            }

            const todosSorted = computed(() => {
                return [...todos].sort((a,b) => (a.createdAt||0) - (b.createdAt||0));
            });

            const count = computed(() => todos.length);

            function add() {
                const v = (newTodo.title || '').trim();
                if (!v) return;
                if (window.localTodoApi) {
                    window.localTodoApi.add({
                        title: newTodo.title,
                        label: newTodo.label,
                        description: newTodo.description,
                        startDate: newTodo.startDate,
                        dueDate: newTodo.dueDate,
                        status: newTodo.status
                    });
                    newTodo.title = '';
                    newTodo.label = '';
                    newTodo.description = '';
                    newTodo.startDate = '';
                    newTodo.dueDate = '';
                    newTodo.status = 'todo';
                    load();
                }
            }

            function toggle(todo) {
                if (!todo || !window.localTodoApi) return;
                window.localTodoApi.update(todo.id, { completed: !!todo.completed });
                load();
            }

            function remove(id) {
                if (!window.localTodoApi) return;
                window.localTodoApi.remove(id);
                load();
            }

            function startEdit(todo) {
                editingId.value = todo.id;
                editingDraft.title = todo.title || '';
                editingDraft.label = todo.label || '';
                editingDraft.description = todo.description || '';
                editingDraft.startDate = todo.startDate || '';
                editingDraft.dueDate = todo.dueDate || '';
                editingDraft.status = todo.status || 'todo';
            }

            function finishEdit(todo) {
                if (!editingId.value) return;
                const updates = {
                    title: editingDraft.title && String(editingDraft.title).trim(),
                    label: editingDraft.label && String(editingDraft.label).trim(),
                    description: editingDraft.description && String(editingDraft.description).trim(),
                    startDate: editingDraft.startDate || '',
                    dueDate: editingDraft.dueDate || '',
                    status: editingDraft.status || 'todo'
                };
                window.localTodoApi.update(todo.id, updates);
                editingId.value = null;
                // clear draft
                editingDraft.title = '';
                editingDraft.label = '';
                editingDraft.description = '';
                editingDraft.startDate = '';
                editingDraft.dueDate = '';
                editingDraft.status = 'todo';
                load();
            }

            function cancelEdit() {
                editingId.value = null;
                editingDraft.title = '';
                editingDraft.label = '';
                editingDraft.description = '';
                editingDraft.startDate = '';
                editingDraft.dueDate = '';
                editingDraft.status = 'todo';
            }

            function clearCompleted() {
                if (!window.localTodoApi) return;
                window.localTodoApi.clearCompleted();
                load();
            }

            function clearAll() {
                if (!window.localTodoApi) return;
                if (confirm('Hapus semua tugas?')) {
                    window.localTodoApi.clearAll();
                    load();
                }
            }

            // listen for external changes
            window.addEventListener('localTodoApi:changed', load);

            // initial load
            load();

            return {
                newTodo,
                todos,
                todosSorted,
                count,
                editingId,
                editingDraft,
                add,
                toggle,
                remove,
                startEdit,
                finishEdit,
                cancelEdit,
                clearCompleted,
                clearAll
            };
        }
    }).mount('#todo-app-vue');

    window.$app = app; 
    /// Variable bisa dihlangkan supaya tetap encaplsulated, untuk debuging saja. Misal $app.todos[0].label = "UBAH SESUAI KEINGINAN"

})();	