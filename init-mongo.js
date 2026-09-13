import { MongoClient } from 'mongodb';

async function init() {
    const uri = "mongodb://127.0.0.1:27018/?directConnection=true";
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const adminDb = client.db('admin');
        const result = await adminDb.command({
            replSetInitiate: {
                _id: "rs0",
                members: [{ _id: 0, host: "localhost:27018" }]
            }
        });
        console.log("Replica set initiated:", result);
    } catch (err) {
        if (err.message.includes('already initialized')) {
            console.log('Replica set already initialized.');
        } else {
            console.error("Error initiating replica set:", err);
        }
    } finally {
        await client.close();
    }
}

init();
