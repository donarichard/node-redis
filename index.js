const express = require("express");
const axios = require("axios");
const { createClient } = require("redis");
const morgan = require("morgan");

const dotenv = require("dotenv");
dotenv.config();

const app = express();

app.use(morgan("dev"));

// setup redis client

const client = createClient();

client.on("error", (err) => console.log("Redis Client Error", err));

client.connect();

// redis store configs
const usersRedisKey = "store:users"; // cache key for users
const dataExpireTime = 3600; // 1 hour cache expire time

// users endpoint with caching
app.get("/users", async (req, res) => {
  // try to fetch the result from redis
  const users = await client.get(usersRedisKey);
  if (users) {
    return res.json({ source: "cache", data: JSON.parse(users) });

    // if cache not available call API
  } else {
    // get data from remote API
    
  }
  
});

// clear the cache on redis
app.get('/clear',async(req,res,next)=>{
    await client.flushAll('ASYNC');
    res.json({
        status:true,
        message:'Cleared successfully'
    })
})


app.listen(process.env.PORT, () => {
  console.log(`Server is running on http://localhost:${process.env.PORT}`);
});
