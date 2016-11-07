var geocoder = require('geocoder');


var https = require('https');
var xml2js = require('xml2js');
var async = require('async');
var builder = require('botbuilder'); 


// Create LUIS recognizer that points at our model and add it as the root '/' dialog for our Cortana Bot.
var model = 'https://api.projectoxford.ai/luis/v1/application?id=7704c0a8-3f30-4c1c-b367-8d639b5b6318&subscription-key=cbaa9e72b11a4814bc5e69b5012e2d48';
var recognizer = new builder.LuisRecognizer(model);
// Bing Maps
const bingkey = "X9wosdrB8HFd7j9s5hn6~1dQTAlo2_zcwSGmwkZrXAg~ArDaTj0kHrg0EqJm7E06Gi4wq8eXCw1k3kBcTiN8IGUKdUV1KUv5LynGGQFW5Pjf";

// Google Maps
const gmapkey = "AIzaSyDZsl6zcDSuwYytnmNkgh78jJI_0yxY-es";
//export GOOGLE_PLACES_API_KEY = "AIzaSyDZsl6zcDSuwYytnmNkgh78jJI_0yxY-es";
//export GOOGLE_PLACES_OUTPUT_FORMAT = "json";

// Weiliangjs
var parser = new xml2js.Parser({explicitArray : false, ignoreAttrs : true});

//=========================================================
// Bots Dialogs
//=========================================================



function NearBySPApp(bot, dialog) {
	
	
	
	
	dialog.matches('FindCarpark', [
		function (session) {
			session.beginDialog('/findcp');
		}
	]);

	dialog.matches('buysp', [
		function (session) {
			session.send('Intent: Routing to buysp');
			//session.beginDialog('/buysp');
		}
	]);

	//=========================================================
	// Dialog Waterfalls
	//=========================================================

	// Search for Car parks
	bot.dialog('/findcp', [
		function (session) {
			builder.Prompts.confirm(session, "Are you searching for a HDB car park?");
		},
		function (session, results) {
			
			if (results.response) {
				
				// Test for Facebook
				if (session.message.source === 'facebook') {
					session.beginDialog('/findlocfb');
				}
				else {
					session.beginDialog('/findloc');
				}
			}
			else {
				session.send('Sorry, we can only search for HDB Carparks.');
				session.endDialog();
			}
		}
	]);

	// Find location
	bot.dialog('/findloc', [
		function (session) {
			console.log("/findloc");
			//getLocation(session,)
		},
		function (session, results) {
			console.log(results);
		}
	]);

	// Find location via Facebook Messenger
	bot.dialog('/findlocfb', [
		function (session, result, next) {
			
			console.log("/findlocfb 1");
			
			var msg = session.message;
			
			if (!msg.entities.length) {
				// Prompt facebook Send Location Button
				msg = new builder.Message(session).text('Can you send me your location?');
				msg.sourceEvent({
					facebook: {
						quick_replies: [{
							content_type:'location'
						}]
					}
				});
				session.send(msg);
			} else {
				session.userData.msg = msg.entities;
				next();
			}
		},
		function (session, result, next) {
			console.log("/findlocfb 2");
			
			var msg = session.message;
			
			if (session.userData.msg) {
				
				var geo = session.userData.msg[0].geo;
				
				
				session.sendTyping();
				
				getcp(session, geo.latitude, geo.longitude);
				
			} else {
				session.endDialog('Did not receive location');
			}
		}
	]);
	
}



//=========================================================
// 1)Retrieve XML from Server 2)Get Nearest Carpark
//=========================================================

