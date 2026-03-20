"""
Views for managing user personal information (UserProfile) and social accounts.
Handles profile data, personal info updates, and linked social media accounts.
"""

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.contrib.auth import get_user_model
from core.models import UserProfile, SocialAccount, Business, BusinessMember
from core.serializers import PersonalInfoSerializer, SocialAccountSerializer

User = get_user_model()


class PersonalInfoViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing user personal information.
    """

    serializer_class = PersonalInfoSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (JSONParser, MultiPartParser, FormParser)
    http_method_names = ['get', 'put', 'patch', 'post', 'head', 'options']

    def get_queryset(self):
        return UserProfile.objects.filter(user=self.request.user)

    def get_object(self):
        obj, created = UserProfile.objects.get_or_create(
            user=self.request.user,
            defaults={'username_display': self.request.user.username}
        )
        return obj

    @action(detail=False, methods=['get'])
    def get_personal_info(self, request):
        profile = self.get_object()
        serializer = self.get_serializer(profile, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['put', 'patch'])
    def update_personal_info(self, request):
        profile = self.get_object()
        partial = request.method == 'PATCH'

        serializer = self.get_serializer(
            profile,
            data=request.data,
            partial=partial,
            context={'request': request}
        )

        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    'message': 'Personal information updated successfully',
                    'data': serializer.data
                },
                status=status.HTTP_200_OK
            )

        return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def change_password(self, request):

        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')

        if not all([old_password, new_password, confirm_password]):
            return Response(
                {'error': 'All password fields are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if new_password != confirm_password:
            return Response(
                {'error': 'New passwords do not match'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(new_password) < 8:
            return Response(
                {'error': 'Password must be at least 8 characters long'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not user.check_password(old_password):
            return Response(
                {'error': 'Old password is incorrect'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        user.set_password(new_password)
        user.save()

        return Response(
            {'message': 'Password changed successfully'},
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['post'])
    def upload_profile_image(self, request):

        profile = self.get_object()

        if 'profile_image' not in request.FILES:
            return Response(
                {'error': 'No image file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        profile_image = request.FILES['profile_image']

        if profile_image.size > 5 * 1024 * 1024:
            return Response(
                {'error': 'Image size must be less than 5MB'},
                status=status.HTTP_400_BAD_REQUEST
            )

        allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if profile_image.content_type not in allowed_types:
            return Response(
                {'error': 'Only JPEG, PNG, GIF, and WebP images are allowed'},
                status=status.HTTP_400_BAD_REQUEST
            )

        profile.profile_image = profile_image
        profile.save()

        serializer = self.get_serializer(profile)

        return Response(
            {
                'message': 'Profile image uploaded successfully',
                'data': serializer.data
            },
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['post'])
    def update_email(self, request):

        user = request.user
        new_email = request.data.get('email')
        password = request.data.get('password')

        if not new_email or not password:
            return Response(
                {'error': 'Email and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not user.check_password(password):
            return Response(
                {'error': 'Password is incorrect'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if User.objects.filter(email=new_email).exclude(id=user.id).exists():
            return Response(
                {'error': 'This email is already in use'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.email = new_email
        user.save()

        profile = self.get_object()
        serializer = self.get_serializer(profile)

        return Response(
            {
                'message': 'Email updated successfully',
                'data': serializer.data
            },
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['post'])
    def update_recovery_info(self, request):

        profile = self.get_object()

        recovery_email = request.data.get('recovery_email', '').strip()
        recovery_mobile = request.data.get('recovery_mobile', '').strip()

        if recovery_email:
            if User.objects.filter(email=recovery_email).exists():
                return Response(
                    {'error': 'This email is already registered as a user account'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if '@' not in recovery_email or '.' not in recovery_email:
                return Response(
                    {'error': 'Invalid email format'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        if recovery_mobile:
            import re
            if not re.match(r'^\+?1?\d{9,14}$', recovery_mobile.replace(' ', '').replace('-', '')):
                return Response(
                    {'error': 'Invalid phone number format. Use 10-15 digits'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        if recovery_email:
            profile.recovery_email = recovery_email

        if recovery_mobile:
            profile.recovery_mobile = recovery_mobile

        profile.save()

        serializer = self.get_serializer(profile)

        return Response(
            {
                'message': 'Recovery information updated successfully',
                'data': serializer.data
            },
            status=status.HTTP_200_OK
        )


class SocialAccountViewSet(viewsets.ModelViewSet):

    serializer_class = SocialAccountSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def get_queryset(self):

        user = self.request.user

        business_ids = BusinessMember.objects.filter(
            user=user,
            role__in=["owner", "manager"],
            is_active=True
        ).values_list("business_id", flat=True)

        return SocialAccount.objects.filter(
            business_id__in=business_ids
        ).select_related("business")

    def _has_manage_permission(self, user, business):

        return BusinessMember.objects.filter(
            business=business,
            user=user,
            role__in=["owner", "manager"],
            is_active=True
        ).exists()

    def create(self, request, *args, **kwargs):

        business_id = request.data.get('business')

        if not business_id:
            return Response(
                {'error': 'Business ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            business = Business.objects.get(id=business_id)
        except Business.DoesNotExist:
            return Response(
                {'error': 'Business not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        if not self._has_manage_permission(request.user, business):
            return Response(
                {'error': 'You do not have permission to manage this business'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            serializer.save()

            return Response(
                {
                    'message': 'Social account linked successfully',
                    'data': serializer.data
                },
                status=status.HTTP_201_CREATED
            )

        return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):

        social_account = self.get_object()

        if not self._has_manage_permission(request.user, social_account.business):
            return Response(
                {'error': 'You do not have permission to manage this account'},
                status=status.HTTP_403_FORBIDDEN
            )

        partial = kwargs.pop('partial', False)

        serializer = self.get_serializer(
            social_account,
            data=request.data,
            partial=partial
        )

        if serializer.is_valid():
            serializer.save()

            return Response(
                {
                    'message': 'Social account updated successfully',
                    'data': serializer.data
                },
                status=status.HTTP_200_OK
            )

        return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):

        social_account = self.get_object()

        if not self._has_manage_permission(request.user, social_account.business):
            return Response(
                {'error': 'You do not have permission to manage this account'},
                status=status.HTTP_403_FORBIDDEN
            )

        social_account.delete()

        return Response(
            {'message': 'Social account disconnected successfully'},
            status=status.HTTP_204_NO_CONTENT
        )