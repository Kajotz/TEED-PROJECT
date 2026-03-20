"""
Integration Tests for Backend User Profile and Business Navigation
Tests the complete flow of user profile → business profile navigation

Run with: python manage.py test core.tests.test_integration
"""

from django.test import TestCase, Client
from django.contrib.auth.models import User
from rest_framework.test import APIClient, APITestCase
from rest_framework import status
from core.models import Business, BusinessProfile, Membership
import json
import uuid


class UserProfileIntegrationTest(APITestCase):
    """Test user profile and business integration"""

    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        
        # Create test users
        self.user1 = User.objects.create_user(
            username='testuser1',
            email='user1@test.com',
            password='testpass123'
        )
        self.user2 = User.objects.create_user(
            username='testuser2',
            email='user2@test.com',
            password='testpass123'
        )
        
        # Create test businesses
        self.business1 = Business.objects.create(
            id=uuid.uuid4(),
            name='Test Business 1',
            slug='test-business-1',
            business_type='retail',
            created_by=self.user1
        )
        
        self.business2 = Business.objects.create(
            id=uuid.uuid4(),
            name='Test Business 2',
            slug='test-business-2',
            business_type='service',
            created_by=self.user1
        )
        
        self.business3 = Business.objects.create(
            id=uuid.uuid4(),
            name='Test Business 3',
            slug='test-business-3',
            business_type='online',
            created_by=self.user2
        )
        
        # Create business profiles
        self.profile1 = BusinessProfile.objects.create(
            business=self.business1,
            logo='test_logo1.png',
            primary_color='#3498db',
            secondary_color='#2c3e50',
            theme='light',
            about='Test Business 1 Profile'
        )
        
        self.profile2 = BusinessProfile.objects.create(
            business=self.business2,
            logo='test_logo2.png',
            primary_color='#e74c3c',
            secondary_color='#c0392b',
            theme='dark',
            about='Test Business 2 Profile'
        )
        
        self.profile3 = BusinessProfile.objects.create(
            business=self.business3,
            logo='test_logo3.png',
            primary_color='#27ae60',
            secondary_color='#16a085',
            theme='light',
            about='Test Business 3 Profile'
        )
        
        # Create memberships
        # User 1 owns business 1 and 2
        Membership.objects.create(
            user=self.user1,
            business=self.business1,
            role='owner'
        )
        Membership.objects.create(
            user=self.user1,
            business=self.business2,
            role='owner'
        )
        
        # User 2 owns business 3
        Membership.objects.create(
            user=self.user2,
            business=self.business3,
            role='owner'
        )
        
        # User 1 is staff in business 3
        Membership.objects.create(
            user=self.user1,
            business=self.business3,
            role='staff'
        )

    def authenticate(self, user):
        """Authenticate as a user"""
        self.client.force_authenticate(user=user)

    # ========================================================================
    # USER PROFILE TESTS
    # ========================================================================

    def test_get_user_profile_authenticated(self):
        """Test getting authenticated user profile"""
        self.authenticate(self.user1)
        response = self.client.get('/api/profile/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        self.assertEqual(data['username'], 'testuser1')
        self.assertEqual(data['email'], 'user1@test.com')
        self.assertIn('businesses', data)
        self.assertIsInstance(data['businesses'], list)

    def test_get_user_profile_unauthenticated(self):
        """Test that unauthenticated users cannot access profile"""
        response = self.client.get('/api/profile/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_profile_contains_all_businesses(self):
        """Test profile includes all user's businesses"""
        self.authenticate(self.user1)
        response = self.client.get('/api/profile/')
        
        data = response.json()
        businesses = data['businesses']
        
        # User 1 has 3 businesses (2 owned, 1 where staff)
        self.assertEqual(len(businesses), 3)
        
        business_ids = [b['id'] for b in businesses]
        self.assertIn(str(self.business1.id), business_ids)
        self.assertIn(str(self.business2.id), business_ids)
        self.assertIn(str(self.business3.id), business_ids)

    def test_update_user_profile(self):
        """Test updating user profile name"""
        self.authenticate(self.user1)
        
        update_data = {
            'first_name': 'John',
            'last_name': 'Doe'
        }
        
        response = self.client.put(
            '/api/profile/',
            data=json.dumps(update_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        self.assertEqual(data['first_name'], 'John')
        self.assertEqual(data['last_name'], 'Doe')

    def test_update_profile_email_protected(self):
        """Test that email cannot be updated via profile endpoint"""
        self.authenticate(self.user1)
        
        update_data = {
            'first_name': 'John',
            'last_name': 'Doe',
            'email': 'newemail@test.com'  # Should be ignored
        }
        
        response = self.client.put(
            '/api/profile/',
            data=json.dumps(update_data),
            content_type='application/json'
        )
        
        # Check email wasn't updated
        self.user1.refresh_from_db()
        self.assertEqual(self.user1.email, 'user1@test.com')

    # ========================================================================
    # BUSINESS LIST TESTS
    # ========================================================================

    def test_get_user_businesses_by_role(self):
        """Test getting businesses organized by role"""
        self.authenticate(self.user1)
        response = self.client.get('/api/profile/businesses/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        businesses = response.json()
        
        self.assertIsInstance(businesses, list)
        self.assertEqual(len(businesses), 3)

    def test_business_list_includes_user_role(self):
        """Test that business list includes user's role in each business"""
        self.authenticate(self.user1)
        response = self.client.get('/api/profile/businesses/')
        
        businesses = response.json()
        
        for business in businesses:
            self.assertIn('user_role', business)
            self.assertIn(business['user_role'], ['owner', 'admin', 'staff', 'analyst'])

    def test_business_list_different_for_different_users(self):
        """Test that different users see different businesses"""
        # User 1
        self.authenticate(self.user1)
        response1 = self.client.get('/api/profile/businesses/')
        businesses1 = response1.json()
        count1 = len(businesses1)
        
        # User 2
        self.client.force_authenticate(user=self.user2)
        response2 = self.client.get('/api/profile/businesses/')
        businesses2 = response2.json()
        count2 = len(businesses2)
        
        # User 1 should see 3, User 2 should see 1
        self.assertEqual(count1, 3)
        self.assertEqual(count2, 1)

    # ========================================================================
    # BUSINESS DETAIL TESTS
    # ========================================================================

    def test_get_business_detail_authenticated(self):
        """Test getting business detail for owned business"""
        self.authenticate(self.user1)
        response = self.client.get(f'/api/profile/businesses/{self.business1.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        self.assertEqual(data['id'], str(self.business1.id))
        self.assertEqual(data['name'], 'Test Business 1')
        self.assertIn('user_role', data)
        self.assertEqual(data['user_role'], 'owner')

    def test_get_business_detail_includes_profile(self):
        """Test business detail includes business profile"""
        self.authenticate(self.user1)
        response = self.client.get(f'/api/profile/businesses/{self.business1.id}/')
        
        data = response.json()
        
        self.assertIn('business_profile', data)
        profile = data['business_profile']
        
        self.assertEqual(profile['primary_color'], '#3498db')
        self.assertEqual(profile['secondary_color'], '#2c3e50')
        self.assertEqual(profile['theme'], 'light')
        self.assertEqual(profile['about'], 'Test Business 1 Profile')

    def test_get_business_detail_unauthenticated(self):
        """Test that unauthenticated users cannot access business"""
        response = self.client.get(f'/api/profile/businesses/{self.business1.id}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_business_detail_forbidden_for_non_member(self):
        """Test that non-members cannot access business"""
        # User 2 is not a member of business 1
        self.authenticate(self.user2)
        response = self.client.get(f'/api/profile/businesses/{self.business1.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_get_business_detail_404_for_invalid_id(self):
        """Test that invalid business ID returns 404"""
        self.authenticate(self.user1)
        fake_id = uuid.uuid4()
        response = self.client.get(f'/api/profile/businesses/{fake_id}/')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_business_detail_includes_user_joined_at(self):
        """Test business detail includes user_joined_at timestamp"""
        self.authenticate(self.user1)
        response = self.client.get(f'/api/profile/businesses/{self.business1.id}/')
        
        data = response.json()
        self.assertIn('user_joined_at', data)
        self.assertIsNotNone(data['user_joined_at'])

    # ========================================================================
    # BUSINESS ROLE TESTS
    # ========================================================================

    def test_business_detail_shows_staff_role(self):
        """Test that staff role is correctly shown"""
        self.authenticate(self.user1)
        response = self.client.get(f'/api/profile/businesses/{self.business3.id}/')
        
        data = response.json()
        self.assertEqual(data['user_role'], 'staff')

    def test_different_users_see_different_roles(self):
        """Test that different users see correct roles for same business"""
        # User 1 is owner of business 2
        self.authenticate(self.user1)
        response1 = self.client.get(f'/api/profile/businesses/{self.business2.id}/')
        data1 = response1.json()
        
        self.assertEqual(data1['user_role'], 'owner')

    # ========================================================================
    # SYNC TESTS
    # ========================================================================

    def test_profile_and_business_list_consistency(self):
        """Test that profile businesses match business list endpoint"""
        self.authenticate(self.user1)
        
        # Get from profile
        profile_response = self.client.get('/api/profile/')
        profile_businesses = profile_response.json()['businesses']
        
        # Get from business list
        list_response = self.client.get('/api/profile/businesses/')
        listed_businesses = list_response.json()
        
        # Should have same count
        self.assertEqual(len(profile_businesses), len(listed_businesses))
        
        # IDs should match
        profile_ids = {b['id'] for b in profile_businesses}
        list_ids = {b['id'] for b in listed_businesses}
        
        self.assertEqual(profile_ids, list_ids)

    def test_business_detail_matches_list_entry(self):
        """Test that business detail matches data in list"""
        self.authenticate(self.user1)
        
        # Get from list
        list_response = self.client.get('/api/profile/businesses/')
        business_from_list = list_response.json()[0]
        
        # Get detail
        detail_response = self.client.get(
            f'/api/profile/businesses/{business_from_list["id"]}/'
        )
        business_detail = detail_response.json()
        
        # Key fields should match
        self.assertEqual(business_from_list['name'], business_detail['name'])
        self.assertEqual(business_from_list['business_type'], business_detail['business_type'])

    # ========================================================================
    # ERROR HANDLING TESTS
    # ========================================================================

    def test_error_response_format(self):
        """Test that error responses have consistent format"""
        # Try to access without auth
        response = self.client.get('/api/profile/')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        data = response.json()
        
        # Should have detail field
        self.assertIn('detail', data)

    def test_malformed_request_returns_400(self):
        """Test that malformed requests return 400"""
        self.authenticate(self.user1)
        
        response = self.client.put(
            '/api/profile/',
            data='invalid json',
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ========================================================================
    # PERFORMANCE TESTS
    # ========================================================================

    def test_profile_endpoint_response_time(self):
        """Test that profile endpoint responds quickly"""
        import time
        
        self.authenticate(self.user1)
        
        start = time.time()
        response = self.client.get('/api/profile/')
        elapsed = time.time() - start
        
        # Should respond within 500ms
        self.assertLess(elapsed, 0.5)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_business_list_with_many_businesses(self):
        """Test business list performs well with multiple businesses"""
        # Create more businesses
        for i in range(10):
            business = Business.objects.create(
                id=uuid.uuid4(),
                name=f'Additional Business {i}',
                slug=f'business-{i}',
                business_type='retail',
                created_by=self.user1
            )
            Membership.objects.create(
                user=self.user1,
                business=business,
                role='owner'
            )
        
        self.authenticate(self.user1)
        response = self.client.get('/api/profile/businesses/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        businesses = response.json()
        
        # Should have all businesses
        self.assertGreater(len(businesses), 3)


class BusinessProfileSerializationTest(APITestCase):
    """Test business profile data serialization"""

    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123'
        )
        
        self.business = Business.objects.create(
            id=uuid.uuid4(),
            name='Test Business',
            slug='test-business',
            business_type='service',
            created_by=self.user
        )
        
        self.profile = BusinessProfile.objects.create(
            business=self.business,
            logo='logo.png',
            primary_color='#3498db',
            secondary_color='#2c3e50',
            theme='light',
            about='Test About',
            email='business@test.com',
            phone='+1234567890',
            website='https://test.com',
            address='123 Main St'
        )
        
        Membership.objects.create(
            user=self.user,
            business=self.business,
            role='owner'
        )

    def test_business_profile_all_fields_present(self):
        """Test all business profile fields are serialized"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f'/api/profile/businesses/{self.business.id}/')
        
        business = response.json()
        profile = business['business_profile']
        
        required_fields = [
            'logo', 'primary_color', 'secondary_color', 'theme',
            'about', 'email', 'phone', 'website', 'address'
        ]
        
        for field in required_fields:
            self.assertIn(field, profile, f'Missing field: {field}')

    def test_business_profile_types(self):
        """Test business profile field types"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f'/api/profile/businesses/{self.business.id}/')
        
        business = response.json()
        profile = business['business_profile']
        
        self.assertIsInstance(profile['primary_color'], str)
        self.assertIsInstance(profile['email'], str)
        self.assertIsInstance(profile['about'], str)