function getcp(session,ulat,ulng) {
	
	console.log('function:getcp');

	var getlatfromuser = ulat;
	var getlongfromuser = ulng;
	var userlocation = ulat + "," + ulng;
	var cards = [];
	
	https.get('https://services2.hdb.gov.sg/webapp/BN22GetAmenitiesByRangeCoord/BN22SGetAmenitiesByRangeCoord?systemId=FI10&programID=MobileHDB&lngtd='+getlongfromuser+'&latd='+getlatfromuser+'&identifier=CPK&bounds=500', function(res) {
	
		var response_data = '';
		
		res.setEncoding('utf8');
		res.on('data', function(chunk) {
			response_data += chunk;
		});
		
		res.on('end', function() {
			
			parser.parseString(response_data, function(err, result) {
				if (err) {
					console.log('Got error: ' + err.message);
				} else {
					//eyes.inspect(result);

					//convert into JSON object
					var jsonobject = result;
					//console.log(jsonobject);

					//traverse JSON object
					var cv = new SVY21();
					var showdistanceformat;
					var showdistance;
					var getlatlong;
					var showlat;
					var showlong;
					var selcp = jsonobject.GetAmenities.Carparking[0].CarParkingNo;
					
					var nearbycarparks = [];
					
					// Looping through carparks retrieved
					for (var i = 0; i < jsonobject.GetAmenities.Carparking.length; ++i) {
					
						console.log("Latitude(SVY21) : " + jsonobject.GetAmenities.Carparking[i].Latitude);
						console.log("Longitude(SVY21) : " + jsonobject.GetAmenities.Carparking[i].Longitude);
						
						//convert SVY21 to Lat/Long
						cv.computeLatLon(jsonobject.GetAmenities.Carparking[i].Latitude, jsonobject.GetAmenities.Carparking[i].Longitude);
						
						getlatlong = cv.computeLatLon(jsonobject.GetAmenities.Carparking[i].Latitude, jsonobject.GetAmenities.Carparking[i].Longitude);
						showlat = getlatlong[0];
						showlong = getlatlong[1];
						console.log("Latitude : " + showlat);
						console.log("Longitude : " + showlong);

						console.log("CarParkingNo : " + jsonobject.GetAmenities.Carparking[i].CarParkingNo);
						console.log("Address : " + jsonobject.GetAmenities.Carparking[i].Address);
						console.log("CpkAvail : " + jsonobject.GetAmenities.Carparking[i].CpkAvail);
						
						//calculate distance between 2 coordinates
						showdistance = calculatedistance(showlat, showlong, getlatfromuser, getlongfromuser, 'K');
						
						//round to 3 decimal places
						showdistanceformat = Math.round(showdistance*1000)/1000;
						console.log("Distance(in km) : " + showdistanceformat);
						/*
						var cptype = getcpinfo(jsonobject.GetAmenities.Carparking[i].CarParkingNo);
						*/
						nearbycarparks.push({
							"Latitude": showlat,
							"Longitude" : showlong,
							"CarParkingNo": jsonobject.GetAmenities.Carparking[i].CarParkingNo,
							"Address": jsonobject.GetAmenities.Carparking[i].Address,
							"CpkAvail": jsonobject.GetAmenities.Carparking[i].CpkAvail,
							"distance" : showdistanceformat,
							location: showlat + ',' + showlong
						});
						
					
						
					
						selcp  = jsonobject.GetAmenities.Carparking[0].CarParkingNo > selcp ?
							tmpSelCp:
							selcp;
						
						
						
						console.log("----------------------------------------");
						
						// Limit the number cards shown to 5
						if (i == 4) {
							break;
						}
					}
					
					
					async.series([
						function(callback) {
							
							
							async.each(nearbycarparks, getcpinfo, function (err, result) {
								callback(err);														
							});	
							
							
							console.log('async 1');
							
							
						},
						function(callback) {
							
							async.each(nearbycarparks, getWeatherInfo, function (err, result) {
								callback(err);														
							});	
							
							
							console.log('async 1');
							
							
						},
						function(callback) {
							
							nearbycarparks.forEach(function(carpark) {
								addCard(session, carpark, userlocation, cards);
							});
							
							
							callback(null);
							
						}
					], function (err, result) {
						
						if (err) {
							session.send('Something went wrong.')
							return false;
						}
						
						console.log('async result');
						suggestNearestCP(session, selcp, cards);
												
					});	
					
					
				}
			});
		});
		
		res.on('error', function(err) {
			console.log('Got error: ' + err.message);
		});
		
	});
}



