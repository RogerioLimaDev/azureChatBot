/*-----------------------------------------------------------------------------
A simple echo bot for the Microsoft Bot Framework. 
-----------------------------------------------------------------------------*/

/*jshint esversion: 6 */


var restify = require('restify');
var builder = require('botbuilder');
var botbuilder_azure = require("botbuilder-azure");
var builder_cognitiveservices = require("botbuilder-cognitiveservices");
var minha = require('./minhabiblioteca');


// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
    openIdMetadata: process.env.BotOpenIdMetadata 
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

/*----------------------------------------------------------------------------------------
* Bot Storage: This is a great spot to register the private state storage for your bot. 
* We provide adapters for Azure Table, CosmosDb, SQL Azure, or you can implement your own!
* For samples and documentation, see: https://github.com/Microsoft/BotBuilder-Azure
* ---------------------------------------------------------------------------------------- */

var tableName = 'botdata';
var azureTableClient = new botbuilder_azure.AzureTableClient(tableName, process.env.AzureWebJobsStorage);
var tableStorage = new botbuilder_azure.AzureBotStorage({ gzipData: false }, azureTableClient);

// Create your bot with a function to receive messages from the user
const bot = new builder.UniversalBot(connector);

bot.set('storage', tableStorage);

var recognizer = new builder_cognitiveservices.QnAMakerRecognizer({
    knowledgeBaseId: process.env.QnAKnowledgebaseId, 
    subscriptionKey: process.env.QnASubscriptionKey,
    top:3});

var qnaMakerTools = new builder_cognitiveservices.QnAMakerTools();
var qnaMakerTools = new minha.BrazilianQnaMakerTools();//
bot.library(qnaMakerTools.createLibrary());

const qnaMakerDialog = new builder_cognitiveservices.QnAMakerDialog(
    {
        recognizers: [recognizer],
        defaultMessage:'Ops!...Não entendi. Pode reformular a pergunta?',
        qnaThreshold: 0.3,
        feedbackLib: qnaMakerTools
    }
);

qnaMakerDialog.respondFromQnAMakerResult = (session,result) => {
    const resposta = result.answers[0].answer;
    const partesDaResposta = resposta.split('%');
    const [titulo, imagem, descricao, url] = partesDaResposta;


    // if(partesDaResposta.length ===1)
    //     return session.send(resposta);

    var card4 = ()=>{
        const card  = new builder.HeroCard(session)
            .title(titulo)
            .images([builder.CardImage.create(session,imagem.trim())])
            .text(descricao)
            .buttons([ builder.CardAction.openUrl(session, url.trim(), 'mande um email')]);
        const retorno = new builder.Message(session).addAttachment(card);
        session.send(retorno);
    };

    var card3 = ()=>{
        const card  = new builder.HeroCard(session)
            .title(titulo)
            .images([builder.CardImage.create(session,imagem.trim())])
            .text(descricao);
        const retorno = new builder.Message(session).addAttachment(card);
        session.send(retorno);
    };

    var card2 = ()=>{
        const card  = new builder.HeroCard(session)
        .text(descricao)
        .buttons([ builder.CardAction.openUrl(session, url.trim(), 'mande um email')]);
        const retorno = new builder.Message(session).addAttachment(card);
        session.send(retorno);
    };

    switch(partesDaResposta.length){
        case 4:
        card4();
        break;

        case 3:
        card3();
        break;

        case 2:
        card2();
        break;

        case 1:
        session.send(resposta);
        break;
    }
};

bot.dialog('/', qnaMakerDialog);


//modificar//










