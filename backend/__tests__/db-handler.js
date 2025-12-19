const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
let mongoServer = undefined;

const connect = async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri, {
        // modern driver doesn't need these options; keep minimal
    });
}
const closeDatabase = async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    if (mongoServer) {
        await mongoServer.stop();
    }
}
const clearDatabase = async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany();
    }
}
module.exports = {
    connect,
    closeDatabase,
    clearDatabase,
};