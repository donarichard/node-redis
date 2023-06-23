const express = require("express");
const axios = require("axios");
const { createClient } = require("redis");
const morgan = require("morgan");
const data = require("./example.json");

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
const largeRedisKey = "store:large"; // cache key for users
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
    await axios
      .get("https://jsonplaceholder.typicode.com/users")
      .then((res) => res.data)
      .then(async (users) => {
        client.setEx(usersRedisKey, 600, JSON.stringify(user));
        // send JSON response to client
        return res.json({ source: "api", data: users });
      })
      .catch((error) => {
        // send error to the client
        return res.json(error.toString());
      });
  }
});

// sample data endpoint with caching
app.get("/large", async (req, res) => {
  // try to fetch the result from redis
  const largeData = await client.get(largeRedisKey);
  if (largeData) {
    return res.json({ source: "cache", data: JSON.parse(largeData) });
    // if cache not available call API
  } else {
    client.setEx(largeRedisKey, 600, JSON.stringify(data));
    // sending large data
    res.json({
      source:'api',
      data
    });
  }
});

// clear the cache on redis
app.get("/clear", async (req, res, next) => {
  await client.flushAll("ASYNC");
  res.json({
    status: true,
    message: "Cleared successfully",
  });
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on http://localhost:${process.env.PORT}`);
});
