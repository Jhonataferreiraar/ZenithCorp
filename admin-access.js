(function () {
    "use strict";

    const STORAGE_KEY = "emailsAdministrativos";
    const BLOCKED_STORAGE_KEY = "emailsBloqueados";
    const DEFAULT_EMAILS = [
        "agendamento.massagem@zenithcorp.com.br",
        "jhonata.araujo@zenithcorp.com.br"
    ];

    function readEmails() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (Array.isArray(saved)) return saved.map(email => String(email).toLowerCase());
        } catch (_) { /* Usa a configuração inicial. */ }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_EMAILS));
        return [...DEFAULT_EMAILS];
    }

    function saveEmails(emails) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(emails));
        renderEmails();
    }

    function readBlockedEmails() {
        try {
            const saved = JSON.parse(localStorage.getItem(BLOCKED_STORAGE_KEY));
            return Array.isArray(saved) ? saved.map(email => String(email).toLowerCase()) : [];
        } catch (_) { return []; }
    }

    function saveBlockedEmails(emails) {
        localStorage.setItem(BLOCKED_STORAGE_KEY, JSON.stringify(emails));
        renderBlockedEmails();
    }

    function renderEmails() {
        const list = document.getElementById("admin-email-list");
        const count = document.getElementById("admin-email-count");
        if (!list || !count) return;
        const emails = readEmails();
        count.textContent = emails.length;
        list.innerHTML = emails.length ? emails.map(email => `
            <article class="admin-email-item">
                <span class="admin-email-icon"><i class="fa-regular fa-envelope"></i></span>
                <div><strong>${email}</strong><small>Agendamento sem restrições pessoais</small></div>
                <button type="button" data-remove-admin-email="${email}" title="Remover permissão"><i class="fa-regular fa-trash-can"></i></button>
            </article>
        `).join("") : '<div class="admin-email-empty">Nenhum e-mail administrativo cadastrado.</div>';
    }

    function renderBlockedEmails() {
        const list = document.getElementById("blocked-email-list");
        const count = document.getElementById("blocked-email-count");
        if (!list || !count) return;
        const emails = readBlockedEmails();
        count.textContent = emails.length;
        list.innerHTML = emails.length ? emails.map(email => `
            <article class="admin-email-item blocked-email-item">
                <span class="admin-email-icon"><i class="fa-solid fa-ban"></i></span>
                <div><strong>${email}</strong><small>Sem permissão para realizar massagens</small></div>
                <button type="button" data-unblock-email="${email}" title="Desbloquear e-mail"><i class="fa-solid fa-lock-open"></i></button>
            </article>
        `).join("") : '<div class="admin-email-empty">Nenhum e-mail bloqueado.</div>';
    }

    function addEmail(event) {
        event.preventDefault();
        const input = document.getElementById("novo-email-admin");
        const error = document.getElementById("admin-email-error");
        const email = input.value.trim().toLowerCase();
        error.textContent = "";
        if (!/^[\w.%+-]+@zenithcorp\.com\.br$/i.test(email)) {
            error.textContent = "Informe um e-mail corporativo @zenithcorp.com.br.";
            return;
        }
        const emails = readEmails();
        if (readBlockedEmails().includes(email)) {
            error.textContent = "Este e-mail está bloqueado. Desbloqueie-o antes de conceder permissão administrativa.";
            return;
        }
        if (emails.includes(email)) {
            error.textContent = "Este e-mail já possui permissão administrativa.";
            return;
        }
        emails.push(email);
        saveEmails(emails);
        input.value = "";
        if (window.Swal) Swal.fire({ icon: "success", title: "Permissão adicionada", text: `${email} agora pode agendar sem restrições pessoais.`, confirmButtonColor: "#102a43" });
    }

    function blockEmail(event) {
        event.preventDefault();
        const input = document.getElementById("novo-email-bloqueado");
        const error = document.getElementById("blocked-email-error");
        const email = input.value.trim().toLowerCase();
        error.textContent = "";
        if (!/^[\w.%+-]+@zenithcorp\.com\.br$/i.test(email)) {
            error.textContent = "Informe um e-mail corporativo @zenithcorp.com.br.";
            return;
        }
        const blockedEmails = readBlockedEmails();
        if (blockedEmails.includes(email)) {
            error.textContent = "Este e-mail já está bloqueado.";
            return;
        }
        blockedEmails.push(email);
        saveBlockedEmails(blockedEmails);
        saveEmails(readEmails().filter(item => item !== email));
        input.value = "";
        if (window.Swal) Swal.fire({ icon: "success", title: "E-mail bloqueado", text: `${email} não poderá realizar novos agendamentos.`, confirmButtonColor: "#102a43" });
    }

    async function unblockEmail(email) {
        let confirmed = true;
        if (window.Swal) {
            const result = await Swal.fire({ title: "Desbloquear e-mail?", text: `${email} poderá voltar a realizar agendamentos seguindo as regras normais.`, icon: "question", showCancelButton: true, confirmButtonText: "Desbloquear", cancelButtonText: "Cancelar", confirmButtonColor: "#102a43" });
            confirmed = result.isConfirmed;
        } else confirmed = window.confirm(`Desbloquear ${email}?`);
        if (!confirmed) return;
        saveBlockedEmails(readBlockedEmails().filter(item => item !== email));
    }

    async function removeEmail(email) {
        let confirmed = true;
        if (window.Swal) {
            const result = await Swal.fire({ title: "Remover permissão?", text: `${email} voltará a seguir todas as regras de agendamento.`, icon: "warning", showCancelButton: true, confirmButtonText: "Remover", cancelButtonText: "Cancelar", confirmButtonColor: "#a44040" });
            confirmed = result.isConfirmed;
        } else confirmed = window.confirm(`Remover a permissão de ${email}?`);
        if (!confirmed) return;
        saveEmails(readEmails().filter(item => item !== email));
    }

    document.addEventListener("DOMContentLoaded", () => {
        renderEmails();
        renderBlockedEmails();
        document.getElementById("admin-email-form")?.addEventListener("submit", addEmail);
        document.getElementById("blocked-email-form")?.addEventListener("submit", blockEmail);
        document.getElementById("admin-email-list")?.addEventListener("click", event => {
            const button = event.target.closest("[data-remove-admin-email]");
            if (button) removeEmail(button.dataset.removeAdminEmail);
        });
        document.getElementById("blocked-email-list")?.addEventListener("click", event => {
            const button = event.target.closest("[data-unblock-email]");
            if (button) unblockEmail(button.dataset.unblockEmail);
        });
    });
})();
