(function () {
    "use strict";

    const TIMES = ["09:00", "09:20", "09:40", "10:00", "10:20", "10:40", "11:00", "11:20", "11:40", "12:00", "13:20", "13:40", "14:00", "14:20", "14:40", "15:00", "15:20", "15:40", "16:00", "16:20"];
    const MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
    const HOLIDAYS = new Set(["01/01/2026", "20/02/2026", "21/02/2026", "03/04/2026", "21/04/2026", "01/05/2026", "04/06/2026", "07/09/2026", "12/10/2026", "02/11/2026", "15/11/2026", "25/12/2026"]);
    const BLOCKED_USERS = new Set(["thiago.alves"]);
    const DEFAULT_ADMIN_EMAILS = ["agendamento.massagem@zenithcorp.com.br", "jhonata.araujo@zenithcorp.com.br"];
    const state = { date: null, time: null, viewDate: null, editingId: null };

    const getData = (key, fallback) => {
        try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
        catch { return fallback; }
    };
    const setData = (key, value) => localStorage.setItem(key, JSON.stringify(value));
    const pad = value => String(value).padStart(2, "0");
    const toBR = date => `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
    const toISO = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    const parseBR = value => { const [d, m, y] = value.split("/").map(Number); return new Date(y, m - 1, d); };
    const titleDate = value => parseBR(value).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });

    function getAdminEmails() {
        const configured = getData("emailsAdministrativos", null);
        return new Set(Array.isArray(configured) ? configured.map(email => email.toLowerCase()) : DEFAULT_ADMIN_EMAILS);
    }

    function getBlockedEmails() {
        const configured = getData("emailsBloqueados", []);
        return new Set(Array.isArray(configured) ? configured.map(email => String(email).toLowerCase()) : []);
    }

    function releasedMonth() {
        const configured = getData("mesLiberado", null);
        const today = new Date();
        return configured && configured.mes && configured.ano
            ? new Date(Number(configured.ano), Number(configured.mes) - 1, 1)
            : new Date(today.getFullYear(), today.getMonth(), 1);
    }

    function isBookable(date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const extras = new Set(getData("diasExtras", []));
        const blocked = new Set(getData("diasBloqueados", []));
        const br = toBR(date);
        return date > today && !HOLIDAYS.has(br) && !blocked.has(br) && (date.getDay() === 3 || date.getDay() === 5 || extras.has(br));
    }

    function renderCalendar() {
        const grid = document.getElementById("calendar-grid");
        const title = document.getElementById("calendar-title");
        const released = releasedMonth();
        if (!state.viewDate) state.viewDate = new Date(released);
        title.textContent = `${MONTHS[state.viewDate.getMonth()]} de ${state.viewDate.getFullYear()}`;
        grid.innerHTML = "";

        const first = new Date(state.viewDate.getFullYear(), state.viewDate.getMonth(), 1);
        const total = new Date(state.viewDate.getFullYear(), state.viewDate.getMonth() + 1, 0).getDate();
        for (let i = 0; i < first.getDay(); i++) grid.appendChild(document.createElement("span"));

        for (let day = 1; day <= total; day++) {
            const date = new Date(first.getFullYear(), first.getMonth(), day);
            const button = document.createElement("button");
            button.type = "button";
            button.className = "calendar-day";
            button.textContent = day;
            button.setAttribute("role", "gridcell");
            if (toBR(date) === toBR(new Date())) button.classList.add("today");
            if (isBookable(date)) {
                button.classList.add("available");
                button.setAttribute("aria-label", `Selecionar ${titleDate(toBR(date))}`);
                button.addEventListener("click", () => chooseDate(date));
            } else button.disabled = true;
            if (state.date === toBR(date)) button.classList.add("selected");
            grid.appendChild(button);
        }

        const isReleased = state.viewDate.getMonth() === released.getMonth() && state.viewDate.getFullYear() === released.getFullYear();
        document.getElementById("prev-month").disabled = isReleased;
        document.getElementById("next-month").disabled = true;
    }

    function chooseDate(date) {
        state.date = toBR(date);
        state.time = null;
        document.getElementById("selected-date-pill").textContent = titleDate(state.date);
        renderTimes();
        showStep(2);
    }

    function renderTimes() {
        const bookings = getData("agendamentos", []).filter(item => Number(item.id) !== Number(state.editingId));
        const occupied = new Set(bookings.filter(item => item.dia === state.date && Number(item.cancelado) === 0 && !item.oculto).map(item => item.horario));
        const [d, m, y] = state.date.split("/");
        const blocked = new Set(getData("bloqueiosHorario", {})[`${y}-${m}-${d}`] || []);
        const morning = document.getElementById("morning-times");
        const afternoon = document.getElementById("afternoon-times");
        morning.innerHTML = "";
        afternoon.innerHTML = "";

        TIMES.forEach(time => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "time-button";
            button.textContent = time;
            button.disabled = occupied.has(time) || blocked.has(time);
            if (!button.disabled) button.addEventListener("click", () => chooseTime(time));
            (Number(time.slice(0, 2)) < 13 ? morning : afternoon).appendChild(button);
        });
    }

    function chooseTime(time) {
        state.time = time;
        document.getElementById("summary-date").textContent = titleDate(state.date);
        document.getElementById("summary-time").textContent = `${time} — 20 minutos`;
        showStep(3);
    }

    function showStep(step) {
        document.querySelectorAll(".booking-step").forEach(el => el.classList.toggle("active", Number(el.dataset.step) === step));
        document.querySelectorAll("[data-step-indicator]").forEach(el => el.classList.toggle("active", Number(el.dataset.stepIndicator) <= Math.min(step, 3)));
        if (window.innerWidth < 800) document.querySelector(".booking-card").scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function validateBooking(name, email) {
        const normalizedName = name.trim().toLowerCase();
        const isAdmin = getAdminEmails().has(email);
        if (!/^[a-z]+\.[a-z]+$/i.test(normalizedName)) return "Digite o usuário no padrão nome.sobrenome, como jhonata.araujo.";
        if (!/^[\w.%+-]+@zenithcorp\.com\.br$/i.test(email)) return "Use seu e-mail corporativo @zenithcorp.com.br.";
        if (getBlockedEmails().has(email)) return "Este e-mail está bloqueado e não pode realizar agendamentos.";
        if (BLOCKED_USERS.has(normalizedName) && !isAdmin) return "Este usuário não está autorizado a realizar agendamentos.";
        if (!document.getElementById("booking-consent").checked) return "Confirme que leu as orientações da sessão.";
        if (!state.date || !state.time || !isBookable(parseBR(state.date))) return "A data ou o horário selecionado não está mais disponível.";

        const allBookings = getData("agendamentos", []);
        const otherBookings = allBookings.filter(item => Number(item.id) !== Number(state.editingId));
        const activeBookings = otherBookings.filter(item => !item.oculto && Number(item.cancelado) === 0);
        const conflictingName = otherBookings.find(item => item.email.toLowerCase() === email && item.nome.toLowerCase() !== normalizedName);
        const conflictingEmail = otherBookings.find(item => item.nome.toLowerCase() === normalizedName && item.email.toLowerCase() !== email);

        if (conflictingName && !isAdmin) return "Este e-mail já foi utilizado com outro usuário. Verifique seus dados.";
        if (conflictingEmail && !isAdmin) return "Este usuário já foi utilizado com outro e-mail. Verifique seus dados.";
        if (activeBookings.some(item => item.dia === state.date && item.horario === state.time)) return "Este horário acabou de ser reservado. Escolha outro horário.";

        const [, month, year] = state.date.split("/");
        const userMonth = activeBookings.filter(item => item.email.toLowerCase() === email && item.dia.split("/")[1] === month && item.dia.split("/")[2] === year);
        if (userMonth.length >= 2 && !isAdmin) return "Você já fez dois agendamentos neste mês.";

        const sameDay = userMonth.filter(item => item.dia === state.date);
        if (sameDay.length === 1 && !isAdmin) {
            const minutes = value => { const [hours, mins] = value.split(":").map(Number); return hours * 60 + mins; };
            if (Math.abs(minutes(sameDay[0].horario) - minutes(state.time)) !== 20) return "Sua segunda sessão no mesmo dia precisa ser em um horário consecutivo.";
        } else if (sameDay.length >= 2 && !isAdmin) {
            return "Você já possui duas sessões neste dia.";
        }
        return "";
    }

    function submitBooking(event) {
        event.preventDefault();
        const name = document.getElementById("booking-name").value.trim();
        const email = document.getElementById("booking-email").value.trim().toLowerCase();
        const error = validateBooking(name, email);
        document.getElementById("form-error").textContent = error;
        if (error) return;

        let bookings = getData("agendamentos", []);
        const wasEditing = state.editingId !== null;
        if (wasEditing) {
            bookings = bookings.map(item => Number(item.id) === Number(state.editingId) ? { ...item, nome: name.toLowerCase(), email, dia: state.date, horario: state.time } : item);
            const history = getData("historicoEdicoes", []);
            const now = new Date();
            history.unshift({ usuario: name.toLowerCase(), data_edicao: toBR(now), horario_edicao: `${pad(now.getHours())}:${pad(now.getMinutes())}`, novo_horario: state.time, novo_dia: state.date });
            setData("historicoEdicoes", history);
        } else {
            const nextId = bookings.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
            bookings.push({ id: nextId, nome: name.toLowerCase(), email, dia: state.date, horario: state.time, cancelado: 0, oculto: 0, criadoEm: new Date().toISOString() });
        }
        setData("agendamentos", bookings);
        document.getElementById("success-summary").innerHTML = `<strong>${titleDate(state.date)}</strong><br>${state.time} · 20 minutos<br>${email}`;
        document.querySelector(".success-step .eyebrow").lastChild.textContent = wasEditing ? " Reserva atualizada" : " Reserva confirmada";
        document.querySelector(".success-step h3").textContent = wasEditing ? "Seu agendamento foi atualizado." : "Seu momento está agendado.";
        state.editingId = null;
        showStep(4);
        showToast(wasEditing ? "Agendamento atualizado com sucesso." : "Agendamento confirmado com sucesso.");
    }

    function showToast(message) {
        const toast = document.getElementById("toast");
        toast.querySelector("span").textContent = message;
        toast.classList.add("show");
        clearTimeout(showToast.timer);
        showToast.timer = setTimeout(() => toast.classList.remove("show"), 3200);
    }

    function openBookings() {
        const dialog = document.getElementById("bookings-dialog");
        if (!dialog.open) dialog.showModal();
        setTimeout(() => document.getElementById("lookup-email").focus(), 100);
    }

    function lookupBookings(event) {
        event.preventDefault();
        const email = document.getElementById("lookup-email").value.trim().toLowerCase();
        const results = document.getElementById("bookings-results");
        const found = getData("agendamentos", []).filter(item => !item.oculto && item.email.toLowerCase() === email).sort((a, b) => parseBR(b.dia) - parseBR(a.dia));
        if (!found.length) {
            results.innerHTML = '<div class="empty-state"><i class="fa-regular fa-calendar-xmark"></i><br><br>Nenhum agendamento encontrado para este e-mail.</div>';
            return;
        }
        const today = new Date(); today.setHours(0, 0, 0, 0);
        results.innerHTML = found.map(item => {
            const isCancelled = Number(item.cancelado) === 1;
            const canEdit = !isCancelled && parseBR(item.dia) > today;
            return `<article class="booking-result ${isCancelled ? "cancelled" : ""}"><strong>${titleDate(item.dia)} · ${item.horario}</strong><span>${isCancelled ? "Cancelado" : "Confirmado · 20 minutos"}</span><div class="result-actions"><button type="button" data-receipt-booking="${item.id}">Comprovante</button>${canEdit ? `<button type="button" data-edit-booking="${item.id}">Editar</button><button type="button" class="danger" data-cancel-booking="${item.id}">Cancelar</button>` : ""}</div></article>`;
        }).join("");
    }

    function editBooking(id) {
        const booking = getData("agendamentos", []).find(item => Number(item.id) === Number(id));
        const today = new Date(); today.setHours(0, 0, 0, 0);
        if (!booking || Number(booking.cancelado) === 1 || parseBR(booking.dia) <= today) return showToast("Este agendamento não pode mais ser editado.");
        state.editingId = Number(id);
        state.date = null;
        state.time = null;
        state.viewDate = releasedMonth();
        document.getElementById("booking-name").value = booking.nome;
        document.getElementById("booking-email").value = booking.email;
        document.getElementById("booking-consent").checked = false;
        document.getElementById("booking-submit").querySelector("span").textContent = "Salvar alteração";
        document.getElementById("bookings-dialog").close();
        renderCalendar();
        showStep(1);
        document.getElementById("agendamento").scrollIntoView({ behavior: "smooth" });
        showToast("Escolha a nova data e o novo horário.");
    }

    function generateReceipt(id) {
        const booking = getData("agendamentos", []).find(item => Number(item.id) === Number(id));
        if (!booking) return showToast("Agendamento não encontrado.");
        if (!window.jspdf) return showToast("Não foi possível carregar o gerador de comprovantes.");
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.setFillColor(16, 42, 67); doc.rect(0, 0, 210, 35, "F");
        doc.setTextColor(255, 255, 255); doc.setFontSize(20); doc.text("Zenith Bem-Estar", 20, 22);
        doc.setTextColor(16, 42, 67); doc.setFontSize(17); doc.text("Comprovante de agendamento", 20, 55);
        doc.setDrawColor(201, 130, 75); doc.line(20, 62, 190, 62);
        doc.setTextColor(30, 45, 56); doc.setFontSize(11);
        doc.text(`Usuário: ${booking.nome}`, 20, 80); doc.text(`E-mail: ${booking.email}`, 20, 92);
        doc.text(`Data: ${booking.dia}`, 20, 104); doc.text(`Horário: ${booking.horario}`, 20, 116);
        doc.text(`Status: ${Number(booking.cancelado) ? "Cancelado" : "Confirmado"}`, 20, 128);
        doc.setFontSize(9); doc.setTextColor(100, 110, 118); doc.text("Zenith Corp. © 2026", 20, 280);
        doc.save(`Comprovante_${booking.email.replace(/[@.]/g, "_")}.pdf`);
    }

    function cancelBooking(id) {
        if (!window.confirm("Deseja cancelar este agendamento?")) return;
        const bookings = getData("agendamentos", []).map(item => Number(item.id) === Number(id) ? { ...item, cancelado: 1 } : item);
        setData("agendamentos", bookings);
        document.getElementById("lookup-form").requestSubmit();
        showToast("Agendamento cancelado.");
    }

    document.addEventListener("DOMContentLoaded", () => {
        state.viewDate = releasedMonth();
        renderCalendar();
        document.getElementById("booking-form").addEventListener("submit", submitBooking);
        document.getElementById("lookup-form").addEventListener("submit", lookupBookings);
        document.getElementById("prev-month").addEventListener("click", () => { state.viewDate.setMonth(state.viewDate.getMonth() - 1); renderCalendar(); });
        document.getElementById("next-month").addEventListener("click", () => { state.viewDate.setMonth(state.viewDate.getMonth() + 1); renderCalendar(); });
        document.querySelectorAll("[data-back]").forEach((button, index) => button.addEventListener("click", () => showStep(index + 1)));
        document.getElementById("change-selection").addEventListener("click", () => showStep(1));
        document.getElementById("new-booking").addEventListener("click", () => { state.date = null; state.time = null; state.editingId = null; document.getElementById("booking-form").reset(); document.getElementById("booking-submit").querySelector("span").textContent = "Confirmar agendamento"; renderCalendar(); showStep(1); });
        document.querySelectorAll("[data-open-bookings]").forEach(button => button.addEventListener("click", openBookings));
        document.querySelector("[data-close-modal]").addEventListener("click", () => document.getElementById("bookings-dialog").close());
        document.getElementById("bookings-results").addEventListener("click", event => {
            const cancelButton = event.target.closest("[data-cancel-booking]");
            const editButton = event.target.closest("[data-edit-booking]");
            const receiptButton = event.target.closest("[data-receipt-booking]");
            if (cancelButton) cancelBooking(cancelButton.dataset.cancelBooking);
            if (editButton) editBooking(editButton.dataset.editBooking);
            if (receiptButton) generateReceipt(receiptButton.dataset.receiptBooking);
        });
    });
})();
