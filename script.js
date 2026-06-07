// ================================================
// CAMADA DE DADOS LOCAL (localStorage)
// Substitui todas as conexões PHP/banco de dados
// ================================================

// Customização global do SweetAlert2 - cores Zenith
document.addEventListener('DOMContentLoaded', function() {
    if (typeof Swal !== 'undefined') {
        window.Swal = Swal.mixin({
            confirmButtonColor: '#1E3A5F',
            cancelButtonColor: '#152C4A'
        });
    }
});

function getLocalData(key, fallback = []) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : fallback;
    } catch { return fallback; }
}

function setLocalData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// Gera ID incremental
function nextId(key) {
    const items = getLocalData(key);
    if (items.length === 0) return 1;
    return Math.max(...items.map(i => i.id || 0)) + 1;
}

// ── Dados de exemplo (inseridos apenas na primeira vez) ──
function inicializarDadosExemplo() {
    if (localStorage.getItem("_dadosInicializados")) return;

    const hoje = new Date();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const ano = hoje.getFullYear();

    // Mês liberado
    setLocalData("mesLiberado", { mes: parseInt(mes), ano: ano });

    // Agendamentos de exemplo
    const agendamentos = [
        { id: 1, nome: "maria.silva", email: "maria.silva@zenithcorp.com.br", dia: `05/${mes}/${ano}`, horario: "09:00", cancelado: 0, oculto: 0 },
        { id: 2, nome: "joao.santos", email: "joao.santos@zenithcorp.com.br", dia: `05/${mes}/${ano}`, horario: "09:20", cancelado: 0, oculto: 0 },
        { id: 3, nome: "ana.oliveira", email: "ana.oliveira@zenithcorp.com.br", dia: `05/${mes}/${ano}`, horario: "10:00", cancelado: 0, oculto: 0 },
        { id: 4, nome: "carlos.lima", email: "carlos.lima@zenithcorp.com.br", dia: `07/${mes}/${ano}`, horario: "14:00", cancelado: 0, oculto: 0 },
        { id: 5, nome: "fernanda.costa", email: "fernanda.costa@zenithcorp.com.br", dia: `07/${mes}/${ano}`, horario: "15:00", cancelado: 1, oculto: 0 },
        { id: 6, nome: "pedro.rocha", email: "pedro.rocha@zenithcorp.com.br", dia: `12/${mes}/${ano}`, horario: "11:00", cancelado: 0, oculto: 0 },
        { id: 7, nome: "lucas.mendes", email: "lucas.mendes@zenithcorp.com.br", dia: `12/${mes}/${ano}`, horario: "13:40", cancelado: 0, oculto: 0 },
        { id: 8, nome: "julia.ferreira", email: "julia.ferreira@zenithcorp.com.br", dia: `14/${mes}/${ano}`, horario: "09:40", cancelado: 1, oculto: 0 },
    ];
    setLocalData("agendamentos", agendamentos);

    // Histórico de edições
    setLocalData("historicoEdicoes", [
        { usuario: "Administrador", data_edicao: `02/${mes}/${ano}`, horario_edicao: "10:30", novo_horario: "14:00", novo_dia: `07/${mes}/${ano}` },
        { usuario: "jhonata.araujo", data_edicao: `01/${mes}/${ano}`, horario_edicao: "16:00", novo_horario: "11:00", novo_dia: `12/${mes}/${ano}` },
    ]);

    // Bloqueios de horário
    setLocalData("bloqueiosHorario", {});

    // Dias extras e bloqueados
    setLocalData("diasExtras", []);
    setLocalData("diasBloqueados", []);

    // Notícia de liberação
    setLocalData("noticiaLiberacao", null);

    localStorage.setItem("_dadosInicializados", "true");
}

inicializarDadosExemplo();

// ================================================
// FUNÇÕES DO SISTEMA
// ================================================

document.addEventListener("DOMContentLoaded", function () {
    if (document.getElementById("calendario")) {
        carregarCalendario();
    }

    carregarAgendamentos();

    const botaoAgendar = document.getElementById("botao-agendar");
    if (botaoAgendar) {
        botaoAgendar.addEventListener("click", agendar);
    }

    const mesInput = document.getElementById("mesLiberado");
    const anoInput = document.getElementById("anoLiberado");

    if (mesInput && anoInput) {
        function notificarSelecao() {
            const mesSelecionado = mesInput.value;
            const anoSelecionado = anoInput.value;

            if (mesSelecionado && anoSelecionado) {
                mostrarAlerta(`Você selecionou: ${mesSelecionado}/${anoSelecionado}`, "info");
            }
        }

        mesInput.addEventListener("change", notificarSelecao);
        anoInput.addEventListener("input", notificarSelecao);
    }
});

document.addEventListener("DOMContentLoaded", function () {
    carregarNoticiaLiberacao();
});

let agendamentoPendente = null;

let horarioTemporariamenteReservado = null;
let temporizadorConfirmacao = null;
let intervaloContagem = null;

let intervaloContador;

async function carregarCalendario() {
    const calendario = document.getElementById("calendario");
    const mesAtual = document.getElementById("mes-atual");

    let mesLiberado = null;
    let anoLiberado = null;

    try {
        const dadosMes = getLocalData("mesLiberado", null);
        if (dadosMes) {
            mesLiberado = dadosMes.mes - 1;
            anoLiberado = dadosMes.ano;
        } else {
            throw new Error("Sem mês liberado");
        }
    } catch (error) {
        console.warn("⚠️ Não foi possível carregar o mês liberado. Usando mês atual.");
        let dataAtual = new Date();
        mesLiberado = dataAtual.getMonth();
        anoLiberado = dataAtual.getFullYear();
    }

    const meses = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    mesAtual.innerText = `${meses[mesLiberado]} ${anoLiberado}`;
    calendario.innerHTML = "";

    // Feriados fixos
    let feriadosSet = new Set([
        "01/01/2026", "20/02/2026", "21/02/2026", "03/04/2026", "21/04/2026",
        "01/05/2026", "04/06/2026", "07/09/2026", "12/10/2026", "02/11/2026",
        "15/11/2026", "25/12/2026"
    ]);

    let diasExtrasSet = new Set(getLocalData("diasExtras", []));
    let diasBloqueadosSet = new Set(getLocalData("diasBloqueados", []));

    let primeiroDia = new Date(anoLiberado, mesLiberado, 1).getDay();
    let totalDias = new Date(anoLiberado, mesLiberado + 1, 0).getDate();

    for (let i = 0; i < primeiroDia; i++) {
        calendario.appendChild(document.createElement("div"));
    }

    const hoje = new Date();

    for (let dia = 1; dia <= totalDias; dia++) {
        let data = new Date(anoLiberado, mesLiberado, dia);
        let diaSemana = data.getDay();
        let dataFormatada = `${String(dia).padStart(2, '0')}/${String(mesLiberado + 1).padStart(2, '0')}/${anoLiberado}`;

        let diaElemento = document.createElement("div");
        diaElemento.textContent = dia;

        const isFeriado = feriadosSet.has(dataFormatada);

        if (
            data.getFullYear() === hoje.getFullYear() &&
            data.getMonth() === hoje.getMonth() &&
            dia === hoje.getDate()
        ) {
            diaElemento.classList.add("hoje");
        } else if (data < hoje) {
            diaElemento.classList.add("desativado");
        } else if (isFeriado) {
            diaElemento.classList.add("feriado");
        } else if (
            !diasBloqueadosSet.has(dataFormatada) && (
                (diaSemana === 3 || diaSemana === 5) ||
                diasExtrasSet.has(dataFormatada)
            )
        ) {
            diaElemento.classList.add("ativo");
            diaElemento.onclick = function () {
                selecionarDia(dia, mesLiberado + 1, anoLiberado);
            };
        }

        calendario.appendChild(diaElemento);
    }
}

function selecionarDia(dia, mes, ano) {
    let diaFormatado = dia.toString().padStart(2, "0");
    let mesFormatado = mes.toString().padStart(2, "0");
    let dataFormatada = `${diaFormatado}/${mesFormatado}/${ano}`;

    localStorage.setItem("diaSelecionado", dataFormatada);
    atualizarHorariosDisponiveis(dataFormatada);

    document.querySelectorAll(".calendario div").forEach(el => el.classList.remove("selecionado"));

    let dias = document.querySelectorAll("#calendario div");
    dias[dia + new Date(ano, mes - 1, 1).getDay() - 1]?.classList.add("selecionado");

    mostrarAlerta(`Você selecionou o dia ${dataFormatada}`, "info");
}

