const functions = require("firebase-functions");
const DialogflowApp = require("actions-on-google").DialogflowApp; // Google Assistant helper library
const rp = require("request-promise");

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((req, resp) => {
    console.log(`Dialogflow Request headers: ${JSON.stringify(req.headers)}`);
    console.log(`Dialogflow Request body: ${JSON.stringify(req.body)}`);

    const app = new DialogflowApp({request: req, response: resp});

    let actionMap = new Map();
    actionMap.set("input.welcome", welcomeIntent);
    actionMap.set("input.unknown", unknownIntent);
    actionMap.set("default", defaultIntent);
    actionMap.set("OpenLottery", openIntent);
    actionMap.set("UpcomingLottery", upcomingIntent);
    actionMap.set("EnterLottery", enterIntent);
    app.handleRequest(actionMap);
});

function welcomeIntent(app) {
    app.ask("Welcome to Virginia Liquor Lottery! Try asking for open or upcoming lotteries.");
}

function unknownIntent(app) {
    app.ask("I'm having trouble, can you try that again?");
}

function defaultIntent(app) {
    app.ask("Try asking for open or upcoming lotteries.");
}

function openIntent(app) {
    console.log(`OpenLottery intent received`);

    retrieveLotteries().then(lotteries => {
        const filtered = lotteries.filter(lottery => lottery.open);

        // check to ensure there was stocking data
        if (filtered.length === 0) {
            app.tell(`No open lotteries were found`);
            return;
        }

        app.tell(`There ${filtered.length > 1 ? "are" : "is"} ${filtered.length} open ${filtered.length > 1 ? "lotteries" : "lottery"}. ${aggregateLotteries(filtered)}.`);

        // if (this.event.context.System.device.supportedInterfaces.Display) {
        //     this.response.renderTemplate(createStockingMapTemplate(filtered));
        // }
    }).catch(err => {
        console.error(err);
        app.tell(`There was a problem communicating with the Virginia Department of Alcoholic Beverage Control.`);
    });
}

function upcomingIntent(app) {
    console.log(`UpcomingLottery intent received`);

    retrieveLotteries().then(lotteries => {
        const filtered = lotteries.filter(lottery => !(lottery.open));

        // check to ensure there was stocking data
        if (filtered.length === 0) {
            app.tell(`No upcoming lotteries were found`);
            return;
        }

        app.tell(`There ${filtered.length > 1 ? "are" : "is"} ${filtered.length} upcoming ${filtered.length > 1 ? "lotteries" : "lottery"}. ${aggregateLotteries(filtered)}.`);

        // if (this.event.context.System.device.supportedInterfaces.Display) {
        //     this.response.renderTemplate(createStockingMapTemplate(filtered));
        // }
    }).catch(err => {
        console.error(err);
        app.tell(`There was a problem communicating with the Virginia Department of Alcoholic Beverage Control.`);
    });
}

function enterIntent(app) {
    console.log(`EnterLottery intent received`);

    app.tell(`<speak>We don't support this feature <break time="500ms"/> <emphasis level="strong">yet</emphasis></speak>`);
}

function retrieveLotteries() {
    return rp({
        method: "GET",
        uri: "https://abhi2xr3kb.execute-api.us-east-1.amazonaws.com/prod/lottery",
        json: true
    }).then(distributions => {
        console.log(`${distributions.length} entries found: ${JSON.stringify(distributions)}`);
        return distributions;
    });
}

function aggregateLotteries(lotteries) {
    return makeGoodListGrammar(lotteries.map(lottery => `${lottery.name}, which is ${lottery.quantity} for ${lottery.price}`));
}

function makeGoodListGrammar(descriptions) {
    if (descriptions.length === 1) {
        return descriptions[0];
    } else {
        return descriptions.map((description, index) => `${index === 0 ? "" : ", "}${index === descriptions.length - 1 ? "and " : ""}${description}`).join("");
    }
}


