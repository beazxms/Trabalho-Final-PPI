const express = require('expres'); 
const session = require('express-session');
const cookieParser = require('cookie-parser');

const app = express();

// Configurações básicas
app.use(express.urlencoded({ extend: true })); 
app.use(cookieParser());

app.use(session({
    secret: 'it-girl-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 30 } 
}));

// "Banco de dados"
let listaLivros = [];
let listaLeitores = [];

// Estilo CSS Global (Paleta: Rosa, Lavanda e Roxo)
const style = `
<style>
    body { background-color: #F4E7FB; font-family: 'Segoe UI', sans-serif; color: #333; display: flex; justify-content: center; padding: 40px; }
    .card { background: white; padding: 30px; border-radius: 20px; border: 2px solid #F2DDDC; box-shadow: 8px 8px 0px #C8A8E9; width: 450px; }
    h1 { color: #E3AADD; text-align: center; }
    input, select { width: 100%; padding: 10px; margin: 8px 0; border: 1px solid #C3C7F4; border-radius: 10px; }
    button { background-color: #F6BCBA; color: white; border: none; padding: 12px; width: 100%; border-radius: 10px; cursor: pointer; font-weight: bold; margin-top: 10px; }
    button:hover { background-color: #E3AADD; }
    a { display: block; text-align: center; margin-top: 15px; color: #C8A8E9; text-decoration: none; font-size: 0.9rem; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border-bottom: 1px solid #F2DDDC; padding: 8px; text-align: left; font-size: 0.8rem; }
</style>
`;

// Middleware de Autenticação
function autenticar(req, res, next) {
    if (req.sesion.usuarioLogado) {
        next();
    } else {
        res.redirect('/login');
    }
}

// Rota de Login
app.get('/login', (req, res) => {
    res.send(`
        ${style}
        <div class="card">
            <h1>Library Login</h1>
            <form action="/login" method="POST">
                <input type="text" name="usuario" placeholder="Usuário" required>
                <input type="password" name="senha" placeholder="Senha" required>
                <button type="submit">Entrar</button>
            </form>
        </div>
    `);
});

app.post('/login', (req, res) => {
    const { usuario, senha } = req.body;
    if (usuario === 'admin' && senha === '123') {
        req.session.usuarioLogado = true;
        const data = new Date().toLocaleString();
        res.cookie('ultimoAcesso', data, { maxAge: 900000, httpOnly: true });
        res.redirect('/menu');
    } else {
        res.send('<h2>Falha no login</h2><a href="/login">Voltar</a>');
    }
});

// Menu Principal
app.get('/menu', autenticar, (req, res) => {
    const ultimoAcesso = req.cookies.ultimoAcesso || "Primeiro acesso";
    res.send(`
        ${style}
        <div class="card">
            <h1>Menu Principal</h1>
            <p>Seja bem-vinda ao sistema de gestão.</p>
            <button onclick="location.href='/cadastroLivro'">Cadastro de Livros</button>
            <button onclick="location.href='/cadastroLeitor'">Cadastro de Leitores</button>
            <a href="/logout">Sair</a>
            <p style="font-size: 0.7rem; color: #C3C7F4; margin-top: 20px;">Último acesso: ${ultimoAcesso}</p>
        </div>
    `);
});

// Cadastro de Livros
app.get('/cadastroLivro', autenticar, (req, res) => {
    let tabela = '<table><tr><th>Título</th><th>Autor</th><th>ISBN</th></tr>';
    listaLivros.forEach(l => {
        tabela += '<tr><td>' + l.titulo + '</td><td>' + l.autor + '</td><td>' + l.isbn + '</td></tr>';
    });
    tabela += '</table>';

    res.send(`
        ${style}
        <div class="card">
            <h1>Cadastrar Livro</h1>
            <form action="/cadastroLivro" method="POST">
                <input type="text" name="titulo" placeholder="Título do Livro">
                <input type="text" name="autor" placeholder="Nome do Autor">
                <input type="text" name="isbn" placeholder="Código ISBN">
                <button type="submit">Adicionar Livro</button>
            </form>
            ${tabela}
            <a href="/menu">Voltar ao Menu</a>
        </div>
    `);
});

app.post('/cadastroLivro', (req, res) => {
    const { titulo, autor, isbn } = req.body;
    if (titulo && autor && isbn) {
        listaLivros.push(titulo, autor, isbn);
        res.redirect('/cadastroLivro');
    } else {
        res.send('Campos obrigatórios! <a href="/cadastroLivro">Voltar</a>');
    }
});

// Cadastro de Leitores
app.get('/cadastroLeitor', autenticar, (req, res) => {
    let options = '';
    listaLivros.forEach(livro => {
        options += '<option value="' + livro.titulo + '">' + livro.titulo + '</option>';
    });

    res.send(`
        ${style}
        <div class="card">
            <h1>Registrar Leitor</h1>
            <form action="/cadastroLeitor" method="POST">
                <input type="text" name="nome" placeholder="Nome do Leitor">
                <input type="text" name="cpf" placeholder="CPF">
                <input type="text" name="telefone" placeholder="Telefone">
                <label>Empréstimo:</label><input type="date" name="dataEmp">
                <label>Devolução:</label><input type="date" name="dataDev">
                <select name="livro">
                    <option value="">Selecione o Livro...</option>
                    ${options}
                </select>
                <button type="submit">Confirmar Empréstimo</button>
            </form>
            <a href="/menu">Voltar ao Menu</a>
        </div>
    `);
});

app.post('/cadastroLeitor', autenticar, (req, res) => {
    const { nome, cpf, telefone, dataEmp, dataDev, livro } = req.body;
    if (nome || cpf || telefone || dataEmp || dataDev || livro) {
        listaLeitores.push({ nome, cpf, telefone, dataEmp, dataDev, livro });
        res.send('<h2>Cadastrado com sucesso!</h2><a href="/menu">Menu</a>');
    } else {
        res.send('Erro na validação. <a href="/cadastroLeitor">Tentar de novo</a>');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

app.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
});