const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const urlParser = require('url');
const app = express();

app.use(express.json());
app.use(express.static('public'));

// Set the 'views' directory
app.set('views', __dirname + '/views');

// Set the view engine (EJS in this example)
app.set('view engine', 'ejs');

// In-memory search history with links, favorites, and media links
const searchHistory = [];

// Define a route to render the "index" view
app.get('/', (req, res) => {
  res.render('index'); // Renders "index.ejs" from the "views" directory
});

app.post('/api/count-words', async (req, res) => {
    const { websiteUrl } = req.body;

    try {
        // Fetch the content of the website
        const response = await axios.get(websiteUrl);
        const text = response.data;

        // Count the words (a simple example)
        const words = text.split(/\s+/).filter(word => word !== '');
        const wordCount = words.length;

        // Extract links from the website
        const htmlContent = response.data;
        const $ = cheerio.load(htmlContent);
        const links = [];
        const mediaLinks = [];

        $('a').each((index, element) => {
            const link = $(element).attr('href');
            if (link) {
                links.push(link);
            }
        });

        $('img').each((index, element) => {
            const imgSrc = $(element).attr('src');
            if (imgSrc) {
                mediaLinks.push(imgSrc);
            }
        });

        // Initialize favorite status as false
        let isFavorite = false;

        // Check if the website is in the favorites
        const existingFavorite = searchHistory.find(entry => entry.websiteUrl === websiteUrl);
        if (existingFavorite) {
            isFavorite = existingFavorite.isFavorite;
        }

        // Store the search history with links, media links, and favorite status
        searchHistory.push({ websiteUrl, wordCount, links, mediaLinks, isFavorite });

        res.json({ websiteUrl, wordCount, links, mediaLinks, isFavorite });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch and count words.' });
    }
});

//search history
app.get('/api/search-history', (req, res) => {
    res.json(searchHistory);
});


app.post('/api/toggle-favorite', (req, res) => {
    const { websiteUrl } = req.body;

    const websiteEntry = searchHistory.find(entry => entry.websiteUrl === websiteUrl);
    if (websiteEntry) {
        websiteEntry.isFavorite = !websiteEntry.isFavorite;
        res.json({ websiteUrl, isFavorite: websiteEntry.isFavorite });
    } else {
        res.status(404).json({ error: 'Website not found in search history.' });
    }
});


const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
