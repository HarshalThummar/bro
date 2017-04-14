// This skill to find a bro from the database 

'use strict';

var winston = require('winston');

var logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)({ prettyPrint: true, timestamp: true, json: false, stderrLevels:['error']})
    ]
  });

var intentHandlers = {};

if(process.env.NODE_DEBUG_EN) {
  logger.level = 'debug';
}


exports.handler = function (event, context) {
    try {

        logger.info('event.session.application.applicationId=' + event.session.application.applicationId);

        if (APP_ID !== '' && event.session.application.applicationId !== APP_ID) {
            context.fail('Invalid Application ID');
         }
      
        if (!event.session.attributes) {
            event.session.attributes = {};
        }

        logger.debug('Incoming request:\n', JSON.stringify(event,null,2));

        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }


        if (event.request.type === 'LaunchRequest') {
            onLaunch(event.request, event.session, new Response(context,event.session));
        } else if (event.request.type === 'IntentRequest') {
            var response =  new Response(context,event.session);
            if (event.request.intent.name in intentHandlers) {
              intentHandlers[event.request.intent.name](event.request, event.session, response,getSlots(event.request));
            } else {
              response.speechText = 'Unknown intent';
              response.shouldEndSession = true;
              response.done();
            }
        } else if (event.request.type === 'SessionEndedRequest') {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail('Exception: ' + getError(e));
    }
};

function getSlots(req) {
  var slots = {}
  for(var key in req.intent.slots) {
    if(req.intent.slots[key].value !== undefined) {
      slots[key] = req.intent.slots[key].value;
    }  
  }
  return slots;
}

var Response = function (context,session) {
  this.speechText = '';
  this.shouldEndSession = true;
  this.ssmlEn = true;
  this._context = context;
  this._session = session;

  this.done = function(options) {

    if(options && options.speechText) {
      this.speechText = options.speechText;
    }

    if(options && options.repromptText) {
      this.repromptText = options.repromptText;
    }

    if(options && options.ssmlEn) {
      this.ssmlEn = options.ssmlEn;
    }

    if(options && options.shouldEndSession) {
      this.shouldEndSession = options.shouldEndSession;
    }

    this._context.succeed(buildAlexaResponse(this));
  }

  this.fail = function(msg) {
    logger.error(msg);
    this._context.fail(msg);
  }

};

function createSpeechObject(text,ssmlEn) {
  if(ssmlEn) {
    return {
      type: 'SSML',
      ssml: '<speak>'+text+'</speak>'
    }
  } else {
    return {
      type: 'PlainText',
      text: text
    }
  }
}

function buildAlexaResponse(response) {
  var alexaResponse = {
    version: '1.0',
    response: {
      outputSpeech: createSpeechObject(response.speechText,response.ssmlEn),
      shouldEndSession: response.shouldEndSession
    }
  };

  if(response.repromptText) {
    alexaResponse.response.reprompt = {
      outputSpeech: createSpeechObject(response.repromptText,response.ssmlEn)
    };
  }

  if(response.cardTitle) {
    alexaResponse.response.card = {
      type: 'Simple',
      title: response.cardTitle
    };

    if(response.imageUrl) {
      alexaResponse.response.card.type = 'Standard';
      alexaResponse.response.card.text = response.cardContent;
      alexaResponse.response.card.image = {
        smallImageUrl: response.imageUrl,
        largeImageUrl: response.imageUrl
      };
    } else {
      alexaResponse.response.card.content = response.cardContent;
    }
  }

  if (!response.shouldEndSession && response._session && response._session.attributes) {
    alexaResponse.sessionAttributes = response._session.attributes;
  }
  logger.debug('Final response:\n', JSON.stringify(alexaResponse,null,2),'\n\n');
  return alexaResponse;
}

function getError(err) {
  var msg='';
  if (typeof err === 'object') {
    if (err.message) {
      msg = ': Message : ' + err.message;
    }
    if (err.stack) {
      msg += '\nStacktrace:';
      msg += '\n====================\n';
      msg += err.stack;
    }
  } else {
    msg = err;
    msg += ' - This error is not object';
  }
  return msg;
}


//--------------------------------------------- Skill specific logic starts here ----------------------------------------- 

//Add your skill application ID from amazon devloper portal
var APP_ID = 'amzn1.ask.skill.ce1dd0fc-a286-4711-8943-68ef6d98b990';

function onSessionStarted(sessionStartedRequest, session) {
    logger.debug('onSessionStarted requestId=' + sessionStartedRequest.requestId + ', sessionId=' + session.sessionId);
    // add any session init logic here
    
}

function onSessionEnded(sessionEndedRequest, session) {
  logger.debug('onSessionEnded requestId=' + sessionEndedRequest.requestId + ', sessionId=' + session.sessionId);
  // Add any cleanup logic here
  
}

function onLaunch(launchRequest, session, response) {
  logger.debug('onLaunch requestId=' + launchRequest.requestId + ', sessionId=' + session.sessionId);
  response.speechText = 'Yo yo waddup bro, i can help you find your bro, who are you looking for?, tell me the first and last name';
  response.repromptText = 'For Example, you can say tell me first and last name of the bro';
  response.shouldEndSession = false;
  response.done();
}

var MAX_RESPONSES = 5;
var MAX_BRO_ITEMS = 10;


