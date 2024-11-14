const fs = require('fs');
const path = require('path');
const { WAConnection, MessageType } = require('@adiwajshing/baileys');
const fetch = require('node-fetch');

// Initialize WhatsApp connection
async function initWhatsApp() {
    const conn = new WAConnection();
    conn.on('open', () => {
        console.log('WhatsApp connection opened successfully');
    });

    await conn.connect();

    // Function to fetch news
    async function fetchNews() {
        try {
            const response = await fetch('https://newsapi.org/v2/everything?q=tesla&from=2024-10-14&sortBy=publishedAt&apiKey=869bd48ae29a4b45abeef752438a4cc9');
            const data = await response.json();

            if (data.articles && data.articles.length > 0) {
                const newsSummary = data.articles.slice(0, 5).map((article, index) => `*${index + 1}. ${article.title}*
${article.description}
Read more: ${article.url}
`).join('\n\n');
                
                // Send the news summary to the specified number
                await conn.sendMessage('94777839446@s.whatsapp.net', newsSummary, MessageType.text);
                console.log('News sent successfully');
            } else {
                console.log('No news found');
            }
        } catch (error) {
            console.error('Error fetching news:', error);
        }
    }

    // Call the function to fetch and send news
    fetchNews();
}

initWhatsApp();

