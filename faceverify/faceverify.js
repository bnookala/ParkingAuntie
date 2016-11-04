const faceapikey = 'eae8e7413ad948edb1dcfbb9b198ca34';//'eae8e7413ad948edb1dcfbb9b198ca34';
const facegroupid = "hdbc001";
const personid = "18944c9d-e500-4f7e-addb-a4158c6f2062";
const persistedFaceId = "706ddf23-6e33-4be9-81ab-b6e3559efbaa";
//url1: "http://asia-tv.su/_bl/3/58320473.jpg"
//url2: "http://asianwiki.com/images/0/0c/Emi_Takei-p2.jpg"
//url3: "http://1.bp.blogspot.com/-8vJLS06NZeY/T_TmGPiIMoI/AAAAAAAAAbo/AXyHW1AWcMY/s1600/Emi+Takei_03.jpg"
//Load the request module
var request = require('request');
var Promise = require('bluebird');



function Face(argbot, argbuilder, connector) {
	var builder = argbuilder,
	bot = argbot,
	verifyurl="https://api.projectoxford.ai/face/v1.0/verify",
	getfaceidurl="https://api.projectoxford.ai/face/v1.0/detect?returnFaceId=true&returnFaceLandmarks=false",
	obtainToken = Promise.promisify(connector.getAccessToken.bind(connector));
	
	
	
	this.verify = function(session, imgurl) {
		//session.send();
		session.endDialog("Verifying...");
		requestBuffer(session, imgurl);		
		
	}
	
	function requestBuffer(argsession, argimgurl, argcb) {
		//Lets configure and request
		var session = argsession,
		imgurl = argimgurl,
		cb = argcb;
		
		
		obtainToken().then(function (token) {	
			console.log("url: " + imgurl )
			
			
			var session = argsession,
			cb = verifyFaceId;
			
			request({
				url: imgurl, //URL to hit
				//qs: {)}, //Query string data
				method: 'GET',
				'encoding': null,
				headers: {					
					'Authorization': 'Bearer ' + token	,
					'Content-Type': 'application/octet-stream'
				}
			}, function(error, response, body){
				
				
				if(error) {
					console.log("requestBuffer :" + error);
				} else {
					console.log("requestBuffer :" + response.statusCode);
					//do payment
					requestFaceId(session, body, cb)
					
				}
			});
		});
	}
	
	
	function requestFaceId( argsession, argbody, argcb ) {
		var session = argsession,
		cb = argcb;
		
		
		//Lets configure and request
		
		request({
			url: getfaceidurl, //URL to hit
			//qs: {)}, //Query string data
			method: 'POST',
			
			headers: {
				'Content-Type': 'application/octet-stream',
				'Ocp-Apim-Subscription-Key': faceapikey
			},
			body: argbody //Set the body as a string
		}, function(error, response, body){
			
			
			
			if(error) {
				console.log(error);
			} else {
				//console.log(response.statusCode, body);
				body = JSON.parse(body);				
				console.log(body[0]['faceId'])
				verifyFaceId(session, body[0]['faceId'])
			}
		});
		
	}
	
	function verifyFaceId(argsession, argfaceid) {
		var session = argsession;
		var data = {
			"faceId":argfaceid,
			"personId":"18944c9d-e500-4f7e-addb-a4158c6f2062",
			"personGroupId":"hdbc001"
		}
		
		
		console.log("verifying: " + JSON.stringify(data))
		console.log('key ' + faceapikey )
		
		request.debug = true;
		
		request({
				url: verifyurl, //URL to hit
				//qs: {)}, //Query string data
				method: 'POST',
				headers: {					
					'Content-Type': 'application/json',
					'Ocp-Apim-Subscription-Key': faceapikey
				},
				body: JSON.stringify(data)
			}, function(error, response, body){
				if(error) {
					console.log("verifyFaceId :" + error);
				} else {
					body = JSON.parse(body);
					console.log(typeof body)
					console.log(body)
					//do payment
					if (body['isIdentical']) {
						session.send("Face verification identical");						
						session.beginDialog("/paySP2");
						//session.send('Payment successful ' + session.userData.name + ", Ask me more if you need any help, thanks");
					} else {
						session.send('Sorry verification failed, Payment is unsuccessful');
					}
				}
			});
		
		
	}
	
	

	
	
	
}



exports.Face = Face;