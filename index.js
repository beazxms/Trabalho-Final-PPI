const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');

const app = express();
const host = "0.0.0.0";
const porta = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(session({
    secret: 'segredo',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 30 }
}));

let livros = [];
let leitores = [];

function pagina(titulo, conteudo, ultimo = "") {
    return `
    <!DOCTYPE html>
    <html lang="pt-br">
    <head>
    <meta charset="UTF-8">
    <title>${titulo}</title>

    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">

    <style>
    body {
        background: linear-gradient(135deg, #F0F3FA, #B1C9EF, #638ECB);
        min-height: 100vh;
        font-family: Arial;
    }

    .container-box {
        background: white;
        padding: 25px;
        border-radius: 20px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        max-width: 500px;
        margin: 40px auto;
    }

    h1 {
        color: #395886;
        text-align: center;
    }

    .btn-custom {
        background-color: #638ECB;
        color: white;
        border-radius: 10px;
        font-weight: bold;
    }

    .btn-custom:hover {
        background-color: #395886;
    }

    .top-bar {
        text-align: center;
        font-size: 12px;
        color: gray;
        margin-bottom: 10px;
    }
    </style>
    </head>

    <body>

    <div class="container-box">

    <div class="top-bar">
        Último acesso: ${ultimo}
    </div>

    ${conteudo}

    </div>

    </body>
    </html>
    `;
}

app.get('/', (req, res) => {
    res.send(pagina("Login", `
    <h1>Login</h1>

    <form method="POST" action="/login">
    <input class="form-control mb-2" name="user" placeholder="Usuário">
    <input class="form-control mb-2" type="password" name="senha" placeholder="Senha">
    <button class="btn btn-custom w-100">Entrar</button>
    </form>
    `));
});

app.post('/login', (req, res) => {

    const { user, senha } = req.body;

    let html = `
    <h1>Login</h1>

    <form method="POST" action="/login">
    <input class="form-control mb-2" name="user" placeholder="Usuário" value="${user || ""}">
    `;

    if (!user) {
        html += `<div class="alert alert-danger">Usuário não preenchido</div>`;
    }

    html += `
    <input class="form-control mb-2" type="password" name="senha" placeholder="Senha">
    `;

    if (!senha) {
        html += `<div class="alert alert-danger">Senha não preenchida</div>`;
    }

    html += `<button class="btn btn-custom w-100">Entrar</button></form>`;

    if (!user || !senha) {
        return res.send(pagina("Erro", html));
    }

    if (user === 'admin' && senha === '123') {
        req.session.logado = true;
        const agora = new Date().toLocaleString();
        res.cookie('ultimoAcesso', agora);
        return res.redirect('/menu');
    }

    html += `<div class="alert alert-danger mt-2">Usuário ou senha inválidos</div>`;

    res.send(pagina("Erro", html));
});

app.get('/menu', (req, res) => {
    if (!req.session.logado) return res.redirect('/');

    const ultimo = req.cookies.ultimoAcesso;

    res.send(pagina("Menu", `
    <h1>Menu</h1>

    <button class="btn btn-custom w-100 mb-2" onclick="location.href='/livro'">
    Cadastrar Livro
    </button>

    <button class="btn btn-custom w-100 mb-2" onclick="location.href='/leitor'">
    Cadastrar Leitor
    </button>

    <a href="/logout" class="btn btn-outline-secondary w-100 mt-2">Sair</a>
    `, ultimo));
});

app.get('/livro', (req, res) => {
    if (!req.session.logado) return res.redirect('/');

    let lista = livros.map(l => `
    <div class="alert alert-light">
        <b>${l.titulo}</b> - ${l.autor}
    </div>
    `).join('');

    res.send(pagina("Livro", `
    <h1>Novo Livro</h1>

    <form method="POST">
    <input class="form-control mb-2" name="titulo" placeholder="Título">
    <input class="form-control mb-2" name="autor" placeholder="Autor">
    <input class="form-control mb-2" name="isbn" placeholder="ISBN">
    <button class="btn btn-custom w-100">Salvar</button>
    </form>

    <a href="/menu" class="btn btn-outline-secondary w-100 mt-2">Voltar</a>

    ${lista}
    `));
});

app.post('/livro', (req, res) => {

    const { titulo, autor, isbn } = req.body;

    if (!titulo || !autor || !isbn) {
        return res.send(pagina("Erro", `
        <div class="alert alert-danger">Preencha todos os campos!</div>
        <a href="javascript:history.back()" class="btn btn-outline-secondary w-100 mt-2">Voltar</a>
        `));
    }

    livros.push({ titulo, autor, isbn });
    res.redirect('/livro');
});

app.get('/leitor', (req, res) => {
    if (!req.session.logado) return res.redirect('/');

    let options = livros.map(l => `<option>${l.titulo}</option>`).join('');

    res.send(pagina("Leitor", `
    <h1>Novo Leitor</h1>

    <form method="POST">
    <input class="form-control mb-2" name="nome" placeholder="Nome">
    <input class="form-control mb-2" name="cpf" placeholder="CPF">
    <input class="form-control mb-2" name="tel" placeholder="Telefone">

    <label>Data empréstimo</label>
    <input class="form-control mb-2" type="date" name="emp">

    <label>Data devolução</label>
    <input class="form-control mb-2" type="date" name="dev">

    <select class="form-control mb-2" name="livro">
    <option value="">Selecione um livro</option>
    ${options}
    </select>

    <button class="btn btn-custom w-100">Cadastrar</button>
    </form>

    <a href="/menu" class="btn btn-outline-secondary w-100 mt-2">Voltar</a>
    `));
});

app.post('/leitor', (req, res) => {

    const { nome, cpf, tel, emp, dev, livro } = req.body;

    if (!nome || !cpf || !tel || !emp || !dev || !livro) {
        return res.send(pagina("Erro", `
        <div class="alert alert-danger">Preencha todos os campos!</div>
        <a href="javascript:history.back()" class="btn btn-outline-secondary w-100 mt-2">Voltar</a>
        `));
    }

    leitores.push({ nome, cpf, tel, emp, dev, livro });

    res.send(pagina("Sucesso", `
    <div class="alert alert-success">Leitor cadastrado com sucesso!</div>
    <a href="/menu" class="btn btn-custom w-100">Voltar ao menu</a>
    `));
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.listen(porta, host, () => {
    console.log("Rodando em http://localhost:3000");
});