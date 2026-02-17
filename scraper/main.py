import requests
from bs4 import BeautifulSoup
import pandas as pd
def scrape_blog_articles(url):
    # Send a request to the website
    response = requests.get(url)
    if response.status_code != 200:
        print(f"Failed to retrieve the page. Status code: {response.status_code}")
        return []

    soup = BeautifulSoup(response.content, 'html.parser')

    # Find all news teasers
    teasers = soup.select('a.teaser')
    article_list = []
    for teaser in teasers:
        # Title
        title_tag = teaser.select_one('h3.heading')
        title = title_tag.get_text(strip=True) if title_tag else 'No title'

        # Date
        date_tag = teaser.select_one('.published-date')
        date = date_tag.get_text(strip=True) if date_tag else 'No date'

        # Description
        desc_tag = teaser.select_one('.field-description')
        description = desc_tag.get_text(strip=True) if desc_tag else 'No description'

        # Link (relative to absolute)
        link = teaser.get('href', '')
        if link and link.startswith('/'):
            link = 'https://www.jyu.fi' + link

        # Image (find <img> inside <picture> inside .field-media-image)
        img_tag = teaser.select_one('.field-media-image img')
        image_url = ''
        if img_tag:
            src = img_tag.get('src', '')
            if src.startswith('/'):
                image_url = 'https://www.jyu.fi' + src
            else:
                image_url = src

        article_list.append({
            'Title': title,
            'Date': date,
            'Description': description,
            'Link': link,
            'Image': image_url
        })

    return article_list


if __name__ == "__main__":
    url = 'https://www.jyu.fi/fi/ajankohtaista/uutiset-ja-tiedotteet'
    articles = scrape_blog_articles(url)
    # Replace en dash (U+2013) with ASCII hyphen-minus (U+002d) and non-breaking space (U+00A0) with regular space (U+0020) in all string fields
    for article in articles:
        for key, value in article.items():
            if isinstance(value, str):
                value = value.replace('\u2013', '-')
                value = value.replace('\u00a0', ' ')
                article[key] = value
    df = pd.DataFrame(articles)
    print(df)
    # Save to JSON
    df.to_json('uutiset.json', orient='records', force_ascii=False, indent=2)
    print("Saved to uutiset.json")