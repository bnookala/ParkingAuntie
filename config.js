var config = {}

config.host = process.env.HOST || "https://parkingauntie.documents.azure.com:443/";
config.authKey = process.env.AUTH_KEY || "H2AD40qUut6PQv9Bf50GCs5m3qEYJ9ui3Cp9X86WjH2D5z7TxZ0ErZK6nc53CYbsa4AnM5zzHt1HPijTIVzeow==";
config.databaseId = "ParkingAuntieDB";
config.userCollectionId = "ParkingAuntieUsersCollection";
config.collectionId = "ParkingAuntieCollection";

module.exports = config;
