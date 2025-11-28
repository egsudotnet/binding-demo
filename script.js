(function(){
    function getFilename(path) { var parts = path.split('/'); var last = parts.pop() || parts.pop(); return last || ''; }
    var filename = getFilename(window.location.pathname).toLowerCase();
    var tabs = document.querySelectorAll('.tabs .tab');
    if (!filename) filename = 'index.html';
    tabs.forEach(function(t){ var href = t.getAttribute('href') || ''; var target = getFilename(href).toLowerCase(); if (target && filename.indexOf(target) !== -1) t.classList.add('active'); });
})();