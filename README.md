# SuperQuant - App de Gerenciamento de Operações com Opções

Aplicativo para gerenciamento de operações com opções no mercado financeiro, incluindo rastreamento de resultados, acompanhamento de margem e relatórios.

## Funcionalidades Principais

- Gerenciamento completo de operações com opções (CALL/PUT)
- Fechamento parcial ou total de operações
- Controle de margem utilizada
- Relatórios detalhados por mês e ano
- Controle de acesso multi-usuário (autenticação e autorização)
- Copytrading (acompanhamento de operações de outros usuários)

## Tecnologias

- Next.js 15
- MongoDB via Mongoose
- Tailwind CSS
- NextAuth.js para autenticação

## Requisitos

- Node.js 20.x ou superior
- MongoDB (Atlas ou local)

## Configuração

1. Clone o repositório
2. Instale as dependências:

```bash
npm install
```

3. Configure as variáveis de ambiente copiando o arquivo de exemplo:

```bash
cp .env.example .env.local
```

4. Edite o arquivo `.env.local` com suas próprias configurações:
   - Adicione sua string de conexão do MongoDB
   - Configure um segredo forte para o NextAuth
   - Defina uma chave de setup para o admin inicial

## Desenvolvimento

Execute o servidor de desenvolvimento:

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no navegador.

## Deploy na Vercel

1. Crie uma conta na [Vercel](https://vercel.com)
2. Conecte seu repositório Git
3. Configure as seguintes variáveis de ambiente no dashboard da Vercel:
   - `MONGODB_URI`: String de conexão do MongoDB
   - `MONGODB_DB`: Nome do banco de dados
   - `NEXTAUTH_SECRET`: Um valor seguro e aleatório para assinar os cookies
   - `ADMIN_SETUP_KEY`: Chave para configuração do usuário administrador

4. Deploy! A Vercel detectará automaticamente que é um projeto Next.js

## Primeira Execução

1. Após o deploy, acesse `/setup-admin` para criar o primeiro usuário administrador
2. Use a chave de configuração definida em `ADMIN_SETUP_KEY`
3. Após criar o admin, você poderá fazer login e começar a usar o sistema

## Licença

Este projeto é proprietário e não está licenciado para uso público.
