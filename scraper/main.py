import os
import requests
from bs4 import BeautifulSoup
import pandas as pd
from dotenv import load_dotenv

load_dotenv()

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
    import argparse
    parser = argparse.ArgumentParser(description='Scrape TekstiTV news and updates.')
    parser.add_argument('--no-gemini', action='store_true', help='Skip Gemini summarization')
    args = parser.parse_args()

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
        
        for item in atlassian_data:
            title_prefix = "Project Update" if item.get('source') == 'Jira' else "Wiki Update"
            
            if args.no_gemini:
                print(f"Skipping summarization for {item['title']}")
                # Use recent_activity (preview) or just a static text
                summary = item.get('recent_activity', 'No details available.')
            else:
                print(f"Summarizing {item['title']}...")
                # Use full_content if available (Confluence), else recent_activity (Jira)
                content_to_summarize = item.get('full_content') or item.get('recent_activity')
                summary = summarize_project_update(item['title'], content_to_summarize)
            
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
                'Image': '' 
            })
            
    except ImportError as e:
        print(f"Skipping Atlassian integration due to missing modules: {e}")
    except Exception as e:
        print(f"Error in Atlassian integration: {e}")

    df = pd.DataFrame(articles)
    print(df)
    # Save to JSON
    df.to_json('uutiset.json', orient='records', force_ascii=False, indent=2)
    print("Saved to uutiset.json")