function addCard(session, el, userlocation, cards) {
	var imgmapurl = "http://dev.virtualearth.net/REST/v1/Imagery/Map/Road/Routes?wp.0={POINT1};64;1&wp.1={POINT2};66;2&key=" + bingkey;
					
	// Create cards based on car parks
		
		
		var imgurl = imgmapurl.replace(/\{POINT1\}/g, userlocation)
			.replace(/\{POINT2\}/g, el.location)
			.replace('{TITLE}', el.name);
		
		var cplot = '';
		
		console.log(el.CpkAvail);
		if (el.CpkAvail != "NA") { cplot = el.CpkAvail + " lots available"; }
		
		cplot += ' Type: ' + el.type;
		
	
	
		//console.log("%s", imgurl);
		
		var routeurl = 'http://maps.google.com/maps?saddr=My+Location&daddr=' + el.location;
		var streeturl = 'http://maps.google.com/maps?layer=c&cbll=' + el.location;
		
		console.log(streeturl);

		var card = new builder.HeroCard(session)
			.title(el.CarParkingNo)
			.subtitle(el.Address + '\n\n')
			.text(cplot)
			.images([ builder.CardImage.create(session, imgurl) ])
			.buttons([ 
					builder.CardAction.openUrl(session, routeurl, 'Directions'),
					builder.CardAction.openUrl(session, streeturl, 'Street View')
			]);
			
		cards.push(card);
	
}


function suggestNearestCP(session, selcp, cards) {
	if (cards.length > 0) {
						
		session.send('Here are the carparks are nearby:');
						
		var reply = new builder.Message(session)
			.attachmentLayout(builder.AttachmentLayout.carousel)
			.textFormat(builder.TextFormat.xml)
			.attachments(cards);

		session.send(reply);
		session.sendTyping();
		session.send('I suggest parking at the nearest carpark ' + selcp + '.');
	}
}


//=========================================================
// 1) Get Carpark Information
//=========================================================

function getcpinfo(carpark, callback) {
	
	var carparknoinput = carpark.CarParkingNo;
	
	
	console.log('getcpinfo');
	
    var getcarparkno = carparknoinput;
	var cptype = "error";

    https.get('https://services2.hdb.gov.sg/webapp/BC16AWCpkInfoXML/BC16SCpkXml?cpkNo='+getcarparkno+'&sysId=BC16&cpkStatus=A', function(res)
    {
        var response_data = '';
        res.setEncoding('utf8');
        res.on('data', function(chunk)
        {
            response_data += chunk;
        });
    
        res.on('end', function() 
        {
            parser.parseString(response_data, function(err, result) 
            {
                if (err) 
                {
                    console.log('Got error: ' + err.message);
                }
                else 
                {
                    var jsonobject1 = result;
					carpark.info = { 1: jsonobject1.CarParkInfo.NumCpk, 2: jsonobject1.CarParkInfo.CarParkType };
					carpark.type = jsonobject1.CarParkInfo.CarParkType;
                    //Read from JSON object
					console.log(jsonobject1.CarParkInfo.NumCpk + " : " + jsonobject1.CarParkInfo.CarParkType);
                    //console.log("Short Term Parking Scheme : ", jsonobject1.CarParkInfo.ShortTermParkingScheme);
                    //console.log("Free Parking Scheme : ", jsonobject1.CarParkInfo.FreeParkingScheme);
                    //console.log("Parking System : ", jsonobject1.CarParkInfo.ParkingSystem);
                    //console.log("Park and Ride Scheme : ", jsonobject1.CarParkInfo.ParkAndRideScheme);
					
					cptype = jsonobject1.CarParkInfo.CarParkType;
					
					callback(null, carpark);
					
                }
            });
        });

        res.on('error', function(err) 
        {
            console.log('Got error: ' + err.message);
        });
    });
	
	return cptype;
}


function getWeatherInfo(carpark, callback) {
	console.log('fetching weather info')
	carpark.weatherInfo = 'weather info';
	callback(null, carpark);
	
}


//=========================================================
// Convert SVY21 to Lat/Long
//=========================================================

