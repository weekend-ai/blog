document.addEventListener('keydown', function (event) {
    if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        window.location.href = '/search';
    }
}); 