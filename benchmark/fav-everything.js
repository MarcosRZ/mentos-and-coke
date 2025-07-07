import { MongoClient, ObjectId } from 'mongodb';

const uri = 'mongodb://localhost:27017/?appName=dev-marcos.rodriguez&readPreference=secondaryPreferred&readPreferenceTags=nodeType:ANALYTICS&retryWrites=true&w=majority';
const dbName = 'paysite';
const sourceCollection = 'videos';
const targetCollection = 'favouritevideos';
const userObjectId = new ObjectId('67e176e8ffc920ff7895aac3');
const userId = '67e176f0000100016dc1bb3d'
const BATCH_SIZE = 100;
const N_VIDEOS_TO_FAV = process.argv[2] ? parseInt(process.argv[2]) : 100;

const favoriteVideos = async (db, userId) => {
  try {
    const source = db.collection(sourceCollection);
    const target = db.collection(targetCollection);

    const total = await db.collection('videos').countDocuments();
    console.log('Total', total);

    await db.collection(targetCollection).deleteMany({ userId });

    const cursor = source.find({}, { projection: { _id: 1, primarySite: 1, videoId: 1 }}).limit(N_VIDEOS_TO_FAV)

    let batch = [];
    let counter = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();

      batch.push({
        userObjectId,
        userId,
        videoObjectId: doc._id,
        brand: doc.primarySite,
        videoId: doc.videoId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });


      if (batch.length === BATCH_SIZE) {
        await target.insertMany(batch);
        console.log(`Insertados ${counter + batch.length} documentos`);
        counter += batch.length;
        batch = [];
      }
    }

    // insertar cualquier resto
    if (batch.length > 0) {
      await target.insertMany(batch);
      console.log(`Insertados ${counter + batch.length} documentos`);
    }

  } catch (err) {
    console.error('Error en la migración', err);
  }
};

const fetchUserIds = async (db) => {
  try {

    const source = db.collection('users');
    const users = await source.find({ site: 'blacked' }, { projection: { _id: 1, site: 1 }});
    return users;
  } catch (err) {
    console.error('Error al obtener los usuarios:', err);
  }
}

// (async () => {
//   const client = new MongoClient(uri);
//   try {
//     const db = client.db(dbName);
//     await client.connect();

//     await favoriteVideos(db, userId);
//   } catch (err) {
//     console.error('Error en la migración', err);
//   }
//   finally {
//     await client.close();
//     console.log('✅ Done');
//   }
// })();

(async () => {
  const client = new MongoClient(uri);
  try {
    const db = client.db(dbName);
    await client.connect();
  
    await favoriteVideos(db, userId);
  
    console.log('✅ Done');
  } catch (err) {
    console.error('Error en la migración', err);
  } finally {
    await client.close();
  }
})();

// (async () => {
//   const client = new MongoClient(uri);
//   try {
//     const db = client.db(dbName);
//     await client.connect();
  
//     const cursor = await fetchUserIds(db);
  
//     let batch = [];
//     let counter = 0;
  
//     console.log(await cursor.hasNext())
  
//     while (await cursor.hasNext()) {
//       const doc = await cursor.next();
  
//       batch.push({
//         userId: doc._id.toString()
//       });
  
//       if (batch.length === BATCH_SIZE) {
//         await Promise.all(batch.map(user => favoriteVideos(db, user.userId)))
//         console.log(`Procesados ${counter + batch.length} userIds`);
//         counter += batch.length;
//         batch = [];
//       }
//     }
  
//     // insertar cualquier resto
//     if (batch.length > 0) {
//       await Promise.all(batch.map(user => favoriteVideos(db, user.userId)))
//       console.log(`Procesados ${counter + batch.length} userIds`);
//     }
  
//     console.log('✅ Done');
//   } catch (err) {
//     console.error('Error en la migración', err);
//   } finally {
//     await client.close();
//   }
// })();
