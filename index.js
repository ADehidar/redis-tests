const { response } = require("express");
const express = require("express"); 
const redis = require("redis");
const util = require("util")
const axios = require("axios")

const redisURL = "redis://localhost:6379";

const client = redis.createClient({
    url: redisURL,
    legacyMode: true}
    );




client.set = util.promisify(client.set);
client.get = util.promisify(client.get);

const app = express();
app.use(express.json()) // This is required since node v4 +


app.post("/",async (req,res) => { 
 
    const {key,value} = req.body;

    await client.connect(); // This is also required in newer version of redis 
 
    const response= client.set(key,value);  

    res.json(response)
})

app.get("/", async (req,res) => {
    const {key} = req.body; 
    await client.connect(); 
    const result = await client.get(key); 
    res.json(result);
})

app.get("/post/:id", async (req,res) => {

    const {id} = req.params;

    if(!client.isOpen)
     await client.connect(); 

    const cachedPost = await client.get("post-"+id); 

    if(cachedPost){
        return res.json(JSON.parse(cachedPost))
    }

    const response = await axios.get("https://jsonplaceholder.typicode.com/posts/"+id);

    await client.set("post-"+id,JSON.stringify(response.data),"EX",5);

    return res.json(response.data);

})

app.listen(8080, ()=> {
   console.log('Hey, now listening on  PORT 8080!')
})