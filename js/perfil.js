// ===== PÁGINA DE PERFIL (visualização + edição + lightbox) =====
let usuarioAtual = null;
let perfilAtual = null;
let arquivoSelecionado = null;

const nomesTipo = {
  aluno: 'Aluno',
  professor: 'Professor',
  gestao: 'Gestão',
  admin: 'Administrador'
};

function preencherView(perfil) {
  document.getElementById('avatar-view').src = perfil.foto_url || 'assets/img/avatar-placeholder.png';
  document.getElementById('apelido-view').textContent = perfil.apelido;
  document.getElementById('username-view').textContent = '@' + perfil.username;
  document.getElementById('bio-view').textContent = perfil.bio || 'Nenhuma bio adicionada ainda.';
  document.getElementById('profile-badge').textContent = nomesTipo[perfil.tipo] || perfil.tipo;

  const aviso = document.getElementById('profile-status-hint');
  if (perfil.tipo === 'professor' && perfil.status === 'pendente') {
    aviso.textContent = 'Sua conta de professor está pendente de aprovação pela gestão. Enquanto isso, você navega com acesso de aluno.';
    aviso.style.display = 'block';
  } else {
    aviso.style.display = 'none';
  }
}

function preencherFormEdicao(perfil) {
  document.getElementById('perfil-username').value = perfil.username || '';
  document.getElementById('perfil-apelido').value = perfil.apelido || '';
  document.getElementById('perfil-bio').value = perfil.bio || '';
  document.getElementById('avatar-preview').src = perfil.foto_url || 'assets/img/avatar-placeholder.png';
}

async function carregarPerfil() {
  const { data: { session } } = await supabaseClient.auth.getSession();

  if (!session) {
    window.location.href = 'login.html';
    return;
  }

  usuarioAtual = session.user;

  const { data: perfil, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', usuarioAtual.id)
    .single();

  if (error || !perfil) {
    document.getElementById('perfil-erro').textContent = 'Não foi possível carregar seu perfil.';
    return;
  }

  perfilAtual = perfil;
  preencherView(perfil);
  preencherFormEdicao(perfil);
}

carregarPerfil();

// ===== ALTERNAR ENTRE VISUALIZAÇÃO E EDIÇÃO (com transição) =====
const profileView = document.getElementById('profile-view');
const profileEdit = document.getElementById('profile-edit');

function mostrarEdicao() {
  gsap.to(profileView, {
    opacity: 0, y: 10, duration: 0.25, ease: 'power1.in',
    onComplete: () => {
      profileView.style.display = 'none';
      profileEdit.style.display = 'block';
      gsap.fromTo(profileEdit, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' });
    }
  });
}

function mostrarVisualizacao() {
  gsap.to(profileEdit, {
    opacity: 0, y: 10, duration: 0.25, ease: 'power1.in',
    onComplete: () => {
      profileEdit.style.display = 'none';
      profileView.style.display = 'block';
      gsap.fromTo(profileView, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' });
    }
  });
}

document.getElementById('btn-editar').addEventListener('click', mostrarEdicao);

document.getElementById('btn-cancelar').addEventListener('click', () => {
  arquivoSelecionado = null;
  preencherFormEdicao(perfilAtual);
  document.getElementById('perfil-erro').textContent = '';
  document.getElementById('perfil-sucesso').textContent = '';
  mostrarVisualizacao();
});

// ===== LIGHTBOX DA FOTO (clicar pra ver grande) =====
const avatarView = document.getElementById('avatar-view');
const lightbox = document.getElementById('avatar-lightbox');
const lightboxImg = document.getElementById('avatar-lightbox-img');

avatarView.addEventListener('click', () => {
  lightboxImg.src = avatarView.src;
  lightbox.style.display = 'flex';
  gsap.fromTo(lightbox, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power1.out' });
});

lightbox.addEventListener('click', () => {
  gsap.to(lightbox, {
    opacity: 0, duration: 0.2, ease: 'power1.in',
    onComplete: () => { lightbox.style.display = 'none'; }
  });
});

// ===== PREVIEW DA FOTO AO ESCOLHER ARQUIVO (dentro do modo edição) =====
const avatarInput = document.getElementById('avatar-input');
const avatarPreview = document.getElementById('avatar-preview');

avatarInput.addEventListener('change', () => {
  const arquivo = avatarInput.files[0];
  if (!arquivo) return;

  arquivoSelecionado = arquivo;
  avatarPreview.src = URL.createObjectURL(arquivo);
});

avatarPreview.addEventListener('click', () => {
  lightboxImg.src = avatarPreview.src;
  lightbox.style.display = 'flex';
  gsap.fromTo(lightbox, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power1.out' });
});

// ===== SALVAR ALTERAÇÕES =====
const formPerfil = document.getElementById('form-perfil');
const perfilErro = document.getElementById('perfil-erro');
const perfilSucesso = document.getElementById('perfil-sucesso');

formPerfil.addEventListener('submit', async (e) => {
  e.preventDefault();
  perfilErro.textContent = '';
  perfilSucesso.textContent = '';

  const apelido = document.getElementById('perfil-apelido').value.trim();
  const bio = document.getElementById('perfil-bio').value.trim();

  let fotoUrl = null;

  if (arquivoSelecionado) {
    const extensao = arquivoSelecionado.name.split('.').pop();
    const caminho = `${usuarioAtual.id}/avatar.${extensao}`;

    const { error: erroUpload } = await supabaseClient.storage
      .from('avatars')
      .upload(caminho, arquivoSelecionado, { upsert: true });

    if (erroUpload) {
      perfilErro.textContent = 'Erro ao enviar a foto: ' + erroUpload.message;
      return;
    }

    const { data: urlPublica } = supabaseClient.storage
      .from('avatars')
      .getPublicUrl(caminho);

    fotoUrl = urlPublica.publicUrl;
  }

  const atualizacao = { apelido, bio };
  if (fotoUrl) atualizacao.foto_url = fotoUrl;

  const { error: erroUpdate } = await supabaseClient
    .from('profiles')
    .update(atualizacao)
    .eq('id', usuarioAtual.id);

  if (erroUpdate) {
    perfilErro.textContent = 'Erro ao salvar: ' + erroUpdate.message;
    return;
  }

  perfilAtual = { ...perfilAtual, ...atualizacao };
  localStorage.setItem('perfil_cache', JSON.stringify({
    apelido: perfilAtual.apelido,
    foto_url: perfilAtual.foto_url
  }));

  arquivoSelecionado = null;

  preencherView(perfilAtual);
  mostrarVisualizacao();

  const sucessoView = document.getElementById('profile-sucesso-view');
  sucessoView.textContent = 'Perfil atualizado com sucesso!';
  setTimeout(() => { sucessoView.textContent = ''; }, 4000);
});