# claude-plugins

Plugins do Claude Code mantidos por Bruno Marino (marketplace `plugins-bruno`).

| Plugin | O que faz |
| --- | --- |
| [uso-sessao](./uso-sessao) | Barra azul acima do prompt com o uso dos limites (sessão de 5 h e semana) e o horário do próximo reset |
| [resources-monitor](./resources-monitor) | Painel na lateral direita com uso de CPU, memória e disco em tempo real, em âmbar |

## Instalação

No prompt de uma sessão do Claude Code no terminal:

```
/plugin install uso-sessao --marketplace bmarino01/claude-plugins
/plugin install resources-monitor --marketplace bmarino01/claude-plugins
```

Responda `y` para adicionar o marketplace e escolha o escopo (usuário, para valer em todos os projetos).

Para receber versões novas depois: `claude plugin marketplace update plugins-bruno` e `/reload-plugins`.
