// jQuery-based Todo app wiring using localTodoApi (enhanced fields + Bootstrap)
(function ($) {
    'use strict';

    var $form = $('#todo-form');
    var $input = $('#todo-input');
    var $labelInput = $('#todo-label');
    var $descInput = $('#todo-desc');
    var $startInput = $('#todo-start');
    var $dueInput = $('#todo-due');
    var $statusSelect = $('#todo-status');
    var $list = $('#todo-list');
    var $count = $('#todo-count');
    var $clearCompleted = $('#clear-completed');
    var $clearAll = $('#clear-all');

    function formatCount(n) { return n + (n === 1 ? ' tugas' : ' tugas'); }

    function render() {
        var todos = [];
        if (window.localTodoApi && window.localTodoApi.isAvailable()) {
            todos = window.localTodoApi.getAll() || [];
        }
        todos.sort(function (a, b) { return (a.createdAt || 0) - (b.createdAt || 0); });

        $count.text(formatCount(todos.length));

        $list.empty();
        if (!todos.length) {
            $('<li>').addClass('list-group-item text-muted').text('Belum ada tugas. Tambah tugas di atas.').appendTo($list);
            return;
        }

        todos.forEach(function (t) {
            var $li = $('<li>').attr('data-id', t.id).addClass('list-group-item');
            var $topRow = $('<div>').addClass('d-flex align-items-center gap-2');
            var $cb = $('<input type="checkbox">').addClass('todo-checkbox form-check-input me-2').prop('checked', !!t.completed);

            var $titleWrap = $('<div>').addClass('d-flex align-items-center gap-2 flex-grow-1');
            if (t.label) {
                var $badge = $('<span>').addClass('badge bg-info text-dark me-2').text(t.label);
                $titleWrap.append($badge);
            }
            var $titleEl = $('<div>').text(t.title || '(tanpa judul)');
            if (t.completed) $titleEl.css('textDecoration', 'line-through');
            $titleWrap.append($titleEl);

            var $edit = $('<button type="button">').addClass('todo-edit btn btn-sm btn-outline-secondary').text('Edit');
            var $del = $('<button type="button">').addClass('todo-delete btn btn-sm btn-outline-danger').text('Hapus');

            $topRow.append($cb, $titleWrap, $edit, $del);
            $li.append($topRow);

            if (t.description) {
                $li.append($('<p>').addClass('mb-1 text-muted').text(t.description));
            }

            var $meta = $('<div>').addClass('small text-muted');
            if (t.startDate) $meta.append($('<span>').addClass('me-3').text('Start: ' + t.startDate));
            if (t.dueDate) $meta.append($('<span>').addClass('me-3').text('Due: ' + t.dueDate));
            if (t.status) $meta.append($('<span>').text('Status: ' + t.status));
            if ($meta.children().length) $li.append($meta);

            $list.append($li);
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

    // delegated events
    $list.on('change', '.todo-checkbox', function () {
        var $li = $(this).closest('li');
        var id = $li.attr('data-id');
        toggleTodo(id, $(this).prop('checked'));
    });

    $list.on('click', '.todo-delete', function () {
        var $li = $(this).closest('li');
        deleteTodo($li.attr('data-id'));
    });

    $list.on('click', '.todo-edit', function () {
        var $li = $(this).closest('li');
        var id = $li.attr('data-id');
        var todo = (window.localTodoApi && window.localTodoApi.find) ? window.localTodoApi.find(id) : null;
        if (!todo) return;

        var $editWrap = $('<div>').addClass('d-grid gap-2');
        var $titleInput = $('<input>').attr('type', 'text').addClass('form-control').val(todo.title || '').attr('placeholder', 'Judul tugas');
        var $labelInp = $('<input>').attr('type', 'text').addClass('form-control').val(todo.label || '').attr('placeholder', 'Label (mis. Urgent)');
        var $desc = $('<textarea>').addClass('form-control').attr('rows', 3).val(todo.description || '').attr('placeholder', 'Deskripsi (opsional)');

        var $row = $('<div>').addClass('d-flex gap-2');
        var $start = $('<input>').attr('type', 'date').addClass('form-control').val(todo.startDate || '').css('width', 'auto');
        var $due = $('<input>').attr('type', 'date').addClass('form-control').val(todo.dueDate || '').css('width', 'auto');
        var $status = $('<select>').addClass('form-select').css('width', '160px');
        $status.append($('<option>').val('todo').text('Todo'));
        $status.append($('<option>').val('in-progress').text('In Progress'));
        $status.append($('<option>').val('done').text('Done'));
        $status.val(todo.status || 'todo');
        $row.append($start, $due, $status);

        var $btnRow = $('<div>').addClass('d-flex gap-2');
        var $save = $('<button type="button">').addClass('btn btn-sm btn-primary').text('Simpan');
        var $cancel = $('<button type="button">').addClass('btn btn-sm btn-secondary').text('Batal');
        $btnRow.append($save, $cancel);

        $editWrap.append($titleInput, $labelInp, $desc, $row, $btnRow);

        $li.empty().append($editWrap);
        $titleInput.focus();

        $save.on('click', function () {
            var updates = {
                title: $titleInput.val() && $titleInput.val().trim(),
                label: $labelInp.val() && $labelInp.val().trim(),
                description: $desc.val() && $desc.val().trim(),
                startDate: $start.val() || '',
                dueDate: $due.val() || '',
                status: $status.val() || 'todo'
            };
            window.localTodoApi.update(id, updates);
            render();
        });

        $cancel.on('click', function () { render(); });

        $editWrap.on('keydown', function (ev) {
            if (ev.key === 'Escape') { ev.preventDefault(); render(); }
            if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey || ev.target === $titleInput[0])) { ev.preventDefault(); $save.click(); }
        });
    });

    $form.on('submit', function (e) {
        e.preventDefault();
        var title = $input.val() && $input.val().trim();
        if (!title) return;
        var payload = {
            title: title,
            label: $labelInput.val() && $labelInput.val().trim(),
            description: $descInput.val() && $descInput.val().trim(),
            startDate: $startInput.val() || '',
            dueDate: $dueInput.val() || '',
            status: $statusSelect.val() || 'todo'
        };
        addTodo(payload);
        $input.val(''); $labelInput.val(''); $descInput.val(''); $startInput.val(''); $dueInput.val(''); $statusSelect.val('todo');
        $input.focus();
    });

    $clearCompleted.on('click', function () {
        if (!window.localTodoApi) return;
        window.localTodoApi.clearCompleted();
        render();
    });

    $clearAll.on('click', function () {
        if (!window.localTodoApi) return;
        if (confirm('Hapus semua tugas?')) {
            window.localTodoApi.clearAll();
            render();
        }
    });

    $(window).on('localTodoApi:changed', function () { render(); });

    $(function () { render(); });

})(jQuery); 