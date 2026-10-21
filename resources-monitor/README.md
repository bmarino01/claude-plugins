# resources-monitor

Painel na lateral direita do Claude Code com o uso de CPU, memória e disco da máquina, atualizado a cada segundo, em âmbar:

```
CPU (1 núcleo)
██████░░░░░░░░░░░░░░  27.4%
▁▂▂▃▅▃▂▁▁▂▃▄▃▂▁▁▂▂▃▂

Memória
███████████░░░░░░░░░  60.9%
0.61 / 1.00 GiB
▅▅▅▅▆▆▆▆▆▆▅▅▅▅▅▅▆▆▆▆

Disco (/)
████████████████░░░░  84.0%
6.17 / 7.36 GiB
```

- CPU e memória vêm de `/proc/stat` e `/proc/meminfo` (Linux); a memória usada é `MemTotal − MemAvailable`, sem contar cache.
- O disco é o da raiz `/`, lido com `df` a cada 5 s.
- As barras ficam vermelhas a partir de 85%; os gráficos mostram os últimos 60 s.
- O painel fica fixo ao lado da conversa no modo fullscreen do terminal a partir de 110 colunas e abre sozinho a partir de 144; `/resources-monitor` o abre a qualquer largura.

## Instalação

No prompt de uma sessão do Claude Code no terminal:

```
/plugin install resources-monitor --marketplace bmarino01/claude-plugins
```

Responda `y` para adicionar o marketplace e escolha o escopo (usuário, para valer em todos os projetos).

## Testes

```
claude plugin validate /root/claude-plugins/resources-monitor
```
