"""
Minimal Gemini AI service - Core functions only.
"""
import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)


async def analyze_with_gemini(context: str) -> dict:
    """
    Analyze stock data using Gemini AI.
    
    Args:
        context: Formatted context string with stock data and indicators
    
    Returns:
        Dictionary with AI analysis
    """
    if not GEMINI_API_KEY:
        return {
            "success": False,
            "error": "GEMINI_API_KEY not configured"
        }
    
    try:
        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content(context)
        
        return {
            "success": True,
            "analysis": response.text
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Gemini error: {str(e)}"
        }


async def ask_gemini(question: str, context: str = "") -> dict:
    """
    Ask Gemini a question with optional context.
    
    Args:
        question: User's question
        context: Optional context to provide
    
    Returns:
        Dictionary with AI response
    """
    if not GEMINI_API_KEY:
        return {
            "success": False,
            "error": "GEMINI_API_KEY not configured"
        }
    
    try:
        # Build prompt
        if context:
            prompt = f"{context}\n\nUser Question: {question}"
        else:
            prompt = question
        
        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content(prompt)
        
        return {
            "success": True,
            "answer": response.text
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Gemini error: {str(e)}"
        }
