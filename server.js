'use strict';

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const request = require('request');
const sequest = require('sequest');

app.use(bodyParser.json());

var seq = sequest('remote.ecf.utoronto.ca', {
    username: 'mahmo211',
    password: 'Anam110744550000990044'
}, function(err, stdout) {
    if (err) console.error(err)
    console.log(stdout)
});


app.get('/webhook', function(req, res) {
    console.log(req.query);

    if (req.query['hub.mode'] === 'subscribe' &&
        req.query['hub.verify_token'] === 'keyIsCompliments') {
        console.log("Validating webhook");
        res.status(200).send(req.query['hub.challenge']);
    } else {
        console.error("Failed validation. Make sure the validation tokens match.");
        res.sendStatus(403);
    }
});

app.post('/webhook', function(req, res) {
    let data = req.body;
    console.log(JSON.stringify(data));
    console.log('post');
    // Make sure this is a page subscription
    if (data.object === 'page') {

        // Iterate over each entry - there may be multiple if batched
        data.entry.forEach(function(entry) {
            let pageID = entry.id;
            let timeOfEvent = entry.time;

            // Iterate over each messaging event
            entry.messaging.forEach(function(event) {
                if (event.message) {
                    receivedMessage(event);
                } else {
                    console.log("Webhook received unknown event: ", event);
                }
            });
        });

        res.sendStatus(200);
    }
});

let dir = 'cd ~ && ';

function receivedMessage(event) {
    let senderID = event.sender.id;
    let recipientID = event.recipient.id;
    let timeOfMessage = event.timestamp;
    let message = event.message;

    console.log("Received message for user %d and page %d at %d with message:",
        senderID, recipientID, timeOfMessage);
    console.log(JSON.stringify(message));

    let messageId = message.mid;

    let messageText = message.text;
    let messageAttachments = message.attachments;

    if (messageText) {

        // If we receive a text message, check to see if it matches a keyword
        // and send back the example. Otherwise, just echo the text we received.

        switch (messageText) {
            case 'generic':
                sendGenericMessage(senderID);
                break;
            default:
                seq.pipe(process.stdout) // only necessary if you want to see the output in your terminal
                seq.write('ls -la')
                seq.write('touch testfile')
                seq.write('ls -la')
                seq.end()
        }
    } else if (messageAttachments) {
        sendTextMessage(senderID, "Message with attachment received");
    }
}

function sendTextMessage(recipientId, messageText) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            text: messageText
        }
    };

    callSendAPI(messageData);
}

function callSendAPI(messageData) {
    request({
        uri: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {
            access_token: 'EAADwhhaDOhgBAEQ3MKF56klGxI1ZAkzVb05Gv4yiW0TWRV7T9xkeR02gQh7Cpc8RrkwAikmO42IljZBBZAe9iFIi7VeC9I04J0NZCRcFt6YagpBhc85X2X0TglrZCMOoNDcs8kVaNZBbk3J4ae02s1ppBTnjZBMUZCg4b0MAMylXnAZDZD'
        },
        method: 'POST',
        json: messageData
    }, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var recipientId = body.recipient_id;
            var messageId = body.message_id;

            console.log("Successfully sent generic message with id %s to recipient %s",
                messageId, recipientId);
        } else {
            console.error("Unable to send message.");
            console.error(response);
            console.error(error);
        }
    });
}

app.listen(process.env.PORT || 3000, () => {
    console.log('Listening on port: 3000');
});
