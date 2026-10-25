import dns from 'node:dns';
import mongoose from 'mongoose';
import env from './env.js';

export async function connectDB() {
  // Some local DNS proxies can't answer the SRV lookup that mongodb+srv:// needs
  if (env.dnsServers.length) {
    dns.setServers(env.dnsServers);
  }
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri);
  console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
}

export async function disconnectDB() {
  await mongoose.connection.close();
}
