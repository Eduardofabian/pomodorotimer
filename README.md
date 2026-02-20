# 🍅 Pomodoro & Flow Timer

Um timer de produtividade minimalista e funcional, inspirado no design do Notion. Este projeto oferece um cronômetro Pomodoro clássico, mas com flexibilidade para contagem progressiva (cronômetro) e gerador de áudio integrado para foco.

## ✨ Funcionalidades

- **Três Modos de Intervalo**: Foco (25 min), Pausa Curta (5 min) e Pausa Longa (10 min).
- **Modo Dual**: Escolha entre o timer regressivo (estilo Pomodoro) ou progressivo (estilo Cronômetro).
- **Gerador de Ruído Marrom (Brown Noise)**: Áudio gerado via Web Audio API para ajudar na concentração durante os períodos de foco.
- **Customização Visual**: Altere cores de fundo e fontes diretamente nas configurações para combinar com seu setup.
- **Sistema de Alarme**: Alerta visual e sonoro ao finalizar um ciclo.
- **Persistência**: Suas preferências de cores e volume são salvas no navegador (LocalStorage).

## 🚀 Como usar

1.  **Iniciar/Pausar**: Clique no botão "Start" para começar a contagem.
2.  **Alternar Modo**: Use o botão de ícone de relógio para alternar entre:
    * 🕒 **Timer**: Conta de 25:00 até 00:00.
    * ⏱️ **Cronômetro**: Conta de 00:00 até 25:00.
3.  **Configurações**: Clique na engrenagem (⚙️) para ativar o Ruído Marrom, ajustar o volume ou mudar o tema de cores.

## 🛠️ Tecnologias Utilizadas

- **HTML5**: Estrutura semântica.
- **CSS3**: Estilização com Flexbox, animações de alarme e design responsivo.
- **JavaScript (Vanilla)**: Lógica do timer, manipulação de DOM e persistência de dados.
- **Web Audio API**: Utilizada para gerar o ruído marrom e os tons do alarme de forma nativa, sem arquivos de áudio externos.
- **FontAwesome**: Ícones de interface.

## 📦 Como rodar o projeto localmente

1. Clone este repositório:
   ```bash
   git clone [https://github.com/SEU_USUARIO/NOME_DO_REPOSITORIO.git](https://github.com/SEU_USUARIO/NOME_DO_REPOSITORIO.git)
