<div align="center">

# 💆 Zenith Corp. — Sistema de Agendamento de Massagens

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![PHP](https://img.shields.io/badge/PHP-777BB4?style=for-the-badge&logo=php&logoColor=white)

Sistema completo de agendamento de massagem corporativa com painel administrativo, desenvolvido com foco em usabilidade, design moderno e praticidade para empresas.

</div>

---

## 📋 Sobre o Projeto

O **Zenith Massagem** é uma aplicação web desenvolvida para gerenciar agendamentos de sessões de massagem dentro de um ambiente corporativo. O sistema permite que colaboradores agendem horários de forma simples e intuitiva, enquanto administradores têm controle total sobre a gestão dos agendamentos, bloqueios de datas/horários e geração de relatórios.

### Principais diferenciais:
- Interface moderna com paleta **Azul Marinho + Cobre Dourado**
- Armazenamento local via `localStorage` (sem necessidade de banco de dados)
- Geração automática de **comprovantes em PDF**
- Painel administrativo completo e responsivo
- Popup motivacional para incentivar o bem-estar

---

## ✨ Funcionalidades

### 🖥️ Painel do Colaborador (`index.php`)
- Formulário de agendamento com validação de e-mail corporativo
- Calendário interativo com visualização de dias disponíveis
- Seleção de horários disponíveis em tempo real
- Consulta de agendamento existente por e-mail
- Edição e cancelamento de agendamentos
- Geração de comprovante em PDF (via jsPDF)
- Verificação por código enviado por e-mail
- Popup motivacional com frases sobre bem-estar
- Auto-refresh automático a cada 130 segundos

### 🔧 Painel do Administrador (`administrador1.php`)
- **Visão Geral (Dashboard):**
  - Estatísticas em tempo real (agendamentos ativos, cancelados, bloqueios)
  - Ações rápidas para navegação
- **Gerenciamento de Agendamentos:**
  - Listagem de agendamentos ativos e cancelados
  - Pesquisa por nome
  - Filtro por data
  - Edição e exclusão de agendamentos
  - Exportação para Excel
- **Bloqueios & Dias:**
  - Bloquear/desbloquear horários específicos
  - Liberar/remover/bloquear dias inteiros
- **Liberação de Mês:**
  - Liberação de meses para agendamento
  - Notícia de liberação com data e horário
- **Relatórios:**
  - Relatório mensal exportável em Excel (XLSX)
  - Relatório diário exportável em Excel (XLSX)
- **Barra Superior:**
  - Últimos agendamentos recentes
  - Histórico de edições
  - Botão de retorno rápido ao dashboard
- **Sidebar retrátil** com estado persistido via `localStorage`

---

## 🛠️ Tecnologias Utilizadas

| Tecnologia | Uso |
|---|---|
| **HTML5** | Estrutura das páginas |
| **CSS3** | Estilização completa (2300+ linhas) |
| **JavaScript** | Lógica de negócio e interatividade (1900+ linhas) |
| **PHP** | Wrapper das páginas e inclusão de templates |
| **localStorage** | Persistência de dados no navegador |
| **SweetAlert2** | Alertas e confirmações estilizados |
| **jsPDF** | Geração de comprovantes em PDF |
| **SheetJS (XLSX)** | Exportação de relatórios em Excel |
| **Font Awesome 6** | Ícones profissionais na interface |

---

## 📁 Estrutura do Projeto

```
PrimeiroProjeto/
├── index.php               # Página principal (agendamento do colaborador)
├── agendador.html          # Template do formulário de agendamento
├── administrador1.php      # Painel admin (versão com ícone personalizado)
├── administrador2.php      # Painel admin (versão alternativa)
├── administrador.html      # Template do painel administrativo
├── script.js               # Lógica completa do sistema
├── style.css               # Estilização de todas as páginas
├── Zenith Logo.png         # Logo principal (tela de agendamento)
├── Zenith Sidebar.png      # Logo da sidebar (painel admin)
├── Icone Zenith.png        # Favicon/ícone da marca
├── Massagem.png            # Imagem de fundo
└── README.md               # Este arquivo
```

---

## 🚀 Como Executar

### Pré-requisitos
- Servidor web com suporte a PHP (Apache, Nginx, XAMPP, Laragon, etc.)
- Navegador moderno (Chrome, Firefox, Edge)

### Instalação

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/Jhonata334/PrimeiroProjeto.git
   ```

2. **Mova para o diretório do servidor web:**
   ```bash
   # Exemplo com XAMPP:
   cp -r PrimeiroProjeto/ C:/xampp/htdocs/

   # Exemplo com Laragon:
   cp -r PrimeiroProjeto/ C:/laragon/www/
   ```

3. **Inicie o servidor web** (Apache via XAMPP, Laragon, etc.)

4. **Acesse no navegador:**
   - Colaborador: `http://localhost/PrimeiroProjeto/`
   - Administrador: `http://localhost/PrimeiroProjeto/administrador1.php`

---

## 🔐 Credenciais de Acesso

O sistema possui validação de e-mail corporativo e autenticação para o painel administrativo.

| Perfil | E-mail | Senha |
|---|---|---|
| Admin 1 | `agendamento.massagem@zenithcorp.com.br` | `Zenith@123` |
| Admin 2 | `jhonata.araujo@zenithcorp.com.br` | `ZenitH@123` |

> **Nota:** Colaboradores devem usar e-mails com domínio `@zenithcorp.com.br` para agendar.

---

## 🎨 Design

O projeto utiliza uma paleta de cores **Azul Marinho + Cobre Dourado**, transmitindo sofisticação e profissionalismo:

| Cor | Hex | Uso |
|---|---|---|
| Azul Marinho | `#1E3A5F` | Botões, títulos, destaques |
| Azul Profundo | `#152C4A` | Hover, gradientes |
| Azul Royal | `#2563EB` | Menu ativo da sidebar |
| Sidebar | `#0F1F33` | Fundo da sidebar |
| Cobre | `#C87533` | Detalhes accent |
| Cobre Claro | `#D4943A` | Confirmações |

---

## 📦 Dependências Externas (CDN)

Todas as dependências são carregadas via CDN, sem necessidade de instalação:

- [SweetAlert2](https://sweetalert2.github.io/) — Alertas elegantes
- [jsPDF](https://github.com/parallax/jsPDF) — Geração de PDF
- [SheetJS](https://sheetjs.com/) — Exportação Excel
- [Font Awesome 6](https://fontawesome.com/) — Ícones
- [disable-devtool](https://github.com/nickthecook/disable-devtool) — Proteção do console

---

## 📄 Licença

Este projeto é de uso privado. © 2026 Zenith Corp. Todos os direitos reservados.

---

<div align="center">

Desenvolvido com ❤️ para promover o bem-estar corporativo.

</div>
