import {category} from "../types";
import axios, {AxiosResponse} from "axios";

import {currentTimeReadable} from "@pierogi.dev/readable_time";

import type {returnOfGetJpNewsByCategories} from "../types";

//
//Define a function that gets each category of top news headline from NewsAPI.
//

export const getJpNewsByCategories = async (): Promise<returnOfGetJpNewsByCategories> => {
    let categories: Array<category> = ["general", "business", "technology", "science", "entertainment", "sports", "health"];
    let arrayOfJpCategoriesTopHeadlines: returnOfGetJpNewsByCategories = {general: [], business: [], technology: [], science: [], entertainment: [], health: [], sports: []};

    for (const category of categories) {
        let jpCategoriesTopHeadlines: AxiosResponse = await axios.get(`https://newsapi.org/v2/top-headlines?country=jp&category=${category}&apiKey=86414c1e4e4b4e7195657297a5f7a53d`);
        arrayOfJpCategoriesTopHeadlines[category] = jpCategoriesTopHeadlines.data.articles;
    }

    console.log(`${currentTimeReadable()} | The getJpNewsByCategories is done.`);

    return arrayOfJpCategoriesTopHeadlines;
}
