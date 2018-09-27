const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const token = require('./token.js');

const state = require('./stats.json');
const chats = require('./chats.json');

const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/klick/, (msg, match) => {
  const chatId = msg.chat.id;
  let userObj;
  // Checks whether a message has been received from this chat
  if (chats[chatId]) {
    // Find the user's record, if any
    userObj = state.user.find(member => member.id === chats[chatId][0]);
    if (!userObj) {
      // If the id has not been found, try name
      userObj = state.user.find(member => member.name === chats[chatId][1]);
      if (userObj) {
        // If the user is found by name, store their id
        userObj.id = chats[chatId][0];
      }
    }
    if (userObj) {
      // If the user has been found, increment the count by 1
      userObj.count += 1;
    } else {
    // Otherwise, create a new user and initialize their count with 1
      const newUser = {};
      newUser.id = chats[chatId][0];
      newUser.name = chats[chatId][1];
      newUser.count = 1;
      state.user.push(newUser);
      userObj = newUser;
    }
    fs.writeFileSync('stats.json', JSON.stringify(state));
    bot.sendMessage(chatId, `Klicken har registrerats. ${userObj.name}${userObj.name.endsWith('s') ? '' : 's'} klicks: ${userObj.count}`);
  } else {
    // Nothing to click
    bot.sendMessage(chatId, 'Fel: Inget meddelande har mottagits!');
  }
});

bot.onText(/\/resultat/, (msg, match) => {
  const chatId = msg.chat.id;
  let resultStr = '*Resultat*\n';

  state.user.sort((a, b) => parseInt(b.count, 10) - parseInt(a.count, 10));
  state.user.forEach((member) => { resultStr += `${member.name}: ${member.count}\n`; });
  bot.sendMessage(chatId, resultStr, { parse_mode: 'Markdown' });
});

bot.onText(/\/gdpr/, (msg, match) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Allmän dataskyddsförordning, Artikel 2.2 c:'
                        + 'Denna förordning ska inte tillämpas på behandling av personuppgifter '
                        + 'som en fysisk person utför som ett led i verksamhet av rent privat '
                        + 'natur eller som har samband med hans eller hennes hushåll.');
});

bot.on('message', (msg) => {
  if (msg.entities) {
    // Ignore bot commands
    if (msg.entities.find(member => member.type === 'bot_command')) return;
  }
  if (msg.text && !msg.from.is_bot && msg.chat.type !== 'private') {
    if (msg.from.first_name.length > 0) {
      chats[msg.chat.id] = [msg.from.id, msg.from.first_name];
      fs.writeFileSync('chats.json', JSON.stringify(chats));
    }
  }
});
