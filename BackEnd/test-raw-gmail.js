import dotenv from 'dotenv';
import tls from 'tls';
import readline from 'readline';

dotenv.config();

const clean = (v) => (v || '').replace(/\r/g, '').trim();
const user = clean(process.env.SMTP_USER);
const pass = clean(process.env.SMTP_PASS).replace(/\s/g, '');

console.log(`Connecting directly to smtp.gmail.com:465 for ${user}...`);

const socket = tls.connect(465, 'smtp.gmail.com', { rejectUnauthorized: false }, () => {
  console.log('Connected to smtp.gmail.com:465');
});

const rl = readline.createInterface({ input: socket });

let step = 0;

rl.on('line', (line) => {
  console.log(`S: ${line}`);

  if (step === 0 && line.startsWith('220')) {
    step = 1;
    console.log('C: EHLO localhost');
    socket.write('EHLO localhost\r\n');
  } else if (step === 1 && line.startsWith('250 ')) {
    step = 2;
    console.log('C: AUTH LOGIN');
    socket.write('AUTH LOGIN\r\n');
  } else if (step === 2 && line.startsWith('334')) {
    step = 3;
    const b64User = Buffer.from(user).toString('base64');
    console.log(`C: (base64 username) ***REDACTED***`);
    socket.write(`${b64User}\r\n`);
  } else if (step === 3 && line.startsWith('334')) {
    step = 4;
    const b64Pass = Buffer.from(pass).toString('base64');
    console.log(`C: (base64 password) ***REDACTED***`);
    socket.write(`${b64Pass}\r\n`);
  } else if (step === 4) {
    if (line.startsWith('235')) {
      console.log('🎉 SUCCESS! GMAIL AUTHENTICATION PASSED! Your credentials are valid!');
    } else {
      console.log('❌ GMAIL REJECTED AUTHENTICATION:', line);
    }
    socket.end();
  }
});

socket.on('error', (err) => {
  console.error('Socket error:', err);
});
