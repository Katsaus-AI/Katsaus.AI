"""
Web scraper for Jyväskylä University news feed.

This script scrapes news articles from the JYU news page and exports them to JSON
format for consumption by the Katsaus.AI frontend application.

Data Source: https://www.jyu.fi/fi/ajankohtaista/uutiset-ja-tiedotteet

Usage:
    python main.py

Output:
    uutiset.json - JSON file containing scraped articles

Schedule:
    Run manually or via cron job for daily updates.
    
Dependencies:
    - requests: HTTP client for fetching web pages
    - beautifulsoup4: HTML parser for extracting data
    - pandas: Data manipulation and JSON export
    - lxml: Fast HTML parser backend for BeautifulSoup
"""

import requests
from bs4 import BeautifulSoup
import pandas as pd


def scrape_blog_articles(url):
    """
    Scrape news articles from JYU news page.
    
    The scraper extracts:
    - Title: Article headline (from <h3.heading>)
    - Date: Publication date (from .published-date)
    - Description: Short summary (from .field-description)
    - Link: Full URL to article
    - Image: Cover image URL
    
    CSS Selectors used:
    - 'a.teaser': Each news item is wrapped in an <a> tag with class "teaser"
    - 'h3.heading': Article title within teaser
    - '.published-date': Publication date
    - '.field-description': Article summary/description
    - '.field-media-image img': Cover image
    
    Args:
        url (str): URL of the JYU news page to scrape
        
    Returns:
        list[dict]: List of article dictionaries, each containing:
            - Title (str): Article headline
            - Date (str): Publication date in format "D.M.YYYY"
            - Description (str): Article summary
            - Link (str): Full URL to article
            - Image (str): URL to cover image
            
    Returns empty list if:
        - HTTP request fails (status code != 200)
        - Page structure has changed
        
    Example:
        >>> articles = scrape_blog_articles('https://www.jyu.fi/fi/ajankohtaista/uutiset')
        >>> len(articles)
        15
        >>> articles[0]['Title']
        'Uusi tutkimus paljastaa...'
        
    Note:
        If the website's HTML structure changes, update the CSS selectors accordingly.
    """
    # Send HTTP GET request to fetch the page
    response = requests.get(url)
    if response.status_code != 200:
        print(f"Failed to retrieve the page. Status code: {response.status_code}")
        return []  # Return empty list on failure

    # Parse HTML content with BeautifulSoup
    soup = BeautifulSoup(response.content, 'html.parser')

    # Find all news teasers (each article is wrapped in <a class="teaser">)
    teasers = soup.select('a.teaser')
    article_list = []
    
    for teaser in teasers:
        # Extract title from <h3 class="heading">
        title_tag = teaser.select_one('h3.heading')
        title = title_tag.get_text(strip=True) if title_tag else 'No title'

        # Extract publication date from element with class "published-date"
        date_tag = teaser.select_one('.published-date')
        date = date_tag.get_text(strip=True) if date_tag else 'No date'

        # Extract description/summary from element with class "field-description"
        desc_tag = teaser.select_one('.field-description')
        description = desc_tag.get_text(strip=True) if desc_tag else 'No description'

        # Extract link and convert relative URLs to absolute URLs
        link = teaser.get('href', '')
        if link and link.startswith('/'):
            link = 'https://www.jyu.fi' + link

        # Extract cover image URL from <img> inside <picture> inside .field-media-image
        img_tag = teaser.select_one('.field-media-image img')
        image_url = ''
        if img_tag:
            src = img_tag.get('src', '')
            # Convert relative image URLs to absolute URLs
            if src.startswith('/'):
                image_url = 'https://www.jyu.fi' + src
            else:
                image_url = src

        # Append article data to list
        article_list.append({
            'Title': title,
            'Date': date,
            'Description': description,
            'Link': link,
            'Image': image_url
        })

    return article_list


if __name__ == "__main__":
    # URL of the JYU news page to scrape
    url = 'https://www.jyu.fi/fi/ajankohtaista/uutiset-ja-tiedotteet'
    
    # Scrape articles from the URL
    articles = scrape_blog_articles(url)
    
    # Clean up Unicode characters that may cause issues in JSON/frontend
    # Replace en dash (U+2013 '–') with ASCII hyphen-minus (U+002D '-')
    # Replace non-breaking space (U+00A0) with regular space (U+0020)
    # These replacements ensure compatibility with frontend parsing and display
    for article in articles:
        for key, value in article.items():
            if isinstance(value, str):
                value = value.replace('\u2013', '-')  # En dash → hyphen
                value = value.replace('\u00a0', ' ')  # Non-breaking space → space
                article[key] = value
    
    # Convert to DataFrame for easier manipulation and export
    df = pd.DataFrame(articles)
    print(df)
    
    # Export to JSON file for frontend consumption
    # orient='records': Each row becomes a JSON object in an array
    # force_ascii=False: Preserve Finnish characters (ä, ö, etc.)
    # indent=2: Pretty-print with 2-space indentation for readability
    df.to_json('uutiset.json', orient='records', force_ascii=False, indent=2)
    print("Saved to uutiset.json")