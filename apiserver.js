const express = require('express');
const cors = require('cors');

const { MongoClient } = require('mongodb');
const { ObjectId } = require('mongodb');

const app = express();

const port = process.env.PORT || 3000;

const uri = 'mongodb+srv://cqu_kb_assignment:VGuHcAgXmtR05k4L@cluster0.w6yww8o.mongodb.net/?retryWrites=true&w=majority'
const client = new MongoClient(uri, { useUnifiedTopology: true });

// to allow cross site request
app.use(cors());

// app.use((req, res, next) => {
//   res.setHeader('Access-Control-Allow-Origin', 'http://localhost:*');
//   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
//   res.setHeader('Access-Control-Allow-Credentials', 'true');
//   next();
// });

app.use(express.json());

async function startServer() {
  try {
    
    await client.connect();
    console.log('Connected to MongoDB Atlas');
    const db = client.db('store');
    const locationsCollection = db.collection('locations');

    // api to fetch cloud data
    app.get('/search', async (req, res) => {
    const type = req.query.type;
    const city = req.query.city;


      const filter = {};
      if (type !== undefined) {
        filter.location_type = { $regex: new RegExp(type, 'i') };
      }
      if (city !== undefined) {
        filter.city = { $regex: new RegExp(city, 'i') };
      }

      const locations = await locationsCollection.find(filter).toArray();
      console.log("Data fetched: "+ JSON.stringify(locations));
      res.send(locations);
    });

    app.get('/find/:id', async (req, res) => {
      const id = req.params.id;
      const filter = {};
      filter._id = new ObjectId(id);
      const locations = await locationsCollection.find(filter).toArray();
      console.log("Data fetched: "+ JSON.stringify(locations));
      res.send(locations);
    });
    
    // api to upload data to the cloud
    app.post('/post_static_location_data', async (req, res) => {
    var dataArray = [];
      try {
        // tries to add [] to the req.body (for applicaiton)
        dataArray = JSON.parse('\[' + req.body + '\]');
      } catch(e) {
        // this is for postman testing. req.body will come as an array, so no need to parse it.
         dataArray = req.body;
      }

      const options = { ordered: true };
      try {
        const result = await locationsCollection.insertMany(dataArray, options);
        console.log("Data uploaded: "+ JSON.stringify(dataArray));
      } catch (e) {
        console.log("Error during upload. !");

      }
      res.send(JSON.stringify(dataArray));
    });

    app.put('/post_review/:id', async (req, res) => {
      try {
        const placeId = req.params.id;
        const updatedPlace = req.body;
    
        delete updatedPlace._id;

        const result = await locationsCollection.replaceOne(
          { _id: new ObjectId(placeId) },
          updatedPlace
        );
    
        if (result.modifiedCount === 0) {
          res.status(500).send('Place update failed');
        } else {
          res.send('Place updated successfully');
        }
        
      } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred');
      }
      
    });

    // starting express server
    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });

  } catch (error) {
    console.error('Error connecting to MongoDB Atlas', error);
  }
}

startServer();
