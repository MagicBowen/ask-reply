const AixBot = require('aixbot');
const fs = require('fs');

const aixbot = new AixBot('317390438728205312');

aixbot.use(async (ctx, next) => {
    console.log(`process request for '${ctx.request.query}' ...`);
    var start = new Date().getTime();
    await next();
    var execTime = new Date().getTime() - start;
    console.log(`... response in duration ${execTime}ms`);
});

aixbot.onEvent('enterSkill', (ctx) => {
    ctx.query('你好，请开始录音').record();
});

aixbot.onEvent('recordFinish', (ctx) => {
    console.log('in record finish');
    let asr = ctx.request.body.request.event_property.asr_text;
    let msgId = ctx.request.body.request.event_property.msg_file_id;
    console.log(`query in record finish : ${ctx.request.query}`);
    console.log(`asr text in record finish : ${asr}`);
    console.log(`msg id in record finish : ${msgId}`);
    ctx.speak(asr).playMsgs([msgId]).wait();
});

aixbot.onEvent('recordFail', (ctx) => {
    console.log('in record fail');
    ctx.query('录音失败，请重录').record();
});

aixbot.onEvent('quitSkill', (ctx) => {
    console.log('in quit skill');
    ctx.reply('再见').closeSession();
});

aixbot.hears(/\w+/, (ctx) => {
    console.log('in echo');
    ctx.speak(ctx.request.query);
});

let tlsOptions = {
    key: fs.readFileSync('./keys/1522555444697.key'),
    cert: fs.readFileSync('./keys/1522555444697.pem')
};

aixbot.run(8086, '0.0.0.0', tlsOptions);