# uso-sessao

Barra azul acima do prompt do Claude Code com o uso dos limites da conta e o horário do próximo reset, no horário de Brasília:

```
Sessão (5 h)    ████████░░░░░░░░░░░░    42%   reset às 16:00 (em 1h 12min)
Semana          ██░░░░░░░░░░░░░░░░░░    11%   reset seg 26/10 às 09:00 (em 5d 20h)
```

- Os números são as janelas `five_hour` e `seven_day` que a API informa a cada resposta (evento `session.measure`).
- O percentual fica âmbar a partir de 80% e vermelho a partir de 95%; a contagem regressiva anda a cada 30 s.

## Instalação

No prompt de uma sessão do Claude Code no terminal:

```
/plugin install uso-sessao --marketplace bmarino01/claude-plugins
```

Responda `y` para adicionar o marketplace e escolha o escopo (usuário, para valer em todos os projetos).

## Testes

```
claude plugin validate /root/claude-plugins/uso-sessao
claude plugin test /root/claude-plugins/uso-sessao
```
