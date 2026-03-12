# SÍNTESE ESTRATÉGICA — MARKETPLACE DE SERVIÇOS

## OS 5 MAIORES DIFERENCIAIS ESTRATÉGICOS DO NEGÓCIO

### 1. Trust-as-Infrastructure

A maioria dos marketplaces de serviços no Brasil falhou porque tratou o problema de confiança como feature, não como produto. Nós tratamos trust como infraestrutura — a fundação sobre a qual todo o resto é construído.

**O que isso significa na prática**:
- Verificação de identidade com biometria + validação de documentos + checagem de antecedentes
- Reviews somente após serviço completado e pagamento confirmado (sem compra de avaliações)
- Garantia de satisfação com política clara: se não ficou satisfeito, resolvemos ou devolvemos
- Seguro do serviço integrado nativamente (não como afterthought)
- Dispute resolution humano em < 48h (não chatbot)

**Por que é moat**: Trust se constrói em anos, destrói em dias. Após 2 anos de operação com zero incidentes graves e NPS > 60, nenhum concorrente pode replicar esse ativo — nem com capital ilimitado.

**Impacto financeiro**: Cada 10 pontos de NPS = 15% menor churn. Com NPS 65 vs. concorrente a 40, nosso LTV é 40-60% maior com o mesmo produto.

---

### 2. Recorrência como Modelo de Negócio (não transação)

A maior diferença entre um marketplace vale R$ 50M e um vale R$ 500M é recorrência.

**Como construímos recorrência**:
- Produto de "Recorrência" nativo: cliente agenda 1 vez, define frequência, nunca mais precisa reagendar
- Match consistente: mesma cuidadora, mesmo eletricista, mesma equipe de limpeza toda semana
- Relacionamento, não transação: clientes não buscam "um prestador", eles buscam "a Rosana que limpa minha casa"

**O que muda em unit economics com recorrência**:
```
Sem recorrência:
- CAC: R$ 100
- Booking frequência: 1.5x/ano
- LTV: R$ 180
- LTV/CAC: 1.8x (não é negócio)

Com recorrência:
- CAC: R$ 100
- Booking frequência: 18x/ano (quinzenal)
- LTV (3 anos): R$ 1.800
- LTV/CAC: 18x (excelente negócio)
```

**Por que é difícil de copiar**: Recorrência só funciona com matching de qualidade e supply confiável. Competidores precisam dos dois para oferecer isso — e nós chegaremos lá primeiro.

---

### 3. Matching por IA como Produto Diferenciador

O matching de qualidade é o que transforma uma busca em conversão, e uma conversão em recorrência.

**Nossa vantagem**:
- Dados de qualidade de resultado (não só transações — comportamento, preferências, outcomes)
- Feature store com 50+ sinais por prestador
- Modelo de ranking que otimiza para LTV, não apenas conversão imediata
- Fairness algorithms que garantem distribuição equitativa (sustentabilidade do supply)

**O data flywheel**:
```
Cada booking → mais dados → modelo melhor → matching melhor → mais bookings
```

Após 500k bookings (18-24 meses), nosso modelo de matching é fundamentalmente superior a qualquer entrada no mercado — e a lacuna cresce a cada dia.

---

### 4. Plataforma Financeira para Prestadores Autônomos

O prestador autônomo no Brasil não tem acesso a crédito, seguro, ou gestão financeira adequada. Somos a única plataforma que resolve o problema de renda E o problema de infraestrutura financeira.

**Produtos financeiros roadmap**:
- Conta digital com cartão de débito (saldo direto da plataforma)
- Adiantamento de recebíveis (trabalhou hoje, recebe hoje por 2% de taxa)
- Seguro de saúde e acidentes (grupo com melhores condições por volume)
- Previdência privada facilitada (desconto automático por % da renda)
- Crédito para equipamentos (financiamento embutido na plataforma)

