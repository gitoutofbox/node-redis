require('dotenv').config();
const express = require('express');
const axios = require('axios').default;
const app = express();
const redis = require('redis');

let redisClient;

(async () => {
    redisClient = redis.createClient();

    redisClient.on("error", (error) => console.error(`Error : ${error}`));


    await redisClient.connect();
})();


const PORT = process.env.PORT || 3000;

const redisGetUsersMiddleware = async (req, res, next) => {
    try {
        const cachedData = await redisClient.get('users');
        if (cachedData) {
            res.send(cachedData)
        } else {
            next();
        }
    } catch (err) {
        next();
    }

}
app.listen(PORT, (err) => {
    if (err) throw err;
    console.log('Server started at port' + PORT)
});

app.get('/users', redisGetUsersMiddleware, async (req, res) => {
    await axios.get("https://api.publicapis.org/entries")
    .then(resp => {
        redisClient.set('users', JSON.stringify(resp.data), {
            EX: 60,
            NX: true,
        });
        res.send(resp.data);
    }).catch(err => {
        console.log('error', err)
    })

})