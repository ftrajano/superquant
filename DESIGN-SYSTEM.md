# Sistema de Design Superquant

Este documento descreve o sistema de design utilizado na aplicação Superquant, incluindo cores, componentes e convenções de estilo.

## 🎨 Cores e Tema

O sistema de design utiliza variáveis CSS para garantir consistência de cores em toda a aplicação, com suporte a tema claro e escuro.

### Variáveis Semânticas

Utilize as seguintes variáveis para criar componentes visualmente consistentes:

**Cores Primárias**
- `--primary`: Cor principal da marca
- `--primary-hover`: Cor para hover em elementos primários
- `--primary-light`: Versão mais clara da cor primária
- `--primary-bg`: Cor de fundo sutil com tom primário

**Cores de Superfície**
- `--background`: Cor de fundo principal da aplicação
- `--surface-bg`: Cor de fundo para elementos de interface
- `--surface-card`: Cor de fundo para cards e painéis
- `--surface-border`: Cor para bordas e separadores
- `--surface-secondary`: Cor para superfícies secundárias (ex: cabeçalhos)
- `--surface-tertiary`: Cor para superfícies terciárias
- `--surface-tonal`: Cor de fundo com tonalidade da marca

**Cores de Texto**
- `--text-primary`: Cor principal para textos
- `--text-secondary`: Cor secundária para textos (menos destaque)
- `--text-tertiary`: Cor terciária para textos (ainda menos destaque)
- `--text-disabled`: Cor para textos desabilitados

**Estados e Feedback**
- `--success`: Cor para sucesso/confirmação
- `--warning`: Cor para avisos/atenção
- `--error`: Cor para erros/problemas
- `--info`: Cor para informações

### Classes Tailwind Personalizadas

O Tailwind foi estendido para usar as variáveis CSS, permitindo:

```jsx
// Exemplos de uso do Tailwind com as variáveis de tema
<div className="bg-primary text-white">Botão Primário</div>
<div className="bg-surface-card border border-surface-border">Card</div>
<div className="text-text-secondary">Texto secundário</div>
```

## 🧩 Componentes Básicos

### Button

```jsx
<Button variant="primary">Botão Padrão</Button>
<Button variant="secondary">Botão Secundário</Button>
<Button variant="outline">Botão Outline</Button>
<Button variant="danger">Botão de Perigo</Button>

// Tamanhos
<Button size="sm">Pequeno</Button>
<Button size="md">Médio (padrão)</Button>
<Button size="lg">Grande</Button>

// Estados
<Button disabled>Desabilitado</Button>
<Button isLoading>Carregando</Button>

// Link como botão
<Button href="/rota">Link</Button>
```

### Card

```jsx
// Card básico
<Card>Conteúdo do card</Card>

// Card com título
<Card title="Título do Card">Conteúdo</Card>

// Card com ação
<Card 
  title="Título" 
  action={<Button size="sm">Ação</Button>}
>
  Conteúdo
</Card>

// Sem padding interno
<Card noPadding>Conteúdo sem padding</Card>
```

### Input

```jsx
<Input 
  label="Nome" 
  name="nome"
  value={valor}
  onChange={handleChange}
  required
/>

// Com erro
<Input 
  label="Email"
  type="email"
  error="Email inválido"
/>

// Com texto de ajuda
<Input 
  label="Senha"
  type="password"
  helper="Mínimo de 8 caracteres"
/>
```

### Select

```jsx
<Select
  label="Estado"
  name="estado"
  value={estado}
  onChange={handleChange}
  options={[
    { value: 'sp', label: 'São Paulo' },
    { value: 'rj', label: 'Rio de Janeiro' }
  ]}
/>
```

### Badge

```jsx
<Badge>Padrão</Badge>
<Badge variant="primary">Primário</Badge>
<Badge variant="success">Sucesso</Badge>
<Badge variant="warning">Aviso</Badge>
<Badge variant="error">Erro</Badge>
<Badge variant="info">Informação</Badge>
```

## 🧭 Convenções

### Classes Utilitárias

Além das classes do Tailwind, o sistema fornece classes utilitárias para casos comuns:

**Backgrounds**
- `.bg-primary`, `.bg-primary-light`, `.bg-surface`, etc.

**Textos**
- `.text-primary`, `.text-secondary`, `.text-tertiary`, etc.

**Bordas**
- `.border-primary`, `.border-surface`

### Melhores Práticas

1. **Evite hardcoding de cores** - Sempre use as variáveis CSS ou classes do Tailwind para cores.

2. **Use componentes em vez de repetir estilos** - Prefira os componentes pré-definidos a recriar estilos.

3. **Siga o padrão de nomenclatura** - Mantenha a consistência nomeando suas variáveis e classes.

4. **Respeite a responsividade** - Utilize as classes responsivas do Tailwind (`sm:`, `md:`, `lg:`, etc).

## 🚀 Atualizações e Manutenção

Ao criar novos componentes:

1. Documente o componente neste arquivo
2. Adicione tipos JSDoc para os props
3. Garanta que funciona corretamente com os temas claro e escuro

Ao modificar cores e temas:

1. Faça alterações apenas nas variáveis CSS em globals.css
2. Não altere diretamente elementos individuais