# Bolão Codecon

Sistema de bolão para a **Copa do Mundo FIFA 2026**. Os participantes apostam
nos placares de cada partida, giram a roleta da sorte para receber um
modificador de pontuação e disputam o ranking geral até a final.

Em produção: [bolao.codecon.dev](https://bolao.codecon.dev)

![Tela de rodadas do Bolão Codecon](.github/screenshot.png)

## Funcionalidades

- **Apostas por rodada** — as 104 partidas do torneio organizadas em rodadas
  (fase de grupos 1–3, dezesseis avos, oitavas, quartas, semifinal, disputa de
  terceiro lugar e final), agrupadas por grupo com estádio, data e horário.
- **Roleta da sorte** — ao registrar uma aposta o participante gira a roleta e
  recebe um modificador: inverter aposta, pontos em dobro, metade dos pontos,
  aposta inválida, pato da sorte (+1 ponto se pontuar) ou sem efeito.
- **Pontuação automática** — 3 pontos para o placar exato, 1 ponto para acertar
  apenas o resultado, 0 para o erro. Nas partidas eliminatórias com decisão por
  pênaltis, o placar dos pênaltis é pontuado com o mesmo critério e somado à
  aposta antes de o modificador ser aplicado uma única vez.
- **Trava de apostas** — a aposta é bloqueada assim que a partida começa, recebe
  um placar ou sai do status `pending`.
- **Ranking ao vivo** — classificação geral, resumo pessoal (posição, total de
  pontos, apostas feitas, partidas pendentes, última pontuação) e histórico
  detalhado de cada pontuação via `ranking_log`, com chuva de confete na página
  de classificação.
- **Chaveamento automático** — ao encerrar as três rodadas de grupos, o sistema
  monta os dezesseis avos de final aplicando as regras oficiais da FIFA 2026
  (classificação dos grupos e a matriz dos melhores terceiros colocados) e vai
  avançando os vencedores pelas fases seguintes.
- **Painel administrativo** — gestão de partidas e resultados, times, estádios,
  usuários, apostas e ranking, restrito a contas com `isAdmin`.
- **Autenticação** — e-mail e senha com Better Auth; o cadastro aberto pode ser
  desligado em produção.

## Stack

| Camada | Tecnologias |
| --- | --- |
| Runtime & monorepo | [Bun 1.3](https://bun.sh), [Turborepo](https://turbo.build) |
| Frontend | [Next.js 16](https://nextjs.org) (App Router, React Compiler), [React 19](https://react.dev), [Tailwind CSS 4](https://tailwindcss.com) |
| UI | [shadcn/ui](https://ui.shadcn.com) + [Base UI](https://base-ui.com), [Phosphor Icons](https://phosphoricons.com), `lucide-react`, `next-themes`, `sonner`, `date-fns`, `react-day-picker`, `react-confetti-boom` |
| Dados no cliente | [TanStack Query](https://tanstack.com/query), [TanStack Form](https://tanstack.com/form) |
| Backend | [Hono](https://hono.dev), [tRPC 11](https://trpc.io) |
| Banco de dados | [PostgreSQL](https://www.postgresql.org) com [Drizzle ORM](https://orm.drizzle.team) e Drizzle Kit |
| Autenticação | [Better Auth](https://better-auth.com) |
| Validação & config | [Zod 4](https://zod.dev), [@t3-oss/env](https://env.t3.gg) |
| Testes & build | [Vitest](https://vitest.dev), [tsdown](https://tsdown.dev), TypeScript |
| Observabilidade | Vercel Analytics e Speed Insights |

## Estrutura do projeto

```
bolao-codecon/
├── apps/
│   ├── web/         # Aplicação Next.js (porta 3001)
│   └── server/      # API Hono + tRPC (porta 3000)
└── packages/
    ├── api/         # Routers tRPC, regras de aposta, pontuação e chaveamento
    ├── auth/        # Configuração do Better Auth
    ├── db/          # Schema Drizzle, migrations, seed e docker-compose
    ├── env/         # Variáveis de ambiente validadas (server e web)
    ├── ui/          # Componentes shadcn/ui e estilos compartilhados
    └── config/      # Configuração base de TypeScript
```

## Começando

Pré-requisitos: [Bun](https://bun.sh) 1.3+ e Docker (ou um PostgreSQL próprio).

1. Instale as dependências:

```bash
bun install
```

2. Configure as variáveis de ambiente.

`apps/server/.env`:

```env
DATABASE_URL=postgres://postgres:password@localhost:5432/codecon
BETTER_AUTH_SECRET=<string com no mínimo 32 caracteres>
BETTER_AUTH_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3001
# Em produção o cadastro por e-mail/senha fica desativado por padrão.
# Use false apenas quando o cadastro aberto for intencional.
AUTH_DISABLE_SIGN_UP=true
```

`apps/web/.env`:

```env
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
```

3. Suba o banco e aplique o schema:

```bash
bun run db:start
bun run db:push
```

4. Popule times, estádios, rodadas e partidas da Copa 2026:

```bash
bun run db:seed
```

5. Rode tudo em modo de desenvolvimento:

```bash
bun run dev
```

A aplicação web fica em [http://localhost:3001](http://localhost:3001) e a API em
[http://localhost:3000](http://localhost:3000).

## Scripts disponíveis

Execute a partir da raiz do repositório.

### Desenvolvimento e build

| Script | Descrição |
| --- | --- |
| `bun run dev` | Sobe web e servidor em modo de desenvolvimento |
| `bun run dev:web` | Sobe apenas a aplicação web |
| `bun run dev:server` | Sobe apenas a API |
| `bun run build` | Builda todos os pacotes e aplicações |
| `bun run check-types` | Checa os tipos de todo o monorepo |
| `bun run test` | Roda a suíte de testes (Vitest) |

### Banco de dados

| Script | Descrição |
| --- | --- |
| `bun run db:start` | Sobe o PostgreSQL via Docker Compose |
| `bun run db:watch` | Sobe o PostgreSQL em primeiro plano, com logs |
| `bun run db:stop` | Para o container do PostgreSQL |
| `bun run db:down` | Remove o container do PostgreSQL |
| `bun run db:push` | Aplica o schema diretamente no banco |
| `bun run db:generate` | Gera as migrations a partir do schema |
| `bun run db:migrate` | Executa as migrations pendentes |
| `bun run db:studio` | Abre o Drizzle Studio |
| `bun run db:seed` | Popula times, estádios, rodadas e partidas da Copa 2026 |
| `bun run db:fill-group-scores` | Simula um admin preenchendo os placares da fase de grupos pelas mesmas procedures tRPC da UI (útil para testar pontuação e chaveamento) |

## Personalização da UI

Os componentes shadcn/ui são compartilhados pelo pacote `packages/ui`.

- Tokens de design e estilos globais: `packages/ui/src/styles/globals.css`
- Componentes compartilhados: `packages/ui/src/components/*`
- Aliases e config do shadcn: `packages/ui/components.json` e `apps/web/components.json`

Para adicionar novos primitivos compartilhados, rode a partir da raiz:

```bash
bunx shadcn@latest add accordion dialog popover sheet table -c packages/ui
```

E importe assim:

```tsx
import { Button } from "@codecon/ui/components/button";
```

Se o componente for específico da aplicação web, rode a CLI do shadcn a partir de
`apps/web` em vez da raiz.