**Por que isso aumenta o valuation**:
- Revenue de serviços financeiros tem margens 3-5x maiores que comissão
- Cria dependência econômica saudável (o prestador usa nossa conta como conta principal)
- Dados de fluxo financeiro melhoram o credit scoring para produtos futuros
- Um prestador com conta, crédito e seguro nossa nunca vai para o concorrente

---

### 5. Operational Excellence como Barreira de Entrada

"Move fast and break things" não funciona quando você está lidando com o lar das pessoas.

**Nosso diferencial operacional**:
- City Playbook: processo documentado e replicável para lançar nova cidade em 60 dias
- Ops de verificação: triagem de prestadores com < 3 dias de espera e > 85% de aprovação nos qualificados
- Customer Success proativo: identificamos e resolvemos problemas antes do cliente reclamar
- Incident response: protocolo claro para cada tipo de incidente (dano, roubo, no-show)

**Resultado**: CAC de expansão 70% menor após a 3ª cidade. Payback period de 4 meses em cidades novas (vs. 18 meses na cidade pioneira).

---

## AS 10 MAIORES PRIORIDADES DE IMPLEMENTAÇÃO

### 1. Trust Stack Completo (Semanas 1-8)

**Por que é prioridade #1**: Sem trust, nada mais funciona. Um único incidente sério no início destrói o produto antes de decolar.

**O que construir**:
- Verificação de identidade (integração com Bureau ou Unico.io)
- Checagem de antecedentes criminais (Serasa/Certidão)
- Processo de aprovação/rejeição documentado
- Política de garantia de satisfação escrita e publicada
- Protocolo de atendimento a incidentes (quem faz o quê em < 1h)

**Critério de sucesso**: Primeiros 100 prestadores verificados com < 5% de incidentes de qualidade.

---

### 2. MVP com Zero Bugs Críticos (Semanas 4-12)

**Por que é prioridade #2**: Bugs em fluxo de pagamento ou agendamento destroem a confiança antes de qualquer incidente físico.

**Fluxos que devem funcionar perfeitamente**:
- Busca → Seleção de prestador → Agendamento → Pagamento → Confirmação
- Notificação ao prestador → Aceite → Lembrete D-1 → Check-in → Completion → Review

**Zero tolerance** para:
- Double-charge em pagamentos
- Agendamento sobreposto
- Notificações não entregues
- Review enviada para prestador errado

---

### 3. Modelo de Recorrência no MVP (Semanas 8-16)

**Por que é prioridade #3**: Cada cliente que não sai como cliente recorrente é 10x menos valioso. Recorrência deve estar no produto desde o dia 1.

**Implementar**:
- Na tela de conclusão de booking: "Agendar próxima vez?"
- Recorrência automática (mesmo prestador, mesma frequência, mesmo horário)
- Lembrete automático 48h antes
- Easy reschedule se conflito

**Meta**: 30% dos clientes com ao menos 1 recorrência ativa em 60 dias.

---

### 4. Supply de Qualidade antes de Demand (Semanas 1-6)

**Por que é prioridade #4**: Se você abrir para clientes sem supply suficiente, o primeiro cliente não encontra prestador e nunca mais volta.

**Regra de ouro**: Nunca abrir novas zonas para clientes sem ao menos 15 prestadores verificados por categoria.

**O que fazer**:
- Pré-recrutamento intensivo (WhatsApp, grupos de Facebook, parcerias com cursos técnicos)
- Verificação em massa antes do lançamento
- Pagar primeiros 50 prestadores por completar o onboarding (R$ 50-100 de crédito)

---

### 5. Instrumentação Completa de Analytics (Semanas 4-8)

**Por que é prioridade #5**: Dados coletados hoje são o moat de amanhã. Não há segunda chance de capturar impressões e comportamentos da fase inicial.

**Instrumentar obrigatoriamente**:
- Eventos de funil completo (busca → booking → completion → review)
- Posição de cada prestador mostrado em cada resultado
- Tempo de visualização por prestador
- Todos os eventos de matching (para futura ML)

**Ferramenta recomendada**: PostHog (self-hosted) para controle total dos dados.

---

### 6. Payments Robusto com Experiência de Classe Mundial (Semanas 6-12)

