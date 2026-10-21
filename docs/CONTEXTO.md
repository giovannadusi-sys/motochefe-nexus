# Motochefe Nexus — Contexto do Projeto

## 1. Visão Geral

O Motochefe Nexus é uma plataforma interna de gestão comercial, organização operacional e conhecimento desenvolvida inicialmente como projeto piloto para a unidade Motochefe Piratininga.

O sistema tem como objetivo centralizar informações que atualmente estão distribuídas entre planilhas, plataformas externas, documentos e conhecimento informal dos colaboradores.

O Nexus conecta:

- vendedores
- gerentes
- clientes
- vendas
- metas
- atividades comerciais
- acompanhamentos
- conhecimento interno
- inteligência artificial

O nome "Nexus" representa esse ponto de conexão entre pessoas, informações e processos.

---

## 2. Problema

Atualmente, parte da operação comercial depende de:

- planilhas individuais dos vendedores
- planilha geral controlada pela auxiliar administrativa
- ChatGuru para atendimento dos leads
- conhecimento informal sobre produtos e processos
- controles manuais de atividades

Isso pode gerar:

- falta de organização
- duplicidade de informações
- perda de acompanhamentos
- dificuldade para acompanhar resultados
- falta de centralização das vendas
- dificuldade para encontrar informações sobre produtos
- falta de controle sobre atividades diárias
- dependência de conhecimento informal

## 3. Objetivo do Produto

Criar uma plataforma interna moderna, simples e funcional que permita aos usuários:

- registrar e organizar clientes
- registrar vendas
- acompanhar resultados
- acompanhar metas
- visualizar ranking
- registrar atividades comerciais
- organizar follow-ups e acompanhamentos
- acompanhar oportunidades de seguro
- acompanhar revisões
- consultar informações sobre produtos
- acessar materiais e treinamentos
- utilizar futuramente um assistente baseado em inteligência artificial

O sistema não deve criar burocracia desnecessária. Cada funcionalidade deve resolver um problema real da operação.

## 4. Unidade Piloto

**Motochefe Piratininga** — 3 vendedores, gerente, auxiliar administrativa. A arquitetura deve permitir expansão futura para outras unidades.

## 5. Estrutura Futura

```
Empresa
└── Unidade
    ├── Gerente
    ├── Vendedores
    └── Outros usuários autorizados
```

Empresa: Motochefe · Unidade piloto: Piratininga. O banco de dados não deve impedir expansão multi-empresa, mas o MVP não precisa implementá-la.

## 6. Usuários

### 6.1 Vendedor
Login próprio. Acessa: dashboard pessoal, seus clientes, suas vendas, seus acompanhamentos, agenda, atividades diárias, metas, ranking da unidade, base de conhecimento, treinamentos, assistente IA (futuro). Não acessa dados privados de outros vendedores, exceto o que for explicitamente liberado (ex: ranking).

### 6.2 Gerente
Acompanha: faturamento total e por vendedor, quantidade de leads, ranking, desempenho da equipe, atividades registradas, metas, vendas — sempre respeitando a unidade do usuário.

### 6.3 Auxiliar Administrativa
Participa do controle geral das vendas. Permissões específicas a definir. O sistema deve permitir criar essa função sem reescrever a arquitetura.

## 7. Atendimento e Leads

Leads chegam pelo WhatsApp via ChatGuru, distribuídos por rodízio entre os 3 vendedores. O Nexus **não substitui** o ChatGuru. Sem acesso à API/Webhooks do contrato atual — nenhuma integração automática nesta versão, e nenhuma técnica não autorizada (scraping etc.). Integração oficial fica para quando houver acesso.

## 8. Relatório Diário

Período considerado: 00h–19h. Indicadores iniciais: quantidade de leads, ligações, vídeos, vendas realizadas. Estrutura deve permitir novos indicadores no futuro.

## 9. Atividades Comerciais

Meta de **50 ligações diárias**. Meta de vídeos a definir. O Nexus deve permitir acompanhar progresso (ex: "32 / 50").

## 10. Clientes

Campos iniciais: nome, CPF, telefone, data de nascimento, e-mail, endereço, CEP, bairro. CPF e telefone avaliados como possíveis identificadores contra duplicidade. Dados da moto (modelo, cor) pertencem à **venda**, não ao cadastro do cliente. Um cliente pode ter mais de uma compra.

## 11. Vendas

Campos: cliente, data, modelo, cor, valor, forma de pagamento, seguro, vendedor, unidade. Objetivo: substituir gradualmente as planilhas individuais e a planilha geral por um banco centralizado, alimentando automaticamente faturamento, ranking, metas, relatórios, seguro e revisão.

## 12. Metas

Meta mínima mensal: **R$ 200.000**. Regra de déficit e comissionamento — ver `BUSINESS_RULES.md` para as regras já confirmadas.

## 13. Ranking

Baseado no valor total de vendas, inicialmente só entre vendedores da unidade Piratininga. Futuro: ranking por unidade, regional, geral — acesso dependente de permissão.

## 14. Acompanhamentos

Tipos: follow-up, retorno, seguro, revisão, pós-venda, outro. Campos: cliente, tipo, descrição, data, status, responsável. Pendências devem aparecer claramente no dashboard/agenda.

## 15. Seguros

Identificar clientes com/sem seguro, oportunidades de acompanhamento, status do processo. Ver `BUSINESS_RULES.md` para a regra de comissionamento e janela de conversão já confirmadas.

## 16. Revisões

Acompanhamento pós-venda baseado na data (e, complementarmente, km) — ver `BUSINESS_RULES.md` para a regra confirmada.

## 17. Base de Conhecimento

A Motochefe já tem uma plataforma de treinamento (empresa, produtos, especificações, processos, objeções, garantia, revisões). O Nexus não deve duplicá-la — deve integrá-la conceitualmente e reorganizar depois. Separar conteúdo estável (produtos, processos, garantia) de conteúdo dinâmico (preços, campanhas, metas), este último com estratégia própria de atualização.

## 18. Inteligência Artificial

Filosofia: **a IA organiza, a IA analisa, a IA sugere — o usuário decide.** Nunca executa decisões importantes sozinha. Futuro: RAG sobre a Base de Conhecimento.

## 19. Dashboard

Centro de comando do usuário — moderno, limpo, profissional, intuitivo. Cada informação exibida precisa ter propósito. Vendedor: vendas do mês, faturamento, progresso da meta, ranking, acompanhamentos pendentes, atividades diárias, clientes que precisam de atenção. Gerente: informações da unidade.

## 20. Princípios do Produto

Resolver problemas reais, evitar burocracia, centralizar o que importa, interface simples, arquitetura organizada, permitir expansão, proteger dados, respeitar permissões, evitar funcionalidades desnecessárias.

> Cada informação e cada funcionalidade deve ter um motivo para existir.

## 21. MVP

1. Autenticação e usuários
2. Estrutura de unidade e permissões
3. Clientes
4. Registro de vendas
5. Resultados
6. Metas
7. Ranking
8. Acompanhamentos
9. Agenda
10. Atividades diárias
11. Dashboard

Base de Conhecimento e IA vêm depois. Integração ChatGuru depende de acesso oficial à API/Webhooks.

## 22. Stack Inicial

Next.js, TypeScript, Tailwind CSS, PostgreSQL, Supabase, Supabase Auth, Git, GitHub. Monólito organizado — sem microserviços sem necessidade real.
