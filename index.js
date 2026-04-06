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

function pagina(titulo, conteudo, mostrarUltimo = false, ultimo = "") {
    return `
    <!DOCTYPE html>
    <html lang="pt-br">
    <head>
    <meta charset="UTF-8">
    <title>${titulo}</title>

    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
/*fiz css por puro fru-fru mesmo, queria deixar a aplicação mais bonitinha :) */
<style>
/* Coloquei esse gradiente pra dar um ar mais moderno pro login */
body {
    background: linear-gradient(135deg, #F0F3FA, #B1C9EF, #638ECB);
    min-height: 100vh;
    font-family: Arial;
}

/* Usei esse box-shadow sólido (estilo Neobrutalista) que vi num post de UI */
.container-box {
    background: white;
    padding: 25px;
    border-radius: 20px;
    box-shadow: 6px 6px 0px #64B5F6;
    max-width: 500px;
    margin: 40px auto;
}

h1 {
    color:  #395886;
    text-align: center;
}

.btn-custom {
    background-color: #7ba8e8;;
    color: white;
    font-weight: bold;
    border-radius: 10px;
}

.btn-custom:hover {
    background-color: #76bbf7;
}

.voltar {
    margin-top: 10px;
    display: block;
    text-align: center;
    color: #1E88E5;
    text-decoration: none;
}

label {
    font-weight: bold;
    color: #1565C0;
}
</style>
    </head>

    <body>

    <div class="container-box">

    ${mostrarUltimo ? `
    <p style="font-size:12px; color:gray;">
    Último acesso: ${ultimo}
    </p>
    ` : ""}

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
    <label>Usuário:</label>
    <input class="form-control mb-2" name="user" placeholder="Ex: admin">

    <label>Senha:</label>
    <input class="form-control mb-2" type="password" name="senha" placeholder="Ex: 123">

    <button class="btn btn-custom w-100">Entrar</button>
    </form>
    `));
});

app.post('/login', (req, res) => {

    const { user, senha } = req.body;

    let html = `
    <h1>Login</h1>

    <form method="POST" action="/login">

    <label>Usuário:</label>
    <input class="form-control mb-2" name="user" value="${user || ""}">
    `;

    if (!user) html += `<div class="alert alert-danger">Usuário não preenchido</div>`;

    html += `
    <label>Senha:</label>
    <input class="form-control mb-2" type="password" name="senha">
    `;

    if (!senha) html += `<div class="alert alert-danger">Senha não preenchida</div>`;

    html += `<button class="btn btn-custom w-100">Entrar</button></form>`;

    if (!user || !senha) return res.send(pagina("Erro", html));

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

    <a href="/logout" class="voltar">Sair</a>
    `, true, ultimo));
});

app.get('/livro', (req, res) => {
    if (!req.session.logado) return res.redirect('/');

    let lista = livros.map(l => `
    <div class="alert alert-secondary">
    ${l.titulo} - ${l.autor} ISBN: ${l.isbn}
    </div>
    `).join('');

    res.send(pagina("Livro", `
    <h1>Novo Livro</h1>

    <form method="POST">
    <label>Título:</label>
    <input class="form-control mb-2" name="titulo" placeholder="Ex: Dom Casmurro">

    <label>Autor:</label>
    <input class="form-control mb-2" name="autor" placeholder="Ex: Machado de Assis">

    <label>ISBN:</label>
    <input class="form-control mb-2" name="isbn" placeholder="Ex: 9788535914849">

    <button class="btn btn-custom w-100">Salvar</button>
    </form>

    ${lista}

    <a href="/menu" class="voltar">Voltar</a>
    `));
});

app.post('/livro', (req, res) => {

    const { titulo, autor, isbn } = req.body;

    let html = `
    <h1>Cadastro de Livro</h1>

    <form method="POST">

    <label>Título:</label>
    <input class="form-control mb-2" name="titulo" value="${titulo || ""}">
    `;

    if (!titulo) html += `<div class="alert alert-danger">Título não preenchido</div>`;

    html += `
    <label>Autor:</label>
    <input class="form-control mb-2" name="autor" value="${autor || ""}">
    `;

    if (!autor) html += `<div class="alert alert-danger">Autor não preenchido</div>`;

    html += `
    <label>ISBN:</label>
    <input class="form-control mb-2" name="isbn" value="${isbn || ""}">
    `;

    if (!isbn || !/^[0-9]+$/.test(isbn)) {
        html += `<div class="alert alert-danger">ISBN inválido (somente números)</div>`;
    }

    html += `<button class="btn btn-custom w-100">Salvar</button></form>`;

    if (!titulo || !autor || !isbn || !/^[0-9]+$/.test(isbn)) {
        return res.send(pagina("Erro", html));
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
    <label>Nome:</label>
    <input class="form-control mb-2" name="nome" placeholder="Ex: Maria Oliveira">

    <label>CPF:</label>
    <input class="form-control mb-2" name="cpf" placeholder="000.000.000-00">

    <label>Telefone:</label>
    <input class="form-control mb-2" name="tel" placeholder="(00) 90000-0000">

    <label>Data empréstimo:</label>
    <input class="form-control mb-2" type="date" name="emp">

    <label>Data devolução:</label>
    <input class="form-control mb-2" type="date" name="dev">

    <label>Livro:</label>
    <select class="form-control mb-2" name="livro">
    <option value="">Selecione um livro</option>
    ${options}
    </select>

    <button class="btn btn-custom w-100">Cadastrar</button>
    </form>

    <a href="/menu" class="voltar">Voltar</a>
    `));
});

