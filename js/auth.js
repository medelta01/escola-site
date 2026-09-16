// ===== ALTERNAR ENTRE ABAS (ENTRAR / CADASTRAR) =====
const tabs = document.querySelectorAll('.auth-tab');
const forms = document.querySelectorAll('.auth-form');

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabs.forEach((t) => t.classList.remove('is-active'));
    forms.forEach((f) => f.classList.remove('is-active'));

    tab.classList.add('is-active');
    document.getElementById(`form-${tab.dataset.tab}`).classList.add('is-active');
  });
});

// ===== LOGIN (universal — o sistema já sabe o tipo de cada um) =====
const formLogin = document.getElementById('form-login');
const loginErro = document.getElementById('login-erro');

formLogin.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginErro.textContent = '';

  const email = document.getElementById('login-email').value.trim();
  const senha = document.getElementById('login-senha').value;

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password: senha
  });

  if (error) {
    loginErro.textContent = 'E-mail ou senha incorretos.';
    return;
  }

  // Login deu certo — por enquanto, redireciona pra home.
  // Mais pra frente vamos redirecionar/ajustar por tipo de perfil (aluno/professor/gestão/admin).
  window.location.href = 'index.html';
});

// ===== CADASTRO (Aluno ou Professor) =====
const formCadastro = document.getElementById('form-cadastro');
const cadastroErro = document.getElementById('cadastro-erro');
const cadastroSucesso = document.getElementById('cadastro-sucesso');
const cadTipo = document.getElementById('cad-tipo');
const cadastroHint = document.getElementById('cadastro-hint');

// Atualiza a mensagem de aviso conforme o tipo escolhido
cadTipo.addEventListener('change', () => {
  if (cadTipo.value === 'professor') {
    cadastroHint.textContent = 'Contas de professor passam por aprovação da gestão antes de serem liberadas. Enquanto isso, você pode navegar normalmente como aluno.';
  } else {
    cadastroHint.textContent = 'Contas de gestão são criadas apenas pela administração da escola.';
  }
});

formCadastro.addEventListener('submit', async (e) => {
  e.preventDefault();
  cadastroErro.textContent = '';
  cadastroSucesso.textContent = '';

  const tipo = cadTipo.value;
  const username = document.getElementById('cad-username').value.trim();
  const apelido = document.getElementById('cad-apelido').value.trim();
  const email = document.getElementById('cad-email').value.trim();
  const senha = document.getElementById('cad-senha').value;
  const confirmar = document.getElementById('cad-confirmar').value;
  const codigoConvite = document.getElementById('cad-convite').value.trim();

  if (senha !== confirmar) {
    cadastroErro.textContent = 'As senhas não conferem.';
    return;
  }

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password: senha,
    options: {
      data: {
        username: username,
        apelido: apelido,
        tipo: tipo,
        codigo_convite: codigoConvite
      }
    }
  });

  if (error) {
    cadastroErro.textContent = 'Erro ao criar conta: ' + error.message;
    return;
  }

  if (tipo === 'professor') {
    cadastroSucesso.textContent = 'Conta criada! Confirme seu e-mail. Seu acesso como professor ficará pendente até aprovação da gestão — enquanto isso, você pode navegar como aluno.';
  } else {
    cadastroSucesso.textContent = 'Conta criada! Verifique seu e-mail para confirmar antes de entrar.';
  }

  formCadastro.reset();
});