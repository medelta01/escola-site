// ===== VERIFICA SESSÃO E ATUALIZA O MENU (com cache local) =====
const AVATAR_PADRAO = 'assets/img/avatar-placeholder.png';

function renderizarLogado(navAuth, apelido, fotoUrl) {
  const foto = fotoUrl || AVATAR_PADRAO;

  navAuth.innerHTML = `
    <a href="perfil.html" class="nav__user">
      <img src="${foto}" alt="" class="nav__avatar">
      <span>Olá, ${apelido}</span>
    </a>
    <button class="nav__link nav__logout" id="btn-logout">Sair</button>
  `;

  document.getElementById('btn-logout').addEventListener('click', async () => {
    localStorage.removeItem('perfil_cache');
    await supabaseClient.auth.signOut();
    window.location.href = 'index.html';
  });
}

async function atualizarMenuAuth() {
  const navAuth = document.getElementById('nav-auth');
  const navAdmin = document.getElementById('nav-admin');
  if (!navAuth) return;

  const cacheBruto = localStorage.getItem('perfil_cache');
  const cache = cacheBruto ? JSON.parse(cacheBruto) : null;

  if (cache) {
    renderizarLogado(navAuth, cache.apelido, cache.foto_url);
    if (navAdmin) navAdmin.style.display = (cache.tipo === 'admin' || cache.tipo === 'gestao') ? 'block' : 'none';
  }

  const { data: { session } } = await supabaseClient.auth.getSession();

  if (!session) {
    localStorage.removeItem('perfil_cache');
    navAuth.innerHTML = '<a href="login.html" class="nav__link">Entrar</a>';
    if (navAdmin) navAdmin.style.display = 'none';
    return;
  }

  const { data: perfil } = await supabaseClient
    .from('profiles')
    .select('apelido, foto_url, tipo')
    .eq('id', session.user.id)
    .single();

  if (!perfil) return;

  const mudou = !cache || cache.apelido !== perfil.apelido || cache.foto_url !== perfil.foto_url || cache.tipo !== perfil.tipo;

  if (mudou) {
    localStorage.setItem('perfil_cache', JSON.stringify(perfil));
    renderizarLogado(navAuth, perfil.apelido, perfil.foto_url);
  }

  if (navAdmin) navAdmin.style.display = (perfil.tipo === 'admin' || perfil.tipo === 'gestao') ? 'block' : 'none';
}

atualizarMenuAuth();