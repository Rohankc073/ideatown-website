import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_NAME = process.env.MONGODB_NAME;

// Cached on the global so Next's dev server does not open a new pool on every
// hot reload.
let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, {
            dbName: MONGODB_NAME,
            // Mongoose defaults to 30s of server selection and 30s to connect.
            // Thirty seconds is not "slow", it is a hang: the application-link
            // gate sat on "CHECKING YOUR LINK..." for the full half minute
            // before its fail-open could run, which is what a founder with a
            // fresh invitation actually saw. Ten seconds is still generous for
            // a cold pool and turns an outage into an error the caller can
            // handle rather than a page that never resolves.
            serverSelectionTimeoutMS: 10000,
            connectTimeoutMS: 10000,
            socketTimeoutMS: 20000,
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (error) {
        // Without this the rejected promise stays cached and every later
        // request awaits the same failure — so a database that was briefly
        // down stays "down" until someone restarts the site. Clearing it lets
        // the next request try again.
        cached.promise = null;
        cached.conn = null;
        throw error;
    }

    return cached.conn;
}
