import os
import html
import json
from datetime import datetime, timezone
import requests
from bs4 import BeautifulSoup
import pandas as pd
from dotenv import load_dotenv

EXTERNAL_RSS_SOURCES = [
    {
        'id': 'aalto',
        'title_prefix': 'Aalto',
        'url': 'https://www.aalto.fi/en/news/feed',
        'category': 'aalto',
    },
    {
        'id': 'helsinki',
        'title_prefix': 'Helsingin yliopisto',
        'url': 'https://www.helsinki.fi/rss.xml',
        'category': 'helsinki',
    },
    {
        'id': 'tampere',
        'title_prefix': 'Tampereen yliopisto',
        'url': 'https://news.google.com/rss/search?q=site:tuni.fi+Tampereen+yliopisto&hl=fi&gl=FI&ceid=FI:fi',
        'category': 'tampere',
    },
    {
        'id': 'turku',
        'title_prefix': 'Turun yliopisto',
        'url': 'https://www.utu.fi/rss',
        'category': 'turku',
    },
    {
        'id': 'oulu',
        'title_prefix': 'Oulun yliopisto',
        'url': 'https://news.google.com/rss/search?q=site:oulu.fi+Oulun+yliopisto&hl=fi&gl=FI&ceid=FI:fi',
        'category': 'oulu',
    },
    {
        'id': 'uef',
        'title_prefix': 'Itä-Suomen yliopisto',
        'url': 'https://news.google.com/rss/search?q=site:uef.fi+It%C3%A4-Suomen+yliopisto&hl=fi&gl=FI&ceid=FI:fi',
        'category': 'uef',
    },
    {
        'id': 'lut',
        'title_prefix': 'LUT-yliopisto',
        'url': 'https://news.google.com/rss/search?q=site:lut.fi+LUT-yliopisto&hl=fi&gl=FI&ceid=FI:fi',
        'category': 'lut',
    },
    {
        'id': 'abo-akademi',
        'title_prefix': 'Abo Akademi',
        'url': 'https://www.abo.fi/en/news/feed',
        'category': 'abo-akademi',
    },
    {
        'id': 'hanken',
        'title_prefix': 'Hanken',
        'url': 'https://news.google.com/rss/search?q=site:hanken.fi+Hanken&hl=fi&gl=FI&ceid=FI:fi',
        'category': 'hanken',
    },
    {
        'id': 'lapland',
        'title_prefix': 'Lapin yliopisto',
        'url': 'https://www.ulapland.fi/feed',
        'category': 'lapland',
    },
    {
        'id': 'vaasa',
        'title_prefix': 'Vaasan yliopisto',
        'url': 'https://www.uwasa.fi/rss.xml',
        'category': 'vaasa',
    },
    {
        'id': 'uniarts',
        'title_prefix': 'Taideyliopisto',
        'url': 'https://news.google.com/rss/search?q=site:uniarts.fi+Taideyliopisto&hl=fi&gl=FI&ceid=FI:fi',
        'category': 'uniarts',
    },
    {
        'id': 'yle',
        'title_prefix': 'YLE',
        'url': 'https://feeds.yle.fi/uutiset/v1/majorHeadlines/YLE_UUTISET.rss',
        'category': 'uutisia',
    },
    {
        'id': 'bbc',
        'title_prefix': 'BBC',
        'url': 'https://feeds.bbci.co.uk/news/world/rss.xml',
        'category': 'uutisia',
    },
]

load_dotenv()
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
            'Title': f'JYU: {title}',
            'Date': date,
            'Description': description,
            'Link': link,
            'Image': image_url,
            'Category': 'jyu'
        })

    return article_list


def scrape_external_rss_sources(limit_per_source=5):
    collected = []

    for source in EXTERNAL_RSS_SOURCES:
        try:
            items = scrape_rss_feed(source)
            for item in items[:limit_per_source]:
                collected.append(item)
        except Exception as error:
            print(f"Error scraping RSS source {source['id']}: {error}")

    return collected


def normalize_text(value):
    if value is None:
        return ''
    text = html.unescape(str(value))
    return ' '.join(text.replace('\u00a0', ' ').split())


def strip_html(value):
    soup = BeautifulSoup(value or '', 'html.parser')
    return soup.get_text(separator=' ', strip=True)


