# NEXO AI Python

Microservico local da Fase 9 para analise financeira avancada do NEXO.

## Ambiente recomendado

Para ter o setup mais estavel e eficiente, rode este servico em:

- `WSL`
- `Python 3.12`

Evite usar `Python 3.14` para este servico neste momento. O stack atual
(`pandas`, `numpy`, `scikit-learn`, `prophet`) pode falhar com dependencias
binarias nativas nesse ambiente, especialmente no Windows puro.

## Stack

- `FastAPI`
- `pandas`
- `scikit-learn`
- `prophet`
- `pytest`

## Setup local recomendado

No WSL:

```bash
cd /mnt/c/END0-SYM/project/nexo\ project/nexo/services/nexo-ai-python
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Rodar o servico

Da raiz do projeto:

```bash
pnpm dev:py
```

Ou diretamente:

```bash
uvicorn app.main:app --reload --port 8001 --app-dir services/nexo-ai-python
```

## Health check

```bash
curl http://127.0.0.1:8001/health
```

## Testes

Da raiz do projeto:

```bash
pnpm check:py
pnpm test:py
```

## Nota sobre o Windows puro

Hoje o repositorio ja compila o codigo Python, mas a execucao completa dos testes
com `pandas/numpy` pode falhar em `Python 3.14` no Windows devido a DLLs nativas.
Se isso acontecer, use `WSL + Python 3.12`, que e o caminho recomendado para esta
fase pesada de IA.