async function atualizarHorariosDisponiveis(diaSelecionado) {
    const horariosFixos = [
        "09:00", "09:20", "09:40", "10:00", "10:20", "10:40",
        "11:00", "11:20", "11:40", "12:00", "13:20",
        "13:40", "14:00", "14:20", "14:40", "15:00", "15:20",
        "15:40", "16:00", "16:20"
    ];

    const grade = document.getElementById("grade-horarios");
    if (!grade) return;
    grade.innerHTML = "";

    try {
        const agendamentos = getLocalData("agendamentos", []);

        const horariosOcupados = agendamentos
            .filter(a => a.dia === diaSelecionado && a.cancelado == 0 && !a.oculto)
            .map(a => a.horario);

        // Carrega bloqueios locais
        let horariosBloqueados = [];
        const bloqueios = getLocalData("bloqueiosHorario", {});
        const partes = diaSelecionado.split("/");
        const dataFormatoISO = `${partes[2]}-${partes[1]}-${partes[0]}`;
        horariosBloqueados = bloqueios[dataFormatoISO] || [];

        horariosFixos.forEach(horario => {
            const btn = document.createElement("button");
            btn.textContent = horario;
            btn.classList.add("botao-horario");
            btn.setAttribute("data-horario", horario);

            if (horariosBloqueados.includes(horario)) {
                btn.classList.add("bloqueado");
                btn.disabled = true;
                btn.title = "Horário bloqueado por evento";
            } else if (horariosOcupados.includes(horario)) {
                btn.classList.add("ocupado");
                btn.disabled = true;
            } else {
                btn.addEventListener("click", function () {
                    if (horarioTemporariamenteReservado) {
                        const anterior = document.querySelector(`button[data-horario="${horarioTemporariamenteReservado}"]`);
                        anterior?.classList.remove("selecionado", "ocupado");
                        clearTimeout(temporizadorConfirmacao);
                        clearInterval(intervaloContador);
                        horarioTemporariamenteReservado = null;
                    }

                    document.querySelectorAll(".botao-horario").forEach(b => b.classList.remove("selecionado"));
                    btn.classList.add("selecionado", "ocupado");
                    document.getElementById("horarioSelecionado").value = horario;
                    horarioTemporariamenteReservado = horario;

                    let tempoRestante = 120;
                    const divContador = document.getElementById("contador-tempo");
                    const spanTempo = document.getElementById("tempo-restante");
                    if (spanTempo) spanTempo.textContent = tempoRestante;

                    intervaloContador = setInterval(() => {
                        tempoRestante--;
                        if (spanTempo) spanTempo.textContent = tempoRestante;

                        if (tempoRestante <= 0) {
                            clearInterval(intervaloContador);
                            clearTimeout(temporizadorConfirmacao);
                            btn.classList.remove("selecionado", "ocupado");
                            document.getElementById("horarioSelecionado").value = "";
                            horarioTemporariamenteReservado = null;
                            if (divContador) divContador.style.display = "none";
                            mostrarAlerta("Tempo para confirmar expirou. Selecione o horário novamente.", "erro");
                        }
                    }, 1000);

                    temporizadorConfirmacao = setTimeout(() => {
                        clearInterval(intervaloContador);
                        btn.classList.remove("selecionado", "ocupado");
                        document.getElementById("horarioSelecionado").value = "";
                        horarioTemporariamenteReservado = null;
                        if (divContador) divContador.style.display = "none";
                    }, 120000);
                });
            }

            grade.appendChild(btn);
        });

    } catch (error) {
        console.error("Erro ao carregar agendamentos:", error);
    }
}


function validarNomeFormato(nome) {
    const regex = /^[a-z]+\.[a-z]+$/i;
    return regex.test(nome);
}

const nomesBloqueados = [
    "thiago.alves"
];


async function agendar() {
    let nome = document.getElementById("nome").value;
    let email = document.getElementById("email").value.trim().toLowerCase();
    const emailCorporativoRegex = /^[\w.%+-]+@zenithcorp\.com\.br$/i;

    const emailsAdmin = [
        "agendamento.massagem@zenithcorp.com.br",
        "jhonata.araujo@zenithcorp.com.br",
        "jhonata.araujo@zenithcorp.com.br"
    ];

    const isAdmin = emailsAdmin.includes(email);

    if (!emailCorporativoRegex.test(email)) {
        Swal.fire({
            icon: "error",
            title: "E-mail inválido",
            text: "O e-mail deve ser corporativo: @zenithcorp.com.br",
            confirmButtonText: "Fechar",
            confirmButtonColor: "#152C4A"
        });
        return;
    }

    if (!validarNomeFormato(nome)) {
        Swal.fire({
            icon: "error",
            title: "Nome inválido",
            text: "O nome deve estar no formato nome.sobrenome, como jhonata.araujo",
            confirmButtonText: "Fechar",
            confirmButtonColor: "#152C4A"
        });
        return;
    }

    nome = nome.trim().toLowerCase();

    if (nomesBloqueados.includes(nome)) {
        Swal.fire({
            icon: "error",
            title: "Agendamento bloqueado",
            text: "Este usuário não está autorizado a realizar agendamentos.",
            confirmButtonText: "Fechar",
            confirmButtonColor: "#152C4A"
        });
        return;
    }

    let horario = document.getElementById("horarioSelecionado").value;
    let dia = localStorage.getItem("diaSelecionado");

    if (!nome || !email || !horario || !dia) {
        mostrarAlerta("Preencha todos os campos e selecione um dia!", "erro");
        return;
    }

    let agendamentos = getLocalData("agendamentos", []);

    const conflitoNome = agendamentos.find(a => a.email.toLowerCase() === email && a.nome.toUpperCase() !== nome.toUpperCase());
    const conflitoEmail = agendamentos.find(a => a.nome.toUpperCase() === nome.toUpperCase() && a.email.toLowerCase() !== email);

    if (conflitoNome && !isAdmin) {
        mostrarAlerta("Este e-mail já foi utilizado com outro nome. Verifique seus dados.", "erro");
        return;
    }

    if (conflitoEmail && !isAdmin) {
        mostrarAlerta("Este nome já foi utilizado com outro e-mail. Verifique seus dados.", "erro");
        return;
    }

    let horarioOcupado = agendamentos.some(ag => ag.dia === dia && ag.horario === horario && ag.cancelado == 0 && !ag.oculto);
    if (horarioOcupado) {
        mostrarAlerta("Este horário já está agendado. Por favor, escolha outro.", "erro");
        return;
    }

    const [_, mesNum, anoNum] = dia.split("/");
    const agendamentosMes = agendamentos.filter(ag =>
        ag.email.toLowerCase() === email &&
        ag.dia.split("/")[1] === mesNum &&
        ag.dia.split("/")[2] === anoNum &&
        ag.cancelado == 0
    );

    if (agendamentosMes.length >= 2 && !isAdmin) {
        mostrarAlerta("Você já fez 2 agendamentos neste mês.", "erro");
        return;
    }

    const agendamentosMesmoDia = agendamentosMes.filter(ag => ag.dia === dia);

    if (agendamentosMesmoDia.length === 1) {
        const horarioExistente = agendamentosMesmoDia[0].horario;

        function minutos(h) {
            const [hh, mm] = h.split(":").map(Number);
            return hh * 60 + mm;
        }

        const diferenca = Math.abs(minutos(horarioExistente) - minutos(horario));
        const ehConsecutivo = diferenca === 20;

        if (!ehConsecutivo && !isAdmin) {
            mostrarAlerta("Você já possui um agendamento neste dia que não é consecutivo.", "erro");
            return;
        }
    } else if (agendamentosMesmoDia.length >= 2 && !isAdmin) {
        mostrarAlerta("Você já possui 2 agendamentos neste dia.", "erro");
        return;
    }

    agendamentoPendente = { nome, email, horario, dia };
    document.getElementById("textoConfirmacao").innerText =
        `Nome: ${nome}\nEmail: ${email}\nData: ${dia}\nHorário: ${horario}`;
    document.getElementById("popupConfirmacao").style.display = "flex";
}


function fecharPopup() {
    document.getElementById("popupConfirmacao").style.display = "none";
}

let paginaAtualAgendamentos = 1;
let itensPorPaginaAgendamentos = 3;

function mudarItensPorPagina() {
    const select = document.getElementById("itensPorPagina");
    if(select) {
        if(select.value === "todos") {
            itensPorPaginaAgendamentos = "todos";
        } else {
            itensPorPaginaAgendamentos = parseInt(select.value, 10);
        }
        paginaAtualAgendamentos = 1;
        carregarAgendamentos();
    }
}

function renderizarPaginacaoAgendamentos(totalItens) {
    const container = document.getElementById("paginacao-numeros");
    if (!container) return;
    container.innerHTML = "";

    if (itensPorPaginaAgendamentos === "todos") return;

    const totalPaginas = Math.ceil(totalItens / itensPorPaginaAgendamentos);
    if (totalPaginas <= 1) return;

    // Lógica para mostrar apenas 5 botões (sliding window)
    let startPage = Math.max(1, paginaAtualAgendamentos - 2);
    let endPage = Math.min(totalPaginas, startPage + 4);

    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }

    // Botão Anterior (<)
    if (paginaAtualAgendamentos > 1) {
        const btnPrev = document.createElement("button");
        btnPrev.innerText = "<";
        estilizarBotaoPaginacao(btnPrev, false);
        btnPrev.onclick = () => {
            paginaAtualAgendamentos--;
            carregarAgendamentos();
        };
        container.appendChild(btnPrev);
    }

    for (let i = startPage; i <= endPage; i++) {
        const btn = document.createElement("button");
        btn.innerText = i;
        const isAtivo = (i === paginaAtualAgendamentos);
        estilizarBotaoPaginacao(btn, isAtivo);
        
        btn.onclick = () => {
            paginaAtualAgendamentos = i;
            carregarAgendamentos();
        };
        container.appendChild(btn);
    }

    // Botão Próximo (>)
    if (paginaAtualAgendamentos < totalPaginas) {
        const btnNext = document.createElement("button");
        btnNext.innerText = ">";
        estilizarBotaoPaginacao(btnNext, false);
        btnNext.onclick = () => {
            paginaAtualAgendamentos++;
            carregarAgendamentos();
        };
        container.appendChild(btnNext);
    }
}

function estilizarBotaoPaginacao(btn, isAtivo) {
    btn.style.padding = "5px 10px";
    btn.style.margin = "0 2px";
    btn.style.border = "1px solid #ccc";
    btn.style.borderRadius = "5px";
    btn.style.cursor = "pointer";
    btn.style.backgroundColor = isAtivo ? "#1E3A5F" : "#fff";
    btn.style.color = isAtivo ? "#fff" : "#333";
}

