# Portfólio — NovaTech

Coleção de mini projetos de software, cada um em sua própria pasta, publicados em um único lugar para
demonstração pública. Todos usam a marca fictícia **NovaTech** e dados de exemplo — nenhuma informação real de
empresa ou de terceiros aparece neste repositório.

**[Ver o portfólio publicado →](https://andre-tech2.github.io/portfolio/)**

## Projetos

| Projeto | Descrição | Stack | Demo |
| --- | --- | --- | --- |
| [Inventário de Máquinas](./inventario-maquinas) | Controle de parque de máquinas com papéis de usuário, importação/exportação de planilha e trilha de auditoria — SQLite rodando 100% no navegador. | React, TypeScript, Tailwind, sql.js | [abrir](https://andre-tech2.github.io/portfolio/inventario-maquinas/) |

Novos projetos serão adicionados como novas pastas neste mesmo repositório.

## Estrutura

```
portfolio/
├── web/                    # landing page do portfólio (GitHub Pages)
├── inventario-maquinas/    # projeto 1: inventário de máquinas
├── .github/workflows/      # build + deploy automático para GitHub Pages
```

Cada projeto é independente (seu próprio `package.json`, dependências e build). O workflow em
[`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml) builda cada um e publica o resultado em um
subcaminho do GitHub Pages a cada push na branch `main`.

## Autor

André — [LinkedIn](https://www.linkedin.com/in/andrelsandre) · [GitHub](https://github.com/andre-tech2)

## Licença

MIT — veja [LICENSE](./LICENSE).
