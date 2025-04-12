# 🎯 Mudae Sniper - Auto Claim & Kakera Sniper

Um script feito com `discord.js-selfbot-v13` que automatiza o claim de personagens e o snipe de kakera no bot [Mudae](https://top.gg/bot/432610292342587392), respeitando os limites de claim e cooldowns do sistema.

> ⚠️ Este projeto é apenas para fins educacionais. Use com responsabilidade e esteja ciente das regras da Mudae e do Discord.

---

## ✨ Funcionalidades

- 🤖 Autoclaim quando o usuário for mencionado.
- 💠 Sniper de kakera com valor mínimo configurável.
- 🕒 Controle de cooldown de claims (reseta a cada 3 horas, começando às 01:31).
- 🔘 Interação automática com botões de claim.
- 💬 Comando `!sniper` para ativar/desativar em tempo real.

---

## 🚀 Instalação

> Requisitos: Node.js (v16 ou superior) e uma conta com token de Selfbot (só use com a sua conta, por sua conta e risco).

```bash
git clone https://github.com/ryangustav/mudae-sniper.git
cd mudae-sniper
npm install
```

---

## ⚙️ Configuração

Edite o arquivo `config.json` com os seguintes campos:

```json
{
  "token": "SEU_TOKEN_AQUI",
  "guildId": "ID_DO_SERVIDOR",
  "minimunKakeraValue": 100
}
```

| Campo | Descrição |
|-------|-----------|
| `token` | Token da sua conta do Discord (selfbot). |
| `guildId` | ID do servidor onde o Mudae está. |
| `minimunKakeraValue` | Valor mínimo de kakera para snipar. |

---

## ▶️ Execução

Após configurar tudo, execute o script com:

```bash
node index.js
```

---

## 🔁 Reset de Claims

Este sniper respeita o limite de **1 claim a cada 3 horas**, com resets em horários fixos começando às **01:31**. O sistema bloqueia automaticamente qualquer tentativa de interação (click ou reação) fora do tempo permitido.

---

## ❗ Avisos

- Usar selfbots vai contra os [Termos de Serviço do Discord](https://discord.com/terms), podendo resultar em banimento.
- Este projeto **não deve ser usado em contas principais**.
- Não abuse do sistema e respeite os outros usuários no servidor.

---

## 💻 Autor

Desenvolvido por [@ryangustav](https://github.com/ryangustav)  
Contribuições são bem-vindas!

---

## 🛡️ Licença

Este projeto está licenciado sob a [MIT License](LICENSE).

---