function carregarAgendamentos() {
    let listaAtivos = document.getElementById("lista-agendamentos");
    let listaCancelados = document.getElementById("lista-cancelados");
    if (!listaAtivos || !listaCancelados) return;

    listaAtivos.innerHTML = "";
    listaCancelados.innerHTML = "";

    const agendamentos = getLocalData("agendamentos", [])
        .filter(a => !a.oculto)
        .sort((a, b) => {
            const [d1, m1, a1] = a.dia.split("/").map(Number);
            const [d2, m2, a2] = b.dia.split("/").map(Number);
            const dataA = new Date(a1, m1 - 1, d1, ...a.horario.split(":").map(Number));
            const dataB = new Date(a2, m2 - 1, d2, ...b.horario.split(":").map(Number));
            return dataA - dataB;
        });

    const agendamentosCancelados = agendamentos.filter(a => a.cancelado == 1);
    let agendamentosAtivos = agendamentos.filter(a => a.cancelado == 0);

    const termo = document.getElementById("pesquisaAtivos")?.value.toLowerCase() || "";
    if (termo) {
        agendamentosAtivos = agendamentosAtivos.filter(a => a.nome.toLowerCase().includes(termo));
    }

    const totalItens = agendamentosAtivos.length;
    let agendamentosPaginados;

    if (itensPorPaginaAgendamentos === "todos") {
        agendamentosPaginados = agendamentosAtivos;
    } else {
        const startIndex = (paginaAtualAgendamentos - 1) * itensPorPaginaAgendamentos;
        const endIndex = startIndex + itensPorPaginaAgendamentos;
        agendamentosPaginados = agendamentosAtivos.slice(startIndex, endIndex);
    }

    renderizarPaginacaoAgendamentos(totalItens);

    agendamentosPaginados.forEach((agendamento) => {
        let item = document.createElement("div");
        item.classList.add("agendamento-item");
        item.setAttribute("data-id", agendamento.id);

        item.innerHTML = `
            <p><strong>Nome:</strong> ${agendamento.nome}</p>
            <p><strong>Email:</strong> ${agendamento.email}</p>
            <p><strong>Data:</strong> ${agendamento.dia}</p>
            <p><strong>Horário:</strong> ${agendamento.horario}</p>
        `;
        item.innerHTML += `
            <button onclick="abrirEdicao(${agendamento.id}, '${agendamento.nome}', '${agendamento.email}', '${agendamento.dia}', '${agendamento.horario}')">Editar</button>
            <button onclick="confirmarCancelarAgendamento(${agendamento.id})">Cancelar</button>
            <button onclick="excluirAgendamento(this)">Excluir</button>
        `;
        listaAtivos.appendChild(item);
    });

    agendamentosCancelados.forEach((agendamento) => {
        let item = document.createElement("div");
        item.classList.add("agendamento-item");
        item.setAttribute("data-id", agendamento.id);

        item.innerHTML = `
            <p><strong>Nome:</strong> ${agendamento.nome}</p>
            <p><strong>Email:</strong> ${agendamento.email}</p>
            <p><strong>Data:</strong> ${agendamento.dia}</p>
            <p><strong>Horário:</strong> ${agendamento.horario}</p>
        `;
        item.innerHTML += `
            <button onclick="reativarAgendamento(${agendamento.id})">Reativar Agendamento</button>
        `;
        listaCancelados.appendChild(item);
    });
    
    // Reaplica filtro visual nos cancelados se houver algo digitado
    filtrarAgendamentosCancelados();
}

function cancelarAgendamento(id) {
    let agendamentos = getLocalData("agendamentos", []);
    agendamentos = agendamentos.map(a => a.id === id ? { ...a, cancelado: 1 } : a);
    setLocalData("agendamentos", agendamentos);
    carregarAgendamentos();
    mostrarAlerta("Agendamento cancelado.", "erro");
}

function confirmarCancelamento() {
    const id = window.indiceCancelamento;
    let agendamentos = getLocalData("agendamentos", []);
    agendamentos = agendamentos.map(a => a.id === id ? { ...a, cancelado: 1 } : a);
    setLocalData("agendamentos", agendamentos);
    carregarAgendamentos();
    fecharPopupCancelamento();
    mostrarAlerta("Agendamento cancelado.", "erro");
}

function fecharPopupCancelamento() {
    document.getElementById("popupConfirmacaoCancelamento").style.display = "none";
}

let indiceEditando = null;

function fecharEdicao() {
    document.getElementById("editarPopup").style.display = "none";
    document.body.classList.remove("admin-edicao-ativa");
}

function salvarEdicao() {
    const nome = document.getElementById("editarNome").value;
    const email = document.getElementById("editarEmail").value;
    const dia = document.getElementById("editarData").value;
    const horario = document.getElementById("editarHorario").value;
    const id = window.idEditando;

    if (!id || !dia || !horario) {
        mostrarAlerta("Preencha todos os campos obrigatórios.", "erro");
        return;
    }

    let agendamentos = getLocalData("agendamentos", []);
    agendamentos = agendamentos.map(a => {
        if (a.id === id) {
            return { ...a, nome: nome || a.nome, email: email || a.email, dia, horario };
        }
        return a;
    });
    setLocalData("agendamentos", agendamentos);

    // Salvar no histórico de edições
    const historico = getLocalData("historicoEdicoes", []);
    const agora = new Date();
    historico.unshift({
        usuario: "Administrador",
        data_edicao: `${String(agora.getDate()).padStart(2, '0')}/${String(agora.getMonth() + 1).padStart(2, '0')}/${agora.getFullYear()}`,
        horario_edicao: `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`,
        novo_horario: horario,
        novo_dia: dia
    });
    setLocalData("historicoEdicoes", historico);

    carregarAgendamentos();
    fecharEdicao();
    mostrarAlerta("Agendamento editado com sucesso!", "sucesso");
}

function mostrarMensagem(mensagem) {
    let msgBox = document.getElementById("mensagem-confirmacao");
    if (!msgBox) return;
    msgBox.textContent = mensagem;
    msgBox.classList.add("mensagem-visivel");

    setTimeout(() => {
        msgBox.classList.remove("mensagem-visivel");
    }, 3000);
}

function confirmarAgendamento() {
    console.log("📨 Função confirmarAgendamento chamada");
    mostrarAlerta("Agendamento sendo confirmado...", "info");
    const popupConfirmacao = document.getElementById("popupConfirmacao");
    if (popupConfirmacao) popupConfirmacao.style.display = "none";
    const contadorTempo = document.getElementById("contador-tempo");
    if (contadorTempo) contadorTempo.style.display = "none";
    clearInterval(intervaloContador);

    // Modo local: salvar direto sem verificação de código
    salvarAgendamento();
}

function iniciarContadorConfirmacao() {
    // No modo local não precisa de contador
}

function abrirLogin() {
    document.getElementById("popupLogin").style.display = "block";
}

function entrarComoAdmin() {
    const usuario = document.getElementById("usuario").value.trim();
    const senha = document.getElementById("senha").value.trim();
    const lembrarEl = document.getElementById("lembrarLogin");
    const lembrar = lembrarEl ? lembrarEl.checked : false;

    if ((usuario === "Admin.zenith" && senha === "Maçã@1978") ||
        (usuario === "Jhonata.araujo" && senha === "S161727aa#") ||
        (usuario === "Jhonata.araujo" && senha === "Zenith@123") ||
        (usuario === "Admin.geral" && senha === "ZenitH@123")) {

        localStorage.setItem("usuarioLogado", usuario);

        if (lembrar) {
            localStorage.setItem("usuarioSalvo", usuario);
            localStorage.setItem("senhaSalva", senha);
        } else {
            localStorage.removeItem("usuarioSalvo");
            localStorage.removeItem("senhaSalva");
        }

        if (usuario === "Admin.zenith" || usuario === "Admin.geral") {
            window.open("administrador.php", "_blank");
        } else {
            window.open("massagem-frontend/aprendiz.php", "_blank");
        }

        document.getElementById("popupLogin").style.display = "none";
        document.getElementById("usuario").value = "";
        document.getElementById("senha").value = "";
    } else {
        Swal.fire({
            icon: "error",
            title: "Acesso negado",
            text: "Usuário ou senha incorretos.",
            confirmButtonColor: "#152C4A",
            confirmButtonText: "OK"
        });
    }
}

window.addEventListener("DOMContentLoaded", () => {
    const usuarioSalvo = localStorage.getItem("usuarioSalvo");
    const senhaSalva = localStorage.getItem("senhaSalva");
    const usuarioEl = document.getElementById("usuario");
    const senhaEl = document.getElementById("senha");
    const lembrarEl = document.getElementById("lembrarLogin");

    if (usuarioSalvo && senhaSalva && usuarioEl && senhaEl) {
        usuarioEl.value = usuarioSalvo;
        senhaEl.value = senhaSalva;
        if (lembrarEl) lembrarEl.checked = true;
    }
});

function cancelarLogin() {
    document.getElementById("popupLogin").style.display = "none";
    document.getElementById("usuario").value = "";
    document.getElementById("senha").value = "";
}

function fecharLogin() {
    document.getElementById("popupLogin").style.display = "none";
}

const botaoLogin = document.getElementById("botao-login");
if (botaoLogin) {
    botaoLogin.addEventListener("click", function () {
        verificarLogin();
    });
}

function verificarLogin() {
    const usuario = document.getElementById("usuario").value.trim();
    const senha = document.getElementById("senha").value.trim();

    const usuarioCorreto = "Admin.zenith";
    const senhaCorreta = "Maça@1978";

    if (usuario === usuarioCorreto && senha === senhaCorreta) {
        let novaAba = window.open("Massagem/administrador.php", "_blank");

        if (!novaAba) {
            alert("O navegador bloqueou a abertura da nova aba. Permita pop-ups e tente novamente.");
        }
    } else {
        mostrarAlerta("Usuário ou senha incorretos!", "erro");
    }
}


function mostrarAlerta(mensagem, tipo = 'info') {
    const alerta = document.getElementById('alerta-personalizado');
    if (!alerta) return;
    alerta.textContent = mensagem;
    alerta.className = `alerta ${tipo}`;
    alerta.style.display = 'block';
    setTimeout(() => {
        alerta.style.opacity = '1';
    }, 10);

    setTimeout(() => {
        alerta.style.opacity = '0';
        setTimeout(() => {
            alerta.style.display = 'none';
        }, 300);
    }, 3000);
}

function confirmarCancelarAgendamento(id) {
    window.indiceCancelamento = id;
    document.getElementById("popupConfirmacaoCancelamento").style.display = "flex";
}

