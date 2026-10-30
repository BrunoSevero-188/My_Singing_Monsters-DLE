const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export function createAutocomplete({ input, list, getOptions, onSelect }) {
  let items = [];
  let active = 0;

  function render() {
    const q = norm(input.value.trim());
    items = q ? getOptions().filter((m) => norm(m.name).includes(q)).slice(0, 8) : [];
    list.innerHTML = '';
    items.forEach((m, i) => {
      const li = document.createElement('li');
      li.textContent = m.name;
      if (i === active) li.classList.add('active');
      li.addEventListener('mousedown', (e) => { e.preventDefault(); pick(m); });
      list.appendChild(li);
    });
    list.hidden = items.length === 0;
  }

  function pick(m) {
    input.value = '';
    items = [];
    active = 0;
    list.hidden = true;
    onSelect(m);
  }

  input.addEventListener('input', () => { active = 0; render(); });
  input.addEventListener('blur', () => { list.hidden = true; });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { active = Math.min(active + 1, items.length - 1); render(); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { active = Math.max(active - 1, 0); render(); e.preventDefault(); }
    else if (e.key === 'Enter' && items[active]) { pick(items[active]); e.preventDefault(); }
  });
}