var SVY21 = (function()
{
    // WGS84 Datum
    this.a = 6378137;
    this.f = 1 / 298.257223563;

    this.oLat = 1.366666;     // origin's lat in degrees
    this.oLon = 103.833333;   // origin's lon in degrees
    this.oN = 38744.572;      // false Northing
	this.oE = 28001.642;      // false Easting
    this.k = 1;               // scale factor

    this.init = function(){
  
        this.b = this.a * (1 - this.f);
        this.e2 = (2 * this.f) - (this.f * this.f);
        this.e4 = this.e2 * this.e2;
        this.e6 = this.e4 * this.e2;
        this.A0 = 1 - (this.e2 / 4) - (3 * this.e4 / 64) - (5 * this.e6 / 256);
        this.A2 = (3. / 8.) * (this.e2 + (this.e4 / 4) + (15 * this.e6 / 128));
        this.A4 = (15. / 256.) * (this.e4 + (3 * this.e6 / 4));
        this.A6 = 35 * this.e6 / 3072;
		};
		this.init();

        this.computeSVY21 = function(lat, lon){
        //Returns a pair (N, E) representing Northings and Eastings in SVY21.

        var latR = lat * Math.PI / 180;
        var sinLat = Math.sin(latR);
        var sin2Lat = sinLat * sinLat;
        var cosLat = Math.cos(latR);
        var cos2Lat = cosLat * cosLat;
        var cos3Lat = cos2Lat * cosLat;
        var cos4Lat = cos3Lat * cosLat;
        var cos5Lat = cos4Lat * cosLat;
        var cos6Lat = cos5Lat * cosLat;
        var cos7Lat = cos6Lat * cosLat;

        var rho = this.calcRho(sin2Lat);
        var v = this.calcV(sin2Lat);
        var psi = v / rho;
        var t = Math.tan(latR);
        var w = (lon - this.oLon) * Math.PI / 180;

        var M = this.calcM(lat);
        var Mo = this.calcM(this.oLat);

        var w2 = w * w;
        var w4 = w2 * w2;
        var w6 = w4 * w2;
        var w8 = w6 * w2;

        var psi2 = psi * psi;
        var psi3 = psi2 * psi;
        var psi4 = psi3 * psi;

        var t2 = t * t;
        var t4 = t2 * t2;
        var t6 = t4 * t2;

        //Compute Northing
        var nTerm1 = w2 / 2 * v * sinLat * cosLat;
        var nTerm2 = w4 / 24 * v * sinLat * cos3Lat * (4 * psi2 + psi - t2);
        var nTerm3 = w6 / 720 * v * sinLat * cos5Lat * ((8 * psi4) * (11 - 24 * t2) - (28 * psi3) * (1 - 6 * t2) + psi2 * (1 - 32 * t2) - psi * 2 * t2 + t4);
        var nTerm4 = w8 / 40320 * v * sinLat * cos7Lat * (1385 - 3111 * t2 + 543 * t4 - t6);
        var N = this.oN + this.k * (M - Mo + nTerm1 + nTerm2 + nTerm3 + nTerm4);

        //Compute Easting
        var eTerm1 = w2 / 6 * cos2Lat * (psi - t2);
        var eTerm2 = w4 / 120 * cos4Lat * ((4 * psi3) * (1 - 6 * t2) + psi2 * (1 + 8 * t2) - psi * 2 * t2 + t4);
        var eTerm3 = w6 / 5040 * cos6Lat * (61 - 479 * t2 + 179 * t4 - t6);
        var E = this.oE + this.k * v * w * cosLat * (1 + eTerm1 + eTerm2 + eTerm3);

        return {N:N, E:E};
		};

		this.calcM = function(lat, lon){
        var latR = lat * Math.PI / 180;
        return this.a * ((this.A0 * latR) - (this.A2 * Math.sin(2 * latR)) + (this.A4 * Math.sin(4 * latR)) - (this.A6 * Math.sin(6 * latR)));
		};
				
        this.calcRho = function(sin2Lat){
        var num = this.a * (1 - this.e2);
        var denom = Math.pow(1 - this.e2 * sin2Lat, 3. / 2.);
        return num / denom;
		};

        this.calcV = function(sin2Lat){
        var poly = 1 - this.e2 * sin2Lat;
        return this.a / Math.sqrt(poly);
		};
		
        this.computeLatLon = function(N, E){
        //Returns lat, lot

        var Nprime = N - this.oN;
        var Mo = this.calcM(this.oLat);
        var Mprime = Mo + (Nprime / this.k);
        var n = (this.a - this.b) / (this.a + this.b);
        var n2 = n * n;
        var n3 = n2 * n;
        var n4 = n2 * n2;
        var G = this.a * (1 - n) * (1 - n2) * (1 + (9 * n2 / 4) + (225 * n4 / 64)) * (Math.PI / 180);
        var sigma = (Mprime * Math.PI) / (180. * G);
        
        var latPrimeT1 = ((3 * n / 2) - (27 * n3 / 32)) * Math.sin(2 * sigma);
        var latPrimeT2 = ((21 * n2 / 16) - (55 * n4 / 32)) * Math.sin(4 * sigma);
        var latPrimeT3 = (151 * n3 / 96) * Math.sin(6 * sigma);
        var latPrimeT4 = (1097 * n4 / 512) * Math.sin(8 * sigma);
        var latPrime = sigma + latPrimeT1 + latPrimeT2 + latPrimeT3 + latPrimeT4;

        var sinLatPrime = Math.sin(latPrime);
        var sin2LatPrime = sinLatPrime * sinLatPrime;

        var rhoPrime = this.calcRho(sin2LatPrime);
        var vPrime = this.calcV(sin2LatPrime);
        var psiPrime = vPrime / rhoPrime;
        var psiPrime2 = psiPrime * psiPrime;
        var psiPrime3 = psiPrime2 * psiPrime;
        var psiPrime4 = psiPrime3 * psiPrime;
        var tPrime = Math.tan(latPrime);
        var tPrime2 = tPrime * tPrime;
        var tPrime4 = tPrime2 * tPrime2;
        var tPrime6 = tPrime4 * tPrime2;
        var Eprime = E - this.oE;
        var x = Eprime / (this.k * vPrime);
        var x2 = x * x;
        var x3 = x2 * x;
        var x5 = x3 * x2;
        var x7 = x5 * x2;

        //Compute Latitude
        var latFactor = tPrime / (this.k * rhoPrime);
        var latTerm1 = latFactor * ((Eprime * x) / 2);
        var latTerm2 = latFactor * ((Eprime * x3) / 24) * ((-4 * psiPrime2) + (9 * psiPrime) * (1 - tPrime2) + (12 * tPrime2));
        var latTerm3 = latFactor * ((Eprime * x5) / 720) * ((8 * psiPrime4) * (11 - 24 * tPrime2) - (12 * psiPrime3) * (21 - 71 * tPrime2) + (15 * psiPrime2) * (15 - 98 * tPrime2 + 15 * tPrime4) + (180 * psiPrime) * (5 * tPrime2 - 3 * tPrime4) + 360 * tPrime4);
        var latTerm4 = latFactor * ((Eprime * x7) / 40320) * (1385 - 3633 * tPrime2 + 4095 * tPrime4 + 1575 * tPrime6);
        var lat = latPrime - latTerm1 + latTerm2 - latTerm3 + latTerm4;

        //Compute Longitude
        var secLatPrime = 1. / Math.cos(lat);
        var lonTerm1 = x * secLatPrime;
        var lonTerm2 = ((x3 * secLatPrime) / 6) * (psiPrime + 2 * tPrime2);
        var lonTerm3 = ((x5 * secLatPrime) / 120) * ((-4 * psiPrime3) * (1 - 6 * tPrime2) + psiPrime2 * (9 - 68 * tPrime2) + 72 * psiPrime * tPrime2 + 24 * tPrime4);
        var lonTerm4 = ((x7 * secLatPrime) / 5040) * (61 + 662 * tPrime2 + 1320 * tPrime4 + 720 * tPrime6);
        var lon = (this.oLon * Math.PI / 180) + lonTerm1 - lonTerm2 + lonTerm3 - lonTerm4;

        var convertlat = (lat / (Math.PI / 180));
        var convertlon = (lon / (Math.PI / 180));
        return [convertlat, convertlon];
		
    };

});

//=========================================================
// Calculate Distance between 2 Coordinates
//=========================================================

function calculatedistance(lat1, lon1, lat2, lon2, unit) {
	
	console.log("function:calculatedistance");
	
	var radlat1 = Math.PI * lat1/180;
	var radlat2 = Math.PI * lat2/180;
	var radlon1 = Math.PI * lon1/180;
	var radlon2 = Math.PI * lon2/180;
	var theta = lon1-lon2;
	var radtheta = Math.PI * theta/180;
	var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
	dist = Math.acos(dist);
	dist = dist * 180/Math.PI;
	dist = dist * 60 * 1.1515;
	if (unit=="K") { dist = dist * 1.609344 };
	if (unit=="N") { dist = dist * 0.8684 };
	return dist;
}



exports.init = NearBySPApp;