function liberarMes() {
    const mes = document.getElementById("mesLiberado").value;
    const ano = document.getElementById("anoLiberado").value;

    if (!mes || !ano) {
        Swal.fire({
            icon: "warning",
            title: "Atenção",
            text: "Por favor, selecione o mês e o ano corretamente.",
            confirmButtonColor: "#152C4A"
        });
        return;
    }

    Swal.fire({
        title: "Tem certeza?",
        text: `Deseja liberar os agendamentos para ${mes}/${ano}?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#152C4A",
        cancelButtonColor: "#1E3A5F",
        confirmButtonText: "Sim, liberar!",
        cancelButtonText: "Cancelar"
    }).then((result) => {
        if (result.isConfirmed) {
            setLocalData("mesLiberado", { mes: parseInt(mes), ano: parseInt(ano) });
            Swal.fire({
                icon: "success",
                title: "Mês liberado!",
                text: `Agendamentos liberados para ${mes}/${ano}.`,
                confirmButtonColor: "#D4943A"
            }).then(() => {
                location.reload();
            });
        }
    });
}

function atualizarCalendario(mes, ano) {
    const calendario = document.getElementById("calendario");
    if (!calendario) return;
    calendario.innerText = `Agendamentos disponíveis para: ${mes.toString().padStart(2, '0')}/${ano}`;
}

function exibirCalendario(mes, ano) {
    const calendario = document.getElementById("calendario");
    if (!calendario) return;

    const nomeMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    calendario.innerHTML = `<h3>${nomeMeses[mes - 1]} de ${ano}</h3>`;
}

document.addEventListener("DOMContentLoaded", () => {
    atualizarTituloCalendario();
});

function atualizarTituloCalendario() {
    const dados = getLocalData("mesLiberado", null);
    if (!dados) return;

    const nomeMeses = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    const titulo = document.getElementById("titulo-calendario");
    if (titulo) {
        titulo.textContent = `${nomeMeses[parseInt(dados.mes) - 1]} de ${dados.ano}`;
    }
}

function salvarMesLiberado() {
    const mes = document.getElementById("mesLiberado").value;
    const ano = document.getElementById("anoLiberado").value;

    setLocalData("mesLiberado", { mes: parseInt(mes), ano: parseInt(ano) });
    alert("Mês de agendamento atualizado!");
}

const adminBtn = document.getElementById("adminBtn");
if (adminBtn) {
    adminBtn.addEventListener("click", function () {
        document.getElementById("popupLogin").style.display = "block";
    });
}

function abrirEdicao(id, nome, email, dia, horario) {
    document.getElementById("editarNome").value = nome;
    document.getElementById("editarEmail").value = email;
    document.getElementById("editarData").value = dia;
    document.getElementById("editarHorario").value = horario;

    document.getElementById("editarPopup").style.display = "flex";
    document.body.classList.add("admin-edicao-ativa");
    window.idEditando = id;
}

// ==== LOGIN DO ADMINISTRADOR ====

const abrirLoginBtn = document.getElementById("adminBtn");
const popupLogin = document.getElementById("popupLogin");
const entrarBtn = document.getElementById("entrarBtn");
const cancelarBtn = document.getElementById("cancelarBtn");
const senhaInput = document.getElementById("senhaAdmin");

if (abrirLoginBtn) {
    abrirLoginBtn.addEventListener("click", () => {
        if (popupLogin) popupLogin.style.display = "block";
    });
}

if (cancelarBtn) {
    cancelarBtn.addEventListener("click", () => {
        if (popupLogin) popupLogin.style.display = "none";
        if (senhaInput) senhaInput.value = "";
    });
}

if (entrarBtn) {
    entrarBtn.addEventListener("click", () => {
        const senha = senhaInput ? senhaInput.value.trim() : "";
        if (senha === "Maçã@1978") {
            document.body.classList.add("admin-edicao-ativa");
            if (popupLogin) popupLogin.style.display = "none";
            if (senhaInput) senhaInput.value = "";
        } else {
            alert("Senha incorreta.");
        }
    });
}

function aplicarFundoEdicao() {
    document.body.classList.add("admin-edicao-ativa");
}

function editarAgendamento(index) {
    const agendamentos = getLocalData("agendamentos", []);
    const ag = agendamentos[index];
    if (!ag) return;

    document.getElementById("editarNome").value = ag.nome;
    document.getElementById("editarEmail").value = ag.email;
    document.getElementById("editarData").value = ag.dia;
    document.getElementById("editarHorario").value = ag.horario;

    indiceEditando = index;
    document.getElementById("editarPopup").style.display = "flex";

    aplicarFundoEdicao();
}

function reativarAgendamento(id) {
    let agendamentos = getLocalData("agendamentos", []);
    agendamentos = agendamentos.map(a => a.id === id ? { ...a, cancelado: 0 } : a);
    setLocalData("agendamentos", agendamentos);
    carregarAgendamentos();
    mostrarAlerta("Agendamento reativado com sucesso!", "sucesso");
}

function apagarAgendamentosAtivos() {
    Swal.fire({
        title: "Confirmação",
        text: "Tem certeza que deseja apagar apenas os agendamentos ativos?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#152C4A",
        cancelButtonColor: "#1E3A5F",
        confirmButtonText: "Sim, apagar!",
        cancelButtonText: "Cancelar"
    }).then((result) => {
        if (result.isConfirmed) {
            let agendamentos = getLocalData("agendamentos", []);
            agendamentos = agendamentos.map(a => a.cancelado == 0 ? { ...a, oculto: 1 } : a);
            setLocalData("agendamentos", agendamentos);
            carregarAgendamentos();
            Swal.fire("Pronto!", "Agendamentos ativos apagados!", "success");
        }
    });
}

function apagarAgendamentosCancelados() {
    Swal.fire({
        title: "Confirmação",
        text: "Tem certeza que deseja apagar todos os agendamentos cancelados?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#152C4A",
        cancelButtonColor: "#1E3A5F",
        confirmButtonText: "Sim, apagar!",
        cancelButtonText: "Cancelar"
    }).then((result) => {
        if (result.isConfirmed) {
            let agendamentos = getLocalData("agendamentos", []);
            agendamentos = agendamentos.map(a => a.cancelado == 1 ? { ...a, oculto: 1 } : a);
            setLocalData("agendamentos", agendamentos);
            carregarAgendamentos();
            Swal.fire("Pronto!", "Agendamentos cancelados apagados!", "success");
        }
    });
}

document.addEventListener("DOMContentLoaded", function () {
    const mesRelatorio = document.getElementById("mesRelatorio");
    if (mesRelatorio) {
        const mesAtual = new Date().getMonth() + 1;
        mesRelatorio.value = mesAtual;
    }
});


function exportarRelatorioExcel() {
    const ano = document.getElementById("anoRelatorio").value;
    const mes = document.getElementById("mesRelatorio").value;

    const mesesNome = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    const nomeMes = mesesNome[parseInt(mes) - 1];
    const agendamentos = getLocalData("agendamentos", []);

    const dados = agendamentos.filter(ag => {
        const [dia, mesAgendamento, anoAgendamento] = ag.dia.split("/");
        return parseInt(mesAgendamento) === parseInt(mes) && anoAgendamento === ano;
    });

    if (dados.length === 0) {
        Swal.fire({
            icon: "info",
            title: "Nenhum agendamento encontrado",
            text: `Não há agendamentos registrados para ${nomeMes} de ${ano}.`,
            confirmButtonColor: "#152C4A",
            confirmButtonText: "OK"
        });
        return;
    }

    const dadosFormatados = dados
        .map(ag => ({
            Nome: ag.nome,
            Horário: ag.horario
        }))
        .sort((a, b) => a.Horário.localeCompare(b.Horário));

    if (typeof XLSX !== 'undefined') {
        const worksheet = XLSX.utils.json_to_sheet(dadosFormatados);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Relatorio_Agendamentos");
        XLSX.writeFile(workbook, `Relatorio_${nomeMes}_${ano}.xlsx`);
    } else {
        Swal.fire("Info", "Biblioteca XLSX não carregada. Dados encontrados: " + dados.length, "info");
    }
}

function abrirPopupConsulta() {
    document.getElementById("popupConsultaAgendamento").style.display = "flex";
}

function fecharConsulta() {
    document.getElementById("popupConsultaAgendamento").style.display = "none";
}

function consultarAgendamento() {
    const email = document.getElementById("consultaEmail").value.trim();

    if (!email) {
        Swal.fire("Atenção!", "Por favor, preencha o e-mail para consultar.", "warning");
        return;
    }

    const agendamentos = getLocalData("agendamentos", []);
    const resultados = agendamentos.filter(ag =>
        ag.email.trim().toLowerCase() === email.toLowerCase() && !ag.oculto
    );

    const resultadoDiv = document.getElementById("resultadoConsulta");
    resultadoDiv.innerHTML = "";

    if (resultados.length === 0) {
        resultadoDiv.innerHTML = `<p style="color: red;">Nenhum agendamento encontrado.</p>`;
        const btnContainer = document.getElementById("botaoComprovanteContainer");
        if (btnContainer) btnContainer.style.display = "none";
    } else {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        resultados.forEach(ag => {
            const bloco = document.createElement("div");

            let partes = ag.dia.includes("/")
                ? ag.dia.split("/")
                : ag.dia.split("-");

            let dataAgendamento;
            if (partes[0].length === 4) {
                dataAgendamento = new Date(partes[0], partes[1] - 1, partes[2]);
            } else {
                dataAgendamento = new Date(partes[2], partes[1] - 1, partes[0]);
            }
            dataAgendamento.setHours(0, 0, 0, 0);

            const podeEditar = dataAgendamento > hoje;

            bloco.innerHTML = `
                <p><strong>Nome:</strong> ${ag.nome}</p>
                <p><strong>Data:</strong> ${ag.dia}</p>
                <p><strong>Horário:</strong> ${ag.horario}</p>
                ${podeEditar ? `
                    <button onclick="confirmarEdicaoUsuario(${ag.id}, '${ag.dia}', '${ag.horario}')" 
                        style="margin: 10px 0; background-color: #152C4A; color: white; padding: 10px 20px; border: none; border-radius: 5px; font-weight: bold; cursor: pointer;">
                        Editar
                    </button>` : `
                    <p style="color: #152C4A; font-style: italic;">* Este agendamento não pode mais ser editado.</p>`}
                <hr>
            `;
            resultadoDiv.appendChild(bloco);
        });

        const btnContainer = document.getElementById("botaoComprovanteContainer");
        if (btnContainer) btnContainer.style.display = "flex";
    }

    resultadoDiv.style.display = "block";
}

function gerarComprovante() {
    const email = document.getElementById("consultaEmail").value.trim();
    const resultadoDiv = document.getElementById("resultadoConsulta");

    if (!email || resultadoDiv.innerHTML.trim() === "") {
        Swal.fire("Erro!", "Nenhum agendamento encontrado para gerar comprovante.", "error");
        return;
    }

    if (typeof jspdf === 'undefined' && typeof window.jspdf === 'undefined') {
        Swal.fire("Info", "Biblioteca jsPDF não carregada.", "info");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const corPrimaria = "#1E3A5F";
    const corDetalhe = "#DBEAFE";

    doc.setFillColor(corPrimaria);
    doc.rect(0, 0, 210, 30, "F");

    doc.setTextColor("#FFFFFF");
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Comprovante de Agendamento", 30, 18);

    let y = 45;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(corPrimaria);
    doc.text("Email:", 20, y);

    doc.setFont("helvetica", "normal");
    doc.setTextColor("#000000");
    doc.setFillColor(corDetalhe);
    doc.rect(55, y - 7, 140, 8, "F");
    doc.text(email, 57, y);

    y += 15;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(corPrimaria);
    doc.text("Detalhes do Agendamento:", 20, y);

    y += 10;
    resultadoDiv.querySelectorAll("p").forEach(p => {
        doc.setFont("helvetica", "normal");
        doc.setTextColor("#000000");
        doc.setFillColor(corDetalhe);
        doc.rect(20, y - 6, 170, 8, "F");
        doc.text(p.innerText, 22, y);
        y += 10;
    });

    doc.setFontSize(10);
    doc.setTextColor("#000000");
    doc.text("Obrigado por utilizar nosso sistema de agendamento!", 20, 285);
    doc.text("Zenith Corp. © 2026", 20, 292);

    doc.save(`Comprovante_${email.replace(/[@.]/g, "_")}.pdf`);
}

const terceirosForm = document.getElementById("terceirosForm");
if (terceirosForm) {
    terceirosForm.classList.add("mostrar");
}

function salvarAgendamento() {
    if (!agendamentoPendente) return;

    let agendamentos = getLocalData("agendamentos", []);
    const novoId = nextId("agendamentos");

    agendamentos.push({
        id: novoId,
        nome: agendamentoPendente.nome,
        email: agendamentoPendente.email,
        dia: agendamentoPendente.dia,
        horario: agendamentoPendente.horario,
        cancelado: 0,
        oculto: 0
    });

    setLocalData("agendamentos", agendamentos);

    mostrarAlerta("Agendamento Confirmado com Sucesso.", "sucesso");

    const nomeEl = document.getElementById("nome");
    const emailEl = document.getElementById("email");
    const horarioEl = document.getElementById("horarioSelecionado");
    const gradeEl = document.getElementById("grade-horarios");

    if (nomeEl) nomeEl.value = "";
    if (emailEl) emailEl.value = "";
    if (horarioEl) horarioEl.value = "";
    localStorage.removeItem("diaSelecionado");
    if (gradeEl) gradeEl.innerHTML = "";
    clearTimeout(temporizadorConfirmacao);
    horarioTemporariamenteReservado = null;

    const popupCodigo = document.getElementById("popupCodigo");
    if (popupCodigo) popupCodigo.style.display = "none";

    agendamentoPendente = null;

    setTimeout(() => {
        location.reload();
    }, 2500);
}

function verificarCodigoDigitado() {
    // Modo local: aceitar qualquer código
    salvarAgendamento();
    const contadorTempo = document.getElementById("contador-tempo");
    if (contadorTempo) contadorTempo.style.display = "none";
    clearInterval(intervaloContador);
}

function fecharPopupCodigo() {
    const el = document.getElementById("popupCodigo");
    if (el) el.style.display = "none";
}

function excluirAgendamento(botao) {
    Swal.fire({
        title: "Excluir Agendamento?",
        text: "Você tem certeza que deseja excluir este agendamento do painel?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#152C4A",
        cancelButtonColor: "#1E3A5F",
        confirmButtonText: "Sim, excluir!",
        cancelButtonText: "Cancelar"
    }).then((result) => {
        if (result.isConfirmed) {
            const item = botao.closest(".agendamento-item");
            const id = parseInt(item.getAttribute("data-id"));

            if (!id) {
                console.error("ID do agendamento não encontrado.");
                return;
            }

            let agendamentos = getLocalData("agendamentos", []);
            agendamentos = agendamentos.map(a => a.id === id ? { ...a, oculto: 1 } : a);
            setLocalData("agendamentos", agendamentos);
            carregarAgendamentos();
            Swal.fire("Excluído!", "O agendamento foi removido do painel.", "success");
        }
    });
}

function reenviarCodigo() {
    // Modo local: simular reenvio
    mostrarAlerta("Código reenviado (modo local)!", "sucesso");
}

function gerarRelatorioDia() {
    const dataSelecionada = document.getElementById("dataRelatorioDia").value;
    if (!dataSelecionada) {
        Swal.fire("Erro", "Por favor, selecione uma data.", "warning");
        return;
    }
    const dataFormatada = dataSelecionada.split("-").reverse().join("/");

    const agendamentos = getLocalData("agendamentos", []);
    const dados = agendamentos.filter(ag => ag.dia === dataFormatada && !ag.oculto);

    if (dados.length === 0) {
        Swal.fire("Sem registros", `Não há agendamentos em ${dataFormatada}.`, "info");
        return;
    }

    const dadosFormatados = dados.map(ag => ({
        Nome: ag.nome,
        Horário: ag.horario
    })).sort((a, b) => a.Horário.localeCompare(b.Horário));

    if (typeof XLSX !== 'undefined') {
        const worksheet = XLSX.utils.json_to_sheet(dadosFormatados);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Relatorio_Dia");
        XLSX.writeFile(workbook, `Relatorio_${dataFormatada.replace(/\//g, '-')}.xlsx`);
    } else {
        Swal.fire("Info", "Biblioteca XLSX não carregada. Dados: " + dados.length, "info");
    }
}

function ocultarAgendamento(id) {
    let agendamentos = getLocalData("agendamentos", []);
    agendamentos = agendamentos.map(a => a.id === id ? { ...a, oculto: 1 } : a);
    setLocalData("agendamentos", agendamentos);
    carregarAgendamentos();
}

function filtrarAgendamentosAtivos() {
    paginaAtualAgendamentos = 1;
    carregarAgendamentos();
}

function filtrarAgendamentosCancelados() {
    const termo = document.getElementById("pesquisaCancelados").value.toLowerCase();
    const agendamentos = document.querySelectorAll("#lista-cancelados .agendamento-item");

    agendamentos.forEach(item => {
        const nome = item.querySelector("p:nth-child(1)")?.innerText?.toLowerCase() || "";
        if (nome.includes(termo)) {
            item.style.display = "block";
        } else {
            item.style.display = "none";
        }
    });
}

function abrirEdicaoUsuario(id, dia, horario) {
    const inputData = document.getElementById("editarDataUsuario");
    const email = document.getElementById("consultaEmail").value.trim();

    document.getElementById("editarIdUsuario").value = id;
    document.getElementById("editarEmailUsuario").value = email;

    const partes = dia.split("/");
    const diaISO = `${partes[2]}-${partes[1]}-${partes[0]}`;

    inputData.value = "";

    document.getElementById("popupEdicaoUsuario").style.display = "flex";

    inputData.onchange = null;

    inputData.addEventListener("change", function () {
        const selectedDate = this.value;

        if (!selectedDate) return;

        const dataObj = new Date(selectedDate + "T00:00");
        const diaSemana = dataObj.getDay();

        const hoje = new Date();
        const hojeISO = hoje.toISOString().split("T")[0];

        if (diaSemana !== 3 && diaSemana !== 5) {
            Swal.fire(
                "Atenção!",
                "Só é permitido escolher quartas e sextas-feiras.",
                "warning"
            );
            this.value = "";
            return;
        }

        if (selectedDate === diaISO && hojeISO === diaISO) {
            Swal.fire(
                "Atenção!",
                "Não é permitido escolher a mesma data do agendamento no próprio dia.",
                "warning"
            );
            this.value = "";
            return;
        }

        atualizarHorariosDisponiveisEdicao(selectedDate);
    });
}

function confirmarEdicaoUsuario(id, dia, horario) {
    Swal.fire({
        title: "Confirmar Edição",
        text: "Você tem certeza que deseja editar este agendamento?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Sim, editar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#152C4A"
    }).then((result) => {
        if (result.isConfirmed) {
            abrirEdicaoUsuario(id, dia, horario);
        }
    });
}

async function atualizarHorariosDisponiveisEdicao(dataSelecionada) {
    const horariosFixos = [
        "09:00", "09:20", "09:40", "10:00", "10:20", "10:40",
        "11:00", "11:20", "11:40", "12:00", "13:20",
        "13:40", "14:00", "14:20", "14:40", "15:00", "15:20",
        "15:40", "16:00", "16:20"
    ];

    const agendamentos = getLocalData("agendamentos", []);

    const horariosOcupados = agendamentos
        .filter(a => a.dia === formatarDataParaBR(dataSelecionada) && a.cancelado == 0 && !a.oculto)
        .map(a => a.horario);

    const selectHorario = document.getElementById("editarHorarioUsuario");
    if (!selectHorario) return;
    selectHorario.innerHTML = '<option value="">Selecione um horário</option>';

    horariosFixos.forEach(horario => {
        if (!horariosOcupados.includes(horario)) {
            const option = document.createElement("option");
            option.value = horario;
            option.textContent = horario;
            selectHorario.appendChild(option);
        }
    });
}

function formatarDataParaBR(dataISO) {
    const partes = dataISO.split("-");
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function fecharEdicaoUsuario() {
    document.getElementById("popupEdicaoUsuario").style.display = "none";
}

function salvarEdicaoUsuario() {
    const id = parseInt(document.getElementById("editarIdUsuario").value);
    const diaISO = document.getElementById("editarDataUsuario").value;
    const horario = document.getElementById("editarHorarioUsuario").value;
    const email = document.getElementById("editarEmailUsuario").value.trim();

    if (!id || !diaISO || !horario || !email) {
        Swal.fire("Erro!", "Dados incompletos. Por favor, preencha todos os campos.", "error");
        return;
    }

    const partes = diaISO.split("-");
    const diaBR = `${partes[2]}/${partes[1]}/${partes[0]}`;

    let agendamentos = getLocalData("agendamentos", []);
    agendamentos = agendamentos.map(a => a.id === id ? { ...a, dia: diaBR, horario, email } : a);
    setLocalData("agendamentos", agendamentos);

    Swal.fire("Sucesso!", "Agendamento atualizado!", "success");
    fecharEdicaoUsuario();
}

function filtrarAgendamentosPorData() {
    const dataSelecionada = document.getElementById("filtroDataAdmin").value;

    if (!dataSelecionada) {
        Swal.fire("Aviso", "Selecione uma data para filtrar.", "warning");
        return;
    }

    const dataFormatada = formatarDataParaBR(dataSelecionada);
    const agendamentos = getLocalData("agendamentos", []).filter(a => !a.oculto);
    const filtrados = agendamentos.filter(ag => ag.dia === dataFormatada);

    const resultadoDiv = document.getElementById("resultadoAgendamentosFiltrados");
    resultadoDiv.innerHTML = "";

    if (filtrados.length === 0) {
        resultadoDiv.innerHTML = `<p style="color: red;">Nenhum agendamento encontrado para ${dataFormatada}.</p>`;
    } else {
        filtrados
            .sort((a, b) => a.horario.localeCompare(b.horario))
            .forEach(ag => {
                const item = document.createElement("div");
                item.classList.add("agendamento-box");
                item.innerHTML = `
                    <p><strong>Nome:</strong> ${ag.nome}</p>
                    <p><strong>Email:</strong> ${ag.email}</p>
                    <p><strong>Horário:</strong> ${ag.horario}</p>
                    <div class="botoes-filtrados">
                        <button onclick="confirmarEdicao(${ag.id}, '${ag.nome}', '${ag.email}', '${ag.dia}', '${ag.horario}')">Editar</button>
                        <button onclick="confirmarCancelamentoFiltrado(${ag.id})">Cancelar</button>
                        <button onclick="confirmarExclusaoFiltrado(${ag.id})">Excluir</button>
                    </div>
                `;
                resultadoDiv.appendChild(item);
            });
    }

    document.getElementById("popupAgendamentosFiltrados").style.display = "flex";
}

function fecharPopupAgendamentosFiltrados() {
    document.getElementById("popupAgendamentosFiltrados").style.display = "none";
}

function confirmarEdicao(id, nome, email, dia, horario) {
    Swal.fire({
        title: "Confirmar Edição",
        text: "Você tem certeza que deseja editar este agendamento?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Sim, editar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#152C4A"
    }).then((result) => {
        if (result.isConfirmed) {
            abrirEdicao(id, nome, email, dia, horario);
        }
    });
}

function confirmarCancelamentoFiltrado(id) {
    Swal.fire({
        title: "Confirmar Cancelamento",
        text: "Tem certeza que deseja cancelar este agendamento?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sim, cancelar",
        cancelButtonText: "Não",
        confirmButtonColor: "#152C4A"
    }).then((result) => {
        if (result.isConfirmed) {
            cancelarAgendamento(id);
        }
    });
}

function confirmarExclusaoFiltrado(id) {
    Swal.fire({
        title: "Excluir Agendamento",
        text: "Tem certeza que deseja excluir este agendamento do painel?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sim, excluir",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#152C4A"
    }).then((result) => {
        if (result.isConfirmed) {
            let agendamentos = getLocalData("agendamentos", []);
            agendamentos = agendamentos.map(a => a.id === id ? { ...a, oculto: 1 } : a);
            setLocalData("agendamentos", agendamentos);
            Swal.fire("Excluído!", "O agendamento foi removido do painel.", "success");
            filtrarAgendamentosPorData();
            carregarAgendamentos();
        }
    });
}

document.addEventListener("DOMContentLoaded", function () {
    const mensagensMotivacionais = [
        "💡 Acredite no seu potencial!",
        "🚀 Você é capaz de ir além!",
        "🌟 Cada passo é uma conquista!",
        "🔥 Não desista, o sucesso está logo ali!",
        "🎯 Foque no seu objetivo e vá!",
        "💪 Cada dia é uma nova chance!",
        "🧠 Mente firme, coração tranquilo!",
        "🏁 A jornada é tão importante quanto o destino!",
        "⚡ Sua atitude define sua altitude!"
    ];

    const hoje = new Date();
    const indice = hoje.getDate() % mensagensMotivacionais.length;
    const mensagemDoDia = mensagensMotivacionais[indice];

    const spanPopup = document.querySelector("#popupMotivacional span");
    if (spanPopup) {
        spanPopup.textContent = mensagemDoDia;
    }
});

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".horario-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            btn.classList.toggle("selecionado");
        });
    });
});

