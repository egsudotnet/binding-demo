// Native JS Todo app wiring using global localTodoApi
(function () {
    'use strict';

    function q(sel, ctx) { return (ctx || document).querySelector(sel); }
    function qa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

    var form = q('#todo-form');
    var input = q('#todo-input');
    var labelInput = q('#todo-label');
    var descInput = q('#todo-desc');
    var startInput = q('#todo-start');
    var dueInput = q('#todo-due');
    var statusSelect = q('#todo-status');
    var listEl = q('#todo-list');
    var countEl = q('#todo-count');
    var clearCompletedBtn = q('#clear-completed');
    var clearAllBtn = q('#clear-all');

    function formatCount(n) { return n + (n === 1 ? ' tugas' : ' tugas'); }

    function render() {
        var todos = [];
        if (window.localTodoApi && window.localTodoApi.isAvailable()) {
            todos = window.localTodoApi.getAll() || [];
        }
        // sort by createdAt asc
        todos.sort(function(a,b){ return (a.createdAt||0) - (b.createdAt||0); });

        // update count
        countEl.textContent = formatCount(todos.length);

        // render list
        listEl.innerHTML = '';
        if (!todos.length) {
            var empty = document.createElement('li');
            empty.textContent = 'Belum ada tugas. Tambah tugas di atas.';
            empty.style.color = '#666';
            listEl.appendChild(empty);
            return;
        }

        todos.forEach(function (t) {
            var li = document.createElement('li');
            li.setAttribute('data-id', t.id);
            li.className = 'list-group-item';
            li.style.padding = '';

            var topRow = document.createElement('div');
            topRow.style.display = 'flex';
            topRow.style.alignItems = 'center';
            topRow.style.gap = '8px';

            var cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.checked = !!t.completed;
            cb.className = 'todo-checkbox form-check-input';

            var titleWrap = document.createElement('div');
            titleWrap.className = 'd-flex align-items-center gap-2 flex-grow-1';

            var titleEl = document.createElement('div');
            titleEl.textContent = t.title || '(tanpa judul)';
            if (t.completed) titleEl.style.textDecoration = 'line-through';

            // optional label badge
            if (t.label) {
                var badge = document.createElement('span');
                badge.className = 'badge bg-info text-dark me-2';
                badge.textContent = t.label;
                titleWrap.appendChild(badge);
            }

            titleWrap.appendChild(titleEl);

            var editBtn = document.createElement('button');
            editBtn.type = 'button';
            editBtn.textContent = 'Edit';
            editBtn.className = 'todo-edit btn btn-sm btn-outline-secondary';

            var delBtn = document.createElement('button');
            delBtn.type = 'button';
            delBtn.textContent = 'Hapus';
            delBtn.className = 'todo-delete btn btn-sm btn-outline-danger';

            topRow.appendChild(cb);
            topRow.appendChild(titleWrap);
            topRow.appendChild(editBtn);
            topRow.appendChild(delBtn);

            li.appendChild(topRow);

            // description
            if (t.description) {
                var p = document.createElement('p');
                p.textContent = t.description;
                p.className = 'mb-1 text-muted';
                li.appendChild(p);
            }

            // meta row: dates and status
            var meta = document.createElement('div');
            meta.className = 'small text-muted';

            if (t.startDate) {
                var sd = document.createElement('span');
                sd.textContent = 'Start: ' + t.startDate;
                sd.className = 'me-3';
                meta.appendChild(sd);
            }
            if (t.dueDate) {
                var dd = document.createElement('span');
                dd.textContent = 'Due: ' + t.dueDate;
                dd.className = 'me-3';
                meta.appendChild(dd);
            }
            if (t.status) {
                var st = document.createElement('span');
                st.textContent = 'Status: ' + t.status;
                meta.appendChild(st);
            }

            if (meta.children.length) li.appendChild(meta);

            listEl.appendChild(li);
        });
    }

    function addTodo(data) {
        if (!window.localTodoApi || !window.localTodoApi.isAvailable()) return null;
        var payload = {
            title: data && data.title ? String(data.title) : '',
            label: data && data.label ? String(data.label) : '',
            description: data && data.description ? String(data.description) : '',
            startDate: data && data.startDate ? String(data.startDate) : '',
            dueDate: data && data.dueDate ? String(data.dueDate) : '',
            status: data && data.status ? String(data.status) : '',
            completed: !!(data && data.completed)
        };
        var item = window.localTodoApi.add(payload);
        render();
        return item;
    }

    function toggleTodo(id, completed) {
        if (!window.localTodoApi) return;
        window.localTodoApi.update(id, { completed: !!completed });
        render();
    }

    function deleteTodo(id) {
        if (!window.localTodoApi) return;
        window.localTodoApi.remove(id);
        render();
    }

    function editTodo(id, newTitle) {
        if (!window.localTodoApi) return null;
        var updated = window.localTodoApi.update(id, { title: String(newTitle) });
        render();
        return updated;
    }

    // event bindings
    document.addEventListener('click', function (ev) {
        var btn = ev.target;
        if (btn.classList.contains('todo-delete')) {
            var li = btn.closest('li');
            if (!li) return;
            var id = li.getAttribute('data-id');
            deleteTodo(id);
        }
        if (btn.classList.contains('todo-edit')) {
            var li = btn.closest('li');
            if (!li) return;
            var id = li.getAttribute('data-id');
            var todo = (window.localTodoApi && window.localTodoApi.find) ? window.localTodoApi.find(id) : null;
            if (!todo) return;

            // build inline editor
            var editWrap = document.createElement('div');
            editWrap.style.display = 'grid';
            editWrap.style.gap = '8px';

            var titleInput = document.createElement('input');
            titleInput.type = 'text';
            titleInput.value = todo.title || '';
            titleInput.placeholder = 'Judul tugas';
            titleInput.style.width = '100%';

            var labelInp = document.createElement('input');
            labelInp.type = 'text';
            labelInp.value = todo.label || '';
            labelInp.placeholder = 'Label (mis. Urgent)';

            var descTextarea = document.createElement('textarea');
            descTextarea.rows = 3;
            descTextarea.value = todo.description || '';
            descTextarea.placeholder = 'Deskripsi (opsional)';

            var row = document.createElement('div');
            row.style.display = 'flex';
            row.style.gap = '8px';

            var startInp = document.createElement('input');
            startInp.type = 'date';
            startInp.value = todo.startDate || '';

            var dueInp = document.createElement('input');
            dueInp.type = 'date';
            dueInp.value = todo.dueDate || '';

            var statusSel = document.createElement('select');
            var optTodo = document.createElement('option'); optTodo.value = 'todo'; optTodo.textContent = 'Todo';
            var optProg = document.createElement('option'); optProg.value = 'in-progress'; optProg.textContent = 'In Progress';
            var optDone = document.createElement('option'); optDone.value = 'done'; optDone.textContent = 'Done';
            statusSel.appendChild(optTodo); statusSel.appendChild(optProg); statusSel.appendChild(optDone);
            statusSel.value = todo.status || 'todo';

            row.appendChild(startInp);
            row.appendChild(dueInp);
            row.appendChild(statusSel);

            var btnRow = document.createElement('div');
            btnRow.style.display = 'flex';
            btnRow.style.gap = '8px';

            var saveBtn = document.createElement('button');
            saveBtn.type = 'button';
            saveBtn.textContent = 'Simpan';
            saveBtn.className = 'btn btn-sm btn-primary';
            var cancelBtn = document.createElement('button');
            cancelBtn.type = 'button';
            cancelBtn.textContent = 'Batal';
            cancelBtn.className = 'btn btn-sm btn-secondary';

            btnRow.appendChild(saveBtn);
            btnRow.appendChild(cancelBtn);

            editWrap.appendChild(titleInput);
            editWrap.appendChild(labelInp);
            editWrap.appendChild(descTextarea);
            editWrap.appendChild(row);
            editWrap.appendChild(btnRow);

            // replace li contents with editor
            li.innerHTML = '';
            li.appendChild(editWrap);

            titleInput.focus();

            saveBtn.addEventListener('click', function () {
                var updates = {
                    title: titleInput.value && titleInput.value.trim(),
                    label: labelInp.value && labelInp.value.trim(),
                    description: descTextarea.value && descTextarea.value.trim(),
                    startDate: startInp.value || '',
                    dueDate: dueInp.value || '',
                    status: statusSel.value || 'todo'
                };
                window.localTodoApi.update(id, updates);
                render();
            });

            cancelBtn.addEventListener('click', function () { render(); });

            // keyboard shortcuts: Enter (save) / Escape (cancel)
            editWrap.addEventListener('keydown', function (ev) {
                if (ev.key === 'Escape') { ev.preventDefault(); render(); }
                if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey || ev.target === titleInput)) { ev.preventDefault(); saveBtn.click(); }
            });
        }
    });

    // checkbox toggle via event delegation
    document.addEventListener('change', function (ev) {
        if (ev.target.classList && ev.target.classList.contains('todo-checkbox')) {
            var li = ev.target.closest('li');
            if (!li) return;
            var id = li.getAttribute('data-id');
            toggleTodo(id, ev.target.checked);
        }
    });

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        var title = input.value && input.value.trim();
        if (!title) return;
        var payload = {
            title: title,
            label: labelInput.value && labelInput.value.trim(),
            description: descInput.value && descInput.value.trim(),
            startDate: startInput.value || '',
            dueDate: dueInput.value || '',
            status: statusSelect.value || 'todo'
        };
        addTodo(payload);
        // clear inputs
        input.value = '';
        labelInput.value = '';
        descInput.value = '';
        startInput.value = '';
        dueInput.value = '';
        statusSelect.value = 'todo';
        input.focus();
    });

    clearCompletedBtn.addEventListener('click', function () {
        if (!window.localTodoApi) return;
        window.localTodoApi.clearCompleted();
        render();
    });

    clearAllBtn.addEventListener('click', function () {
        if (!window.localTodoApi) return;
        if (confirm('Hapus semua tugas?')) {
            window.localTodoApi.clearAll();
            render();
        }
    });

    // respond to storage changes (cross-tab or API events)
    window.addEventListener('localTodoApi:changed', function () { render(); });

    // initial render; wait for DOM ready
    document.addEventListener('DOMContentLoaded', function () { render(); });

    // also render immediately in case script loaded after DOM
    render();

})();