**Por que é prioridade #6**: Um checkout que falha é receita perdida E trust destruído.

**Implementar**:
- Pix (obrigatório — 70%+ dos pagamentos no Brasil)
- Cartão de crédito com parcelamento (importante para tickets acima de R$ 200)
- Saved cards (para recorrência sem reentrar dados)
- Reembolso em < 24h (automático quando possível)

---

### 7. Notificações Omnichannel com Alta Confiabilidade (Semanas 8-14)

**Por que é prioridade #7**: Em um marketplace de serviços, cada notificação perdida pode resultar em no-show.

**Implementar com redundância**:
- WhatsApp Business API (maior confiabilidade no Brasil)
- Push notification (para quem tem o app)
- SMS como fallback (para notificações críticas)
- Email para confirmações e recibos

**Regra**: Nunca depender de um único canal para notificações críticas (confirmação, lembrete D-1).

---

### 8. Reviews e Reputation System (Semanas 10-16)

**Por que é prioridade #8**: Reviews são o combustível de confiança. Sistema mal implementado (compra de reviews, reviews falsas) destrói o valor do ativo em meses.

**Implementar**:
- Reviews somente após booking confirmado como "completado"
- Review bidirecional (cliente avalia prestador E prestador avalia cliente)
- Moderação automática + humana para reviews suspeitas
- Resposta do prestador à review (engagement e transparência)
- Display de rating bayesiano (não média simples)

---

### 9. Matching Algorithm v1 (Semanas 6-12)

**Por que é prioridade #9**: Um matching ruim = clientes frustrados com resultados irrelevantes = baixa conversão.

**Implementar Fase 1 (heurístico)**:
- Fórmula de weighted scoring conforme BLOCO D
- Filtros hard (distância, disponibilidade, categoria)
- Ordenação por score
- Diversificação básica (não mostrar só os mesmos prestadores sempre)

**Meta**: Fill rate > 25% na primeira semana de operação com usuários reais.

---

### 10. Operational Dashboard para Gestão da Plataforma (Semanas 8-16)

**Por que é prioridade #10**: Sem visibilidade da operação, problemas crescem silenciosamente até virar crises.

**Métricas visíveis em real-time**:
- Bookings em cada status (pending, confirmed, in-progress, completed)
- Fill rate por zona/categoria
- Prestadores disponíveis agora por zona
- Alertas: zona com fill rate < 20%, prestador com 3+ cancelamentos essa semana
- Fila de disputes abertas (SLA de resolução)

---

## OS 10 MAIORES RISCOS

### Matriz de Riscos

| # | Risco | Probabilidade | Impacto | Score | Mitigação |
|---|---|---|---|---|---|
| 1 | Incidente grave de segurança | Média (20%) | Catastrófico | 9/10 | Verificação rigorosa, seguro, protocolo 24/7 |
| 2 | Disintermediação em escala | Alta (60%) | Alto | 8/10 | Valor add impossível de replicar offline |
| 3 | CAC > LTV sem discovery early | Média (35%) | Alto | 7/10 | Monitorar cohorts semanalmente, cortar canais ruins |
| 4 | Key prestadores migrando para concorrente | Média (30%) | Alto | 7/10 | Programa de fidelidade, exclusividade top 50 |
| 5 | Regulamentação adversa | Baixa (15%) | Alto | 6/10 | Compliance proativo, jurídico especializado |
| 6 | Fraude em pagamentos | Média (40%) | Médio | 6/10 | ML de fraude, limites de saque, KYC |
| 7 | Concorrente capitalizado entrando | Baixa (20%) | Alto | 6/10 | Velocidade de execução, moat de dados |
| 8 | Problemas de liquidez por zona | Alta (50%) | Médio | 6/10 | Alertas automáticos, boosting de supply proativo |
| 9 | Contratação de time-chave | Média (35%) | Médio | 5/10 | Comp competitivo, equity, cultura forte |
| 10 | Dependência excessiva de Google/FB Ads | Alta (65%) | Médio | 5/10 | Diversificação: referral, organic, B2B |

