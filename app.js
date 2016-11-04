var DocumentDBClient = require('documentdb').DocumentClient;
var config = require('./config');
var DbActions = require('./routes/dbactions');
var DbDao = require('./models/dbDao');

var restify = require('restify');
var builder = require('botbuilder');

//=========================================================
// Bot Setup
//=========================================================

var server = restify.createServer();

server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.APP_ID,
    appPassword: process.env.APP_SECRET

    //appId: "945fc654-8c53-415d-98f3-defd99c077b4",
    //appPassword: "1QsZho2VqxGguMht04DMpUd"
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());
console.log("connected");
//=========================================================
// Activity Events
//=========================================================

bot.on('contactRelationUpdate', function (message) {
    if (message.action === 'add') {
        var name = message.user ? message.user.name : null;
        var reply = new builder.Message()
            .address(message.address)
            .text("Hello %s... Thanks for adding me. How can I help you? ", name || 'there');
        bot.send(reply);
    } else {
        // delete their data
    }
});

bot.on('typing', function (message) {
    // User is typing
    console.log('typing')
});

bot.on('deleteUserData', function (message) {
    // User asked to delete their data
});

//=========================================================
// Bots Middleware
//=========================================================

// Anytime the major version is incremented any existing conversations will be restarted.
bot.use(builder.Middleware.dialogVersion({ version: 1.0, resetCommand: /^reset/i }));

//=========================================================
// Bots Global Actions
//=========================================================

bot.endConversationAction('goodbye', 'Goodbye:)', { matches: /^.*bye/i });
bot.beginDialogAction('help', '/help', { matches: /^help/i });
//=========================================================
// Bots Dialogs
//=========================================================
var style = builder.ListStyle["button"];

//var intents = new builder.IntentDialog();

// Create LUIS recognizer that points at our model and add it as the root '/' dialog for our Cortana Bot.
//var model = 'https://api.projectoxford.ai/luis/v1/application?id=33d6986f-cd13-4711-a0c2-720bbdcae475&subscription-key=896bf1af48e14c74856a6f3cc9e5d8f4';
var model = 'https://api.projectoxford.ai/luis/v1/application?id=33d6986f-cd13-4711-a0c2-720bbdcae475&subscription-key=9e2ce4043618486599a48227fb4b5998';
var recognizer = new builder.LuisRecognizer(model);
var intents = new builder.IntentDialog({ recognizers: [recognizer] });
//bot.dialog('/', dialog);

intents.matches(/^hello|hi/i, [
    function (session) {
        session.send("Hello, how can I help you?");
        session.endDialog("");
    }

]);

intents.matches(/^thank |thanks/i, [
    function (session) {
        session.send("You are welcome.");
        session.endDialog("");
    }
]);

