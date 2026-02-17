import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

def configure_gemini():
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        print("Error: Missing Gemini API key in .env file.")
        return None
    
    genai.configure(api_key=api_key)
    return True

def summarize_project_update(project_name, activity_log):
    if not configure_gemini():
        return "Summarization unavailable: Missing API Key."

    try:
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        prompt = f"""
        You are a helpful assistant for an organization's internal news feed (TekstiTV).
        
        Please summarize the recent activity for the project '{project_name}'.
        
        Here is the raw activity log from Jira/Confluence:
        {activity_log}
        
        Task:
        1. create a concise summary (max 2 sentences) of what has been happening in this project recently.
        2. If there is no significant activity, just say "No major updates recently."
        3. Keep the tone professional but engaging.
        """
        
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Error summarizing with Gemini: {e}")
        return "Error generating summary."

if __name__ == "__main__":
    # Test run
    sample_activity = """
    - Fix login bug on homepage (Done)
    - Update user profile schema (In Progress)
    - Weekly sync meeting notes (Done)
    """
    print(summarize_project_update("Website Redesign", sample_activity))
