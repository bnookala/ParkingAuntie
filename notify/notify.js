const messages = {
	newVehicle : ""
}

function Person(argbot, argbuilder, argmap) {
	var builder = argbuilder;
	var bot = argbot;
	var maps = argmap;
	var address = {"id":"4BmFJskzSqgsFs2q","channelId":"skype","user":{"id":"29:1OiW8-TUc-nLLtneWvvYul38xFbeRI77ul2Uwjicolyk","name":"Judy Bot"},"conversation":{"id":"29:1OiW8-TUc-nLLtneWvvYul38xFbeRI77ul2Uwjicolyk"},"bot":{"id":"28:af635006-3dd0-4b12-b08d-3876fc73fd85","name":"testbot"},"serviceUrl":"https://skype.botframework.com","useAuth":true};
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
	
	
	this.notify = function(cb) {			
		msg.text("Hi " + address.user.name + ", Would you like to purchase for season parking near your house?");
		//bot.send(msg);
		
		bot.beginDialog(address, '/suggestPurchase');
	}
	
	this.setAddress = function(argAddress){
		address = argAddress;
	}
	
	bot.dialog('/suggestPurchase', [
		function (session) {
			
			builder.Prompts.confirm(session, "Hi " + address.user.name + ", Would you like to purchase for season parking near your house?", {
				listStyle: builder.ListStyle.button
			} );
			
		},
		function (session, results) {
			if (results.response) {
				//session.beginDialog('/' + results.response.entity + 'Menu');
				maps.suggest(session);
			} else {
				session.send("Okay, bye");
				session.endDialog();
			}
		}
	]);
	

}

exports.Person = Person;