const { Telegraf, Markup } = require('telegraf')
require('dotenv').config()
const text=require('./const')
const schedule=require('node-schedule')

const bot = new Telegraf(process.env.BOT_TOKEN)

const userStates={}
bot.command('start', async (ctx) => {
    try{
    await ctx.replyWithHTML(`Привет ${ctx.message.from.first_name ? ctx.message.from.first_name : 'незнакомец' }! ${text.text1}`
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
        await ctx.replyWithHTML('Укажи время в формате hh:mm (например, 08:00) когда ты просыпаешься.');
        userStates[ctx.from.id] = { state: 'waitingForWakeUpTime' };
  } catch (e) {
    console.error(e);
  }
});
        bot.on('text', async (ctx) => {
            const userId = ctx.from.id;
            if (userStates[userId] && userStates[userId].state === 'waitingForWakeUpTime') {
            const userTime = ctx.message.text.trim();
            const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;    
            if (timeRegex.test(userTime)) {
                const [hours, minutes] = userTime.split(':');
                const morning = schedule.scheduleJob(`${minutes} ${hours} * * *`, function () {
                    goodMorning(ctx);
                });
                await ctx.replyWithHTML(`Понятно, в ${userTime}.`);
                userStates[userId].state = 'waitingForSleepTime';
                await ctx.replyWithHTML('Укажи время в формате hh:mm (например, 21:00) когда ты ложишься спать.')
            } else {
                await ctx.replyWithHTML('Неверный формат времени. Пожалуйста, используй формат hh:mm (например, 08:00).');
            }
        }
        else if (userStates[userId] && userStates[userId].state === 'waitingForSleepTime') {
            const userTime = ctx.message.text.trim();
            const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
            if (timeRegex.test(userTime)) {
                const [hours, minutes] = userTime.split(':');
                const night = schedule.scheduleJob(`${minutes} ${hours} * * *`, function () {
                  goodNight(ctx);
                });
                await ctx.replyWithHTML(`Понятно, в ${userTime}.`);
                delete userStates[userId];
            } else {
                await ctx.replyWithHTML('Неверный формат времени. Пожалуйста, используй формат hh:mm (например, 21:00).');
              }
            }
          });
        
function goodMorning(ctx) {
    const imagePath = `./imgMorning/${Math.floor(Math.random() * 10)}.jpg`;
    const textMessage = text.text2; 
    ctx.replyWithPhoto({ source: imagePath });
    ctx.replyWithHTML(textMessage);
}
function goodNight(ctx) {
    const imagePath = `./imgNight/${Math.floor(Math.random() * 10)}.jpg`;
    const textMessage = text.text3; 
    ctx.replyWithPhoto({ source: imagePath });
    ctx.replyWithHTML(textMessage);
}

 bot.launch()
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))