var docDbClient = new DocumentDBClient(config.host, {
    masterKey: config.authKey
});
var dbDao = new DbDao(docDbClient, config.databaseId, config.collectionId);
var dbActions = new DbActions(dbDao);
dbDao.init(function () {
    dbActions.initQuestions(function (err, items) {
        var q = items;
        for (x in q) {
            var fn = function (code) { // Immediately Invoked Function Expression
                //return function (session, args) {
                return function (session, args) {
                    var subtopic = "";

                    for (i in args.entities) {
                        var entity = args.entities[i]
                        var type = entity.type;

                        if (type === "Topic") {
                            session.userData.topic = entity
                        } else if (type === "subtopic") {
                            subtopic = args.intents[0].intent + " ";
                        }

                        console.log('str ' + entity.type + ' ' + entity.entity)
                    }

                    //session.send("/" + code)
                    session.beginDialog("/" + code);
                }
                //} ()
            } (q[x].name);
            intents.matches(q[x].name, fn);
        }
    }); // init questions

    dbActions.initAnswers(function(err, items) {
        var a = items;
        for (x in a) {
            bot.dialog('/' +
                function(code, object) { /* Immediately Invoked Function Expression */
                    return function() { return code; }()
                }(a[x].name),
                function(code, obj) { /* Immediately Invoked Function Expression */
                    return function() {
                        var txt = obj.description;
                        var acode = (txt.slice(0, 1) != "{" ? txt : JSON.parse(txt));

                        var type = typeof (acode);

                        var waterfall_fn = [];
                        var o = acode;

                        if (type === "string") {
                            //console.log('str '+obj.name)
                            waterfall_fn.push(function(session, args, fn) {
                                session.send(obj.description);
                                session.endDialog();
                            })
                        } else if (type === "object") {
                            var fn1 = function(session, results) { //prompt
                                var is_choice = !(typeof (o.choice) === "undefined")
                                var is_display = !(typeof (o.display) === "undefined")
                                if (is_choice) {
                                    var options = [];

                                    for (option in o.choice.options) {
                                        options.push(option)
                                        //options.push(o.choice.options[option]+":"+option)
                                    }

                                    var is_image_valid = !(typeof (o.choice.image) === "undefined")

                                    var is_option_valid = !(typeof (o.choice.options) === "undefined")
                                    if (is_option_valid) {
                                        var buttons = [];
                                        for (option in o.choice.options) {
                                            buttons.push(builder.CardAction.imBack(session, option, option));
                                        }
                                    }
                                    var msg = new builder.Message(session)
                                        .textFormat(builder.TextFormat.xml)
                                        .attachmentLayout(builder.AttachmentLayout.carousel)
                                        .attachments([
                                            new builder.HeroCard(session)
                                            .title(o.choice.titlemessage)
                                            .text(o.choice.question)
                                            .images([
                                                builder.CardImage.create(session, o.choice.image)
                                            ])
                                            .buttons(buttons)
                                        ]);
                                    if (is_image_valid) {
                                        builder.Prompts.choice(session, msg, options);
                                    } else {
                                        builder.Prompts
                                            .choice(session, o.choice.question, options, { listStyle: style });
                                    }
                                } else {
                                    session.send(o.display.initmessage);
                                    var is_multi_images = !(typeof (o.display.mimages) === "undefined")

                                    var myimages = [];
                                    for (image in o.display.mimages) {
                                        var is_url_valid = !(typeof (o.display.mimages[image].imageurl) === "undefined")
                                        if (is_url_valid) {
                                            var buttons = [];

                                            buttons.push(builder.CardAction
                                                .openUrl(session, o.display.mimages[image].imageurl, "View Image"));
                                        }

                                        myimages.push(
                                            new builder.HeroCard(session)
                                            .title(o.display.mimages[image].title)
                                            .text(o.display.mimages[image].text)
                                            .images([
                                                builder.CardImage.create(session, o.display.mimages[image].src)
                                            ])
                                            .buttons(buttons)
                                        )
                                    }

                                    var msg = new builder.Message(session)
                                        .textFormat(builder.TextFormat.xml)
                                        .attachmentLayout(builder.AttachmentLayout.carousel)
                                        .attachments(myimages);
                                    session.endDialog(msg);
                                }
                            };

                            waterfall_fn.push(fn1)

                            var fn2 = function(session, results, next) { //prompt
                                //session.send("f2");

                                if (results.response) {
                                    var response = results.response.entity;

                                    var is_response_valid = !(typeof (acode.choice.options[response]) === "undefined")

                                    if (is_response_valid) {
                                        session.beginDialog('/' + acode.choice.options[response]);
                                    } else {
                                        session.endDialogWithResults(results);
                                    }
                                } else {
                                    session.endDialogWithResults(results);
                                }
                            }

                            waterfall_fn.push(fn2)
                        }

                        //console.log(''+waterfall_fn)
                        return waterfall_fn;
                    }();
                }(a[x].name, a[x])
            );
        }
    }); //end init answers
});

intents.onDefault(function(session) {
    console.log(session.message)
    session.send("Sorry, I'm not sure what you mean. Could you rephrase your question or provide more details?");
});

bot.dialog('/', intents);