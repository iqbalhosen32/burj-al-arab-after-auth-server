const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');

require('dotenv').config()
const port = 4000

console.log()

const app = express()

app.use(cors());
app.use(bodyParser.json());

var serviceAccount = require("./configs/bruj-alarab-auth-firebase-adminsdk-ua7sx-b80f3de966.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});



const { MongoClient } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yhxyp.mongodb.net/burjAlArab?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const bookingCollection = client.db("burjAlArab").collection("bookingData");

  app.post('/addBooking', (req, res) => {
    const newBooking = req.body;
    bookingCollection.insertOne(newBooking)
      .then(result => {
        console.log(result);
      })
    console.log(newBooking)
  })

  app.get('/bookings', (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith('Bearer ')) {
      const idToken = bearer.split(' ')[1];
      // console.log({ idToken })
      admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
          // console.log({ tokenEmail })
          if (tokenEmail == queryEmail) {
            bookingCollection.find({ email: queryEmail })
              .toArray((err, documents) => {
                res.status(200).send(documents)
              })
          }
          else{
            res.status(401).send('Access Unauthorized');
          }
        })
        .catch((error) => {
          res.status(401).send('Access Unauthorized');
        });
    }
    else{
      res.status(401).send('Access Unauthorized');
    }


  })

});


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port)