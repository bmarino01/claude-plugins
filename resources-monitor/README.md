# resources-monitor

A Claude Code panel on the right side with the machine's CPU, memory and disk usage, refreshed every second, in black and white:

```
CPU (1 core)
█░░░░░░░░░░░░░   2.1%

Memory
████████░░░░░░  57.5%
0.58 / 1.00 GiB

Disk (/)
████████████░░  83.9%
6.17 / 7.36 GiB
```

- CPU and memory come from `/proc/stat` and `/proc/meminfo` (Linux); used memory is `MemTotal − MemAvailable`, so cache is not counted.
- Disk is the root `/`, read with `df` every 5 s.
- From 85% on, the percentage gets a `!`.
- In the terminal's fullscreen mode the panel docks beside the conversation from 110 columns and opens by itself from 144; `/resources-monitor` opens it at any width.

## Install

At the prompt of a Claude Code session in the terminal:

```
/plugin install resources-monitor --marketplace bmarino01/claude-plugins
```

Answer `y` to add the marketplace and pick the scope (user, to have it in every project).

## Checks

```
claude plugin validate /root/claude-plugins/resources-monitor
```