intentHandlers['GetBroInfo'] = function(request,session,response,slots) {
  //Intent logic
  //slots.FoodItem

  if(slots.BroItem === undefined) {
    response.speechText = 'Looks like you forgot to mention bro name. Which bro information you would like to know? ';
    response.repromptText = 'For example, you can say, first and last name ';
    response.shouldEndSession = false;
    response.done();
    return;
  }

  var broDb = require('./bro_db.json');
  var results = searchBro(broDb,slots.BroItem);

  response.cardTitle = `Bro Lookup results for: ${slots.BroItem}`;
  response.cardContent = '';
  
  if(results.length === 0) {
    response.speechText = `Could not find bro  for ${slots.BroItem}. Please try different bro name. `;
    response.cardContent += response.speechText;
    response.shouldEndSession = true;
    response.done();
  } else {

    results.slice(0,MAX_RESPONSES).forEach( function(item) {
      response.speechText  += `The University for ${item[0]} is ${item[1]}  `; 
      response.cardContent += `The University for ${item[0]} is ${item[1]}  `; 
    });


    if(results.length > MAX_RESPONSES) {
      response.speechText += `There are more bros matched your search. You can say more information for more information. Or say stop to stop the skill. `; 
      response.cardContent += `There are more bros matched your search. You can say more information for more information. Or say stop to stop the skill. `; 
      response.repromptText = `You can say more information or stop.`; 
      session.attributes.resultLength = results.length;
      session.attributes.BroItem = slots.BroItem;
      session.attributes.results = results.slice(MAX_RESPONSES,MAX_BRO_ITEMS);
      response.shouldEndSession = false;
      response.done();

    } else {
      response.shouldEndSession = true;
      response.done();
    }


  }


}


intentHandlers['GetNextEventIntent'] = function(request,session,response,slots) {

  if(session.attributes.results) {
    response.cardTitle = `Nutrition Lookup more information for: ${session.attributes.BroItem}`;

    response.speechText  = `Your search resulted in ${session.attributes.resultLength} food items. Here are the few food items from search. Please add more keywords from this list for better results.`;
    response.cardContent = `${response.speechText}\n`;


    session.attributes.results.forEach(function(item) {
      response.speechText += `${item[0]}. `; 
      response.cardContent += `'${item[0]}'\n`;
    });
  } else {
    response.speechText  = `Wrong invocation of this intent. `;
  }
  response.shouldEndSession = true;
  response.done();

};

intentHandlers['AMAZON.StopIntent'] = function(request,session,response,slots) {
  response.speechText  = `Peace out`;
  response.shouldEndSession = true;
  response.done();
};



intentHandlers['AMAZON.CancelIntent'] =  intentHandlers['AMAZON.StopIntent'];

intentHandlers['AMAZON.HelpIntent'] = function(request,session,response,slots) {
  response.speechText = "You can ask Nutrition Lookup skill about calorie information of food items. For a given food item, it provides you Calories per 100 grams. For example, you can say butter salted, to know about its Calories per 100 grams. Alternatively, you can also say how many calories in butter salted. If skill not opened you can also say in one shot, Alexa, ask Nutri Lookup about butter salted. Please refer to skill description for all possible sample utterences. Which food calorie information would you like to know?";
  response.repromptText = "Which food calorie information would you like to know? or You can say stop to stop the skill.";
  response.shouldEndSession = false;
  response.done();
}



// intentHandlers['GetQuizIntent'] = function(request,session,response,slots) {
//   var fruitsDb = require('./bro_db.json');
//   var index = Math.floor(Math.random() * fruitsDb.length);
//   response.speechText  = `How many calories in ${fruitsDb[index][0]}. `;
//   response.repromptText  = `Please tell number of calories. `;
//   session.attributes.fruit = fruitsDb[index];
//   response.shouldEndSession = false;
//   response.done();
// }





// intentHandlers['QuizAnswerIntent'] = function(request,session,response,slots) {
//   var fruitInfo = session.attributes.fruit;
//   var answer = Number(slots.Answer)
//   var calories = Number(fruitInfo[1])

//   if (calories === answer) {
//     response.speechText  = `Correct answer. Congrats. `;
//   } else if( Math.abs(calories - answer) < 5 )  {
//     response.speechText  = `You are pretty close. ${fruitInfo[0]} contains ${fruitInfo[1]} calories. `;
//   } else {
//     response.speechText  = `Wrong answer. ${fruitInfo[0]} contains ${fruitInfo[1]} calories. `;
//   }
//   response.shouldEndSession = true;
//   response.done();
// }



// intentHandlers['DontKnowIntent'] = function(request,session,response,slots) {
//   var fruitInfo = session.attributes.fruit;
//   var calories = Number(fruitInfo[1])

//   response.speechText  = `No problem. ${broInfo[0]} contains ${fruitInfo[1]} calories. `;
//   response.shouldEndSession = true;
//   response.done();
// }

function searchBro (bDb, broName) {
  broName = broName.toLowerCase();
  broName = broName.replace(/,/g, '');
  var broWords = broName.split(/\s+/);
  var regExps = []
  var searchResult = []

  broWords.forEach(function(sWord) {
  regExps.push(new RegExp(`^${sWord}(es|s)?\\b`));
  regExps.push(new RegExp(`^${sWord}`));
  });

  bDb.forEach( function (item) {
    var match = 1;
    var fullName = item[0]
    var cmpWeight = 0;

  broWords.forEach(function(sWord) {
      if(!fullName.match(sWord)) {
        match = 0;
      }
    });

  if(match==0) {
      return;
    }

  regExps.forEach(function(rExp) {
      if(fullName.match(rExp)) {
        cmpWeight += 10;
      }
    });

  if (fullName.split(/\s+/).length == broWords.length) {
        cmpWeight += 10;
    }
  searchResult.push([item, cmpWeight]);

  });

  var finalResult = searchResult.filter(function(x){return x[1]>=10});
  if(finalResult.length == 0) {
    finalResult = searchResult;
  } else {
    finalResult.sort(function(a, b) {
        return b[1] - a[1];
    });
  }

  finalResult = finalResult.map(function(x) {
    return x[0]
  });

  return finalResult;  
  
}
 
