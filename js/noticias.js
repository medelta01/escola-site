// listagem com filtros de noticias
let todasNoticias = [];

function formatarData(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

const imgStyle = (url) => url ? `style="background-image:url('${url}'); background-size:cover; background-position:center;"` : '';

// renderiza lista
function renderizarNoticias(lista, comDestaque, msgVazio) {
  const container = document.getElementById('noticias-conteudo');
  const vazio = document.getElementById('noticias-vazio');

  if (lista.length === 0) {
    container.innerHTML = '';
    vazio.textContent = msgVazio;
    vazio.style.display = 'block';
    return;
  }
  vazio.style.display = 'none';

  let destaque = null;
  let resto = lista;
  if (comDestaque) {
    destaque = lista[0];
    resto = lista.slice(1);
  }

  const featuredHtml = destaque ? `
    <a href="noticia.html?id=${destaque.id}" class="news-featured" data-reveal>
      <div class="news-featured__image" ${imgStyle(destaque.imagem_url)}></div>
      <div class="news-featured__content">
        <span class="news-card__date">${formatarData(destaque.criado_em)}</span>
        <h2 class="news-featured__title">${destaque.titulo}</h2>
        <p class="news-featured__desc">${destaque.resumo}</p>
        <span class="course-card__link">ler noticia completa &rarr;</span>
      </div>
    </a>
  ` : '';

  const cardsHtml = resto.map((n) => `
    <a href="noticia.html?id=${n.id}" class="news-card" data-reveal>
      <div class="news-card__image" ${imgStyle(n.imagem_url)}></div>
      <span class="news-card__date">${formatarData(n.criado_em)}</span>
      <h3 class="news-card__title">${n.titulo}</h3>
    </a>
  `).join('');

  container.innerHTML = featuredHtml + (resto.length > 0
    ? `<div class="grid grid--3" style="margin-top: var(--space-lg);">${cardsHtml}</div>`
    : '');

  document.querySelectorAll('[data-reveal]').forEach((el) => {
    gsap.fromTo(el, { opacity: 0, y: 40 }, {
      opacity: 1, y: 0, duration: 0.8, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 85%' }
    });
  });
}

// select de anos
function popularFiltroAno(lista) {
  const anos = [...new Set(lista.map((n) => new Date(n.criado_em).getFullYear()))].sort((a, b) => b - a);
  const select = document.getElementById('filtro-ano');
  anos.forEach((ano) => {
    const opt = document.createElement('option');
    opt.value = ano;
    opt.textContent = ano;
    select.appendChild(opt);
  });
}

// busca do ano
function aplicarFiltros() {
  const termo = document.getElementById('filtro-busca').value.trim().toLowerCase();
  const ano = document.getElementById('filtro-ano').value;

  let filtradas = todasNoticias;

  if (termo) {
    filtradas = filtradas.filter((n) =>
      n.titulo.toLowerCase().includes(termo) || n.resumo.toLowerCase().includes(termo)
    );
  }
  if (ano) {
    filtradas = filtradas.filter((n) => new Date(n.criado_em).getFullYear().toString() === ano);
  }

  const semFiltro = !termo && !ano;
  const msg = semFiltro ? 'nenhuma noticia publicada ainda.' : 'nenhuma noticia encontrada para esse filtro.';
  renderizarNoticias(filtradas, semFiltro, msg);
}

async function carregarNoticias() {
  const { data, error } = await supabaseClient
    .from('noticias').select('*').order('criado_em', { ascending: false });

  if (error || !data || data.length === 0) {
    document.getElementById('noticias-vazio').textContent = 'nenhuma noticia publicada ainda.';
    document.getElementById('noticias-vazio').style.display = 'block';
    return;
  }

  todasNoticias = data;
  popularFiltroAno(data);
  renderizarNoticias(data, true, '');

  document.getElementById('filtro-busca').addEventListener('input', aplicarFiltros);
  document.getElementById('filtro-ano').addEventListener('change', aplicarFiltros);
}

carregarNoticias();