const horariosDisponiveis = [
    "09:00", "09:20", "09:40", "10:00", "10:20", "10:40",
    "11:00", "11:20", "11:40", "12:00", "13:20",
    "13:40", "14:00", "14:20", "14:40", "15:00", "15:20",
    "15:40", "16:00", "16:20"
];


let horariosSelecionados = [];

function abrirPopupHorarios() {
    const popup = document.getElementById("popupHorarios");
    const container = document.getElementById("botoesHorariosPopup");
    const horarios = [
        "09:00", "09:20", "09:40", "10:00", "10:20", "10:40",
        "11:00", "11:20", "11:40", "12:00", "13:20",
        "13:40", "14:00", "14:20", "14:40", "15:00", "15:20",
        "15:40", "16:00", "16:20"
    ];

    container.innerHTML = "";

    horarios.forEach(horario => {
        const btn = document.createElement("button");
        btn.classList.add("horario-btn");
        btn.textContent = horario;

        btn.addEventListener("click", () => {
            btn.classList.toggle("selecionado");
            atualizarQuantidadeSelecionada();
        });

        container.appendChild(btn);
    });

    popup.style.display = "flex";
    atualizarQuantidadeSelecionada();
}

function fecharPopupHorarios() {
    document.getElementById("popupHorarios").style.display = "none";
}

