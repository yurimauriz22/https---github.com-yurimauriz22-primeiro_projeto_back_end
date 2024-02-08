const express = require('express');
const fs = require('fs');
const multer = require('multer');

const app = express();
const porta = 3000;

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
let itens = [];

// Função para carregar os itens do arquivo JSON
function carregarItens() {
  try {
    const dados = fs.readFileSync('itens.json', 'utf8');
    return JSON.parse(dados);
  } catch (erro) {
    return [];
  }
}

// Função para salvar os itens no arquivo JSON
function salvarItens() {
  const dados = JSON.stringify(itens);
  fs.writeFileSync('itens.json', dados, 'utf8');
}

// Inicializa os itens com os dados do arquivo JSON
itens = carregarItens();

app.get('/', (req, res) => {
  res.render('home');
});

app.get('/registrar', (req, res) => {
  res.render('registrar');
});

// Configuração de armazenamento
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
      cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
      // Extração da extensão do arquivo original:
      const extensaoArquivo = file.originalname.split('.')[1];

      // Cria um código randômico que será o nome do arquivo
      const novoNomeArquivo = require('crypto')
          .randomBytes(64)
          .toString('hex');

      // Indica o novo nome do arquivo:
      cb(null, `${novoNomeArquivo}.${extensaoArquivo}`)
  }
});

const upload = multer({ storage });

app.post('/registrar', upload.single('imagem'), (req, res) => {
  const novoItem = {
    id: itens.length,
    nome: req.body.nome,
    imagem: req.file ? req.file.filename : '', // Salva o nome do arquivo no campo de imagem
    //imagem: req.body.imagem,
    alugado: false,
    locatario: '',
    horaDevolucao: '',
  };

  //console.log(novoItem.imagem);

  itens.push(novoItem);
  res.redirect('/alugar');
});

app.get('/alugar', (req, res) => {
  const itensDisponiveis = itens.filter(item => !item.alugado);
  res.render('alugar', { itensDisponiveis });
});

app.get('/alugar/:id', (req, res) => {
  const idItem = req.params.id;
  const item = itens[idItem];

  if (item && !item.alugado) {
    res.render('alugarItem', { item });
  } else {
    res.redirect('/alugar');
  }
});

app.post('/alugar/:id', (req, res) => {
  const idItem = req.params.id;
  const item = itens[idItem];

  if (item && !item.alugado) {
    item.alugado = true;
    item.locatario = req.body.locatario;
    item.horaDevolucao = req.body.horaDevolucao;

    res.redirect('/alugado');
  } else {
    res.redirect('/alugar');
  }
});

app.post('/apagar/:id', (req, res) => {
  const idItem = req.params.id;
  itens = itens.filter(item => item.id != idItem);
  res.redirect('/alugar');
});

app.get('/alugado', (req, res) => {
  const itensAlugados = itens.filter(item => item.alugado);
  res.render('alugado', { itensAlugados });
});

app.post('/entregue/:id', (req, res) => {
  const idItem = req.params.id;
  const item = itens[idItem];

  if (item && item.alugado) {
    item.alugado = false;
    item.locatario = '';
    item.horaDevolucao = '';
    
    res.redirect('/alugar');
  } else {
    res.redirect('/alugado');
  }
});

// Salva os itens no arquivo JSON ao encerrar o servidor
process.on('exit', () => {
  salvarItens();
  console.log('Salvando itens no arquivo JSON...');
});

process.on('SIGINT', () => {
  process.exit();
});

app.listen(porta, () => {
  console.log(`Servidor rodando em http://localhost:${porta}`);
});
