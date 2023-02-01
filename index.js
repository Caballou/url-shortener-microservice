require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

//-----------------------------------------------------------//

//Connect to database url-shortener-microservice (MongoDB Atlas)
mongoose.connect(process.env['MONGO_URI'], { useNewUrlParser: true, useUnifiedTopology: true });

const urlSchema = new mongoose.Schema({
  original_url: { type: String, required: true },
  short_url: Number
})

let Url = mongoose.model('Url', urlSchema)

app.use(bodyParser.urlencoded({ extended: false })); //Use body-parser

app.post('/api/shorturl', (req, res) => {

  let original_url = req.body.url // Original URL to add to database
  let parsed_url = url.parse(req.body.url).hostname //Parsed URL to check valid dns

  dns.lookup(parsed_url, (err, address) => { //Check if the URL is valid

    if (address == null) {
      res.json({ error: "invalid url" }) // Is not valid, display an error message

    } else {

      let shortNumber = 1 // Initialize the number for short URL

      Url.findOne({}).sort({ short_url: 'desc' }).exec((err, result) => {

        /*[COUNTER] This is to create a "serial" short_url in the database. 
        Since the last URL short number in the database (only order the 
        database by short url number and get the last (higher))*/

        if (!err && result != undefined) {
          //console.log(result)
          shortNumber = result.short_url + 1 // +1 to the last shor url number in the database!
        }

        Url.findOne({ original_url: original_url }, (err, find) => { //Check if the entered URL exist in database
          //console.log(find)
          if (find) { // if exist, then show json object

            res.json({ original_url: find.original_url, short_url: find.short_url })

          } else { // if doesn't exist, then add the new URL to the database (new + save) and show de json object!

            const add = new Url({ original_url: original_url, short_url: shortNumber })
            add.save()
            res.json({ original_url: add.original_url, short_url: add.short_url })
          }
        })
      })
    }
  })
})

app.get('/api/shorturl/:go', (req, res) => {
  let go = req.params.go

  Url.findOne({ short_url: go }, (err, find) => {
    console.log(find)
    if (!err && find != undefined) {
      res.redirect(find.original_url)
    } else {
      res.json({ error: "404 Not Found"})
    }
  })
})