### Planos de Contingência para Top 3

**Risco #1 — Incidente grave de segurança**:
- Protocolo ativado em < 1h após reporte
- Comunicação transparente com usuários em < 4h
- CEO disponível para mídia em caso de repercussão
- Fundo de reserva de R$ 50k para indenizações imediatas
- Revisão completa do processo de verificação em < 72h

**Risco #2 — Disintermediação**:
- Garantias que o canal online oferece e o offline não: seguro, pagamento parcelado, histórico, avaliações verificadas
- Monitorar "taxa de saída": clientes que têm menos de 3 bookings e somem
- Para prestadores: ferramentas de gestão (agenda, financeiro) que só fazem sentido dentro da plataforma
- Para clientes: histórico de serviços, preferências salvas, recorrência automática

**Risco #3 — CAC > LTV**:
- Dashboard de cohort analysis atualizado semanalmente
- Stop/go automático em campanhas com payback > 18 meses
- 3 triggers de alerta precoce: D30 retention < 20%, D60 repeat rate < 15%, reviews médias < 4.0
- Plano de contingência: reduzir paid acquisition, dobrar em referral e organic

---

## A SEQUÊNCIA IDEAL DE EXECUÇÃO

### Semanas 1-4: Pré-lançamento

**Semana 1 — Fundação**:
- [ ] Constituição jurídica da empresa (CNPJ, conta PJ)
- [ ] Contratar engenheiro de backend sênior #1
- [ ] Definir stack tecnológico e infraestrutura base
- [ ] Iniciar processo de integração com gateway de pagamento (Asaas/PagSeguro)
- [ ] Contratar advogado trabalhista para estrutura de contratação de prestadores

**Semana 2 — Estrutura técnica**:
- [ ] Repositório criado, CI/CD configurado
- [ ] Schema de banco de dados (baseado no Prisma schema do BLOCO_SCHEMA)
- [ ] Autenticação básica (JWT + OTP por SMS/email)
- [ ] Definir política de verificação de prestadores

**Semana 3 — Supply acquisition**:
- [ ] Pré-cadastro de prestadores (landing page simples + WhatsApp)
- [ ] Iniciar processo de verificação dos primeiros 50 candidatos
- [ ] Parcerias com 2-3 grupos de WhatsApp de prestadores em SP
- [ ] Contratar Ops Manager de verificação (meio período inicialmente)

**Semana 4 — Produto básico**:
- [ ] Fluxo de busca e listagem de prestadores
- [ ] Perfil do prestador (com fotos, bio, categorias, avaliação placeholder)
- [ ] Fluxo de agendamento (data, hora, endereço)
- [ ] Integração de pagamento funcionando em sandbox

### Semanas 5-8: Alpha (50 beta users)

**Semana 5-6**:
- [ ] Pagamento em produção (Pix obrigatório)
- [ ] Notificações WhatsApp funcionando (confirmação, lembrete)
- [ ] App mobile (React Native ou Flutter, iOS prioritário)
- [ ] 50 prestadores verificados no banco
- [ ] Onboard 50 clientes beta (amigos, família, colegas)

**Semana 7-8**:
- [ ] Corrigir bugs críticos descobertos no alpha
- [ ] Fluxo de review (cliente avalia prestador)
- [ ] Dashboard de operações básico
- [ ] Coletar NPS dos primeiros 50 bookings
- [ ] Definir go/no-go para lançamento público

### Semanas 9-12: Launch (lançamento público)

**Semana 9-10**:
- [ ] Campanha de lançamento (Instagram + influenciadores de lifestyle SP)
- [ ] PR básico (nota de imprensa para blogs de tech/startup)
- [ ] Google Ads Search para primeiros clientes
- [ ] Meta de: 500 clientes cadastrados, 100 primeiros bookings

**Semana 11-12**:
- [ ] Análise dos primeiros 100 bookings (completion rate, rating, churn)
- [ ] Ajustes de produto baseados no feedback real
- [ ] Primeiro relatório de cohort (quem voltou, quem sumiu)
- [ ] Decisão: expandir ou otimizar?

