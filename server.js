const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const token = require('token.js');

let state = require('./stats.json');
let chats = require('./chats.json');

const bot = new TelegramBot(token, {polling: true});

bot.onText(/\/klick/, (msg, match) => {
  const chatId = msg.chat.id;
  if (chats[chatId]) {
	if (state[chats[chatId]]) {
	  state[chats[chatId]]++;
	} else {
	  state[chats[chatId]] = 1;
	}
	fs.writeFileSync('stats.json', JSON.stringify(state));
	bot.sendMessage(chatId, "Klicken har registrerats. " + (chats[chatId].endsWith("s") ? chats[chatId] : chats[chatId] + "s") + " klicks: " + state[chats[chatId]]);
  } else {
	bot.sendMessage(chatId, "Fel: Inget meddelande har mottagits!");
  } 
});

bot.on('message', (msg) => {
  if (msg.entities) return;
  if (msg.text && !msg.from.is_bot && msg.chat.type != "private") {
    if (msg.from.first_name.length > 0) {
	  chats[msg.chat.id] = msg.from.first_name;
	  fs.writeFileSync('chats.json', JSON.stringify(chats));
    }
  }
});
