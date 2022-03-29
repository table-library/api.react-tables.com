import cors from 'cors';
import express from 'express';
import axios from 'axios';

const app = express();

app.use(cors());

// in-memory cache
// { data: [], expires: new Date() }
const cache = {};

app.get('/', async (req, res) => {
  const hash = req.query.proxy;

  Object.keys(cache).forEach((hash) => {
    const isExpire =
      cache[hash].expires.getTime() < new Date().getTime();

    if (isExpire) {
      console.log('clean up');
      delete cache[hash];
    }
  });

  const isCacheHit = cache[hash];

  let data;

  if (!hash) {
    data = [];
  } else if (isCacheHit) {
    console.log('cache hit');
    // get cached data
    data = cache[hash].data;
  } else {
    console.log('cache miss');
    // decode url
    const buffer = Buffer.from(hash.toString(), 'base64');
    const url = buffer.toString('utf-8');

    // set 1 hour expire date
    const expires = new Date();
    expires.setHours(expires.getHours() + 1);

    try {
      // fetch data
      const result = await axios.get(url);
      data = result.data;

      // cache data
      cache[hash] = {
        data,
        expires,
      };
    } catch (error) {
      console.log(error);

      // fallback
      if (isCacheHit) {
        data = cache[hash].data;
      } else {
        data = [];
      }
    }
  }

  res.send(data);
});

app.listen(3004, () =>
  console.log(`no-rate-limit listening on port 3004!`)
);
