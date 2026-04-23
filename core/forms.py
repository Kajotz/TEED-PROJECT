from django import forms
from django.core.files.uploadedfile import UploadedFile
from core.models import BusinessProfile


class BusinessProfileForm(forms.ModelForm):
    """Form for customizing business profile (branding and colors)"""

    primary_color = forms.CharField(
        max_length=7,
        required=False,
        widget=forms.TextInput(attrs={
            'type': 'color',
            'class': 'w-16 h-10 border border-gray-300 rounded cursor-pointer',
        })
    )

    secondary_color = forms.CharField(
        max_length=7,
        required=False,
        widget=forms.TextInput(attrs={
            'type': 'color',
            'class': 'w-16 h-10 border border-gray-300 rounded cursor-pointer',
        })
    )

    logo = forms.ImageField(
        required=False,
        widget=forms.FileInput(attrs={
            'accept': 'image/*',
            'class': 'hidden',
            'id': 'logo-input',
        })
    )

    about = forms.CharField(
        max_length=500,
        required=False,
        widget=forms.Textarea(attrs={
            'rows': 4,
            'class': 'w-full px-4 py-2 border border-gray-300 dark:border-[#3A3A3A] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F75FE] dark:bg-[#252526] dark:text-white',
            'placeholder': 'Tell customers about your business...',
        })
    )

    contact_email = forms.EmailField(
        required=False,
        widget=forms.EmailInput(attrs={
            'class': 'w-full px-4 py-2 border border-gray-300 dark:border-[#3A3A3A] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F75FE] dark:bg-[#252526] dark:text-white',
            'placeholder': 'business@example.com',
        })
    )

    contact_phone = forms.CharField(
        max_length=20,
        required=False,
        widget=forms.TextInput(attrs={
            'class': 'w-full px-4 py-2 border border-gray-300 dark:border-[#3A3A3A] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F75FE] dark:bg-[#252526] dark:text-white',
            'placeholder': '+1 (555) 123-4567',
        })
    )

    website = forms.URLField(
        required=False,
        widget=forms.URLInput(attrs={
            'class': 'w-full px-4 py-2 border border-gray-300 dark:border-[#3A3A3A] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F75FE] dark:bg-[#252526] dark:text-white',
            'placeholder': 'https://yourwebsite.com',
        })
    )

    class Meta:
        model = BusinessProfile
        fields = ['logo', 'primary_color', 'secondary_color', 'about', 'contact_email', 'contact_phone', 'website']

    def clean_logo(self):
        logo = self.cleaned_data.get('logo')
        if logo:
            # Validate file size (max 5MB)
            if logo.size > 5 * 1024 * 1024:
                raise forms.ValidationError("Logo file size must be less than 5MB.")
            
            # Validate file type
            valid_extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
            file_extension = logo.name.split('.')[-1].lower()
            if file_extension not in valid_extensions:
                raise forms.ValidationError(f"Invalid file format. Allowed: {', '.join(valid_extensions)}")
        
        return logo

    def clean_primary_color(self):
        color = self.cleaned_data.get('primary_color', '').strip()
        if color and not self._is_valid_hex_color(color):
            raise forms.ValidationError("Invalid color format. Please use hex color (e.g., #1F75FE).")
        return color

    def clean_secondary_color(self):
        color = self.cleaned_data.get('secondary_color', '').strip()
        if color and not self._is_valid_hex_color(color):
            raise forms.ValidationError("Invalid color format. Please use hex color (e.g., #f2a705).")
        return color

    @staticmethod
    def _is_valid_hex_color(color):
        """Validate hex color format"""
        color = color.strip()
        if not color.startswith('#'):
            return False
        if len(color) not in [4, 7]:  # #RGB or #RRGGBB
            return False
        try:
            int(color[1:], 16)
            return True
        except ValueError:
            return False
        
class BusinessProfileForm(forms.ModelForm):
    ...

    instagram = forms.CharField(required=False)
    facebook = forms.CharField(required=False)
    tiktok = forms.CharField(required=False)
    whatsapp = forms.CharField(required=False)
    theme = forms.CharField(required=False)

    class Meta:
        model = BusinessProfile
        fields = [
            'logo',
            'primary_color',
            'secondary_color',
            'theme',
            'about',
            'contact_email',
            'contact_phone',
            'website',
            'instagram',
            'facebook',
            'tiktok',
            'whatsapp',
        ]        
