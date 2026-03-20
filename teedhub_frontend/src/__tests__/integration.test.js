/**
 * Frontend Integration Tests for User Profile & Business Navigation
 * Tests React components against mocked API responses
 * 
 * Run with: npm test -- --testPathPattern=integration
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import UserProfilePage from '../pages/UserProfilePage';
import BusinessDetailPage from '../pages/BusinessDetailPage';
import EditBusinessPage from '../pages/EditBusinessPage';

// Mock axios
jest.mock('axios');

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ businessId: 'mock-business-id' }),
}));

// Test Data
const mockUserProfile = {
  id: 'user-1',
  username: 'testuser',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@test.com',
  businesses: [
    {
      id: 'business-1',
      name: 'My Business',
      slug: 'my-business',
      business_type: 'retail',
      user_role: 'owner',
      user_joined_at: '2024-01-01T00:00:00Z',
      business_profile: {
        logo: 'logo.jpg',
        primary_color: '#3498db',
        secondary_color: '#2c3e50',
        theme: 'light',
        about: 'My awesome business',
      },
    },
    {
      id: 'business-2',
      name: 'Member Business',
      slug: 'member-business',
      business_type: 'service',
      user_role: 'staff',
      user_joined_at: '2024-02-01T00:00:00Z',
      business_profile: {
        logo: 'logo2.jpg',
        primary_color: '#e74c3c',
        secondary_color: '#c0392b',
        theme: 'dark',
        about: 'Business where I am staff',
      },
    },
  ],
};

const mockBusinessDetail = {
  id: 'business-1',
  name: 'Test Business',
  slug: 'test-business',
  business_type: 'retail',
  user_role: 'owner',
  user_joined_at: '2024-01-01T00:00:00Z',
  created_at: '2023-12-01T00:00:00Z',
  is_active: true,
  business_profile: {
    logo: 'logo.jpg',
    primary_color: '#3498db',
    secondary_color: '#2c3e50',
    theme: 'light',
    about: 'Test Business About',
    email: 'business@test.com',
    phone: '+1234567890',
    website: 'https://test.com',
    address: '123 Main St',
    contact: {},
    social_media: {
      instagram: '@testbusiness',
      facebook: 'testbusiness',
      tiktok: '@testbusiness',
      whatsapp: '+1234567890',
    },
  },
};

// ============================================================================
// USER PROFILE PAGE TESTS
// ============================================================================

describe('UserProfilePage Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('access_token', 'mock-token');
  });

  afterEach(() => {
    localStorage.removeItem('access_token');
  });

  test('displays user profile information when loaded', async () => {
    axios.get.mockResolvedValueOnce({
      data: mockUserProfile,
      status: 200,
    });

    render(
      <BrowserRouter>
        <UserProfilePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/john@test.com/i)).toBeInTheDocument();
  });

  test('displays user businesses in list', async () => {
    axios.get.mockResolvedValueOnce({
      data: mockUserProfile,
      status: 200,
    });

    render(
      <BrowserRouter>
        <UserProfilePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('My Business')).toBeInTheDocument();
      expect(screen.getByText('Member Business')).toBeInTheDocument();
    });
  });

  test('separates owned and member businesses', async () => {
    axios.get.mockResolvedValueOnce({
      data: mockUserProfile,
      status: 200,
    });

    render(
      <BrowserRouter>
        <UserProfilePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/My Businesses/i)).toBeInTheDocument();
      expect(screen.getByText(/I'm a Member Of/i)).toBeInTheDocument();
    });
  });

  test('navigates to business detail on business click', async () => {
    axios.get.mockResolvedValueOnce({
      data: mockUserProfile,
      status: 200,
    });

    render(
      <BrowserRouter>
        <UserProfilePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('My Business')).toBeInTheDocument();
    });

    const businessCard = screen.getByText('My Business').closest('.business-card');
    fireEvent.click(businessCard);

    expect(mockNavigate).toHaveBeenCalledWith('/business/business-1');
  });

  test('shows loading spinner while fetching data', () => {
    axios.get.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <BrowserRouter>
        <UserProfilePage />
      </BrowserRouter>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('displays error message on API failure', async () => {
    axios.get.mockRejectedValueOnce({
      response: {
        status: 500,
        data: { detail: 'Server error' },
      },
    });

    render(
      <BrowserRouter>
        <UserProfilePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Error|error/i)).toBeInTheDocument();
    });
  });

  test('shows edit profile modal when edit button clicked', async () => {
    axios.get.mockResolvedValueOnce({
      data: mockUserProfile,
      status: 200,
    });

    render(
      <BrowserRouter>
        <UserProfilePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Edit/i)).toBeInTheDocument();
    });

    const editButton = screen.getByText(/Edit/i);
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/first name/i)).toBeInTheDocument();
    });
  });

  test('closes edit modal on cancel', async () => {
    axios.get.mockResolvedValueOnce({
      data: mockUserProfile,
      status: 200,
    });

    render(
      <BrowserRouter>
        <UserProfilePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Edit/i)).toBeInTheDocument();
    });

    // Open modal
    fireEvent.click(screen.getByText(/Edit/i));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/first name/i)).toBeInTheDocument();
    });

    // Close modal
    const cancelButton = screen.getByText(/Cancel/i);
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/first name/i)).not.toBeInTheDocument();
    });
  });

  test('shows empty state when no businesses', async () => {
    const emptyProfile = { ...mockUserProfile, businesses: [] };
    axios.get.mockResolvedValueOnce({
      data: emptyProfile,
      status: 200,
    });

    render(
      <BrowserRouter>
        <UserProfilePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/No Businesses Yet/i)).toBeInTheDocument();
    });
  });
});

// ============================================================================
// BUSINESS DETAIL PAGE TESTS
// ============================================================================

describe('BusinessDetailPage Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('access_token', 'mock-token');
  });

  afterEach(() => {
    localStorage.removeItem('access_token');
  });

  test('displays business information when loaded', async () => {
    axios.get.mockResolvedValueOnce({
      data: mockBusinessDetail,
      status: 200,
    });

    render(
      <BrowserRouter>
        <BusinessDetailPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Business')).toBeInTheDocument();
    });

    expect(screen.getByText('Test Business About')).toBeInTheDocument();
    expect(screen.getByText(/business@test.com/i)).toBeInTheDocument();
  });

  test('displays business profile data', async () => {
    axios.get.mockResolvedValueOnce({
      data: mockBusinessDetail,
      status: 200,
    });

    render(
      <BrowserRouter>
        <BusinessDetailPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/123 Main St/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/@testbusiness/i)).toBeInTheDocument();
  });

  test('shows edit button for owner', async () => {
    axios.get.mockResolvedValueOnce({
      data: mockBusinessDetail,
      status: 200,
    });

    render(
      <BrowserRouter>
        <BusinessDetailPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Edit/i)).toBeInTheDocument();
    });
  });

  test('navigates to edit page on edit button click', async () => {
    axios.get.mockResolvedValueOnce({
      data: mockBusinessDetail,
      status: 200,
    });

    render(
      <BrowserRouter>
        <BusinessDetailPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Edit/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Edit/i));

    expect(mockNavigate).toHaveBeenCalledWith('/business/business-1/edit');
  });

  test('shows back button to navigate to profile', async () => {
    axios.get.mockResolvedValueOnce({
      data: mockBusinessDetail,
      status: 200,
    });

    render(
      <BrowserRouter>
        <BusinessDetailPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Back/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Back/i));

    expect(mockNavigate).toHaveBeenCalledWith('/profile');
  });

  test('displays 403 error for non-members', async () => {
    axios.get.mockRejectedValueOnce({
      response: {
        status: 403,
        data: { detail: 'Permission denied' },
      },
    });

    render(
      <BrowserRouter>
        <BusinessDetailPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Permission|Access/i)).toBeInTheDocument();
    });
  });

  test('displays 404 error for non-existent business', async () => {
    axios.get.mockRejectedValueOnce({
      response: {
        status: 404,
        data: { detail: 'Not found' },
      },
    });

    render(
      <BrowserRouter>
        <BusinessDetailPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Not found|not found/i)).toBeInTheDocument();
    });
  });
});

// ============================================================================
// EDIT BUSINESS PAGE TESTS
// ============================================================================

describe('EditBusinessPage Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('access_token', 'mock-token');
  });

  afterEach(() => {
    localStorage.removeItem('access_token');
  });

  test('loads business data into form', async () => {
    axios.get.mockResolvedValueOnce({
      data: mockBusinessDetail,
      status: 200,
    });

    render(
      <BrowserRouter>
        <EditBusinessPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      const nameInput = screen.getByDisplayValue('Test Business');
      expect(nameInput).toBeInTheDocument();
    });
  });

  test('displays all form sections', async () => {
    axios.get.mockResolvedValueOnce({
      data: mockBusinessDetail,
      status: 200,
    });

    render(
      <BrowserRouter>
        <EditBusinessPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Basic Information/i)).toBeInTheDocument();
      expect(screen.getByText(/Branding/i)).toBeInTheDocument();
      expect(screen.getByText(/Contact Information/i)).toBeInTheDocument();
      expect(screen.getByText(/Social Media/i)).toBeInTheDocument();
    });
  });

  test('submits form with updated data', async () => {
    axios.get.mockResolvedValueOnce({
      data: mockBusinessDetail,
      status: 200,
    });

    axios.post.mockResolvedValueOnce({
      data: { success: true },
      status: 200,
    });

    render(
      <BrowserRouter>
        <EditBusinessPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Business')).toBeInTheDocument();
    });

    const aboutInput = screen.getByPlaceholderText(/about/i);
    fireEvent.change(aboutInput, { target: { value: 'Updated about' } });

    const submitButton = screen.getByText(/Save Changes/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
    });
  });

  test('validates required fields', async () => {
    axios.get.mockResolvedValueOnce({
      data: mockBusinessDetail,
      status: 200,
    });

    render(
      <BrowserRouter>
        <EditBusinessPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Business')).toBeInTheDocument();
    });

    const nameInput = screen.getByDisplayValue('Test Business');
    fireEvent.change(nameInput, { target: { value: '' } });

    const submitButton = screen.getByText(/Save Changes/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/required/i)).toBeInTheDocument();
    });
  });

  test('shows success message on save', async () => {
    axios.get.mockResolvedValueOnce({
      data: mockBusinessDetail,
      status: 200,
    });

    axios.post.mockResolvedValueOnce({
      data: { success: true },
      status: 200,
    });

    render(
      <BrowserRouter>
        <EditBusinessPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Business')).toBeInTheDocument();
    });

    const submitButton = screen.getByText(/Save Changes/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/successfully/i)).toBeInTheDocument();
    });
  });

  test('navigates back to business detail on save', async () => {
    axios.get.mockResolvedValueOnce({
      data: mockBusinessDetail,
      status: 200,
    });

    axios.post.mockResolvedValueOnce({
      data: { success: true },
      status: 200,
    });

    render(
      <BrowserRouter>
        <EditBusinessPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Business')).toBeInTheDocument();
    });

    const submitButton = screen.getByText(/Save Changes/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/business/business-1');
    }, { timeout: 3000 });
  });

  test('shows cancel button that navigates back', async () => {
    axios.get.mockResolvedValueOnce({
      data: mockBusinessDetail,
      status: 200,
    });

    render(
      <BrowserRouter>
        <EditBusinessPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Cancel/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Cancel/i));

    expect(mockNavigate).toHaveBeenCalledWith('/business/business-1');
  });
});

// ============================================================================
// CROSS-PAGE NAVIGATION TESTS
// ============================================================================

describe('Cross-Page Navigation Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('access_token', 'mock-token');
  });

  afterEach(() => {
    localStorage.removeItem('access_token');
  });

  test('complete flow: profile → business detail → edit → profile', async () => {
    // Step 1: Load profile
    axios.get.mockResolvedValueOnce({
      data: mockUserProfile,
      status: 200,
    });

    render(
      <BrowserRouter>
        <UserProfilePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('My Business')).toBeInTheDocument();
    });

    // Step 2: Click business to go to detail
    const businessCard = screen.getByText('My Business').closest('.business-card');
    fireEvent.click(businessCard);

    expect(mockNavigate).toHaveBeenCalledWith('/business/business-1');

    // Step 3: In detail page, click edit
    mockNavigate.mockClear();

    // Mock business detail API
    axios.get.mockResolvedValueOnce({
      data: mockBusinessDetail,
      status: 200,
    });

    // Simulate navigation to business detail page
    const editButton = screen.getByText(/Edit/i);
    fireEvent.click(editButton);

    expect(mockNavigate).toHaveBeenCalledWith('/business/business-1/edit');

    // Step 4: In edit page, save and go back
    mockNavigate.mockClear();

    axios.post.mockResolvedValueOnce({
      data: { success: true },
      status: 200,
    });

    const saveButton = screen.getByText(/Save Changes/i);
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/business/business-1');
    }, { timeout: 3000 });
  });
});
