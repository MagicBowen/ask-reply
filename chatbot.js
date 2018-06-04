const postJson = require('./postjson');

class Chatbot {
    constructor(agent, uri) {
        this.agent = agent;
        this.uri = uri;
    }
    
    async replyToText(user, text) {
        let data = { query   : { query : text, confidence : 1.0 }, 
                     session : user.user_id, 
                     agent   : agent, 
                     userContext : { access_token : user.access_token } };

        let response = await postJson(this,uri, data)
        return formatResponse(response);
    }

    async replyToRecord(user, asr, fileId) {
        let data = { query   : { query : asr, confidence : 1.0 }, 
                     session : user.user_id, 
                     agent   : agent, 
                     userContext : { access_token : user.access_token, file_id : fileId } };

        let response = await postJson(this,uri, data)
        return formatResponse(response);        
    }
    
    async replyToEvent(user, eventType, params) {
        let data = { event   : { name : eventType, content : params },
                     session : user.user_id, 
                     agent   : agent, 
                     userContext : { access_token : user.access_token } };

        let response = await postJson(this.uri, data)
        return formatResponse(response);
    }

    formatResponse(response) {
        if (response.reply) {
            response.reply = this.concatReplies(response.reply);
        }
    }

    concatReplies(replies) {
        let result = '';
        for(let i = 0; i < replies.length; i++) {
            result += replies[i];
        }
        return result;
    }
}

module.exports = Chatbot;