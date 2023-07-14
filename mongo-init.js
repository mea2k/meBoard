
var db = connect("mongodb://localhost:27017/admin");
db.getSiblingDB("admin")
db.auth(process.env.MONGO_INITDB_ROOT_USERNAME, process.env.MONGO_INITDB_ROOT_PASSWORD);

db.createUser(
    {
        user: process.env.MONGO_USERNAME,
        pwd: process.env.MONGO_PASSWORD,
        roles: [{
            role: "readWrite",
            db: process.env.MONGO_DATABASE
        }],
        passwordDigestor: "server",
    }
)

db = db.getSiblingDB(process.env.MONGO_DATABASE); // we can not use "use" statement here to switch db

const collections = JSON.parse(process.env.MONGO_DATABASE_COLLECTIONS)
for (var collection of collections)
    db.createCollection(collection);

