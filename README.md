# Zenith Bem-Estar

Site de agendamento de massagens corporativas da Zenith Corp, com experiência pública de reserva e painel administrativo integrado.

## Experiência pública

O arquivo `index.html` é a entrada principal do site. Ele oferece:

- apresentação do programa de bem-estar da Zenith Corp;
- calendário com dias disponíveis;
- horários ocupados e bloqueados em tempo real;
- agendamento em três etapas;
- validação de e-mail `@zenithcorp.com.br`;
- limite de dois agendamentos por colaborador no mês;
- consulta e cancelamento de reservas;
- edição de reservas futuras e registro no histórico administrativo;
- geração de comprovante em PDF;
- layout responsivo para computador e celular;
- orientações para o atendimento.

## Regras de agendamento

- O usuário deve seguir o padrão `nome.sobrenome`.
- O e-mail deve pertencer ao domínio `@zenithcorp.com.br`.
- O mesmo usuário e e-mail devem permanecer associados entre as reservas.
- Cada colaborador pode realizar no máximo dois agendamentos por mês.
- Duas sessões no mesmo dia precisam ocupar horários consecutivos de 20 minutos para colaboradores comuns.
- Somente quartas, sextas e dias extras liberados pela administração ficam disponíveis.
- Hoje, dias passados, feriados, dias bloqueados e horários ocupados não podem ser escolhidos.
- Usuários bloqueados não podem realizar agendamentos.
- Reservas futuras podem ser editadas ou canceladas pelo colaborador.
- O painel permite administrar os e-mails com permissão para agendar sem limites pessoais ou exigência de horários consecutivos.
- O painel também permite bloquear e desbloquear e-mails; o bloqueio remove permissões administrativas e impede novos agendamentos.

## Painel administrativo

O arquivo `administrador.html` permite:

- acompanhar agendamentos ativos e cancelados;
- bloquear horários e dias;
- liberar dias extras e novos meses;
- consultar o histórico de alterações;
- exportar relatórios em Excel.

## Arquivos principais

```text
index.html          Página pública de agendamento
public.css          Identidade visual e responsividade do site público
public.js           Fluxo de agendamento e consulta de reservas
administrador.html  Painel administrativo
admin-theme.css     Identidade visual do painel
style.css           Estilos estruturais do painel
script.js           Regras administrativas e persistência
Zenith Logo.png     Marca principal
Zenith Sidebar.png  Marca usada no painel
Massagem.png        Imagem da experiência
```

## Armazenamento

O projeto usa `localStorage`, sem banco de dados. A página pública e o painel administrativo compartilham as mesmas chaves, portanto os dados aparecem nos dois ambientes quando são acessados no mesmo navegador e domínio.

Para uso corporativo em produção com vários usuários simultâneos, recomenda-se conectar o fluxo a um banco de dados e a uma autenticação segura. O armazenamento local é indicado para demonstração ou uso em um único dispositivo.

## Publicação

O site é estático e pode ser publicado diretamente no GitHub Pages ou em outro serviço de hospedagem estática. O domínio configurado está no arquivo `CNAME`.

© 2026 Zenith Corp. Todos os direitos reservados.
