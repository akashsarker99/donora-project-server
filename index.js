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
       const userCollection = db.collection('user');
       
      app.post('/users', async (req, res) => {
      const user = req.body;
       const existingUser = await userCollection.findOne({email: user.email});     
    if (existingUser) {
      const result = await userCollection.updateOne(
      { email: user.email },
      {
        $set: {
          bloodGroup: user.bloodGroup,
          district: user.district,
          upazila: user.upazila,
          role: user.role,
          status: user.status,
          image: user.image,
        },
      }
    );

    return res.json(result);
  }
  const result = await userCollection.insertOne(user);
  res.json(result);
});

         app.get("/users", async (req, res) => {
            const { email } = req.query;

          if (email) {
                const user = await userCollection.findOne({ email });
                return res.json(user || {});
            }
        const users = await userCollection.find().toArray();
         res.json(users);
        });
        app.patch('/users/:email', async(req, res)=>{
            const {email} = req.params;
            const data = req.body;
            const result = await userCollection.updateOne({ email }, { $set: {...data, updatedAt: new Date()} });
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
        app.patch('/request/:id',  async(req, res) =>{
            const {id} = req.params;
            const data = req.body;
            const result = await requestCollection.updateOne({_id: new ObjectId(id)}, {$set: data});
            res.json(result);
        })
        app.delete('/request/:id', async (req, res) => {
            const { id } = req.params;
            const result = await requestCollection.deleteOne({_id: new ObjectId(id)});
            res.json(result);
        });

        app.get("/users/search", async (req, res) => {
            const {bloodGroup, district, upazila} = req.query;
            const query = {
                role: "donor",
                status: "active",
                  };
            if (bloodGroup) {
              query.bloodGroup = bloodGroup;
            }
            if (district) {
              query.district = district;
            }
            if (upazila) {
              query.upazila = upazila;
            }
            const result = await userCollection.find(query).toArray();
            console.log(query)
            res.json(result);
});

        app.get("/stats", async (req, res) => {
            const totalDonors = await userCollection.countDocuments({role: "donor",status: "active"});
            const activeRequests = await requestCollection.countDocuments({requestStatus: "inprogress"});
             const payments = await paymentCollection.find().toArray();
            const totalFunding = payments.reduce((sum, payment) => sum + Number(payment.amount),0);

            res.json({totalDonors,activeRequests,totalFunding});
        });

        app.get("/donationpage", async(req, res)=>{
          const {page= 1, limit= 8} = req.query;
          const skip = (page - 1) * limit;
          const result = await requestCollection.find({requestStatus: "pending"}).skip(skip).limit(Number(limit)).toArray();
          const totalData = await requestCollection.countDocuments({requestStatus: "pending"});
          const totalPages = Math.ceil(totalData / Number(limit));
          res.json({data: result, pageNumber: Number(page), totalPages});
        })
        app.get('/alldonationpage', async(req, res)=>{
           const {page= 1, limit= 10} = req.query;
          const skip = (page - 1) * limit;
          const result = await requestCollection.find().skip(skip).limit(Number(limit)).toArray();
          const totalData = await requestCollection.countDocuments();
          const totalPages = Math.ceil(totalData / Number(limit));
          res.json({data: result, pageNumber: Number(page), totalPages});
        })
        app.get('/alluserpage', async(req, res)=>{
           const {page= 1, limit= 10} = req.query;
          const skip = (page - 1) * limit;
          const result = await userCollection.find().skip(skip).limit(Number(limit)).toArray();
          const totalData = await userCollection.countDocuments();
          const totalPages = Math.ceil(totalData / Number(limit));
          res.json({data: result, pageNumber: Number(page), totalPages});
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
