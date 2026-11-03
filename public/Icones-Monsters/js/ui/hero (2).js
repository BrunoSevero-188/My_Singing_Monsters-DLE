// Faixa de apresentação da tela principal: site feito por brasileiros, em português do Brasil
export const FLAG_SVG = `
<svg class="flag" viewBox="0 0 28 20" role="img" aria-label="Bandeira do Brasil">
  <rect width="28" height="20" rx="2" fill="#009c3b"/>
  <polygon points="14,2.2 25.6,10 14,17.8 2.4,10" fill="#ffdf00"/>
  <circle cx="14" cy="10" r="4.3" fill="#002776"/>
  <path d="M9.9 9.2c2.6-.7 5.5-.3 8.2 1.1" fill="none" stroke="#fff" stroke-width=".7"/>
</svg>`;

export function renderHero() {
  const hero = document.createElement('section');
  hero.className = 'hero';
  hero.innerHTML = `
    <div class="hero-flag">${FLAG_SVG}</div>
    <div class="hero-text">
      <h1 class="hero-title">MSMdle</h1>
      <p class="hero-lead">Os desafios diários de My Singing Monsters, feitos por brasileiros e em português do Brasil.</p>
      <p class="hero-note">Um site de fãs que acompanha o jogo, sem vínculo com a Big Blue Bubble.</p>
    </div>`;
  return hero;
}
