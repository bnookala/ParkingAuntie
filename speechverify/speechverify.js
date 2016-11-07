const speechapikey = '0c1a87dadfda4373a24a1cdc1fc5ac98';

const verificationProfileId = "bb3f093c-55cc-4eb3-aadd-af721cbf1419";
const personid = "18944c9d-e500-4f7e-addb-a4158c6f2062";
//url1: "http://asia-tv.su/_bl/3/58320473.jpg"
//url2: "http://asianwiki.com/images/0/0c/Emi_Takei-p2.jpg"
//url3: "http://1.bp.blogspot.com/-8vJLS06NZeY/T_TmGPiIMoI/AAAAAAAAAbo/AXyHW1AWcMY/s1600/Emi+Takei_03.jpg"
//Load the request module
var request = require('request');
var Promise = require('bluebird');




function Speech(argbot, argbuilder, connector, callbot) {
	var builder = argbuilder;
	var bot = argbot;
	var address = {"id":"4BmFJskzSqgsFs2q","channelId":"skype","user":{"id":"29:1OiW8-TUc-nLLtneWvvYul38xFbeRI77ul2Uwjicolyk","name":"Judy Bot"},"conversation":{"id":"29:1OiW8-TUc-nLLtneWvvYul38xFbeRI77ul2Uwjicolyk"},"bot":{"id":"28:af635006-3dd0-4b12-b08d-3876fc73fd85","name":"testbot"},"serviceUrl":"https://skype.botframework.com","useAuth":true};
	var verifyurl="https://api.projectoxford.ai/spid/v1.0/verify?verificationProfileId=bb3f093c-55cc-4eb3-aadd-af721cbf1419";
	var getfaceidurl="https://api.projectoxford.ai/face/v1.0/detect?returnFaceId=true&returnFaceLandmarks=false";
	var obtainToken = Promise.promisify(connector.getAccessToken.bind(connector));
	var address = {"id":"2gDULokzVIfWnHhg","channelId":"skype","user":{"id":"29:1TSjWoozHvWGgqzM6m2Cgq2ofBC8wOg3E7myP_ABNzLE","name":"Judy Bot"},"conversation":{"id":"29:1TSjWoozHvWGgqzM6m2Cgq2ofBC8wOg3E7myP_ABNzLE"},"bot":{"id":"28:754ba270-9a63-4971-b56e-db1319d3d433","name":"testCallingBot"},"serviceUrl":"https://skype.botframework.com","useAuth":true};
	/*address = { id: 'JnqixkzUIqOKZCS',
		 channelId: 'skype',
		 user: 
		  { id: '29:1yQgfHtM05KqPzhsusDTjpxcHEb6-wRZ-psF10L7-1ps',
			name: 'Judy Bot' },
		 conversation: { id: '29:1yQgfHtM05KqPzhsusDTjpxcHEb6-wRZ-psF10L7-1ps' },
		 bot: 
		  { id: '28:945fc654-8c53-415d-98f3-defd99c077b4',
			name: 'judybot' },
		 serviceUrl: 'https://skype.botframework.com',
		 useAuth: true };
	*/
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
	
	
	
	
	this.verify = function(argsession, audio) {
		var session = argsession;
		session.send('verifying voice')		
		//msg.text("verifying voice inside");
		//bot.send(msg);
		//console.log(audio)
		//console.log(audioData)
		//session.send("printing voice...")
		verifyVoice(session, audio);
		//return true;
	}
	
	
	
	
	
	function verifyVoice( argsession, argbody ) {
		var callsession = argsession;
		
		//session.send("verifying voice...")
		//Lets configure and request
		
		
		
		request({
			url: verifyurl, //URL to hit
			//qs: {)}, //Query string data
			method: 'POST',
			
			headers: {
				'Content-Type': 'application/octet-stream',
				'Ocp-Apim-Subscription-Key': speechapikey
			},
			body: argbody //Set the body as a string
		}, function(error, response, body){
			
			
			
			if(error) {
				console.log(error);
			} else {
				console.log(response.statusCode, body);
				body = JSON.parse(body);
					console.log(typeof body)
					//do payment
					
					callsession.endDialog('voice okay');
					var msg = new builder.Message();
					msg.address(address);
					
					if (body['result'] == "Accept") {
						console.log('accepted');
						
						msg.text('Payment successful, Ask me again if you need any help, thanks');
						bot.send(msg);
						
						//session.send('voice accepted');
						//session.send('Payment successful ' + session.userData.name + ", Ask me more if you need any help, thanks");
					} else {
						//session.send('Sorry verification failed, Payment is unsuccessful');
						msg.text('Sorry verification failed, Payment is unsuccessful');
						bot.send(msg);
					}
			}
		});
		
	}
	
	

	
	
}



exports.Speech = Speech;
