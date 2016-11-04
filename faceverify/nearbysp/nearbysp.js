const messages = {
	newVehicle : ""
}
const mapkey = "X9wosdrB8HFd7j9s5hn6~1dQTAlo2_zcwSGmwkZrXAg~ArDaTj0kHrg0EqJm7E06Gi4wq8eXCw1k3kBcTiN8IGUKdUV1KUv5LynGGQFW5Pjf";
var imgmapurl = "http://dev.virtualearth.net/REST/v1/Imagery/Map/Road/Routes?wp.0={POINT1};64;1&wp.1={POINT2};66;2&key=X9wosdrB8HFd7j9s5hn6~1dQTAlo2_zcwSGmwkZrXAg~ArDaTj0kHrg0EqJm7E06Gi4wq8eXCw1k3kBcTiN8IGUKdUV1KUv5LynGGQFW5Pjf";
var routeurl = "http://dev.virtualearth.net/REST/V1/Routes/Driving?o=json&wp.0={POINT1}&wp.1={POINT2}&key=X9wosdrB8HFd7j9s5hn6~1dQTAlo2_zcwSGmwkZrXAg~ArDaTj0kHrg0EqJm7E06Gi4wq8eXCw1k3kBcTiN8IGUKdUV1KUv5LynGGQFW5Pjf"
var async = require('async');
var request = require('request');

var nearbycarparks = [
{name: 'TP17', location: '1.333899,103.848283', rate: {p:20, np: 15}},
{name: 'TP16', location: '1.333138,103.848133', rate: {p:25, np: 18}},
{name: 'TP61', location: '1.332918,103.848165', rate: {p:15, np: 15}},
];

function Locator(argbot, argbuilder) {
	var builder = argbuilder,
	bot = argbot,
	
	userlocation = '1.332105,103.848906',
	address = {"id":"4BmFJskzSqgsFs2q","channelId":"skype","user":{"id":"29:1OiW8-TUc-nLLtneWvvYul38xFbeRI77ul2Uwjicolyk","name":"Judy Bot"},"conversation":{"id":"29:1OiW8-TUc-nLLtneWvvYul38xFbeRI77ul2Uwjicolyk"},"bot":{"id":"28:af635006-3dd0-4b12-b08d-3876fc73fd85","name":"testbot"},"serviceUrl":"https://skype.botframework.com","useAuth":true};
	var address = {"id":"2gDULokzVIfWnHhg","channelId":"skype","user":{"id":"29:1TSjWoozHvWGgqzM6m2Cgq2ofBC8wOg3E7myP_ABNzLE","name":"Judy Bot"},"conversation":{"id":"29:1TSjWoozHvWGgqzM6m2Cgq2ofBC8wOg3E7myP_ABNzLE"},"bot":{"id":"28:754ba270-9a63-4971-b56e-db1319d3d433","name":"testCallingBot"},"serviceUrl":"https://skype.botframework.com","useAuth":true};
	var msg = new builder.Message();
	msg.address(address);
	
	
	this.findnearbysp = function(session, cb) {			
		//msg.text("Hi " + address.user.name + ", Would you like to purchase for season parking near your house?");
		bot.send("Hi " + address.user.name + ", looking up nearby carparks");
		
		bot.beginDialog(address, '/displaynearbysp');
	}
	
	this.setAddress = function(argAddress){
		address = argAddress;
	}
	
		// Bot dialog
	bot.dialog('/displaynearbysp', [function (argsession, results) {
		//console.log(results);
		//console.log(session.message);
		
		
		var session = argsession;
		
		session.send("Hi, looking up nearby carparks");
		
		var cards = getCardsAttachments();

		// create reply with Carousel AttachmentLayout
		var reply = new builder.Message(session)
			.attachmentLayout(builder.AttachmentLayout.carousel)
			.textFormat(builder.TextFormat.xml)
			.attachments(cards);

		session.send(reply);
		
		
		var routeurls = [];
		
		for(obj in nearbycarparks){
			var el = nearbycarparks[obj];
			
			var rurl = routeurl.replace(/\{POINT1\}/g, userlocation)
				.replace(/\{POINT2\}/g, el.location)
				.replace('{TITLE}', el.name);
			
			routeurls.push(rurl);
			
		}
		
		
		
		
		
		
		var getRoute = function(file,cb){
			 request.get(file, function(err,response,body){
				   if ( err){
						 cb(err);
				   } else {
						 cb(null, body); // First param indicates error, null=> no error
				   }
			 });
		}
		async.map(routeurls, getRoute, function(err, results){
			if ( err){
			   // either file1, file2 or file3 has raised an error, so you should not use results and handle the error
			   session.send("Sorry, some problem getting routes")
			} else {
				
				
				
				var minDuration = 0;
				var index = 0;
				for(obj in results){
					var el = results[obj];
					console.log(typeof el)
					el = JSON.parse(el); 
					
					var tmp = el.resourceSets[0].resources[0].travelDuration;
					//console.log(minDuration + " >? " + tmp)
					if (minDuration > tmp) { minDuration = tmp; index = obj; };
					
					
					
				}	
			
				console.log("i: %d", index)
				var el = nearbycarparks[index]
				var imgurl = imgmapurl.replace(/\{POINT1\}/g, userlocation)
				.replace(/\{POINT2\}/g, el.location)
				.replace('{TITLE}', el.name);
				
				var card = new builder.HeroCard(session)
				.title(el.name)
				//.ssubtitle('Your bots — wherever your users are talking')
				.text('Rates Peak ' + el.rate.p + " Non-Peak " + el.rate.np)
				.images([
					builder.CardImage.create(session, imgurl)
				])
				
				
			
				 var msg = new builder.Message(session).addAttachment(card);
				
				//console.log(session.message);
				session.send(" this is the fastest route");	
				session.send(msg);
				session.send('<img src="' + imgurl + '">');
				session.endDialog();
			
			   // results[0] -> "file1" body
			   // results[1] -> "file2" body
			   // results[2] -> "file3" body
			}
		});
		
		
		
		
		
		//session.replaceDialog('/purchaseSP');
	}
	
	]);
	
	
	function getCardsAttachments(argsession, cb) {
		
		var cards = [];
		var session = argsession;
		
		for(obj in nearbycarparks){
			var el = nearbycarparks[obj];
			var imgurl = imgmapurl.replace(/\{POINT1\}/g, userlocation)
				.replace(/\{POINT2\}/g, el.location)
				.replace('{TITLE}', el.name);
			
			console.log("%s", imgurl);
			
			
			
			
			var img = builder.CardImage.create(session, imgurl);
			var card = new builder.HeroCard(session)
            .title(el.name)			
            .subtitle('')
            .text('Rates Peak ' + el.rate.p + " Non-Peak " + el.rate.np)
            .images([ img ])
            .buttons([
                //builder.CardAction.openUrl(session, 'https://azure.microsoft.com/en-us/services/storage/', 'Learn More')
				//builder.CardAction.dialogAction(session, 'purchaseSP', el.name, 'Select')
				//builder.CardAction.imBack(session, el.name, 'Select')
            ]);	
			cards.push(card);
			
			
		}
		
		
		return cards;
	}

}

exports.Locator = Locator;