function atualizarQuantidadeSelecionada() {
    const selecionados = document.querySelectorAll(".horario-btn.selecionado").length;
    document.getElementById("quantidadeSelecionada").textContent = `${selecionados} horário(s) selecionado(s)`;
}

function confirmarBloqueioHorarios() {
    Swal.fire({
        title: 'Confirmar Bloqueio',
        text: 'Você tem certeza que deseja bloquear os horários selecionados?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#152C4A',
        cancelButtonColor: '#1E3A5F',
        confirmButtonText: 'Sim, bloquear',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            bloquearHorario();
        }
    });
}

function bloquearHorario() {
    const data = document.getElementById("dataBloqueio").value;
    const horariosSel = Array.from(document.querySelectorAll(".horario-btn.selecionado"))
        .map(btn => btn.textContent);

    if (!data) {
        mostrarAlerta("Selecione uma data para bloquear.", "erro");
        return;
    }

    if (horariosSel.length === 0) {
        mostrarAlerta("Selecione ao menos um horário para bloquear.", "erro");
        return;
    }

    let bloqueios = getLocalData("bloqueiosHorario", {});
    if (!bloqueios[data]) bloqueios[data] = [];
    horariosSel.forEach(h => {
        if (!bloqueios[data].includes(h)) bloqueios[data].push(h);
    });
    setLocalData("bloqueiosHorario", bloqueios);

    mostrarAlerta("Horários bloqueados com sucesso!", "sucesso");
    fecharPopupHorarios();
}

function carregarHorariosBloqueados() {
    const data = document.getElementById("dataDesbloqueio").value;
    if (!data) {
        mostrarAlerta("Selecione uma data para buscar bloqueios.", "erro");
        return;
    }

    const bloqueios = getLocalData("bloqueiosHorario", {});
    const horarios = bloqueios[data] || [];
    const lista = document.getElementById("horariosBloqueadosLista");
    lista.innerHTML = "";

    if (horarios.length === 0) {
        lista.innerHTML = "<p>Nenhum horário bloqueado nesta data.</p>";
        return;
    }

    horarios.forEach(horario => {
        const div = document.createElement("div");
        div.innerHTML = `
            <span>${horario}</span>
            <button onclick="desbloquearHorario('${data}', '${horario}')">Desbloquear</button>
        `;
        lista.appendChild(div);
    });
}

function desbloquearHorario(data, horario) {
    let bloqueios = getLocalData("bloqueiosHorario", {});
    if (bloqueios[data]) {
        bloqueios[data] = bloqueios[data].filter(h => h !== horario);
        if (bloqueios[data].length === 0) delete bloqueios[data];
    }
    setLocalData("bloqueiosHorario", bloqueios);
    mostrarAlerta("Horário desbloqueado com sucesso!", "sucesso");
    carregarHorariosBloqueados();
}

