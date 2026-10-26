/**
 * Gives an existing account access to the admin panel.
 *   npm run make-admin -- someone@example.com
 *   npm run make-admin -- someone@example.com --remove
 */
import { connectDB, disconnectDB } from '../config/db.js';
import User from '../models/User.js';

const [email, flag] = process.argv.slice(2);

if (!email) {
  console.error('Usage: npm run make-admin -- <email> [--remove]');
  process.exit(1);
}

await connectDB();
const role = flag === '--remove' ? 'user' : 'admin';
const user = await User.findOneAndUpdate({ email: email.toLowerCase().trim() }, { role }, { returnDocument: 'after' });
if (user) {
  console.log(`${user.email} is now ${role === 'admin' ? 'an admin' : 'a regular user'}.`);
} else {
  console.error(`No account found for ${email}. Sign up in the app first.`);
  process.exitCode = 1;
}
await disconnectDB();
