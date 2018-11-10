const AixBot = require('aixbot');
const fs = require('fs');
const Chatbot = require('./chatbot');
const logger = require('./logger').logger('index');

const aixbot = new AixBot();

aixbot.use(async (ctx, next) => {
    console.log(`receive from app: ${ctx.request.appId} request query: ${ctx.request.query} requestId : ${ctx.request.requestId}`);
    var start = new Date().getTime();
    await next();
    var execTime = new Date().getTime() - start;
    console.log(`... response in duration ${execTime}ms`);
});

aixbot.use(async (ctx, next) => {
    const chatbot = new Chatbot('question-answer', 'http://xiaoda.ai/water-drop/qa/');
    const reply = async (ctx, getResponse) => {
        const res = await getResponse();
        if (res.data && res.data.length > 0) {
            if (res.data[0].type === 'quit-app') return ctx.reply(res.reply).closeSession();
            if (res.data[0].type === 'start-record') {
                if (res.data[0]['audio-url']) {
                    return ctx.directiveTts(res.endReply).directiveAudio(res.data[0]['audio-url']).record();
                }
                return ctx.query(res.reply).record();
            }
            if (res.data[0].type === 'play-record') {
                const fileId = res.data[0]['file-id'];
                const content = res.data[0].content;
                const audio = res.data[0]['audio-url'];
                const needRecord = ((res.data.length > 1) && (res.data[1].type === 'start-record'));

                if (res.reply) {
                    ctx.directiveTts(res.reply);
                }
                if (fileId && fileId !== '') {
                    ctx.directiveRecord(fileId)
                } else if (content && content != '') {
                    ctx.directiveTts(content)
                }
                if (res.endReply) {
                    ctx.directiveTts(res.endReply)
                }
                if (audio) {
                    ctx.directiveAudio(audio)
                }
                if (needRecord) {
                    ctx.response.record()
                } else {
                    ctx.response.wait()
                }
            }
        }
        let ret = ctx.query(res.reply);
        console.log(`the reply is ${JSON.stringify(ret)}`);
        return ret;
    };
    ctx.replyToText = async () => {
        await reply(ctx, async () => {return await chatbot.replyToText(ctx.request.user, ctx.request.query)});
    };
    ctx.replyToEvent = async (eventName) => {
        await reply(ctx, async () => {return await chatbot.replyToEvent(ctx.request.user, eventName)});
    };
    ctx.replyToRecord = async () => {
        let asr = ctx.request.eventProperty.asr_text;
        let fileId = ctx.request.eventProperty.msg_file_id;
        await reply(ctx, async () => {return await chatbot.replyToRecord(ctx.request.user, asr, fileId)});
    };
    await next();
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

aixbot.onError((err, ctx) => {
    ctx.reply('内部错误，稍后再试').closeSession();
    logger.error(`error occurred: ${err}`);
    logger.error(`error stack: ${err.stack}`);
});

aixbot.run(8086);