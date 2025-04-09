const { Telegraf, Markup } = require('telegraf')
require('dotenv').config()
const text=require('./const')
const schedule=require('node-schedule')

const bot = new Telegraf(process.env.BOT_TOKEN)

module.exports = (req, res) => {
    if (req.method === 'POST') {
      bot.handleUpdate(req.body); 
      res.status(200).send('OK');
    } else {
      res.status(404).send('Not Found');
    }
  };
  
const userStates={}

function getUserLocalTime(timezone, hours, minutes) {
    const date = new Date();
    const userOffset = new Date().toLocaleString("en-US", { timeZone: timezone });
    const userDate = new Date(userOffset);
    userDate.setHours(hours);
    userDate.setMinutes(minutes);
    
    return userDate;
}


bot.command('start', async (ctx) => {
    try{
    await ctx.replyWithHTML(`Привет, ${ctx.message.from.first_name ? ctx.message.from.first_name : 'незнакомец' }! ${text.text1}`
, Markup.inlineKeyboard(
    [Markup.button.callback('Да', 'btn_1')]
))
} catch(e) {
    console.error(e)
}
})

 bot.action('btn_1', async (ctx) => {
    try {
        await ctx.answerCbQuery();
        await ctx.editMessageReplyMarkup(
            Markup.inlineKeyboard([
                [Markup.button.callback('Да', 'btn_1_disabled')]
            ])
        );
        await ctx.replyWithHTML('Укажи время в формате hh:mm (например 08:00), когда ты просыпаешься.');
        userStates[ctx.from.id] = { state: 'waitingForWakeUpTime' };
  } catch (e) {
    console.error(e);
  }
});
        bot.on('text', async (ctx) => {
            const userId = ctx.from.id;
            const userTime = ctx.message.text.trim();
            const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;

            if (userStates[userId] && userStates[userId].state === 'waitingForWakeUpTime') {    
            if (timeRegex.test(userTime)) {
                const [hours, minutes] = userTime.split(':').map(Number);
                const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                const userLocalTime = getUserLocalTime(userTimezone, hours, minutes);
                
                const morning = schedule.scheduleJob(userLocalTime, function () {
                    goodMorning(ctx, userTimezone);
                });
                await ctx.replyWithHTML(`Понятно, в ${userLocalTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}.`);
                userStates[userId].state = 'waitingForSleepTime';
                await ctx.replyWithHTML('Укажи время в формате hh:mm (например 21:00), когда ты ложишься спать.')
            } else {
                await ctx.replyWithHTML('Неверный формат времени. Пожалуйста, используй формат hh:mm (например, 08:00).');
            }
        }
        else if (userStates[userId] && userStates[userId].state === 'waitingForSleepTime') {
            if (timeRegex.test(userTime)) {
                const [hours, minutes] = userTime.split(':').map(Number);
                const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                const userLocalTime = getUserLocalTime(userTimezone, hours, minutes);
                
                const night = schedule.scheduleJob(userLocalTime, function () {
                  goodNight(ctx, userTimezone);
                });
                await ctx.replyWithHTML(`Понятно, в ${userLocalTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}.`);
                delete userStates[userId];
            } else {
                await ctx.replyWithHTML('Неверный формат времени. Пожалуйста, используй формат hh:mm (например, 21:00).');
              }
            }
          });
        
function goodMorning(ctx, userTimezone) {
    const imagePath = `./imgMorning/${Math.floor(Math.random() * 10)}.jpg`;
    const textMessage = text.text2; 
    ctx.replyWithPhoto({ source: imagePath }).then(()=>{
    ctx.replyWithHTML(textMessage);
    })
}
function goodNight(ctx, userTimezone) {
    const imagePath = `./imgNight/${Math.floor(Math.random() * 10)}.jpg`;
    const textMessage = text.text3; 
    ctx.replyWithPhoto({ source: imagePath }).then(()=>{
    ctx.replyWithHTML(textMessage);
    })
}

 bot.launch()
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))