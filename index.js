const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
       const requestCollection = db.collection('requests')
       const userCollection = db.collection('users');

       app.get('/users', async (req, res)=>{
           const result = await userCollection.find().toArray();    
           res.json(result);
       })
       
      app.post('/users', async (req, res) => {

        const data = req.body;
        const result = await userCollection.insertOne({...data, createdAt: new Date()});
        res.json(result);
        console.log(result);
});
       app.get('/users', async(req, res) =>{
         const email = req.query.email;
         const query = {}
         if(email){
            query.email = email;
         }
          if (query) {
         const result = await userCollection.findOne(query);
          return res.json(result || {});
        }

  const result = await userCollection.find().toArray();
  res.json(result);
        })

        app.patch('/users/:email', async(req, res)=>{
            const {email} = req.params;
            const data = req.body;
            const result = await userCollection.updateOne({ email }, { $set: data });
            res.json(result);
        })
        
        app.get('/payment', async(req, res) =>{
            const result = await paymentCollection.find().toArray();
            res.json(result);
        })
        app.post('/payment', async(req, res)=>{
            const data = req.body;
            const result = await paymentCollection.insertOne({...data, createdAt: new Date()});
            res.json(result);
        })
        app.get('/request', async(req, res) =>{
            const status = req.query.status;
            const email = req.query.email;
            const query = {}
            if(status){
                query.requestStatus = status;
            }
            if(email){
                query.requesterEmail = email;
            }
            const result = await requestCollection.find(query).toArray();
            res.json(result);
        })
        app.post('/request', async(req, res)=>{
            const data = req.body;
            const result = await requestCollection.insertOne({...data, createdAt: new Date()});
            res.json(result);
        })
        app.get('/request/:id', async(req, res) =>{
            const {id} = req.params;
            const result = await requestCollection.findOne({_id: new ObjectId(id)});
            res.json(result || {});
        })
        app.patch('/request/:id', async(req, res) =>{
            const {id} = req.params;
            const data = req.body;
            const result = await requestCollection.updateOne({_id: new ObjectId(id)}, {$set: data});
            res.json(result);
        })
        app.delete('/request/:id', async (req, res) => {
            const { id } = req.params;
            console.log("deleting", id);
            const result = await requestCollection.deleteOne({_id: new ObjectId(id)});
            res.json(result);
            console.log('result', result);
        });

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
