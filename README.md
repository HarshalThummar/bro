# Alexa skill to find your Bro
Find your fraternity bro 

## Parse Excel data into json 
1. Have Data in .csv file
2. Use the URL to convert csv into json - http://www.convertcsv.com/csv-to-json.htm


## Build the Skill
- Event Json 
    - Example 
```JSON
{
  "session": {
    "new": false,
    "sessionId": "session1234",
    "attributes": {},
    "user": {
      "userId": "usrid123"
    },
    "application": {
      "applicationId": "amzn1.echo-sdk-ams.app.1234"
    }
  },
  "version": "1.0",
  "request": {
    "intent": {
      "slots": {
        "FoodItem": {
          "name": "FoodItem",
          "value": "butter salted"
        }
      },
      "name": "GetNutritionInfo"
    },
    "type": "IntentRequest",
    "requestId": "request5678"
  }
}
```
- Sample Uttarance 
    - Example
        - GetNutritionInfo how many calarioes are in {FoodItem}
        - GetNutritionInfo more information 
        - GetNutritionInfo more 
    - Find my bro
        - GetBroInfo how many bros are in {broItem}
        - GetBroInfo more bros
        - GetBroInfo more

- Intent Schema 
    - Example

```JSON
{
    "intents": [ 
        {
            "intent": "GetNutritionInfo",
            "slots": [
                {
                    "name": "FoodItem",
                     "type": "FOOD_ITEMS (Custom Slot Name)"
                 }
            ]
        },
        {
            "intent": "GetNextEventIntent",
            "slots": [

            ]
        },
        {
            "intent": "AMAZON.StopIntent"
        }
    ]
}
```

-  