function mostrarPainelPrincipal() {
    switchTab('dashboard');
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function mostrarUltimoAgendamento() {
    const agendamentos = getLocalData("agendamentos", [])
        .filter(a => !a.oculto && a.cancelado == 0)
        .sort((a, b) => b.id - a.id)
        .slice(0, 5);

    if (!agendamentos || agendamentos.length === 0) {
        Swal.fire("Últimos Agendamentos", "Nenhum agendamento encontrado.", "info");
        return;
    }

    const html = agendamentos.map((a, i) => `
        <div style="margin-bottom: 12px; text-align: left;">
            <strong>#${i + 1}</strong><br>
            <strong>Nome:</strong> ${a.nome}<br>
            <strong>Email:</strong> ${a.email}<br>
            <strong>Data:</strong> ${a.dia}<br>
            <strong>Horário:</strong> ${a.horario}
        </div>
        <hr>
    `).join("");

    Swal.fire({
        title: "Últimos Agendamentos",
        html: html,
        icon: "info",
        confirmButtonText: "Fechar",
        width: 600
    });
}

function mostrarUltimasEdicoes() {
    const edicoes = getLocalData("historicoEdicoes", []).slice(0, 10);

    if (!edicoes || edicoes.length === 0) {
        Swal.fire("Últimas Edições", "Nenhuma edição encontrada.", "info");
        return;
    }

    const html = edicoes.map((e, i) => {
        const msg = `<strong>#${i + 1}</strong><br>
            <strong>${e.usuario}</strong> fez uma edição no dia <strong>${e.data_edicao}</strong> às <strong>${e.horario_edicao}</strong>.`;

        const infoHorario = e.novo_horario ? ` o horário da massagem para <strong>${e.novo_horario}</strong>` : "";
        const infoDia = e.novo_dia ? ` e o dia para <strong>${e.novo_dia}</strong>` : "";

        return `
            <div style="margin-bottom: 12px; text-align: left;">
                ${msg} Ele editou${infoHorario}${infoDia}.
            </div>
            <hr>
        `;
    }).join("");

    Swal.fire({
        title: "Últimas Edições",
        html: html,
        icon: "info",
        confirmButtonText: "Fechar",
        width: 600
    });
}

function carregarNoticiaLiberacao() {
    const dados = getLocalData("noticiaLiberacao", null);
    const noticiaDiv = document.getElementById("noticiaLiberacao");

    if (!noticiaDiv) return;

    if (dados && dados.data && dados.horario) {
        const msg = `O próximo mês será liberado dia <strong>${dados.data}</strong> às <strong>${dados.horario}</strong>.`;
        noticiaDiv.innerHTML = msg;
    } else {
        noticiaDiv.innerHTML = "";
    }
}


function salvarNoticiaLiberacao() {
    const data = document.getElementById("dataLiberacao").value;
    const horario = document.getElementById("horarioLiberacao").value;

    if (!data || !horario) {
        Swal.fire({
            icon: 'warning',
            title: 'Campos obrigatórios!',
            text: 'Preencha a data e o horário.',
            confirmButtonText: 'OK'
        });
        return;
    }

    setLocalData("noticiaLiberacao", { data, horario });

    Swal.fire({
        icon: 'success',
        title: 'Notícia salva com sucesso!',
        showConfirmButton: true,
        confirmButtonText: 'OK'
    });
}

function removerNoticiaLiberacao() {
    setLocalData("noticiaLiberacao", null);
    Swal.fire("Removido!", "A notícia foi removida com sucesso.", "success")
        .then(() => {
            localStorage.setItem("noticiaRemovida", Date.now());
            carregarNoticiaLiberacao();
        });
}

document.addEventListener('DOMContentLoaded', () => {
    function showDailyCollaborationAlert() {
        const lastShownDate = localStorage.getItem('lastCollaborationAlertShownDate');
        const today = new Date().toDateString();

        if (lastShownDate !== today) {
            Swal.fire({
                title: 'Atenção',
                html: `
          <p>Prezado colaborador, por favor recarregue a página usando <b>Ctrl + Shift + R</b>.</p>
          <p style="font-size: 0.9em; color: #152C4A;">
            Este comando força a página a buscar a versão mais recente diretamente do servidor,
            garantindo que você visualize as últimas atualizações e recursos.
          </p>
        `,
                icon: 'info',
                confirmButtonText: 'Entendi',
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpen: () => {
                    const confirmButton = Swal.getConfirmButton();
                    if (confirmButton) {
                        confirmButton.focus();
                    }
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    localStorage.setItem('lastCollaborationAlertShownDate', today);
                }
            });
        }
    }

    showDailyCollaborationAlert();
});

document.addEventListener("DOMContentLoaded", () => {
    const emailInput = document.getElementById("consultaEmail");
    const btnConsultar = document.getElementById("btnConsultar");

    if (emailInput && btnConsultar) {
        emailInput.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                btnConsultar.click();
            }
        });
    }
});

console.log("Funções disponíveis:", {
    exportarRelatorioExcel: typeof exportarRelatorioExcel,
    gerarRelatorioDia: typeof gerarRelatorioDia
});

let diaSelecionadoAdminDias = null;
let diaSelecionadoAdminHorarios = null;
let horarioSelecionadoAcao = null;

async function acaoDiaLib() {
    if (!diaSelecionadoAdminDias) { Swal.fire("Atenção", "Nenhum dia selecionado.", "warning"); return; }
    
    const confirm = await Swal.fire({
        title: 'Confirmar Liberação',
        text: `Deseja realmente liberar o dia ${diaSelecionadoAdminDias}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sim, liberar!',
        cancelButtonText: 'Cancelar'
    });
    if (!confirm.isConfirmed) return;

    let diasExtras = getLocalData("diasExtras", []);
    if (diasExtras.includes(diaSelecionadoAdminDias)) {
        Swal.fire({ icon: "info", title: "Info", text: "Este dia já está liberado." });
        return;
    }
    diasExtras.push(diaSelecionadoAdminDias);
    setLocalData("diasExtras", diasExtras);
    Swal.fire({ icon: "success", title: "Dia liberado!", text: `Dia ${diaSelecionadoAdminDias} foi liberado com sucesso.` });
    document.getElementById('acoes-dias-admin').style.display = 'none';
    carregarCalendarioAdminDias();
    carregarCalendarioAdminHorarios();
}

async function acaoDiaRemLib() {
    if (!diaSelecionadoAdminDias) { Swal.fire("Atenção", "Nenhum dia selecionado.", "warning"); return; }
    
    const confirm = await Swal.fire({
        title: 'Remover Liberação?',
        text: `Deseja realmente remover a liberação do dia ${diaSelecionadoAdminDias}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ffc107',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sim, remover',
        cancelButtonText: 'Cancelar'
    });
    if (!confirm.isConfirmed) return;

    let diasExtras = getLocalData("diasExtras", []);
    if (!diasExtras.includes(diaSelecionadoAdminDias)) {
        Swal.fire({ icon: "info", title: "Info", text: "Este dia não está na lista de dias extras." });
        return;
    }
    diasExtras = diasExtras.filter(d => d !== diaSelecionadoAdminDias);
    setLocalData("diasExtras", diasExtras);
    Swal.fire({ icon: "success", title: "Dia removido!", text: `A liberação do dia ${diaSelecionadoAdminDias} foi removida.` });
    document.getElementById('acoes-dias-admin').style.display = 'none';
    carregarCalendarioAdminDias();
    carregarCalendarioAdminHorarios();
}

async function acaoDiaBloq() {
    if (!diaSelecionadoAdminDias) { Swal.fire("Atenção", "Nenhum dia selecionado.", "warning"); return; }
    
    const confirm = await Swal.fire({
        title: 'Bloquear Dia?',
        text: `Deseja bloquear inteiramente o dia ${diaSelecionadoAdminDias}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sim, bloquear',
        cancelButtonText: 'Cancelar'
    });
    if (!confirm.isConfirmed) return;

    let diasBloqueados = getLocalData("diasBloqueados", []);
    if (diasBloqueados.includes(diaSelecionadoAdminDias)) {
        Swal.fire({ icon: "info", title: "Info", text: "Este dia já está bloqueado." });
        return;
    }
    diasBloqueados.push(diaSelecionadoAdminDias);
    setLocalData("diasBloqueados", diasBloqueados);
    Swal.fire({ icon: "success", title: "Dia bloqueado!", text: `Dia ${diaSelecionadoAdminDias} bloqueado.` });
    document.getElementById('acoes-dias-admin').style.display = 'none';
    carregarCalendarioAdminDias();
    carregarCalendarioAdminHorarios();
}

async function acaoDiaDesbloq() {
    if (!diaSelecionadoAdminDias) { Swal.fire("Atenção", "Nenhum dia selecionado.", "warning"); return; }
    
    const confirm = await Swal.fire({
        title: 'Desbloquear Dia?',
        text: `Deseja desbloquear o dia ${diaSelecionadoAdminDias}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#17a2b8',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sim, desbloquear',
        cancelButtonText: 'Cancelar'
    });
    if (!confirm.isConfirmed) return;

    let diasBloqueados = getLocalData("diasBloqueados", []);
    if (!diasBloqueados.includes(diaSelecionadoAdminDias)) {
        Swal.fire({ icon: "info", title: "Info", text: "Este dia não está bloqueado." });
        return;
    }
    diasBloqueados = diasBloqueados.filter(d => d !== diaSelecionadoAdminDias);
    setLocalData("diasBloqueados", diasBloqueados);
    Swal.fire({ icon: "success", title: "Dia desbloqueado!", text: `Dia ${diaSelecionadoAdminDias} desbloqueado.` });
    document.getElementById('acoes-dias-admin').style.display = 'none';
    carregarCalendarioAdminDias();
    carregarCalendarioAdminHorarios();
}

function carregarCalendarioAdmin(idContainer, tituloElementId, apenasAtivos, callbackClique) {
    const calendario = document.getElementById(idContainer);
    const mesAtual = document.getElementById(tituloElementId);
    if(!calendario || !mesAtual) return;

    let dadosMes = getLocalData("mesLiberado", null);
    let mesLiberado, anoLiberado;
    if (dadosMes) {
        mesLiberado = dadosMes.mes - 1;
        anoLiberado = dadosMes.ano;
    } else {
        let dataAtual = new Date();
        mesLiberado = dataAtual.getMonth();
        anoLiberado = dataAtual.getFullYear();
    }

    const meses = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    mesAtual.innerText = `${meses[mesLiberado]} ${anoLiberado}`;
    calendario.innerHTML = "";

    let feriadosSet = new Set([
        "01/01/2026", "20/02/2026", "21/02/2026", "03/04/2026", "21/04/2026",
        "01/05/2026", "04/06/2026", "07/09/2026", "12/10/2026", "02/11/2026",
        "15/11/2026", "25/12/2026"
    ]);

    let diasExtrasSet = new Set(getLocalData("diasExtras", []));
    let diasBloqueadosSet = new Set(getLocalData("diasBloqueados", []));

    let primeiroDia = new Date(anoLiberado, mesLiberado, 1).getDay();
    let totalDias = new Date(anoLiberado, mesLiberado + 1, 0).getDate();

    for (let i = 0; i < primeiroDia; i++) {
        calendario.appendChild(document.createElement("div"));
    }

    const hoje = new Date();

    for (let dia = 1; dia <= totalDias; dia++) {
        let data = new Date(anoLiberado, mesLiberado, dia);
        let diaSemana = data.getDay();
        let dataFormatada = `${String(dia).padStart(2, '0')}/${String(mesLiberado + 1).padStart(2, '0')}/${anoLiberado}`;

        let diaElemento = document.createElement("div");
        diaElemento.textContent = dia;

        const isFeriado = feriadosSet.has(dataFormatada);

        if (
            data.getFullYear() === hoje.getFullYear() &&
            data.getMonth() === hoje.getMonth() &&
            dia === hoje.getDate()
        ) {
            diaElemento.classList.add("hoje");
        } else if (isFeriado) {
            diaElemento.classList.add("feriado");
        }
        
        let podeClicar = false;
        let isPassadoOuHoje = data <= new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
        
        if (isPassadoOuHoje) {
            diaElemento.classList.add("desativado");
        } else if (!diasBloqueadosSet.has(dataFormatada) && ((diaSemana === 3 || diaSemana === 5) || diasExtrasSet.has(dataFormatada))) {
            diaElemento.classList.add("ativo");
            podeClicar = true;
        } else if (!apenasAtivos) {
            diaElemento.style.cursor = 'pointer';
            podeClicar = true;
        } else {
            diaElemento.classList.add("desativado");
        }

        if(podeClicar) {
            diaElemento.onclick = function () {
                document.querySelectorAll(`#${idContainer} div`).forEach(el => el.classList.remove("selecionado"));
                diaElemento.classList.add("selecionado");
                callbackClique(dataFormatada);
            };
        }

        calendario.appendChild(diaElemento);
    }
}

