const mapkey = "X9wosdrB8HFd7j9s5hn6~1dQTAlo2_zcwSGmwkZrXAg~ArDaTj0kHrg0EqJm7E06Gi4wq8eXCw1k3kBcTiN8IGUKdUV1KUv5LynGGQFW5Pjf";
var url = "https://dev.virtualearth.net/REST/v1/Imagery/Map/Road/{POINTS}/18?mapSize=500,300&pp={POINTS};21;{TITLE}&key=X9wosdrB8HFd7j9s5hn6~1dQTAlo2_zcwSGmwkZrXAg~ArDaTj0kHrg0EqJm7E06Gi4wq8eXCw1k3kBcTiN8IGUKdUV1KUv5LynGGQFW5Pjf";
var nearbycarparks = [
{name: 'TP17', location: '1.333899,103.848283', rate: {p:20, np: 15}},
{name: 'TP16', location: '1.333138,103.848133', rate: {p:25, np: 18}},
{name: 'TP61', location: '1.332918,103.848165', rate: {p:15, np: 15}},
];



function MAP(argbot, argbuilder, argface, argspeech) {
	var builder = argbuilder;
	bot = argbot,
	face = argface,
	speech = argspeech,
	address = {"id":"4BmFJskzSqgsFs2q","channelId":"skype","user":{"id":"29:1OiW8-TUc-nLLtneWvvYul38xFbeRI77ul2Uwjicolyk","name":"Judy Bot"},"conversation":{"id":"29:1OiW8-TUc-nLLtneWvvYul38xFbeRI77ul2Uwjicolyk"},"bot":{"id":"28:af635006-3dd0-4b12-b08d-3876fc73fd85","name":"testbot"},"serviceUrl":"https://skype.botframework.com","useAuth":true};
		var address = { id: '2gDULokzVHhBcItc',
		  channelId: 'skype',
		  user:
		   { id: '29:1TSjWoozHvWGgqzM6m2Cgq2ofBC8wOg3E7myP_ABNzLE',
			 name: 'Judy Bot' },
		  conversation: { id: '29:1TSjWoozHvWGgqzM6m2Cgq2ofBC8wOg3E7myP_ABNzLE' },
		  bot:
		   { id: '28:754ba270-9a63-4971-b56e-db1319d3d433',
			 name: 'testCallingBot' },
		  serviceUrl: 'https://skype.botframework.com',
		  useAuth: true };
	var address = {"id":"2gDULokzVIfWnHhg","channelId":"skype","user":{"id":"29:1TSjWoozHvWGgqzM6m2Cgq2ofBC8wOg3E7myP_ABNzLE","name":"Judy Bot"},"conversation":{"id":"29:1TSjWoozHvWGgqzM6m2Cgq2ofBC8wOg3E7myP_ABNzLE"},"bot":{"id":"28:754ba270-9a63-4971-b56e-db1319d3d433","name":"testCallingBot"},"serviceUrl":"https://skype.botframework.com","useAuth":true};
	
	//parkingauntie address
	address = { id: '4HDebukzX3TB5QlE',
	   channelId: 'skype',
	   user:
		{ id: '29:1oTN1ejkyp07wweSpi5AoqmnnNtXU1cVCCwKJgF1uHkc',
		  name: 'Carpark Auntie' },
	   conversation: { id: '29:1oTN1ejkyp07wweSpi5AoqmnnNtXU1cVCCwKJgF1uHkc' },
	   bot:
		{ id: '28:683b7c37-cb27-4e6b-b1eb-1699a240925c',
		  name: 'Parking Auntie' },
	   serviceUrl: 'https://skype.botframework.com',
	   useAuth: true };
	
	
	
	var msg = new builder.Message();
	msg.address(address),
	
	
	
	
	
	this.suggest = function(cb) {			
		msg.text("Hi " + address.user.name + ", Would you like to purchase for season parking near your house?");
		//bot.send(msg);
		
		bot.beginDialog(address, '/suggestSP');
	}
	
	this.setAddress = function(argAddress){
		address = argAddress;
	}
	
	function getCardsAttachments(argsession, cb) {
		
		var cards = [];
		var session = argsession;
		
		for(obj in nearbycarparks){
			var el = nearbycarparks[obj];
			var imgurl = url.replace(/\{POINTS\}/g, el.location).replace('{TITLE}', el.name);
			
			var card = new builder.HeroCard(session)
            .title(el.name)			
            .subtitle('')
            .text('Rates Peak ' + el.rate.p + " Non-Peak " + el.rate.np)
            .images([
                builder.CardImage.create(session, imgurl)
            ])
            .buttons([
                //builder.CardAction.openUrl(session, 'https://azure.microsoft.com/en-us/services/storage/', 'Learn More')
				//builder.CardAction.dialogAction(session, 'purchaseSP', el.name, 'Select')
				builder.CardAction.imBack(session, el.name, 'Select')
            ]);	
			cards.push(card);
			
			
		}
		
		
		return cards;
	}
	
	
	function getChoices(session, cb) {
		var options = [];
		for(obj in nearbycarparks) {
			options.push(nearbycarparks[obj].name)
		}
		
		return options;
	}
	
	
	
		// Bot dialog
	bot.dialog('/suggestSP', [function (session, results) {
		//console.log(results);
		//console.log(session.message);
		
		
		var cards = getCardsAttachments();

		// create reply with Carousel AttachmentLayout
		var reply = new builder.Message(session)
			.attachmentLayout(builder.AttachmentLayout.carousel)
			.textFormat(builder.TextFormat.xml)
			.attachments(cards);

		session.send(reply);
		session.replaceDialog('/purchaseSP');
	},
	function (session, results) {
		
		
		
			if (results.response) { 
				session.userData.selectedsp = results.response.entity;
				session.replaceDialog('/paySP')
			} else {
				session.send("ok");
			}
		}
	
	]);
	
	
	
	bot.dialog('/purchaseSP', [function (session, results) {		
		session.userData.name = address.user.name
		
		console.log(results);
		console.log(session.message);
		var message = session.message
		
		if (message) {
			var choices = getChoices();
			if (choices.indexOf(message.text) > -1) {
				session.userData.selectedsp = message.text;
				session.replaceDialog('/paySP')
			}
		}
		
		
		/*
		builder.Prompts.choice(session, "Select your preferred carpark " + address.user.name + "", getChoices() , {
				listStyle: builder.ListStyle.button
			} );*/
		},
		
		function (session, results) {
			if (results.response) { 
				session.userData.selectedsp = results.response.entity;
				session.replaceDialog('/paySP')
			} else {
				session.send("ok");
			}
		}
	
	]);
	
	bot.dialog('/paySP', [ function (session) {		
		var msg = session.userData.name + ", you've choosen " + session.userData.selectedsp + ". For payment, please upload a selfie for verification";
		builder.Prompts.attachment(session, msg);
		},
		
		function (session, results){
			
			if (results.response) {
				var attachment = results.response[0];
				// Verify
				
				face.verify(session, attachment.contentUrl);
				
			} else {

				// No attachments were sent
				var reply = new builder.Message(session)
					.text('Please upload a selfie for verification.');
				session.send(reply);
			}
			
			
		}	
	]);
	
	bot.dialog('/paySP2', [ function (session) {		
		var msg = session.userData.name + ", for tighter security please make a call to verify your voice, use the phrase: \"Im going to make him an offer he can't refuse\"";
		session.endDialog(msg);
		}
	]);
	
	
	bot.beginDialogAction('purchaseSP', '/purchaseSP');   // <-- no 'matches' option means this can only be triggered by a button.
	
}







exports.MAP = MAP;