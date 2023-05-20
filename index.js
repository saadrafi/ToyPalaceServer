const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

// Connection URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wqecfea.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const toysCollection = client.db("toypalace").collection("toysCollection");

    //add toy data to database
    app.post("/addToy", async (req, res) => {
      const newToy = req.body;
      console.log("adding new toy: ", newToy);
      const result = await toysCollection.insertOne(newToy);
      res.send(result);
    });

    //get all toys from database
    app.get("/alltoys", async (req, res) => {
      const options = {
        projection: {
          name: 1,
          price: 1,
          quantity: 1,
          subCategory: 1,
          sellerName: 1,
        },
      };
      const cursor = toysCollection.find({}, options);
      const toys = await cursor.toArray();
      res.send(toys);
    });

    // get toy data by id
    app.get("/toy/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const toy = await toysCollection.findOne(query);
      res.send(toy);
    });

    // get toys data by email in url query
    app.get("/mytoys", async (req, res) => {
      const email = req.query.email;
      const isSort = req.query.sort;
      console.log(isSort);
      if (isSort != "none") {
        const options = {
          sort: { price: isSort == "High" ? -1 : 1 },
        };
        const cursor = toysCollection.find({ sellerEmail: email }, options);
        const toys = await cursor.toArray();
        res.send(toys);
        return;
      }
      const query = { sellerEmail: email };

      const cursor = toysCollection.find(query);
      const toys = await cursor.toArray();
      res.send(toys);
    });

    // update toy data by id
    app.put("/updatetoy/:id", async (req, res) => {
      const id = req.params.id;
      const updatedToy = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          ...updatedToy,
        },
      };
      const result = await toysCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    });

    // delete toy data by id
    app.delete("/deletetoy/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await toysCollection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

//
app.get("/", (req, res) => {
  res.send("Server Running");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
