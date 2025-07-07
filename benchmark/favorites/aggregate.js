import { sites, limit, offset, userId, projection } from './common.js';

export const aggregateTest = () => {
  const pipeline = [
    { $match: { userId, brand: { $in: [...sites, "channels"] } } },
    {
      $lookup: {
        from: "videos",
        localField: "videoId",
        foreignField: "videoId",
        as: "video",
      }
    },
    {
      $addFields: {
        video: { $arrayElemAt: ["$video", 0] }
      }
    },
    {
      $match: {
        $or: [
          { "video.channelInfo": null },
          { "video.channelInfo.isThirdPartyChannel": false }
        ]
      }
    },
    { $sort: { updatedAt: -1 } },
    {
      $facet: {
        data: [
          { $skip: offset },
          { $limit: limit },
          { $replaceWith: "$video" },
          { $project: projection },
        ],
        totalCount: [{ $count: "count" }],
      },
    },
  ];
  return async (db) => db.collection('favouritevideos').aggregate(pipeline).toArray();
};