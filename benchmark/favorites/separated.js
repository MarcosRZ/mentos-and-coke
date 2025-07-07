import { sites, limit, offset, userId, projection } from './common.js';

const mapFavoriteVideo = favoriteVideo => {
  return {
      favoriteVideoId: favoriteVideo._id,
      userId: favoriteVideo.userId,
      videoId: favoriteVideo.videoId,
      site: favoriteVideo.brand,
  };
};

const findFavoriteVideoRecordByUserId = async (db) => {
  try {
      const favoriteVideos = await db.collection('favouritevideos').find(
          {
              userId,
              brand: { $in: [...sites, 'channels'] },
          },
          {
              userId: 1,
              videoId: 1,
              brand: 1,
          },
          {
              sort: {
                  updatedAt: -1,
              },
          }
      );

      return favoriteVideos.map(fv => mapFavoriteVideo(fv)).toArray();
  } catch (error) {
      console.error('Error finding favorite video records by userId:', error);
      throw error;
  }
}

const findByVideoIdsInSites = async(db, videoIds) => {
  const orQuery = [{
      videoId: { $in: videoIds },
      primarySite: { $in: [...sites.filter(site => site !== 'channels')] },
  },
  {
      videoId: { $in: videoIds },
      primarySite: { $in: ['channels'] },
      'channelInfo.isThirdPartyChannel': false,
  }];
  const query = { $or: orQuery };

  return db.collection('videos')
    .find(query, {
      sort: { releaseDate: -1 },
      projection: projection,
      skip: offset,
      limit,
    })
    .toArray();
}

const countVideosByVideoIdsAndSites = async(db, videoIds) => {
  const orQuery = [{
      videoId: { $in: videoIds },
      primarySite: { $in: [...sites.filter(site => site !== 'channels')] },
  },
  {
      videoId: { $in: videoIds },
      primarySite: { $in: ['channels'] },
      'channelInfo.isThirdPartyChannel': false,
  }];

  const query = { $or: orQuery };

  return db.collection('videos').count(query);
}

export const separateTest = () => async (db) => {
  const favs = await findFavoriteVideoRecordByUserId(db);
  const ids = favs.map(fav => fav.videoId);
  return await Promise.all([
    countVideosByVideoIdsAndSites(db, ids),
    findByVideoIdsInSites(db, ids),
  ]);
}