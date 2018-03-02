/*jshint esversion: 6 */


var builder = require('botbuilder');
var entities = require('html-entities');
var htmlentities = new entities.AllHtmlEntities();

var BrazilianQnaMakerTools = (function() {

    var answerSelectionDialog = [
        function (session, args) {
            var qnaMakerResult = args;
            session.dialogData.qnaMakerResult = qnaMakerResult;
            var questionOptions = qnaMakerResult.answers.map(function (qna) { return htmlentities.decode(qna.questions[0]); });
            var promptOptions = { listStyle: builder.ListStyle.button };
            builder.Prompts.choice(session, 'Vc quis dizer' , questionOptions, promptOptions);
        },

        function (session, results) {
            var qnaMakerResult = session.dialogData.qnaMakerResult;
            var filteredResult = qnaMakerResult.answers.filter(function (qna) { return htmlentities.decode(qna.questions[0]) === results.response.entity; });
            var selectedQnA = filteredResult[0];
            // session.send(selectedQnA.answer);
            // session.endDialogWithResult(selectedQnA);

            const partesDaResposta = selectedQnA.answer.split('%');
            const [titulo, imagem, descricao, url] = partesDaResposta;
        
            var card4 = ()=>{
                const card  = new builder.HeroCard(session)
                    .title(titulo)
                    .images([builder.CardImage.create(session,imagem.trim())])
                    .text(descricao)
                    .buttons([ builder.CardAction.openUrl(session, url.trim(), 'mande um email')]);
                const retorno = new builder.Message(session).addAttachment(card);
                session.send(retorno);
                session.endDialogue();
            };
        
            var card3 = ()=>{
                const card  = new builder.HeroCard(session)
                    .title(titulo)
                    .images([builder.CardImage.create(session,imagem.trim())])
                    .text(descricao);
                const retorno = new builder.Message(session).addAttachment(card);
                session.send(retorno);
                session.endDialogue();
            };
        
            var card2 = ()=>{
                const card  = new builder.HeroCard(session)
                .text(descricao)
                .buttons([ builder.CardAction.openUrl(session, url.trim(), 'mande um email')]);
                const retorno = new builder.Message(session).addAttachment(card);
                session.send(retorno);
                session.endDialogue();
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
                session.send(selectedQnA);
                session.endDialogue();
                break;
            }
        }
    ];

    function BrazilianQnaMakerTools(options) {
        this.lib = new builder.Library('brazilianQnaMakerTools');
        this.lib.dialog('answerSelection', answerSelectionDialog);
    }

    BrazilianQnaMakerTools.prototype.createLibrary = function() {
        return this.lib;
    };

    BrazilianQnaMakerTools.prototype.answerSelector = function(session, options) {
        session.beginDialog('brazilianQnaMakerTools:answerSelection', options || {});
    };

    return BrazilianQnaMakerTools;
}());
exports.BrazilianQnaMakerTools = BrazilianQnaMakerTools;