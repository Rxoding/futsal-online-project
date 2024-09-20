import dotenv from 'dotenv';
dotenv.config();

function jwtSecretKey() {
  return process.env.SESSION_SECRET_KEY;
}

export default jwtSecretKey;