app.post('/leitor', (req, res) => {

    const { nome, cpf, tel, emp, dev, livro } = req.body;

    let html = `
    <h1>Cadastro de Leitor</h1>

    <form method="POST">

    <label>Nome:</label>
    <input class="form-control mb-2" name="nome" value="${nome || ""}">
    `;

    if (!nome) html += `<div class="alert alert-danger">Nome não preenchido</div>`;

    html += `
    <label>CPF:</label>
    <input class="form-control mb-2" name="cpf" value="${cpf || ""}">
    `;

    if (!cpf) html += `<div class="alert alert-danger">CPF não preenchido</div>`;

    html += `
    <label>Telefone:</label>
    <input class="form-control mb-2" name="tel" value="${tel || ""}">
    `;

    if (!tel) html += `<div class="alert alert-danger">Telefone não preenchido</div>`;

    html += `
    <label>Data empréstimo:</label>
    <input class="form-control mb-2" type="date" name="emp" value="${emp || ""}">
    `;

    if (!emp) html += `<div class="alert alert-danger">Data de empréstimo não preenchida</div>`;

    html += `
    <label>Data devolução:</label>
    <input class="form-control mb-2" type="date" name="dev" value="${dev || ""}">
    `;

    if (!dev) html += `<div class="alert alert-danger">Data de devolução não preenchida</div>`;

    let options = `<option value="">Selecione um livro</option>`;
    for (let i = 0; i < livros.length; i++) {
        if (livro === livros[i].titulo) {
            options += `<option selected>${livros[i].titulo}</option>`;
        } else {
            options += `<option>${livros[i].titulo}</option>`;
        }
    }

    html += `
    <label>Livro:</label>
    <select class="form-control mb-2" name="livro">
    ${options}
    </select>
    `;

    if (!livro) html += `<div class="alert alert-danger">Selecione um livro</div>`;

    html += `<button class="btn btn-custom w-100">Cadastrar</button></form>`;

    if (!nome || !cpf || !tel || !emp || !dev || !livro) {
        return res.send(pagina("Erro", html));
    }

    leitores.push({ nome, cpf, tel, emp, dev, livro });

    res.send(pagina("Sucesso", `
    <div class="alert alert-success">
    Leitor cadastrado com sucesso!
    </div>
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
