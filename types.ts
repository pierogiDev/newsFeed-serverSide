type category = "general" | "business" | "technology" | "science" | "entertainment" | "sports" | "health";

type article = {
    source: {
        id: string | null,
        name: string,
    },
    author: string,
    title: string,
    description: string,
    url: string,
    urlToImage: string,
    publishedAt: string,
    content: string,
}

type articles = Array<article>;

type returnOfGetJpNewsByCategories = {
    [prop in category]: articles;
};

type myFeedObject = {
    [word: string]: {
        recordedAt?: string,
        articles: articles
    },
}

type myFeed = Array<myFeedObject>

type feedList = Array<{
    feedWord: string,
    recordedAt: string,
}>

export type {category, article, articles, returnOfGetJpNewsByCategories, myFeed, myFeedObject, feedList}
