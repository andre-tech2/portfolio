# NovaTech Inventário de Máquinas

Sistema de controle de parque de máquinas (equipamentos novos e antigos) construído como projeto de portfólio.
Todo o back-end roda **dentro do navegador**: banco de dados SQLite real (via [sql.js](https://sql.js.org/), WebAssembly),
persistido no IndexedDB do visitante — sem servidor, sem backend, sem dados reais.

**[Ver demonstração ao vivo →](https://andre-tech2.github.io/portfolio/inventario-maquinas/)**

> "NovaTech" é uma empresa fictícia criada só para este portfólio. O sistema foi originalmente desenvolvido como
> uma aplicação desktop (Electron) para uso interno real e depois adaptado para rodar 100% no navegador, com dados
> e marca fictícios, para poder ser demonstrado publicamente.

## Funcionalidades

- Cadastro de **Máquinas Novas** (entrada/saída) e **Máquinas Antigas** (em atuação / parada / venda)
- Mover uma máquina de "Novas" para "Antigas", com registro de venda (data + comprador)
- Exclusão com **motivo obrigatório**, mantendo trilha de auditoria em "Histórico de remoções"
- Importação e exportação de planilhas `.xlsx`
- Autenticação com três papéis de acesso (**visualizar**, **editar**, **gerenciar tudo**)
- Gestão de usuários (criar, editar papel/status, redefinir senha)
- Modo claro/escuro com visual "vidro" (glassmorphism)
- Modo demonstração: dados de exemplo pré-carregados e um botão para restaurá-los a qualquer momento

## Stack técnica

- **React 18 + TypeScript + Vite**
- **Tailwind CSS** (tema customizado, glassmorphism)
- **sql.js** — SQLite compilado para WebAssembly, rodando no navegador
- **IndexedDB** — persistência local dos dados do visitante
- **Web Crypto API (PBKDF2)** — hash de senha, sem depender de backend
- **SheetJS (xlsx)** — leitura/escrita de planilhas Excel no navegador

## Rodando localmente

```bash
npm install
npm run dev
```

Acesso rápido: na tela de login, use o botão **"Entrar como administrador (demo)"** ou as credenciais mostradas
na própria tela.

## Sobre a origem do projeto

Esta é uma versão adaptada, para fins de portfólio, de um sistema desktop (Electron) que eu desenvolvi para
controle real de inventário de TI. Nesta versão pública:

- O app roda inteiramente no navegador (sem Electron, sem Node no cliente)
- O nome da empresa, e-mails e todos os dados cadastrados são fictícios
- A sincronização bidirecional com planilha (recurso específico do uso interno original) foi simplificada para
  importação/exportação manual, mais adequada a uma demonstração pública
