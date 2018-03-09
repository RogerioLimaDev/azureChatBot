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

var luisAppId = process.env.LuisAppId;
var luisAPIKey = process.env.LuisAPIKey;
var luisAPIHostName = process.env.LuisAPIHostName || 'westus.api.cognitive.microsoft.com';
const LuisModelUrl = 'https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/f1c2986b-e9b0-426f-99ec-faf01acc68b5?subscription-key=69847929754f4440b23d38f8e6b370ec&verbose=true&timezoneOffset=0&q=';
// Create your bot with a function to receive messages from the user
const bot = new builder.UniversalBot(connector);
bot.set('storage', tableStorage);

bot.on('conversationUpdate',(update) => {
    if(update.membersAdded){
        update.membersAdded.forEach( identity =>{
            if(identity.id === update.address.bot.id){
                bot.beginDialog(update.address,'start');
            }
        });
    }     
 });

 bot.dialog('start',[(session)=>{
    if(!session.userData.reload)
        {const helloCard  = new builder.HeroCard(session)
            .title('Olá')
            .images([builder.CardImage.create(session)])
            .text('Me chamo Tropical Cyborg. Sou especialista em realidade virtual e aumentada. Como posso te ajudar?');

            var helloMessage = new builder.Message(session).addAttachment(helloCard);
            session.send(helloMessage);

        }
    session.endDialog();
    }
]);

/// Luis part of the Code ////

var recognizer = new builder.LuisRecognizer(LuisModelUrl);

var intents = new builder.IntentDialog({ recognizers: [recognizer] })
.matches('Cumprimento', (session) => {
    session.send('You reached **Cumprimento** intent, you said **\'%s\'**.', session.message.text);
})
.matches('Xingamento', (session) => {
    session.send('You reached **Xingamento** intent,  you said **\'%s\'**.', session.message.text);
})
.matches('Definicao', (session) => {
    session.send('You reached **Definicao** intent, you said **\'%s\'**.', session.message.text);
})
.onDefault((session) => {
    // session.send('Pouz, não entendi o que vc quis dizer com: **\'%s\'**.', session.message.text);
    goToQnA(session);
});

bot.dialog('/', intents);


////End of Luis Part of the Code ////


////QnAMaker part of the Code //////

var goToQnA = (session) =>{
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
 
};




////End of QnAMaker part of the Code //////










