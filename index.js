const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')
const { MongoClient, ServerApiVersion } = require('mongodb');
dotenv.config();

const app = express();
const port = process.env.PORT || 5000

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
    res.send("Server is running!");
})

const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


const run = async () => {
    try {
        await client.connect();
       const db = client.db('donora-project');
       const paymentCollection = db.collection('payments')


        app.get('/payment', async(req, res) =>{
            const result = await paymentCollection.find().toArray();
            res.json(result);
        })
        app.post('/payment', async(req, res)=>{
            const data = req.body;
            const result = await paymentCollection.insertOne({...data, createdAt: new Date()});
            res.json(result);
        })


        await client.db("admin").command({ ping: 1});
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    }
    finally {
        // await client.close();
    }
}
run().catch(console.dir);


app.listen(port, () =>{
    console.log(`Example app listening on port ${port}`);
})
