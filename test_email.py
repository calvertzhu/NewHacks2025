#!/usr/bin/env python3
"""Test script for email functionality"""

from email_service import send_email

def test_email():
    print("Testing email sending function...")
    print("-" * 50)
    
    # Test email
    result = send_email(
        subject="Test Email from Stock Tracker",
        body="This is a test email from the stock tracker application.\n\nIf you receive this, the email functionality is working!",
        to_email=None  # Will use EMAIL_TO from .env
    )
    
    print("Result:")
    print(f"  Success: {result['success']}")
    print(f"  Message: {result['message']}")
    
    return result

if __name__ == "__main__":
    test_email()
