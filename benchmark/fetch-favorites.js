const { MongoClient, ExplainVerbosity } = require('mongodb');
(async () => {
    const uri = 'mongodb://localhost:27017/?appName=dev-marcos.rodriguez';
    const dbName = 'paysite';
    const userId = '67e176f0000100016dc1bb3d';
    const sites = [ 'vixenplus' ];
    offset = 0;
    limit = 12;
    const pipeline = [
        {
          $match: {
            userId: userId,
            brand: {
                $in: [ ...sites, "channels" ],
            },
          },
        },
        {
          $lookup: {
            from: "videos",
            localField: "videoId",
            foreignField: "videoId",
            as: "video",
          },
        },
        { $unwind: "$video" },
        {
          $match: {
            $or: [
                {
                    "video.channelInfo": null,
                },
                {
                    "video.channelInfo.isThirdPartyChannel": false,
                },
            ],
          },
        },
        {
          $facet: {
            data: [
                { $sort: { updatedAt: -1 } },
                { $replaceWith: "$video" },
                { $skip: offset },
                { $limit: limit },
                { $project: {
                    id: 1,
                    models: 1,
                    slug: 1,
                    targetUrl: 1,
                    images: 1,
                    previews: 1,
                    newId: 1,
                    videoUrl1080P: 1,
                    previewVideoUrl1080P: 1,
                    primarySite: 1,
                    downloadDate: 1,
                    previewDate: 1,
                    releaseDate: 1,
                    directors: 1,
                    runLength: 1,
                    runLengthForDisplay: 1,
                    description: 1,
                    descriptionHtml: 1,
                    categories: 1,
                    tags: 1,
                    title: 1,
                    isUpcoming: 1,
                    picturesInSet: 1,
                    showcaseData: 1,
                    chapters: 1,
                    channelInfo: 1,
                    timelineThumbs: 1,
                    videoSize480P: 1,
                    videoSize720P: 1,
                    videoSize1080P: 1,
                    videoSize2160P: 1,
                    videoSizeMobile270P: 1,
                    videoSizeMobile360P: 1,
                    videoSizeMobile480P: 1,
                    xvsVideo: 1,
                    freeVideoMA: 1,
                    expertReview: 1,
                    freeLimitedTrialSites: 1,
                } },
            ],
            totalCount: [{ $count: "count" }],
          },
        },
    ];

    const client = new MongoClient(uri);
    try {
    const db = client.db(dbName);
    await client.connect();

    const explain = await db.collection('favouritevideos').aggregate(pipeline).explain();
    // const results = await db.collection('favouritevideos').aggregate(pipeline).toArray();

    console.log(JSON.stringify(explain, null, 2));
    // console.log(results[0].data.length);

    } catch (err) {
    console.error('Error en la migración', err);
    }
    finally {
    await client.close();
    console.log('✅ Done');
    }
})();