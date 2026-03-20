"""
Email service for sending verification codes and recovery notifications
Handles all email communications with users
"""

from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.utils.html import strip_tags
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails to users"""
    
    @staticmethod
    def send_verification_code(email, verification_code):
        """
        Send email verification code
        
        Args:
            email: User's email address
            verification_code: 6-digit verification code
        
        Returns:
            bool: True if sent successfully
        """
        try:
            subject = "TEED Hub - Email Verification Code"
            
            # Create HTML email content
            html_message = f"""
            <html>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #f5f5f5; padding: 20px;">
                        <h2 style="color: #1F75FE; margin-bottom: 20px;">Email Verification</h2>
                        
                        <p style="color: #333; font-size: 16px; line-height: 1.6;">
                            Welcome to TEED Hub! Please verify your email address to complete your registration.
                        </p>
                        
                        <div style="background-color: #white; border: 2px solid #1F75FE; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                            <p style="color: #666; font-size: 14px; margin: 0 0 10px 0;">Your verification code is:</p>
                            <p style="font-size: 32px; font-weight: bold; color: #1F75FE; letter-spacing: 5px; margin: 0;">
                                {verification_code}
                            </p>
                            <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">This code expires in 24 hours</p>
                        </div>
                        
                        <p style="color: #666; font-size: 14px;">
                            If you didn't request this verification code, you can safely ignore this email.
                        </p>
                        
                        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                        
                        <p style="color: #999; font-size: 12px; text-align: center;">
                            TEED Hub © 2024. All rights reserved.
                        </p>
                    </div>
                </body>
            </html>
            """
            
            text_message = f"""
            Email Verification - TEED Hub
            
            Your verification code is: {verification_code}
            
            This code expires in 24 hours.
            
            If you didn't request this, ignore this email.
            """
            
            send_mail(
                subject=subject,
                message=text_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                html_message=html_message,
                fail_silently=False,
            )
            
            logger.info(f"Verification email sent to {email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send verification email to {email}: {str(e)}")
            return False
    
    @staticmethod
    def send_recovery_codes(user, recovery_codes):
        """
        Send recovery codes to user email
        
        Args:
            user: Django User object
            recovery_codes: List of recovery code dicts with 'code' and 'display' keys
        
        Returns:
            bool: True if sent successfully
        """
        try:
            subject = "TEED Hub - Your Account Recovery Codes"
            email = user.email
            
            # Format recovery codes for display
            codes_html = "".join([
                f'<tr><td style="padding: 10px; border-bottom: 1px solid #eee;">{code["code"]}</td></tr>'
                for code in recovery_codes
            ])
            
            html_message = f"""
            <html>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #f5f5f5; padding: 20px;">
                        <h2 style="color: #1F75FE; margin-bottom: 20px;">Account Recovery Codes</h2>
                        
                        <p style="color: #333; font-size: 16px; line-height: 1.6;">
                            Hello {user.first_name or user.username},
                        </p>
                        
                        <p style="color: #333; font-size: 14px; line-height: 1.6;">
                            Your account has been secured with 10 recovery codes. Save these codes in a safe place. 
                            You can use any code to regain access to your account if you lose access to your email.
                        </p>
                        
                        <div style="background-color: white; border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin: 20px 0; font-family: monospace;">
                            <table style="width: 100%; border-collapse: collapse;">
                                <thead>
                                    <tr>
                                        <th style="padding: 10px; text-align: left; border-bottom: 2px solid #1F75FE; color: #1F75FE;">Recovery Codes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {codes_html}
                                </tbody>
                            </table>
                        </div>
                        
                        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
                            <p style="color: #856404; font-weight: bold; margin-top: 0;">⚠️ Important:</p>
                            <ul style="color: #856404; margin-bottom: 0;">
                                <li>Keep these codes safe and private</li>
                                <li>Each code can only be used once</li>
                                <li>Store them offline (printed or password manager)</li>
                                <li>Never share these codes with anyone</li>
                            </ul>
                        </div>
                        
                        <p style="color: #666; font-size: 12px;">
                            If you didn't enable recovery codes, contact support immediately.
                        </p>
                        
                        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                        
                        <p style="color: #999; font-size: 12px; text-align: center;">
                            TEED Hub © 2024. All rights reserved.
                        </p>
                    </div>
                </body>
            </html>
            """
            
            text_message = f"""
            Account Recovery Codes - TEED Hub
            
            Your recovery codes are:
            
            {chr(10).join([code["code"] for code in recovery_codes])}
            
            Keep these safe! Each code can only be used once.
            """
            
            send_mail(
                subject=subject,
                message=text_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                html_message=html_message,
                fail_silently=False,
            )
            
            logger.info(f"Recovery codes sent to {email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send recovery codes to {user.email}: {str(e)}")
            return False
    
    @staticmethod
    def send_recovery_contact_verification(contact_value, verification_code, contact_type='email'):
        """
        Send verification code for recovery contact (email or SMS)
        
        Args:
            contact_value: Email or phone number
            verification_code: 6-digit code
            contact_type: 'email' or 'phone'
        
        Returns:
            bool: True if sent successfully
        """
        try:
            if contact_type == 'email':
                subject = "TEED Hub - Recovery Contact Verification"
                
                html_message = f"""
                <html>
                    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background-color: #f5f5f5; padding: 20px;">
                            <h2 style="color: #1F75FE;">Recovery Contact Verification</h2>
                            
                            <p>Your verification code is:</p>
                            
                            <div style="background-color: white; border: 2px solid #1F75FE; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                                <p style="font-size: 32px; font-weight: bold; color: #1F75FE; letter-spacing: 5px; margin: 0;">
                                    {verification_code}
                                </p>
                            </div>
                            
                            <p style="color: #666;">This code expires in 15 minutes.</p>
                        </div>
                    </body>
                </html>
                """
                
                text_message = f"Your TEED Hub verification code is: {verification_code}\n\nExpires in 15 minutes."
                
                send_mail(
                    subject=subject,
                    message=text_message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[contact_value],
                    html_message=html_message,
                    fail_silently=False,
                )
                
            elif contact_type == 'phone':
                # SMS implementation would go here
                # For now, log the code (in production use Twilio or similar)
                logger.info(f"SMS verification code for {contact_value}: {verification_code}")
                # In production: send via SMS API
            
            logger.info(f"Recovery contact verification code sent to {contact_value}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send recovery contact verification: {str(e)}")
            return False
    
    @staticmethod
    def send_account_recovery_notification(user):
        """
        Notify user that account recovery was used
        
        Args:
            user: Django User object
        
        Returns:
            bool: True if sent successfully
        """
        try:
            subject = "TEED Hub - Account Recovery Alert"
            email = user.email
            
            html_message = f"""
            <html>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #f5f5f5; padding: 20px;">
                        <h2 style="color: #1F75FE;">Account Recovery Alert</h2>
                        
                        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                            <p style="color: #856404; font-weight: bold; margin-top: 0;">⚠️ Security Alert</p>
                            <p style="color: #856404; margin: 0;">
                                Your account was recovered using a recovery code. If you didn't authorize this, 
                                please change your password immediately and contact support.
                            </p>
                        </div>
                        
                        <p style="color: #333;">Time: {timezone.now().strftime('%Y-%m-%d %H:%M:%S UTC')}</p>
                    </div>
                </body>
            </html>
            """
            
            text_message = f"""
            Account Recovery Alert - TEED Hub
            
            Your account was recovered using a recovery code.
            
            If you didn't authorize this, change your password immediately.
            """
            
            send_mail(
                subject=subject,
                message=text_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                html_message=html_message,
                fail_silently=False,
            )
            
            logger.warning(f"Account recovery used for {user.username}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send account recovery notification: {str(e)}")
            return False
    
    @staticmethod
    def send_password_reset_code(email, recovery_code, username_display):
        """
        Send password reset code to user email
        
        Args:
            email: User's email address
            recovery_code: 12-digit recovery code
            username_display: Display name for personalization
        
        Returns:
            bool: True if sent successfully
        """
        try:
            subject = "TEED Hub - Password Reset Code"
            
            # Format code for better readability
            formatted_code = f"{recovery_code[:4]}-{recovery_code[4:8]}-{recovery_code[8:12]}"
            
            html_message = f"""
            <html>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #f5f5f5; padding: 20px;">
                        <h2 style="color: #1F75FE; margin-bottom: 20px;">Password Reset Request</h2>
                        
                        <p style="color: #333; font-size: 16px; line-height: 1.6;">
                            Hi {username_display},
                        </p>
                        
                        <p style="color: #333; font-size: 14px; line-height: 1.6;">
                            We received a request to reset your TEED Hub account password. 
                            If you didn't request this, please ignore this email and your password will remain unchanged.
                        </p>
                        
                        <div style="background-color: white; border: 2px solid #1F75FE; border-radius: 8px; padding: 25px; margin: 25px 0; text-align: center;">
                            <p style="color: #666; font-size: 14px; margin: 0 0 15px 0;">Your password reset code is:</p>
                            <p style="font-size: 24px; font-weight: bold; color: #1F75FE; letter-spacing: 3px; font-family: monospace; margin: 0 0 10px 0;">
                                {formatted_code}
                            </p>
                            <p style="color: #999; font-size: 12px; margin: 0;">This code expires in 30 minutes</p>
                        </div>
                        
                        <p style="color: #333; font-size: 14px; line-height: 1.6;">
                            <strong>Next steps:</strong><br>
                            1. Go to the password recovery page<br>
                            2. Verify your identity (username and recovery phone)<br>
                            3. Enter the code above<br>
                            4. Create a new password
                        </p>
                        
                        <div style="background-color: #ffe8e8; border-left: 4px solid #f44336; padding: 15px; margin: 20px 0; border-radius: 4px;">
                            <p style="color: #c62828; font-weight: bold; margin-top: 0;">⚠️ Security Notice:</p>
                            <p style="color: #c62828; font-size: 13px; margin-bottom: 0;">
                                Never share this code with anyone. TEED Hub support will never ask for this code.
                            </p>
                        </div>
                        
                        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                        
                        <p style="color: #999; font-size: 12px; text-align: center;">
                            TEED Hub © 2024. All rights reserved.<br>
                            <a href="#" style="color: #1F75FE; text-decoration: none;">Security Center</a> | 
                            <a href="#" style="color: #1F75FE; text-decoration: none;">Privacy Policy</a>
                        </p>
                    </div>
                </body>
            </html>
            """
            
            text_message = f"""
            Password Reset Code - TEED Hub
            
            Hi {username_display},
            
            Your password reset code is: {formatted_code}
            
            This code expires in 30 minutes.
            
            If you didn't request this, please ignore this email.
            """
            
            send_mail(
                subject=subject,
                message=text_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                html_message=html_message,
                fail_silently=False,
            )
            
            logger.info(f"Password reset code sent to {email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send password reset code to {email}: {str(e)}")
            return False

