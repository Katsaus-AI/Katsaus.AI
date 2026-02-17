import os
from atlassian import Confluence, Jira
from dotenv import load_dotenv

load_dotenv()

def get_atlassian_client():
    url = os.getenv('ATLASSIAN_URL')
    username = os.getenv('ATLASSIAN_USERNAME')
    api_token = os.getenv('ATLASSIAN_API_TOKEN')

    if not all([url, username, api_token]):
        print("Error: Missing Atlassian credentials in .env file.")
        return None, None

    try:
        jira = Jira(
            url=url,
            username=username,
            password=api_token,
            cloud=True
        )
        confluence = Confluence(
            url=url,
            username=username,
            password=api_token,
            cloud=True
        )
        return jira, confluence
    except Exception as e:
        print(f"Failed to connect to Atlassian: {e}")
        return None, None

def fetch_jira_projects():
    jira, _ = get_atlassian_client()
    if not jira:
        return []

    try:
        # Fetch all projects
        projects = jira.projects()
        project_data = []

        for project in projects:
            # Get project details
            project_key = project.get('key')
            project_name = project.get('name')
            
            # Fetch recent issues for this project to get a sense of activity
            # JQL to get updated issues in the last 7 days
            jql = f'project = "{project_key}" AND updated >= -7d ORDER BY updated DESC'
            issues = jira.jql(jql, limit=5)
            
            recent_activity = []
            if issues and 'issues' in issues:
                for issue in issues['issues']:
                    summary = issue['fields'].get('summary', 'No summary')
                    status = issue['fields']['status'].get('name', 'Unknown')
                    recent_activity.append(f"- {summary} ({status})")

            project_data.append({
                'source': 'Jira',
                'title': project_name, # Mapping to 'Title' for consistency
                'key': project_key,
                'recent_activity': "\n".join(recent_activity) if recent_activity else "No recent activity in the last 7 days."
            })

        return project_data

    except Exception as e:
        print(f"Error fetching Jira projects: {e}")
        return []

def fetch_confluence_pages():
    _, confluence = get_atlassian_client()
    if not confluence:
        return []
    
    try:
        # Fetch pages from 'DEV' space (all pages) AND recently updated pages from other spaces
        # For now, let's just target 'DEV' space as requested + others if needed.
        # CQL: space = "DEV" AND type = "page"
        cql = 'space = "DEV" AND type = "page" ORDER BY lastModified DESC'
        
        # We need 'content.body.storage' to get the content for Gemini when using CQL
        results = confluence.cql(cql, limit=30, expand='content.body.storage')
        
        page_data = []
        if results and 'results' in results:
            for page in results['results']:
                title = page.get('title', 'No Title')
                # webui link is stored in _links -> webui
                # Note: Search results might have links at top level or inside content
                webui = page.get('_links', {}).get('webui', '')
                if not webui and 'content' in page:
                     webui = page['content'].get('_links', {}).get('webui', '')
                
                full_link = f"{os.getenv('ATLASSIAN_URL')}/wiki{webui}" if webui else '#'
                
                # Get body content
                body_content = ""
                # Check for body in 'content' object (common in CQL results)
                if 'content' in page and 'body' in page['content'] and 'storage' in page['content']['body']:
                     body_content = page['content']['body']['storage'].get('value', '')
                # Fallback check at top level
                elif 'body' in page and 'storage' in page['body']:
                    body_content = page['body']['storage'].get('value', '')
                
                # Strip HTML tags for cleaner summary context (simple approach)
                # We can use BeautifulSoup here since we already have it
                text_content = ""
                if body_content:
                    try:
                        from bs4 import BeautifulSoup
                        soup = BeautifulSoup(body_content, 'html.parser')
                        text_content = soup.get_text(separator=' ', strip=True)
                        # Truncate if too long (e.g. 100000 chars) to avoid token limits
                        if len(text_content) > 100000:
                            text_content = text_content[:100000] + "..."
                    except Exception as e:
                        print(f"Error parsing body content for {title}: {e}")
                        text_content = "Error parsing content."

                page_data.append({
                    'source': 'Confluence',
                    'title': title,
                    'key': page.get('id'), # Use ID as key for pages
                    'recent_activity': f"Page Content: {text_content[:200]}...", # Preview
                    'full_content': text_content, # Store full content for Gemini
                    'link': full_link
                })
        
        return page_data

    except Exception as e:
        print(f"Error fetching Confluence pages: {e}")
        return []

if __name__ == "__main__":
    # Test run
    projects = fetch_jira_projects()
    for p in projects:
        print(f"Project: {p['title']}")
        print(f"Activity:\n{p['recent_activity']}\n")
