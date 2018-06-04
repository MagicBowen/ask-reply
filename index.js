const AixBot = require('aixbot');
const Chatbot = require('./chatbot');
const fs = require('fs');

const aixbot = new AixBot('317390438728205312');

aixbot.use(async (ctx, next) => {
    console.log(`process request for '${ctx.request.query}' ...`);
    var start = new Date().getTime();
    await next();
    var execTime = new Date().getTime() - start;
    console.log(`... response in duration ${execTime}ms`);
});

aixbot.use((ctx, next) => {
    const chatbot = new Chatbot('question-answer', 'http://xiaoda.ai/kingsoft-demo/query');
    const reply = async (ctx, getResponse) => {
        const res = await getResponse();
        if (!res.data || !res.data.type) return ctx.query(res.reply);
        if (res.data.type === 'start-record') return ctx.query(res.reply).record();
        if (res.data.type === 'play-record') return ctx.query(res.reply).playMsgs([res.data['file-id']]);
    };
    ctx.replyToText = async () => {
        await reply(ctx, () => {chatbot.replyToText(ctx.request.user, ctx.request.query)});
    };
    ctx.replyToEvent = async (eventName) => {
        await reply(ctx, () => {chatbot.replyToEvent(ctx.request.user, eventName)});
    };
    ctx.replyToRecord = async () => {
        let asr = ctx.request.body.request.event_property.asr_text;
        let fileId = ctx.request.body.request.event_property.msg_file_id;
        await reply(ctx, () => {chatbot.replyToRecord(ctx.request.user, asr, fileId)});
    };
});

aixbot.onEvent('noResponse', async (ctx) =>{
    await ctx.replyToEvent('no-response');
});

aixbot.onEvent('enterSkill', async (ctx) => {
    await ctx.replyToEvent('open-app');
});

aixbot.onEvent('quitSkill', async (ctx) => {
    await ctx.replyToEvent('close-app');
});

aixbot.onEvent('inSkill', async (ctx) => {
    await ctx.replyToText();
});

aixbot.onEvent('recordFail', async (ctx) => {
    await ctx.replyToEvent('record-fail');
});

aixbot.onEvent('recordFinish', async (ctx) => {
    await ctx.replyToRecord();
});

let tlsOptions = {
    key: fs.readFileSync('./keys/1522555444697.key'),
    cert: fs.readFileSync('./keys/1522555444697.pem')
};

aixbot.run(8086, '0.0.0.0', tlsOptions);