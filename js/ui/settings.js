import { getSettings, setSetting } from '../core/settings.js';
import { exportData, importData, clearAll } from '../core/storage.js';

export function renderSettings(root) {
  const s = getSettings();
  root.innerHTML = `
    <section class="box">
      <h2 class="box-title">Configurações</h2>
      <label class="opt-row"><input type="checkbox" data-k="colorblind"> Modo daltônico (azul, amarelo e laranja)</label>
      <label class="opt-row"><input type="checkbox" data-k="grey"> Ovo invertido: filtro cinza</label>
      <div class="data-actions">
        <button class="pill" id="exp">Exportar progresso</button>
        <button class="pill" id="imp">Importar progresso</button>
        <button class="pill danger" id="clr">Apagar dados</button>
      </div>
      <input type="file" id="file" accept="application/json" hidden>
    </section>`;

  root.querySelectorAll('input[type=checkbox]').forEach((cb) => {
    cb.checked = !!s[cb.dataset.k];
    cb.onchange = () => setSetting(cb.dataset.k, cb.checked);
  });

  root.querySelector('#exp').onclick = () => {
    const blob = new Blob([exportData()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'msmdle-progresso.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  const file = root.querySelector('#file');
  root.querySelector('#imp').onclick = () => file.click();
  file.onchange = async () => {
    try {
      importData(await file.files[0].text());
      location.reload();
    } catch (e) {
      alert(e.message || 'Não foi possível importar este arquivo.');
    }
  };

  root.querySelector('#clr').onclick = () => {
    if (confirm('Apagar todo o progresso e as configurações deste navegador?')) {
      clearAll();
      location.reload();
    }
  };
}
