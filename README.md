# Numerologia Cabala

## Instalação

```bash
git clone https://github.com/seuusuario/seurepo.git
cd numerologia-cabala
npm install
```

## Configuração

1. Copie `.env.example` para `.env.local` e preencha com suas chaves reais.
2. Coloque sua chave do Google Cloud em `config/chave.json` (não suba para o GitHub).
3. Para autenticação local, edite `lib/auth.js` e cole o hash gerado pelo script `scripts/generate-hash.js`.

## Scripts

- `npm run dev` — inicia em modo desenvolvimento
- `npm run build` — build de produção
- `npm start` — inicia em produção

## Segurança

- **Nunca suba arquivos sensíveis** como `.env.local`, `lib/auth.js` com hash real, ou `config/chave.json` para o repositório.
