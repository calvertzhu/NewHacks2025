"""
Email service using SendGrid API
"""
import os
from dotenv import load_dotenv

load_dotenv()

def send_email(subject: str, body: str, to_email: str = None) -> dict:
    """
    Send email using SendGrid API.
    
    Args:
        subject: Email subject
        body: Email body (plain text)
        to_email: Recipient email (defaults to EMAIL_TO env var)
    
    Returns:
        dict with 'success' and 'message' keys
    """
    try:
        import sendgrid
        from sendgrid.helpers.mail import Mail
        
        api_key = os.getenv("SENDGRID_API_KEY")
        if not api_key:
            return {
                "success": False,
                "message": "SENDGRID_API_KEY not found in .env file"
            }
        
        # Initialize SendGrid client
        sg = sendgrid.SendGridAPIClient(api_key=api_key)
        
        # Create email message
        message = Mail(
            from_email=os.getenv("EMAIL_FROM", "noreply@stocktracker.com"),
            to_emails=to_email or os.getenv("EMAIL_TO"),
            subject=subject,
            plain_text_content=body
        )
        
        # Send email
        response = sg.send(message)
        
        return {
            "success": True,
            "message": f"Email sent successfully (status: {response.status_code})"
        }
        
    except ImportError:
        return {
            "success": False,
            "message": "SendGrid not installed. Run: pip install sendgrid"
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"SendGrid error: {str(e)}"
        }