function carregarCalendarioAdminHorarios() {
    carregarCalendarioAdmin("calendario-admin-horarios", "mes-atual-admin-horarios", true, (dataFormatada) => {
        diaSelecionadoAdminHorarios = dataFormatada;
        atualizarHorariosAdmin(dataFormatada);
    });
}

function carregarCalendarioAdminDias() {
    carregarCalendarioAdmin("calendario-admin-dias", "mes-atual-admin-dias", false, (dataFormatada) => {
        diaSelecionadoAdminDias = dataFormatada;
        const textoAcaoDias = document.getElementById("textoAcaoDias");
        if(textoAcaoDias) textoAcaoDias.innerText = `Gerenciando dia: ${dataFormatada}`;
        document.getElementById('acoes-dias-admin').style.display = 'block';
    });
}

function formatarDataISO(dataBR) {
    const partes = dataBR.split("/");
    return `${partes[2]}-${partes[1]}-${partes[0]}`;
}

let horariosSelecionadosAdmin = [];

async function atualizarHorariosAdmin(diaSelecionado) {
    const grade = document.getElementById("grade-horarios-admin");
    if (!grade) return;
    grade.innerHTML = "";
    horariosSelecionadosAdmin = []; // resetar seleção
    const divAcoesHorarios = document.getElementById("acoes-horarios-container");
    if(divAcoesHorarios) divAcoesHorarios.style.display = "block";
    
    let diasBloqueados = getLocalData("diasBloqueados", []);
    if(diasBloqueados.includes(diaSelecionado)) {
        grade.innerHTML = "<p style='color:red;'>Este dia está bloqueado por inteiro.</p>";
        return;
    }

    const horariosFixos = [
        "09:00", "09:20", "09:40", "10:00", "10:20", "10:40",
        "11:00", "11:20", "11:40", "12:00", "13:20",
        "13:40", "14:00", "14:20", "14:40", "15:00", "15:20",
        "15:40", "16:00", "16:20"
    ];

    const bloqueios = getLocalData("bloqueiosHorario", {});
    const dataFormatoISO = formatarDataISO(diaSelecionado);
    let horariosBloqueados = bloqueios[dataFormatoISO] || [];

    const agendamentos = getLocalData("agendamentos", []);
    const horariosOcupados = agendamentos
        .filter(a => a.dia === diaSelecionado && a.cancelado == 0 && !a.oculto)
        .map(a => a.horario);

    horariosFixos.forEach(horario => {
        const btn = document.createElement("button");
        btn.textContent = horario;
        btn.classList.add("botao-horario");
        
        let isOcupado = horariosOcupados.includes(horario);
        let isBloqueado = horariosBloqueados.includes(horario);

        if (isOcupado && !isBloqueado) {
            btn.classList.add("ocupado");
            btn.title = "Horário ocupado por agendamento";
        } else if (isBloqueado) {
            btn.classList.add("bloqueado");
            btn.title = "Horário bloqueado";
            btn.style.backgroundColor = "gray";
            btn.style.color = "white";
        }

        btn.addEventListener("click", function () {
            if (horariosSelecionadosAdmin.includes(horario)) {
                horariosSelecionadosAdmin = horariosSelecionadosAdmin.filter(h => h !== horario);
                btn.classList.remove("selecionado-multiplo");
            } else {
               horariosSelecionadosAdmin.push(horario);
               btn.classList.add("selecionado-multiplo");
            }
            if (horariosSelecionadosAdmin.length > 0) {
                if(divAcoesHorarios) {
                    divAcoesHorarios.style.display = "block";
                }
            }
        });
        grade.appendChild(btn);
    });

    const todosBloqueados = horariosFixos.every(h => horariosBloqueados.includes(h));
    const btnTodos = document.getElementById("btn-bloquear-todos-horarios");
    if(btnTodos) {
        if(todosBloqueados) {
            btnTodos.innerText = "Desbloquear Todos os Horários";
            btnTodos.style.backgroundColor = "#28a745"; // Verde
            btnTodos.onclick = desbloquearTodosHorariosDia;
        } else {
            btnTodos.innerText = "Bloquear Todos os Horários (Bloquear Tudo)";
            btnTodos.style.backgroundColor = "#8b0000"; // Vermelho escuro
            btnTodos.onclick = bloquearTodosHorariosDia;
        }
    }
}

async function bloquearHorariosSelecionados() {
    if (horariosSelecionadosAdmin.length === 0) return;
    
    const confirm = await Swal.fire({
        title: 'Bloquear Horários',
        text: `Tem certeza que deseja bloquear os ${horariosSelecionadosAdmin.length} horários selecionados no dia ${diaSelecionadoAdminHorarios}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sim, bloquear'
    });
    if (!confirm.isConfirmed) return;

    let bloq = getLocalData("bloqueiosHorario", {});
    let formISO = formatarDataISO(diaSelecionadoAdminHorarios);
    if(!bloq[formISO]) bloq[formISO] = [];
    
    horariosSelecionadosAdmin.forEach(horario => {
        if(!bloq[formISO].includes(horario)) {
            bloq[formISO].push(horario);
        }
    });
    setLocalData("bloqueiosHorario", bloq);
    Swal.fire("Sucesso", "Horários selecionados foram bloqueados.", "success");
    atualizarHorariosAdmin(diaSelecionadoAdminHorarios);
}

async function desbloquearHorariosSelecionados() {
    if (horariosSelecionadosAdmin.length === 0) return;

    const confirm = await Swal.fire({
        title: 'Desbloquear Horários',
        text: `Tem certeza que deseja desbloquear os ${horariosSelecionadosAdmin.length} horários selecionados no dia ${diaSelecionadoAdminHorarios}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sim, desbloquear'
    });
    if (!confirm.isConfirmed) return;

    let bloq = getLocalData("bloqueiosHorario", {});
    let formISO = formatarDataISO(diaSelecionadoAdminHorarios);
    if(bloq[formISO]) {
        bloq[formISO] = bloq[formISO].filter(h => !horariosSelecionadosAdmin.includes(h));
        if(bloq[formISO].length === 0) delete bloq[formISO];
        setLocalData("bloqueiosHorario", bloq);
    }
    Swal.fire("Sucesso", "Horários selecionados foram desbloqueados.", "success");
    atualizarHorariosAdmin(diaSelecionadoAdminHorarios);
}

async function bloquearTodosHorariosDia() {
    const confirm = await Swal.fire({
        title: 'Bloquear TODOS',
        text: `Você irá bloquear TODOS os horários do dia ${diaSelecionadoAdminHorarios}. Continuar?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#8b0000',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sim, bloquear todos'
    });
    if (!confirm.isConfirmed) return;

    let bloq = getLocalData("bloqueiosHorario", {});
    let formISO = formatarDataISO(diaSelecionadoAdminHorarios);
    if(!bloq[formISO]) bloq[formISO] = [];
    
    const horariosFixos = [
        "09:00", "09:20", "09:40", "10:00", "10:20", "10:40",
        "11:00", "11:20", "11:40", "12:00", "13:20",
        "13:40", "14:00", "14:20", "14:40", "15:00", "15:20",
        "15:40", "16:00", "16:20"
    ];

    horariosFixos.forEach(horario => {
        if(!bloq[formISO].includes(horario)) {
            bloq[formISO].push(horario);
        }
    });
    setLocalData("bloqueiosHorario", bloq);
    Swal.fire("Sucesso", "Todos os horários do dia foram bloqueados.", "success");
    atualizarHorariosAdmin(diaSelecionadoAdminHorarios);
}

async function desbloquearTodosHorariosDia() {
    const confirm = await Swal.fire({
        title: 'Desbloquear TODOS',
        text: `Você irá liberar TODOS os horários que estavam bloqueados no dia ${diaSelecionadoAdminHorarios}. Continuar?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sim, desbloquear todos'
    });
    if (!confirm.isConfirmed) return;

    let bloq = getLocalData("bloqueiosHorario", {});
    let formISO = formatarDataISO(diaSelecionadoAdminHorarios);
    
    if(bloq[formISO]) {
        delete bloq[formISO];
        setLocalData("bloqueiosHorario", bloq);
    }
    
    Swal.fire("Sucesso", "Todos os horários do dia foram desbloqueados.", "success");
    atualizarHorariosAdmin(diaSelecionadoAdminHorarios);
}

document.addEventListener("DOMContentLoaded", () => {
    // Inicializa calendários do administrador caso a tela seja a de admin
    if (window.location.pathname.includes('administrador') || document.querySelector('.admin-sidebar')) {
        setTimeout(() => {
            carregarCalendarioAdminHorarios();
            carregarCalendarioAdminDias();
        }, 500);
        
        // Reconectar o evento de tab para recarregar calendários se for clicada a tab correspondente
        const btnTabHorarios = document.getElementById("btn-tab-gerenciar-horarios");
        const btnTabDias = document.getElementById("btn-tab-gerenciar-dias");
        if(btnTabHorarios) {
            btnTabHorarios.addEventListener("click", () => {
                carregarCalendarioAdminHorarios();
            });
        }
        if(btnTabDias) {
            btnTabDias.addEventListener("click", () => {
                carregarCalendarioAdminDias();
            });
        }
    }
});