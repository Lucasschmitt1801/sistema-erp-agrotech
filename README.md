# 🐴 Haras do Sul - ERP & PDV Agronegócio

> Sistema de gestão completo (Fullstack) focado em performance e resiliência para o varejo rural.

![Status do Projeto](https://img.shields.io/badge/Status-Em_Desenvolvimento-yellow) ![Next.js](https://img.shields.io/badge/Next.js-14-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
[![Deploy](https://img.shields.io/badge/Ver_Projeto_Online-000?style=for-the-badge&logo=vercel&logoColor=white)](https://fabrica-gestao.vercel.app/login)

## 🎯 O Problema
O varejo rural enfrenta um desafio constante: a necessidade de operar digitalmente em locais onde a conexão com a internet é instável ou inexistente. Planilhas e cadernos ainda eram a norma, gerando erros de caixa e falta de controle de estoque.

## 🚀 A Solução
Uma aplicação Web Progressiva (PWA concept) que atua como **Frente de Caixa (PDV)** e **Gestor Administrativo**. O sistema foi desenhado para garantir que a venda nunca pare, independentemente da conexão.

### Principais Funcionalidades

* **📡 Modo Offline Robusto:** Sistema de sincronização inteligente. Vendas feitas sem internet são salvas localmente e enviadas ao servidor automaticamente quando a rede retorna.
* **💰 PDV com Cálculos Complexos:** Calculadora financeira integrada que projeta juros de parcelamento no cartão de crédito em tempo real.
* **📱 Mobile First:** Interface desenhada para tablets e smartphones, facilitando o uso em campo ou no balcão.
* **📊 Dashboard Gerencial:** Gráficos de fluxo de caixa, ticket médio e alertas de estoque baixo.

## 🛠️ Tecnologias Utilizadas

O projeto utiliza uma stack moderna focada em performance e tipagem estática:

* **Frontend:** [Next.js 14](https://nextjs.org/) (App Router)
* **Linguagem:** TypeScript
* **Estilização:** Tailwind CSS & Lucide React (Ícones)
* **Backend / BaaS:** [Supabase](https://supabase.com/) (PostgreSQL, Auth, Realtime)
* **Charts:** Recharts
* **Deploy:** Vercel

## 📸 Screenshots

*(Espaço reservado: Coloque aqui prints da tela do PDV e do Dashboard)*

## 🧠 Destaque Técnico: Como funciona o Offline?
O sistema utiliza uma estratégia de **Queue Sync** (Fila de Sincronização):
1.  A aplicação monitora o estado da rede (`navigator.onLine`).
2.  Se offline, os dados da transação são serializados e armazenados no `LocalStorage`.
3.  Um *Event Listener* detecta o retorno da conexão e dispara o processamento da fila, enviando os dados para o Supabase em lote.

---
Desenvolvido por **Lucas Renato Schmitt**
