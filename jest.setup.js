const dotenv = require('dotenv');

dotenv.config();

global.TEST_BACKEND_URL =
  process.env.TEST_BACKEND_URL || 'http://localhost:5000';

global.TEST_API_KEY =
  process.env.TEST_API_KEY || 'dm_15bb2ac3a9d8918a4d973305db1ae7035bbcc07b4275a90687e360f430ae5008';
