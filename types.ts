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

type arrayOfArticle = Array<article>;

type returnOfGetJpNewsByCategories = {
    [prop in category]: arrayOfArticle;
};

type feedObject = {
    [word: string]: arrayOfArticle,
}

type returnOfMyfeed = Array<feedObject>

type auth = {
    email: string,
}

export type {category, article, arrayOfArticle, returnOfGetJpNewsByCategories, auth, feedObject, returnOfMyfeed}
