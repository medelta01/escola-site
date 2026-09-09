// ===== PAINEL DE ADMINISTRAÇÃO (aprovação de professores) =====

async function protegerPagina() {
  const { data: { session } } = await supabaseClient.auth.getSession();

  if (!session) {
    window.location.href = 'login.html';
    return null;
  }

  const { data: perfil } = await supabaseClient
    .from('profiles')
    .select('tipo, status')
    .eq('id', session.user.id)
    .single();

  const autorizado = perfil && (perfil.tipo === 'admin' || perfil.tipo === 'gestao') && perfil.status === 'aprovado';

  if (!autorizado) {
    window.location.href = 'index.html';
    return null;
  }

  return session;
}

function criarCardPendente(professor) {
  const card = document.createElement('div');
  card.className = 'pending-card';
  card.innerHTML = `
    <img src="${professor.foto_url || 'assets/img/avatar-placeholder.png'}" alt="" class="pending-card__avatar">
    <div class="pending-card__info">
      <strong>${professor.apelido}</strong>
      <span>@${professor.username}</span>
      <span>${professor.email || 'e-mail não registrado'}</span>
    </div>
    <div class="pending-card__actions">
      <button class="btn btn--primary" data-acao="aprovar" data-id="${professor.id}">Aprovar</button>
      <button class="btn btn--ghost" data-acao="rejeitar" data-id="${professor.id}">Rejeitar</button>
    </div>
  `;
  return card;
}

async function carregarPendentes() {
  const { data: pendentes, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('tipo', 'professor')
    .eq('status', 'pendente');

  const lista = document.getElementById('lista-pendentes');
  const vazio = document.getElementById('admin-vazio');
  const erro = document.getElementById('admin-erro');

  if (error) {
    erro.textContent = 'Erro ao carregar solicitações: ' + error.message;
    return;
  }

  lista.innerHTML = '';

  if (!pendentes || pendentes.length === 0) {
    vazio.style.display = 'block';
    return;
  }

  vazio.style.display = 'none';
  pendentes.forEach((professor) => {
    lista.appendChild(criarCardPendente(professor));
  });
}

async function processarAcao(id, novoStatus, botao) {
  botao.disabled = true;

  const { error } = await supabaseClient
    .from('profiles')
    .update({ status: novoStatus })
    .eq('id', id);

  if (error) {
    alert('Erro ao processar: ' + error.message);
    botao.disabled = false;
    return;
  }

  const card = botao.closest('.pending-card');
  gsap.to(card, {
    opacity: 0, x: 20, duration: 0.25, ease: 'power1.in',
    onComplete: () => {
      card.remove();
      const lista = document.getElementById('lista-pendentes');
      if (lista.children.length === 0) {
        document.getElementById('admin-vazio').style.display = 'block';
      }
    }
  });
}

document.getElementById('lista-pendentes').addEventListener('click', (e) => {
  const botao = e.target.closest('button[data-acao]');
  if (!botao) return;

  const id = botao.dataset.id;
  const acao = botao.dataset.acao;
  const novoStatus = acao === 'aprovar' ? 'aprovado' : 'rejeitado';

  processarAcao(id, novoStatus, botao);
});

// ===== INICIALIZAÇÃO =====
protegerPagina().then((session) => {
  if (session) carregarPendentes();
});

cat >> /home/claude/admin.js << 'ENDOFFILE'

// ===== GERAR CONVITE DE GESTAO =====
function gerarCodigoAleatorio() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

document.getElementById('btn-gerar-convite').addEventListener('click', async () => {
  const { data: { session } } = await supabaseClient.auth.getSession();
  const codigo = gerarCodigoAleatorio();

  const { error } = await supabaseClient
    .from('convites_gestao')
    .insert({ codigo, criado_por: session.user.id });

  if (error) {
    alert('Erro ao gerar convite: ' + error.message);
    return;
  }

  document.getElementById('convite-codigo').textContent = codigo;
  document.getElementById('convite-resultado').style.display = 'flex';
});

document.getElementById('btn-copiar-convite').addEventListener('click', () => {
  const codigo = document.getElementById('convite-codigo').textContent;
  navigator.clipboard.writeText(codigo);
  const btn = document.getElementById('btn-copiar-convite');
  btn.textContent = 'Copiado!';
  setTimeout(() => { btn.textContent = 'Copiar'; }, 2000);
});
ENDOFFILE