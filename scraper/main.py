import os
import requests
from bs4 import BeautifulSoup
import pandas as pd
from dotenv import load_dotenv

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
            'Title': title,
            'Date': date,
            'Description': description,
            'Link': link,
            'Image': image_url
        })

    return article_list


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
        import json
        
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
                category = 'uutisia'
            else:
                print(f"Summarizing {item['title']}...")
                # Use full_content if available (Confluence), else recent_activity (Jira)
                content_to_summarize = item.get('full_content') or item.get('recent_activity')
                result_dict = summarize_project_update(item['title'], content_to_summarize)
                summary = result_dict.get("summary", "Virhe tiivistämisessä.")
                category = result_dict.get("category", "uutisia")
            
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
    
    # Convert to DataFrame for easier manipulation and export
    df = pd.DataFrame(articles)
    print(df)
    
    # Export to JSON file for frontend consumption
    # orient='records': Each row becomes a JSON object in an array
    # force_ascii=False: Preserve Finnish characters (ä, ö, etc.)
    # indent=2: Pretty-print with 2-space indentation for readability
    df.to_json('uutiset.json', orient='records', force_ascii=False, indent=2)
    print("Saved to uutiset.json")