def scrape_rss_feed(source):
    response = requests.get(
        source['url'],
        headers={
            'User-Agent': 'KatsausAI/1.0 (+https://katsaus.ai)',
            'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
        },
        timeout=30,
    )
    response.raise_for_status()

    soup = BeautifulSoup(response.text, 'xml')
    items = []

    for rss_item in soup.find_all('item')[:20]:
        title = normalize_text(rss_item.title.get_text() if rss_item.title else 'No title')
        link = normalize_text(rss_item.link.get_text() if rss_item.link else '')
        published = normalize_text(rss_item.pubDate.get_text() if rss_item.pubDate else '')
        description = normalize_text(strip_html(rss_item.description.get_text() if rss_item.description else 'No description'))
        items.append({
            'Title': f"{source['title_prefix']}: {title}",
            'Date': published or 'Just now',
            'Description': description,
            'Link': link,
            'Image': '',
            'Category': source['category'],
        })

    if items:
        return items

    for atom_item in soup.find_all('entry')[:20]:
        title = normalize_text(atom_item.title.get_text() if atom_item.title else 'No title')
        link_tag = atom_item.find('link', attrs={'rel': 'alternate'}) or atom_item.find('link')
        link = normalize_text(link_tag.get('href') if link_tag else '')
        published = normalize_text((atom_item.updated.get_text() if atom_item.updated else '') or (atom_item.published.get_text() if atom_item.published else ''))
        raw_description = ''
        if atom_item.summary:
            raw_description = atom_item.summary.get_text()
        elif atom_item.content:
            raw_description = atom_item.content.get_text()
        description = normalize_text(strip_html(raw_description or 'No description'))
        items.append({
            'Title': f"{source['title_prefix']}: {title}",
            'Date': published or 'Just now',
            'Description': description,
            'Link': link,
            'Image': '',
            'Category': source['category'],
        })

    return items


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description='Scrape TekstiTV news and updates.')
    parser.add_argument('--no-gemini', action='store_true', help='Skip Gemini summarization')
    parser.add_argument('--no-jyu', action='store_true', help='Skip fetching JYU articles')
    parser.add_argument('--atlassian-limit', type=int, default=5, help='Max number of Atlassian items to process')
    parser.add_argument('--atlassian-ids', type=str, help='Comma separated list of specific Atlassian IDs to process')
    args = parser.parse_args()

    articles = []
    if not args.no_jyu:
        url = 'https://www.jyu.fi/fi/ajankohtaista/uutiset-ja-tiedotteet'
        articles = scrape_blog_articles(url)
        # Replace en dash (U+2013) with ASCII hyphen-minus (U+002d) and non-breaking space (U+00A0) with regular space (U+0020) in all string fields
        for article in articles:
            for key, value in article.items():
                if isinstance(value, str):
                    value = value.replace('\u2013', '-')
                    value = value.replace('\u00a0', ' ')
                    article[key] = value

    # --- Atlassian Projects ---
    print("Fetching Atlassian projects...")
    try:
        from atlassian_fetcher import fetch_jira_projects, fetch_confluence_pages
        from gemini_summarizer import summarize_project_update
        
        atlassian_data = [] # renamed from jira_projects to be more generic
        atlassian_cache_file = 'atlassian_raw.json'
        
        # Check if cache exists
        if os.path.exists(atlassian_cache_file):
            print(f"Loading Atlassian data from cache: {atlassian_cache_file}")
            try:
                with open(atlassian_cache_file, 'r', encoding='utf-8') as f:
                    atlassian_data = json.load(f)
            except Exception as e:
                print(f"Error reading cache file, will fetch fresh data: {e}")
        
        # If no cache or empty, fetch fresh
        if not atlassian_data:
            print("Fetching fresh data from Atlassian API...")
            jira_projects = fetch_jira_projects()
            print(f"Fetched {len(jira_projects)} Jira projects.")
            
            confluence_pages = fetch_confluence_pages()
            print(f"Fetched {len(confluence_pages)} Confluence pages.")
            
            atlassian_data = jira_projects + confluence_pages
            
            # Save to cache
            if atlassian_data:
                try:
                    with open(atlassian_cache_file, 'w', encoding='utf-8') as f:
                        json.dump(atlassian_data, f, indent=2, ensure_ascii=False)
                    print(f"Saved Atlassian data to cache: {atlassian_cache_file}")
                except Exception as e:
                    print(f"Error saving cache: {e}")
        
        # Filter out items with no recent activity
        filtered_data = [
            item for item in atlassian_data 
            if item.get('recent_activity') != "No recent activity in the last 7 days."
        ]
        
        # Filter by specific IDs if provided
        if args.atlassian_ids:
            allowed_ids = [aid.strip() for aid in args.atlassian_ids.split(',')]
            filtered_data = [item for item in filtered_data if str(item.get('key')) in allowed_ids]
            
        # Apply the specified limit
        filtered_data = filtered_data[:args.atlassian_limit]
        
        for item in filtered_data:
            title_prefix = "Project Update" if item.get('source') == 'Jira' else "Wiki Update"
            
            if args.no_gemini:
                print(f"Skipping summarization for {item['title']}")
                # Use recent_activity (preview) or just a static text
                summary = item.get('recent_activity', 'No details available.')
                category = 'atlassian'
            else:
                print(f"Summarizing {item['title']}...")
                # Use full_content if available (Confluence), else recent_activity (Jira)
                content_to_summarize = item.get('full_content') or item.get('recent_activity')
                result_dict = summarize_project_update(item['title'], content_to_summarize)
                summary = result_dict.get("summary", "Virhe tiivistämisessä.")
                # Always force 'atlassian' category for Atlassian items
                category = 'atlassian'
            
            # Link handling: Jira uses 'key' construction, Confluence provides full 'link'
            link = item.get('link')
            if not link and item.get('source') == 'Jira':
                 link = f"{os.getenv('ATLASSIAN_URL')}/browse/{item['key']}" if os.getenv('ATLASSIAN_URL') else '#'
            
            # Add to article list
            articles.append({
                'Title': f"{title_prefix}: {item['title']}",
                'Date': 'Just now',
                'Description': summary,
                'Link': link,
                'Image': '',
                'Category': category
            })
            
    except ImportError as e:
        print(f"Skipping Atlassian integration due to missing modules: {e}")
    except Exception as e:
        print(f"Error in Atlassian integration: {e}")

    print("Fetching external RSS sources...")
    try:
        external_items = scrape_external_rss_sources(limit_per_source=5)
        for item in external_items:
            articles.append(item)
        print(f"Fetched {len(external_items)} RSS items.")
    except Exception as e:
        print(f"Error in RSS integration: {e}")
    
    # Convert to DataFrame for easier manipulation and export
    df = pd.DataFrame(articles)
    print(df)
    
    # Export to JSON file for frontend consumption
    # orient='records': Each row becomes a JSON object in an array
    # force_ascii=False: Preserve Finnish characters (ä, ö, etc.)
    # indent=2: Pretty-print with 2-space indentation for readability
    df.to_json('uutiset.json', orient='records', force_ascii=False, indent=2)
    print("Saved to uutiset.json")