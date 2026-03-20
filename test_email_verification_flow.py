#!/usr/bin/env python
"""
Test script to verify email verification enforcement flow
"""

import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'teedhub_backend.settings')
django.setup()

from django.contrib.auth.models import User
from core.models.email_verification import EmailVerification
from core.models.user_profile import UserProfile
from django.test import Client

# Create test client
client = Client()

def json_post(path, data):
    """Helper to POST JSON data"""
    return client.post(path, data=json.dumps(data), content_type='application/json')

# Test data
TEST_EMAIL = "test.verification@example.com"
TEST_PASSWORD = "TestPassword123!"

print("=" * 70)
print("EMAIL VERIFICATION ENFORCEMENT TEST")
print("=" * 70)

# Clean up any existing test user
User.objects.filter(email=TEST_EMAIL).delete()
EmailVerification.objects.filter(email=TEST_EMAIL).delete()

print("\n1. Testing signup with email verification...")
print("-" * 70)

# Step 1: Request verification code (should return 400 indicating pending state)
print(f"\nStep 1: Requesting verification code for {TEST_EMAIL}")
try:
    response = json_post(
        '/dj-rest-auth/registration/',
        {
            'email': TEST_EMAIL,
            'password1': TEST_PASSWORD,
            'password2': TEST_PASSWORD,
        }
    )
    
    print(f"Status Code: {response.status_code}")
    response_data = response.json()
    print(f"Response: {json.dumps(response_data, indent=2)}")
    
    # The CustomRegisterView should return 400 on step 1
    if response.status_code == 400 and 'next_step' in response_data:
        # Check if verification code was sent
        verification = EmailVerification.objects.filter(email=TEST_EMAIL).first()
        if verification:
            print(f"\n✅ Verification code created")
            print(f"   Code: {verification.verification_code}")
            print(f"   Expires at: {verification.expires_at}")
            verification_code = verification.verification_code
        else:
            print(f"\n❌ ERROR: No verification code created")
            exit(1)
    elif response.status_code == 201:
        print(f"\n⚠️  WARNING: User created without email verification!")
        print(f"   This means enforcement is not working")
        exit(1)
    else:
        print(f"\n❌ ERROR: Unexpected status {response.status_code}")
        print(f"   Expected 400 for pending verification or 201 for registration")
        exit(1)
        
except Exception as e:
    print(f"\n❌ ERROR: {str(e)}")
    import traceback
    traceback.print_exc()
    exit(1)

# Step 2: Try to login with unverified email
print(f"\n\nStep 2: Attempting login with unverified email")
try:
    response = json_post(
        '/api/auth/token/',
        {
            'email': TEST_EMAIL,
            'password': TEST_PASSWORD,
        }
    )
    
    print(f"Status Code: {response.status_code}")
    response_data = response.json()
    
    # Redact tokens for display
    safe_data = response_data.copy()
    if 'access' in safe_data:
        safe_data['access'] = '[REDACTED]'
    if 'refresh' in safe_data:
        safe_data['refresh'] = '[REDACTED]'
    print(f"Response: {json.dumps(safe_data, indent=2)}")
    
    if response.status_code == 403 and 'next_step' in response_data:
        print(f"\n✅ Login correctly blocked for unverified email")
        print(f"   Error message indicates next step: {response_data.get('next_step')}")
    elif response.status_code == 200 and 'access' in response_data:
        print(f"\n❌ ERROR: Unverified user was able to obtain JWT token!")
        print(f"   Email verification enforcement is NOT working")
        exit(1)
    else:
        print(f"\n⚠️  Unexpected response (may still be ok): {response.status_code}")
        
except Exception as e:
    print(f"\n❌ ERROR: {str(e)}")
    import traceback
    traceback.print_exc()

# Step 3: Verify the code using the email-verification endpoint
print(f"\n\nStep 3: Verifying code via email-verification endpoint")
try:
    response = json_post(
        '/api/auth/email-verification/',
        {
            'email': TEST_EMAIL,
            'verification_code': verification_code,
            'action': 'verify'
        }
    )
    
    print(f"Status Code: {response.status_code}")
    response_data = response.json()
    print(f"Response: {json.dumps(response_data, indent=2)}")
    
    if response.status_code == 200:
        # Check database
        verification_obj = EmailVerification.objects.get(email=TEST_EMAIL)
        if verification_obj.is_verified:
            print(f"\n✅ Email marked as verified")
        else:
            print(f"\n⚠️  Email verification endpoint succeeded but database not updated")
    else:
        print(f"\n⚠️  Email verification returned unexpected status {response.status_code}")
        
except Exception as e:
    print(f"\n❌ ERROR: {str(e)}")
    import traceback
    traceback.print_exc()

# Step 4: Complete registration with verification code
print(f"\n\nStep 4: Completing registration with verification code")
try:
    response = json_post(
        '/dj-rest-auth/registration/',
        {
            'email': TEST_EMAIL,
            'password1': TEST_PASSWORD,
            'password2': TEST_PASSWORD,
            'verification_code': verification_code,
        }
    )
    
    print(f"Status Code: {response.status_code}")
    response_data = response.json()
    
    # Redact tokens for display
    safe_data = response_data.copy()
    if 'access' in safe_data:
        safe_data['access'] = '[REDACTED]'
    if 'refresh' in safe_data:
        safe_data['refresh'] = '[REDACTED]'
    print(f"Response: {json.dumps(safe_data, indent=2)}")
    
    if response.status_code == 201 and 'access' in response_data:
        print(f"\n✅ Registration completed with tokens issued")
        
        # Verify user was created with email_verified=True
        user = User.objects.get(email=TEST_EMAIL)
        profile = user.profile
        if profile.email_verified:
            print(f"✅ UserProfile marked email_verified=True")
        else:
            print(f"⚠️  UserProfile email_verified still False")
    else:
        print(f"\n⚠️  Registration returned {response.status_code}")
        
except Exception as e:
    print(f"\n❌ ERROR: {str(e)}")
    import traceback
    traceback.print_exc()

# Step 5: Login with verified email
print(f"\n\nStep 5: Attempting login with verified email")
try:
    response = json_post(
        '/api/auth/token/',
        {
            'email': TEST_EMAIL,
            'password': TEST_PASSWORD,
        }
    )
    
    print(f"Status Code: {response.status_code}")
    response_data = response.json()
    
    # Redact tokens for display
    safe_data = response_data.copy()
    if 'access' in safe_data:
        safe_data['access'] = '[REDACTED]'
    if 'refresh' in safe_data:
        safe_data['refresh'] = '[REDACTED]'
    print(f"Response: {json.dumps(safe_data, indent=2)}")
    
    if response.status_code == 200 and 'access' in response_data:
        print(f"\n✅ Login successful with verified email")
    else:
        print(f"\n❌ Login failed: {response.status_code}")
        
except Exception as e:
    print(f"\n❌ ERROR: {str(e)}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 70)
print("TEST COMPLETE")
print("=" * 70)
