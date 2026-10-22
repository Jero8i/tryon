/* Include once per page. Product links use data-tryon and their real tryon URL. */
(() => {
  if (window.miradaTryonInstalled) return;
  window.miradaTryonInstalled = true;
  let modal, frame, opener, previousOverflow;
  const close = () => modal?.close();
  document.addEventListener('click', event => {
    const link = event.target.closest?.('a[data-tryon]');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button) return;
    const url = new URL(link.href);
    if (!['https:', 'http:'].includes(url.protocol)) return;
    event.preventDefault();
    if (modal?.open) return;
    opener = link;
    url.searchParams.set('embed', '1');
    url.searchParams.set('parentOrigin', location.origin);
    const select = document.getElementById(link.dataset.tryonLensSelect || '');
    if (select) url.searchParams.set('lens', select.value);
    modal = document.createElement('dialog');
    modal.setAttribute('aria-label', 'Probador virtual');
    modal.style.cssText = 'padding:0;border:0;border-radius:12px;width:min(1200px,96vw);max-width:100vw;height:92dvh;max-height:100dvh;background:#f7f8f2;color:#243d33;overflow:hidden';
    const bar = document.createElement('div');
    bar.style.cssText = 'display:flex;align-items:center;justify-content:space-between;height:54px;padding:0 16px;font:14px sans-serif';
    const title = document.createElement('span'); title.textContent = 'Probador virtual';
    const button = document.createElement('button'); button.type = 'button'; button.textContent = 'Cerrar ×'; button.onclick = close;
    bar.append(title, button);
    const loading = document.createElement('p'); loading.textContent = 'Preparando el probador…'; loading.setAttribute('role', 'status');
    loading.style.cssText = 'position:absolute;z-index:1;top:64px;left:20px;padding:10px;background:#f7f8f2;font:14px sans-serif';
    frame = document.createElement('iframe'); frame.title = 'Probador virtual'; frame.allow = 'camera'; frame.src = url.href;
    frame.style.cssText = 'position:relative;display:block;width:100%;height:calc(100% - 54px);border:0';
    frame.onload = () => loading.remove();
    modal.append(bar, loading, frame); document.body.append(modal);
    previousOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
    modal.addEventListener('close', () => {
      frame?.remove(); frame = undefined; modal.remove(); modal = undefined;
      document.body.style.overflow = previousOverflow; opener?.focus();
    }, {once:true});
    modal.addEventListener('click', e => { const r = modal.getBoundingClientRect(); if(e.target === modal && (e.clientX<r.left || e.clientX>r.right || e.clientY<r.top || e.clientY>r.bottom)) close(); });
    modal.showModal();
  });
  window.addEventListener('message', event => {
    if (frame && event.source === frame.contentWindow && event.origin === new URL(frame.src).origin && event.data?.type === 'tryon:close') close();
  });
})();
