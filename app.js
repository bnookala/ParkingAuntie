var DocumentDBClient = require('documentdb').DocumentClient;
var config = require('./config');
var DbActions = require('./routes/dbactions');
var DbDao = require('./models/dbDao');
var url = require('url');



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
    //appId: process.env.APP_ID,
    //appPassword: process.env.APP_SECRET
	
    appId: "683b7c37-cb27-4e6b-b1eb-1699a240925c",
    appPassword: "ooacdSxLkse9QRHp3Gzz6Xt"
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());


var calling = require('botbuilder-calling');
var callconnector = new calling.CallConnector({
    callbackUrl: "https://9e629178.ngrok.io/api/calls",
    aappId: "683b7c37-cb27-4e6b-b1eb-1699a240925c",
    appPassword: "ooacdSxLkse9QRHp3Gzz6Xt"
});

var callbot = new calling.UniversalCallBot(callconnector);
server.post('/api/calls', callconnector.listen());


var face = require("./faceverify/faceverify");
face = new face.Face(bot, builder, connector);
var speech = require("./speechverify/speechverify");
speech = new speech.Speech(bot, builder, connector, callbot);

var maps = require("./maps/maps");
maps = new maps.MAP(bot, builder, face, speech);
var person = require("./notify/notify");
person = new person.Person(bot, builder, maps);

var locator = require("./nearbysp/nearbysp");
locator = new locator.Locator(bot, builder);

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
var model = 'https://api.projectoxford.ai/luis/v1/application?id=33d6986f-cd13-4711-a0c2-720bbdcae475&subscription-key=83808dbed6d84f4c94c2187d094103ec';
var recognizer = new builder.LuisRecognizer(model);
var intents = new builder.IntentDialog({ recognizers: [recognizer] });

var docDbClient = new DocumentDBClient(config.host, {
    masterKey: config.authKey
});
var dbDao = new DbDao(docDbClient, config.databaseId, config.collectionId);
var dbActions = new DbActions(dbDao);

var HttpStatusCodes = { NOTFOUND: 404 };
var databaseUrl = `dbs/${config.databaseId}`;
var collectionUrl = `${databaseUrl}/colls/${config.userCollectionId}`;

intents.matches(/^hello|hi/i, [
    function (session) {
        session.sendTyping();
        session.send("Hello, how can I help you?");
        session.endDialog("");
    }

]);

intents.matches(/^thank |thanks/i, [
    function (session) {
        session.sendTyping();
        session.send("You are welcome.");
        session.endDialog("");
    }
]);

intents.matches('PurchaseSP', [
    function (session) {
        session.sendTyping();
        session.send("I see you would like to purchase season parking. Let me grab the details.");
        session.endDialog("");
    }
]);

function buildIntent(intentDialog, intent) {
	
    intentDialog.matches(intent, function (session) {		
        session.sendTyping();
		session.beginDialog("/" + intent);		
	});
}
	
	
function buildDialog(dataentry) {
	
	var txt = dataentry.description;
	var entity = (txt.slice(0,1)!="{"?txt:JSON.parse(txt));
	
	(function(txtIntent, argentity) {
		var type = typeof(argentity);
		var waterfall_fn = [];
		
		if (type === "string") {
			
			waterfall_fn = [ function(session, args, fn){ 
				session.endDialog(argentity);
			} ];
			
		} else if (type === "object" ){
			waterfall_fn = getWaterfall(argentity);		
		}
		
		
		
		bot.dialog('/' + txtIntent, waterfall_fn);	
		
	})(dataentry.name, entity)
	
	
}


function getWaterfall(entity){
	return [getFn1(entity), getFn2(entity)]
}


function getFn1(entity) {
	
	return (function(o, isChoice) {		
		if (isChoice) {
			return getChoices(o);
		} else {
			return getResponse(o)
		}
	})(entity, typeof(entity['choice']) != 'undefined' )	
}

function getFn2(entity) {
	var o = entity;
	
	return function(session, results, next){

		
		if (results.response) {
			var response = results.response.entity;
			var is_response_valid = !(typeof(o.choice.options[response]) === "undefined")
												
			if (is_response_valid) {
				session.beginDialog('/'+ o.choice.options[response])
			} else {
				session.endDialogWithResults(results);
			}
		} else {
			session.endDialogWithResults(results);
		}
		
	}
	
}


function getChoices(entity) {
	
	var o = entity;
	
	return function(session, results) {
	
		var	options=[];
							
		for(option in o.choice.options){
			options.push(option);
		}
											
		var is_image_valid = !typeof(o.choice.image) === 'undefined';
		var is_option_valid = !typeof(o.choice.options) === 'undefined';
		
		
		if (!is_image_valid) {
			builder.Prompts.choice(session, o.choice.question, options, { listStyle: style });		
		} else {
			
			var buttons = [];
		
			if (is_option_valid) {		
				for(option in o.choice.options){
					buttons.push(builder.CardAction.imBack(session, option, option));
				}
			}
			
			
			var msg = new builder.Message(session)	
			.textFormat(builder.TextFormat.xml)
			.attachmentLayout(builder.AttachmentLayout.carousel)
			.attachments([
				new builder.HeroCard(session)
					.title(o.choice.titlemessage)
					.text(o.choice.question )
					.images([ builder.CardImage.create(session, o.choice.image) ])
					.buttons(buttons)
			]);
			
			builder.Prompts.choice(session, msg, options);	
		}
	}
	
}

function getResponse(entity){
	
	var o = entity;
	
	return function(session, results){
		
		console.log()
		
		session.send(o.display.initmessage);
		var is_multi_images = !typeof(o.display.mimages) === 'undefined';
										
		var	myimages=[];	
		
		for( image in o.display.mimages ){
			var is_url_valid = typeof(o.display.mimages[image].imageurl) != "undefined";
			var buttons = [];
			if (is_url_valid) {
				buttons.push(builder.CardAction.openUrl(session, o.display.mimages[image].imageurl, "View Image"));
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
}

dbDao.init(function(){
	dbActions.initAnswers(function(err, items){
        var a = items;
	    var x=0;	
		for(x in a) { 
			buildIntent(intents, a[x].name );
			buildDialog( a[x] );	
		}	
	}) //end init answers
});




intents.onDefault(function (session) {
	console.log(session.message)
        session.send("Sorry, I'm not sure what you mean. Could you rephrase your question or provide more details?");
		
    })
		


		
bot.dialog('/', intents);
