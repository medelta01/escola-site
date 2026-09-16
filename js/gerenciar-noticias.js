// protege pagina - so staff
let usuarioAtual = null;

async function protegerPagina() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) { window.location.href = 'login.html'; return null; }

  const { data: perfil } = await supabaseClient
    .from('profiles').select('tipo, status').eq('id', session.user.id).single();

  const ok = perfil && (perfil.tipo === 'admin' || perfil.tipo === 'gestao') && perfil.status === 'aprovado';
  if (!ok) { window.location.href = 'index.html'; return null; }

  usuarioAtual = session.user;
  return session;
}

// elementos do form
const form = document.getElementById('form-noticia');
const campoId = document.getElementById('noticia-id');
const campoTitulo = document.getElementById('n-titulo');
const campoResumo = document.getElementById('n-resumo');
const campoConteudo = document.getElementById('n-conteudo');
const campoImagem = document.getElementById('n-imagem');
const campoVideo = document.getElementById('n-video');
const erro = document.getElementById('n-erro');
const sucesso = document.getElementById('n-sucesso');
const btnCancelar = document.getElementById('btn-cancelar-edicao');
const btnSalvar = document.getElementById('btn-salvar-noticia');
const tituloSecao = document.getElementById('form-titulo-secao');

// reseta form pro modo "nova noticia"
function resetarForm() {
  campoId.value = '';
  form.reset();
  tituloSecao.textContent = 'nova noticia';
  btnSalvar.textContent = 'publicar';
  btnCancelar.style.display = 'none';
}

btnCancelar.addEventListener('click', resetarForm);

// carrega lista de noticias existentes
async function carregarLista() {
  const { data: noticias, error: err } = await supabaseClient
    .from('noticias').select('*').order('criado_em', { ascending: false });

  const lista = document.getElementById('lista-noticias');
  lista.innerHTML = '';

  if (err || !noticias || noticias.length === 0) {
    lista.innerHTML = '<p style="opacity:0.6;">nenhuma noticia cadastrada ainda.</p>';
    return;
  }

  noticias.forEach((n) => {
    const card = document.createElement('div');
    card.className = 'pending-card';
    card.innerHTML = `
      <img src="${n.imagem_url || 'assets/img/avatar-placeholder.png'}" alt="" class="pending-card__avatar">
      <div class="pending-card__info">
        <strong>${n.titulo}</strong>
        <span>${new Date(n.criado_em).toLocaleDateString('pt-BR')}</span>
      </div>
      <div class="pending-card__actions">
        <button class="btn btn--ghost" data-acao="editar" data-id="${n.id}">editar</button>
        <button class="btn btn--ghost" data-acao="apagar" data-id="${n.id}">apagar</button>
      </div>
    `;
    lista.appendChild(card);
  });
}

// delegacao de evento pra editar/apagar
document.getElementById('lista-noticias').addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-acao]');
  if (!btn) return;
  const id = btn.dataset.id;

  if (btn.dataset.acao === 'apagar') {
    if (!confirm('apagar essa noticia?')) return;
    await supabaseClient.from('noticias').delete().eq('id', id);
    carregarLista();
    return;
  }

  // modo editar: busca dados e preenche form
  const { data: n } = await supabaseClient.from('noticias').select('*').eq('id', id).single();
  if (!n) return;

  campoId.value = n.id;
  campoTitulo.value = n.titulo;
  campoResumo.value = n.resumo;
  campoConteudo.value = n.conteudo;
  campoVideo.value = n.video_url || '';
  tituloSecao.textContent = 'editando noticia';
  btnSalvar.textContent = 'salvar alteracoes';
  btnCancelar.style.display = 'inline-block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// salvar (criar ou atualizar)
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  erro.textContent = '';
  sucesso.textContent = '';
  btnSalvar.disabled = true;

  let imagemUrl = null;
  const arquivo = campoImagem.files[0];

  if (arquivo) {
    const nomeArquivo = `${Date.now()}-${arquivo.name}`;
    const { error: errUpload } = await supabaseClient.storage
      .from('noticias-imagens').upload(nomeArquivo, arquivo);

    if (errUpload) {
      erro.textContent = 'erro ao enviar imagem: ' + errUpload.message;
      btnSalvar.disabled = false;
      return;
    }

    const { data: pub } = supabaseClient.storage.from('noticias-imagens').getPublicUrl(nomeArquivo);
    imagemUrl = pub.publicUrl;
  }

  const dados = {
    titulo: campoTitulo.value.trim(),
    resumo: campoResumo.value.trim(),
    conteudo: campoConteudo.value.trim(),
    video_url: campoVideo.value.trim() || null,
    autor_id: usuarioAtual.id
  };
  if (imagemUrl) dados.imagem_url = imagemUrl;

  let resultado;
  if (campoId.value) {
    dados.atualizado_em = new Date().toISOString();
    resultado = await supabaseClient.from('noticias').update(dados).eq('id', campoId.value);
  } else {
    resultado = await supabaseClient.from('noticias').insert(dados);
  }

  btnSalvar.disabled = false;

  if (resultado.error) {
    erro.textContent = 'erro ao salvar: ' + resultado.error.message;
    return;
  }

  sucesso.textContent = 'noticia salva com sucesso!';
  resetarForm();
  carregarLista();
});

// inicializacao
protegerPagina().then((session) => { if (session) carregarLista(); });