### Mês 2-3: Otimização

- [ ] Lançar recorrência (feature de agendamento recorrente)
- [ ] Implementar weighted matching scoring (Fase 1)
- [ ] Programa de referral (cliente indica, ganha R$ 30 em crédito)
- [ ] Meta mês 3: R$ 100k GMV, fill rate > 25%

### Mês 4-6: Aceleração

- [ ] Adicionar 2ª categoria (Encanamento ou Elétrica)
- [ ] Expandir para bairros adjacentes (da Vila Madalena para Pinheiros/Itaim)
- [ ] Contratar segundo engenheiro full-stack
- [ ] Implementar analytics dashboard completo
- [ ] Meta mês 6: R$ 300k GMV, 500 prestadores verificados

### Mês 7-12: Preparação para Série A

- [ ] 8 categorias ativas em SP
- [ ] Fill rate > 35%, NPS > 45
- [ ] LTV/CAC > 3x (medido em cohorts)
- [ ] Deck de Série A pronto
- [ ] Processo de fundraising iniciado
- [ ] Meta mês 12: R$ 800k GMV/mês

---

## O QUE CONSTRUIR PRIMEIRO PARA MAXIMIZAR VALOR

### A Análise 80/20

**80% do valor do negócio vem de 20% das features**. Esse é o 20%:

#### #1 — Confiança (40% do valor total)

Sem isso, nada mais importa:
```
Mínimo viável de confiança:
✓ Verificação de identidade (CPF + foto de rosto)
✓ Checagem básica de antecedentes (Serasa eCPF)
✓ Garantia escrita de satisfação
✓ Suporte humano em < 4h

Não necessário no MVP:
✗ Verificação de referências profissionais
✗ Teste de competência técnica
✗ GPS em tempo real do prestador
✗ Seguro integrado
```

#### #2 — Recorrência (25% do valor total)

Uma feature simples que multiplica o LTV por 10:
```
Mínimo viável de recorrência:
✓ Pergunta pós-booking: "Agendar de novo com mesma prestadora?"
✓ Frequência: semanal, quinzenal, mensal
✓ Notificação automática 48h antes
✓ Easy reschedule

Não necessário no MVP:
✗ Gestão avançada de recorrências
✗ Pausar/retomar com data
✗ Substituição automática de prestador indisponível
```

#### #3 — Matching de Qualidade (20% do valor total)

Uma busca que mostra os prestadores certos na ordem certa:
```
Mínimo viável de matching:
✓ Filtro por distância (< raio do prestador)
✓ Filtro por disponibilidade
✓ Ordenação por rating + distância (básico)

Não necessário no MVP:
✗ ML de ranking
✗ Personalização por cliente
✗ Preço dinâmico
```

#### #4 — Pagamento Sem Atrito (15% do valor total)

Qualquer atrito no checkout mata a conversão:
```
Mínimo viável de pagamento:
✓ Pix (obrigatório)
✓ Cartão de crédito
✓ Confirmação imediata
✓ Reembolso claro

Não necessário no MVP:
✗ Parcelamento
✗ Carteira digital própria
✗ Pagamento parcelado
```

### O que definitivamente NÃO construir no MVP

- ~~Aplicativo de Prestador nativo~~ → WhatsApp + web funciona por 6 meses
- ~~Chat in-app~~ → WhatsApp resolve 95% das comunicações
- ~~Sistema de precificação dinâmica~~ → preço fixo funciona no MVP
- ~~Dashboard de analytics para prestadores~~ → relatório simples por email
- ~~Sistema de indicações complexo~~ → cupom de referral manual funciona
- ~~Múltiplas formas de pagamento~~ → Pix + 1 cartão é suficiente

### A Regra de Ouro

> "O MVP não é a versão menor do produto final. É a menor versão do produto que entrega o valor central ao cliente."

**O valor central**: "Encontre um prestador confiável e agende com 3 cliques."

Tudo que não contribui para isso pode esperar.
