-- =========================================================
-- Motochefe Nexus — Detalhe da forma de pagamento (Etapa 15)
--
-- forma_pagamento continua com 3 valores (avista/parcelado/outro —
-- Etapa 13). O sub-detalhe (PIX vs Dinheiro; 12x/18x/21x) não vira
-- enum novo — texto livre é suficiente e evita outra migração de
-- enum a cada nova opção de parcela que surgir.
-- =========================================================

alter table public.vendas add column detalhe_pagamento text;
