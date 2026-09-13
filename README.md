# ERP Gestão Empresarial

Sistema empresarial moderno para gestão de funcionários, clientes, fornecedores, produtos, stock, vendas, caixa, finanças e relatórios.

## Arquitetura

- Frontend: React + TypeScript + Vite
- Backend: NestJS + TypeScript
- Banco: PostgreSQL
- Deploy: Render

## Estrutura

- apps/web: aplicação frontend
- apps/api: API backend
- render.yaml: configuração do deploy no Render
- .env.example: template de variáveis de ambiente

## Desenvolvimento local

1. Instale as dependências:

```bash
npm install
```

2. Copie o ambiente:

```bash
copy .env.example .env
```

3. Ajuste as variáveis com a sua base de dados local.

4. Gere o cliente Prisma e execute as migrações:

```bash
cd apps/api
npx prisma generate
npx prisma migrate dev --name init
```

5. Inicie os serviços:

```bash
npm run dev:web
npm run dev:api
```

## Produção

A configuração de deploy foi preparada para o Render através do ficheiro `render.yaml`.

### Requisitos no Render

- Criar uma base de dados PostgreSQL
- Definir `DATABASE_URL` no serviço API
- Definir `JWT_SECRET` no serviço API
- Garantir que o serviço web usa o URL público da API

## Variáveis de ambiente

O ficheiro `.env.example` contém os valores base para:

- `DATABASE_URL`
- `JWT_SECRET`
- `PORT`
- `VITE_API_URL`

## Estado do projecto

O ERP já possui a base estrutural e funcional para:

- autenticação
- utilizadores
- empresas/configurações
- dashboard
- RH
- clientes
- fornecedores
- produtos
- stock
- vendas
- caixa
- finanças
- relatórios

## Observação

A execução real completa exige Node/npm instalados e uma base PostgreSQL disponível.
