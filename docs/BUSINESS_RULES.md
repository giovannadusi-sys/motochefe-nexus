# Motochefe Nexus — Regras de Negócio (BUSINESS_RULES.md)

> Este documento detalha as regras de negócio que o sistema deve respeitar.
> Segue o CONTEXTO.md como referência de visão geral do produto.
> Regras marcadas como `[A VALIDAR]` ainda não foram confirmadas e não devem ser assumidas na modelagem do banco de dados.

---

## 1. Metas e Comissionamento

### 1.1 Meta mínima mensal
- Meta mínima por vendedor: **R$ 200.000/mês**.

### 1.2 Regra de déficit
- Se o vendedor não atingir a meta do mês, a diferença vira **déficit**.
- Exemplo: Meta R$ 200.000 → Vendido R$ 170.000 → Déficit R$ 30.000.
- **Para liberar o comissionamento (1%) no mês seguinte, o vendedor precisa:**
  1. Quitar o déficit acumulado do(s) mês(es) anterior(es), **e**
  2. Bater a meta do mês vigente (R$ 200.000).
- Ou seja: a comissão só é liberada quando `vendas do mês ≥ meta do mês + déficit acumulado`.
- O déficit deve ser tratado como um saldo acumulável por vendedor (não zera automaticamente a cada mês — só zera quando quitado).

**Modelagem sugerida:**
- Tabela/campo de controle de déficit por vendedor por mês (saldo devedor acumulado).
- Ao fechar o mês: `déficit_novo = déficit_anterior + max(0, meta - vendido)`
- Comissão liberada apenas quando `vendido_no_mês - déficit_anterior ≥ meta`.

`[A VALIDAR]`: Existe um teto/prazo máximo para o déficit acumular (ex: só pode acumular por X meses)? Ou ele acumula indefinidamente até ser quitado?

---

## 2. Seguros (Motochefe Conecta)

### 2.1 Comissionamento por seguro
- **R$ 50** por seguro fechado (padrão).
- Se o vendedor bater **10 seguros fechados no mês**, o valor sobe para **R$ 150 por seguro fechado** naquele mês.

`[A VALIDAR]`: Ao bater 10 seguros, o valor de R$ 150 vale só a partir do 10º seguro em diante, ou retroage e recalcula os 10 primeiros também (ex: pagamento retroativo)?

### 2.2 Definição de "oportunidade" de seguro
- Uma oportunidade é criada quando o cliente **não fechou o seguro no momento da venda** porque quis "pensar mais um pouco".
- Prazo de janela para conversão: **até 120 dias** a partir da venda/primeiro contato.
- Se o cliente fechar o seguro dentro desses 120 dias, conta como conversão da oportunidade.

**Modelagem sugerida:**
- Cada oportunidade de seguro tem: `cliente`, `venda_relacionada`, `data_criação`, `data_limite (data_criação + 120 dias)`, `status (aberta / convertida / expirada)`, `vendedor_responsável`.
- Job/lógica futura para marcar oportunidades como "expiradas" automaticamente após os 120 dias, caso ainda não convertidas.

`[A VALIDAR]`: O que acontece com uma oportunidade expirada (some do funil, vira "perdida" permanentemente, ou pode ser reaberta)? Existe algum lembrete automático nos dias que antecedem o vencimento dos 120 dias?

---

## 3. Revisões

### 3.1 Periodicidade
- Revisão a cada **3 meses OU 2.000 km rodados — o que ocorrer primeiro**.

**Modelagem sugerida:**
- Cada venda gera um ciclo de revisões previsto por tempo (3 em 3 meses a partir da data da venda).
- Como o sistema não tem acesso à quilometragem real do cliente (não há telemetria/IoT no MVP), o critério de km depende de informação declarada pelo cliente/vendedor no acompanhamento — o gatilho automático confiável no MVP será o **tempo (3 meses)**, com o critério de km funcionando como alerta manual/complementar.

`[A VALIDAR]`:
- Quantas revisões existem no total (ciclo fixo, ex: 4 revisões cobertas por garantia) ou é indefinido enquanto o cliente possuir a moto?
- Como o sistema vai capturar a km rodada, já que não há integração com a moto? Registro manual pelo vendedor/cliente?

---

## 4. Pontos ainda em aberto (herdados do CONTEXTO.md)

Estes seguem como `[A VALIDAR]` e não têm regra definida ainda:

- Meta diária de vídeos (a meta de ligações já é fixa: 50/dia).
- Permissões específicas da Auxiliar Administrativa.
- Regras detalhadas de ranking além de "valor total de vendas" (ex: critério de desempate, pesos por seguro/revisão etc.).
- Regras de duplicidade de cadastro de cliente: CPF e telefone como identificadores — qual prevalece em caso de conflito?

---

## 5. Próxima Etapa

Com déficit/comissão, seguro e revisão fechados, o modelo de dados de **vendas, metas, comissionamento e acompanhamentos** já tem base suficiente para iniciar a Etapa 6 (modelagem do banco). Os pontos da seção 4 podem ser adiados sem travar o schema inicial — bastam campos flexíveis (ex: enum de status, JSON de metadata) para não fechar demais a estrutura antes da validação.
