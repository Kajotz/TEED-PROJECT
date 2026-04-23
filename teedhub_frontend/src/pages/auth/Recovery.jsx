import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Phone, Lock, User, ArrowRight, ArrowLeft, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/ui/Toast';
import { API_BASE_URL } from '@/utils/constants';


const BACKEND_ROOT = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;

export default function Recovery() {
  const { toasts, success, error: showError, info, removeToast } = useToast();
  
  // State management
  const [step, setStep] = useState(1); // Steps 1-5
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [inputMethod, setInputMethod] = useState('email'); // 'email' or 'mobile'
  
  // Form data
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [recoveryCodeFromBackend, setRecoveryCodeFromBackend] = useState(''); // Code returned from backend for display
  const [usernameDisplay, setUsernameDisplay] = useState('');
  const [recoveryMobile, setRecoveryMobile] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Recovery info to display after success
  const [recoveryContact, setRecoveryContact] = useState(null);

  // ============ STEP 1: Email or Mobile Entry ============
  const handleStep1Submit = async (e) => {
    e.preventDefault();
    
    const payload = {};
    
    if (inputMethod === 'email') {
      if (!email) {
        showError('Please enter your email address');
        return;
      }
      payload.email = email;
    } else {
      if (!mobile) {
        showError('Please enter your mobile number');
        return;
      }
      payload.mobile = mobile;
    }

    setLoading(true);
    try {
      const resp = await fetch(`${BACKEND_ROOT}/api/auth/recover/initiate/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await resp.json();
      
      if (!resp.ok) {
        throw new Error(data.error || 'Failed to initiate recovery');
      }

      // Display the recovery code on frontend for testing
      if (data.code) {
        setRecoveryCodeFromBackend(data.code);
        success(`✓ Account found! Your recovery code is: ${data.code}`);
      }
      
      info('Verify your identity on the next step to proceed.');
      setStep(2);
    } catch (err) {
      showError(err.message || 'Recovery initiation failed');
    } finally {
      setLoading(false);
    }
  };

  // ============ STEP 2: Identity Verification ============
  const handleStep2Submit = async (e) => {
    e.preventDefault();
    if (!usernameDisplay || !recoveryMobile) {
      showError('Please enter both username and recovery mobile number');
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch(`${BACKEND_ROOT}/api/auth/recover/verify-identity/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          username_display: usernameDisplay,
          recovery_mobile: recoveryMobile,
        }),
      });

      const data = await resp.json();
      
      if (!resp.ok) {
        throw new Error(data.error || 'Identity verification failed');
      }

      info('Your identity has been verified. Check your email for the recovery code.');
      setStep(3);
    } catch (err) {
      showError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  // ============ STEP 4: Reset Password ============
  const handleStep4Submit = async (e) => {
    e.preventDefault();
    
    if (!recoveryCode || !newPassword || !confirmPassword) {
      showError('Please fill in all fields');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      showError('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      showError('Password must be at least 8 characters');
      return;
    }
    
    if (recoveryCode.length !== 12) {
      showError('Recovery code must be 12 digits');
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch(`${BACKEND_ROOT}/api/auth/recover/reset-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code: recoveryCode,
          new_password: newPassword,
        }),
      });

      const data = await resp.json();
      
      if (!resp.ok) {
        throw new Error(data.error || 'Password reset failed');
      }

      // Store tokens and recovery contact
      if (data.access) localStorage.setItem('access_token', data.access);
      if (data.refresh) localStorage.setItem('refresh_token', data.refresh);
      
      setRecoveryContact(data.recovery_contact);
      success('Password reset successfully!');
      setStep(5);
    } catch (err) {
      showError(err.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBackStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleGoToProfile = () => {
    window.location.href = '/profile';
  };

  return (
    <>
      {/* Background decorative elements */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-[#1F75FE] rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
        <div className="absolute -bottom-20 left-20 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
      </div>

      {/* Main Recovery Section */}
      <section className="w-full bg-white dark:bg-[#252526] transition-colors duration-300 relative z-10 min-h-screen flex items-center justify-center py-10">
        <div className="px-3 sm:px-5 md:px-8 lg:px-12 w-full max-w-2xl">
          
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-3xl sm:text-4xl font-bold text-[#1E1E1E] dark:text-[#D4D4D4] mb-3">
              Recover Your Account
            </h1>
            <p className="text-sm sm:text-base text-[#4A4A4A] dark:text-[#A0A0A0]">
              Follow the steps below to reset your password
            </p>
          </motion.div>

          {/* Step Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex justify-between mb-12"
          >
            {[1, 2, 3, 4, 5].map((stepNum) => (
              <div key={stepNum} className="flex flex-col items-center flex-1">
                <motion.div
                  animate={{
                    backgroundColor: stepNum <= step ? '#1F75FE' : stepNum === step ? '#f2a705' : '#E5E7EB',
                  }}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-bold mb-2 transition-all"
                >
                  {stepNum < step ? '✓' : stepNum}
                </motion.div>
                <p className="text-xs sm:text-sm text-[#4A4A4A] dark:text-[#A0A0A0] text-center">
                  {['Email', 'Verify', 'Sent', 'Reset', 'Done'][stepNum - 1]}
                </p>
              </div>
            ))}
          </motion.div>

          {/* Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#3A3A3A] rounded-2xl p-6 sm:p-8 md:p-10 shadow-lg dark:shadow-2xl"
          >
            <AnimatePresence mode="wait">
              
              {/* STEP 1: Email or Mobile Entry */}
              {step === 1 && (
                <motion.form
                  key="step1"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  onSubmit={handleStep1Submit}
                  className="space-y-4"
                >
                  <label className="block text-sm font-semibold text-[#1E1E1E] dark:text-[#D4D4D4] mb-4">
                    Find Your Account
                  </label>
                  
                  {/* Input Method Tabs */}
                  <div className="flex gap-2 mb-6 p-1 bg-gray-100 dark:bg-[#252526] rounded-lg">
                    <button
                      type="button"
                      onClick={() => { setInputMethod('email'); setMobile(''); setEmail(''); }}
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
                        inputMethod === 'email'
                          ? 'bg-[#1F75FE] text-white'
                          : 'bg-transparent text-[#4A4A4A] dark:text-[#A0A0A0] hover:bg-gray-200 dark:hover:bg-[#3A3A3A]'
                      }`}
                    >
                      <Mail size={16} className="inline mr-2" />
                      Email
                    </button>
                    <button
                      type="button"
                      onClick={() => { setInputMethod('mobile'); setEmail(''); setMobile(''); }}
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
                        inputMethod === 'mobile'
                          ? 'bg-[#1F75FE] text-white'
                          : 'bg-transparent text-[#4A4A4A] dark:text-[#A0A0A0] hover:bg-gray-200 dark:hover:bg-[#3A3A3A]'
                      }`}
                    >
                      <Phone size={16} className="inline mr-2" />
                      Mobile
                    </button>
                  </div>

                  {/* Email Input */}
                  {inputMethod === 'email' && (
                    <>
                      <div className="relative">
                        <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="email"
                          placeholder="your@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-[#3A3A3A] rounded-xl dark:bg-[#252526] dark:text-white focus:ring-2 focus:ring-[#1F75FE] focus:border-transparent transition"
                          required
                        />
                      </div>
                      <p className="text-xs text-[#4A4A4A] dark:text-[#A0A0A0]">
                        Enter the email address associated with your account
                      </p>
                    </>
                  )}

                  {/* Mobile Input */}
                  {inputMethod === 'mobile' && (
                    <>
                      <div className="relative">
                        <Phone size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="tel"
                          placeholder="+1234567890"
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-[#3A3A3A] rounded-xl dark:bg-[#252526] dark:text-white focus:ring-2 focus:ring-[#1F75FE] focus:border-transparent transition"
                          required
                        />
                      </div>
                      <p className="text-xs text-[#4A4A4A] dark:text-[#A0A0A0]">
                        Enter the recovery phone number you set up
                      </p>
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#1F75FE] hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition duration-300 flex items-center justify-center gap-2 mt-6"
                  >
                    {loading ? 'Searching...' : <>Find Account <ArrowRight size={18} /></>}
                  </button>

                  {/* Display Recovery Code for Testing */}
                  {recoveryCodeFromBackend && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4 }}
                      className="mt-8 pt-6 border-t border-gray-300 dark:border-[#3A3A3A]"
                    >
                      <div className="bg-amber-50 dark:bg-[#252526] border-2 border-amber-200 dark:border-[#f2a705] rounded-lg p-4">
                        <p className="text-sm font-semibold text-amber-900 dark:text-[#f2a705] mb-3">
                          📧 Recovery Code (For Testing)
                        </p>
                        <div className="bg-white dark:bg-[#1E1E1E] p-4 rounded-lg font-mono text-lg font-bold text-center tracking-widest text-[#1F75FE] mb-3">
                          {recoveryCodeFromBackend}
                        </div>
                        <p className="text-xs text-amber-800 dark:text-[#A0A0A0] mb-3">
                          ✓ Code expires in 30 minutes. Copy the code above and continue below.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(recoveryCodeFromBackend);
                            success('Code copied to clipboard!');
                          }}
                          className="w-full bg-amber-200 dark:bg-[#3A3A3A] hover:bg-amber-300 dark:hover:bg-[#4A4A4A] text-amber-900 dark:text-[#f2a705] font-semibold py-2 rounded-lg transition text-sm"
                        >
                          Copy Code
                        </button>
                      </div>
                    </motion.div>
                  )}
                </motion.form>
              )}

              {/* STEP 2: Identity Verification */}
              {step === 2 && (
                <motion.form
                  key="step2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  onSubmit={handleStep2Submit}
                  className="space-y-4"
                >
                  <label className="block text-sm font-semibold text-[#1E1E1E] dark:text-[#D4D4D4] mb-2">
                    Verify Your Identity
                  </label>
                  <p className="text-xs text-[#4A4A4A] dark:text-[#A0A0A0] mb-4">
                    Enter your username and recovery phone number you set up earlier
                  </p>
                  
                  <div className="relative">
                    <User size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Display Username"
                      value={usernameDisplay}
                      onChange={(e) => setUsernameDisplay(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-[#3A3A3A] rounded-xl dark:bg-[#252526] dark:text-white focus:ring-2 focus:ring-[#1F75FE] focus:border-transparent transition"
                      required
                    />
                  </div>

                  <div className="relative">
                    <Phone size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      placeholder="Recovery Phone Number"
                      value={recoveryMobile}
                      onChange={(e) => setRecoveryMobile(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-[#3A3A3A] rounded-xl dark:bg-[#252526] dark:text-white focus:ring-2 focus:ring-[#1F75FE] focus:border-transparent transition"
                      required
                    />
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      type="button"
                      onClick={handleBackStep}
                      className="flex-1 bg-white dark:bg-[#252526] text-[#1E1E1E] dark:text-white border border-gray-300 dark:border-[#3A3A3A] font-semibold py-3 rounded-xl transition duration-300 flex items-center justify-center gap-2 hover:bg-gray-100 dark:hover:bg-[#2A2A2A]"
                    >
                      <ArrowLeft size={18} /> Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-[#1F75FE] hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition duration-300 flex items-center justify-center gap-2"
                    >
                      {loading ? 'Verifying...' : <>Verify <ArrowRight size={18} /></>}
                    </button>
                  </div>
                </motion.form>
              )}

              {/* STEP 3: Recovery Code Sent */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="flex justify-center"
                  >
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <CheckCircle size={32} className="text-green-600" />
                    </div>
                  </motion.div>
                  
                  <div>
                    <h3 className="text-xl font-bold text-[#1E1E1E] dark:text-[#D4D4D4] mb-2">
                      Account Found ✓
                    </h3>
                    <p className="text-[#4A4A4A] dark:text-[#A0A0A0]">
                      {inputMethod === 'email' ? (
                        <>We've sent a 12-digit recovery code to<br/>
                          <span className="font-semibold text-[#1F75FE]">{email}</span></>
                      ) : (
                        <>We've sent a 12-digit recovery code via SMS to<br/>
                          <span className="font-semibold text-[#1F75FE]">{mobile}</span></>
                      )}
                    </p>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      ⏱️ The code will expire in 30 minutes. Please check your spam folder if you don't see it.
                    </p>
                  </div>

                  {!recoveryCodeFromBackend && (
                    <div className="bg-gray-50 dark:bg-[#252526] border border-gray-200 dark:border-[#3A3A3A] rounded-lg p-4">
                      <p className="text-sm text-[#4A4A4A] dark:text-[#A0A0A0]">
                        💡 For testing without email: Go back and enter the same {inputMethod} again to see the code
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => setStep(4)}
                    className="w-full bg-[#1F75FE] hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition duration-300 flex items-center justify-center gap-2"
                  >
                    I Have the Code <ArrowRight size={18} />
                  </button>

                  <button
                    onClick={handleBackStep}
                    className="w-full bg-white dark:bg-[#252526] text-[#1E1E1E] dark:text-white border border-gray-300 dark:border-[#3A3A3A] font-semibold py-3 rounded-xl transition duration-300 hover:bg-gray-100 dark:hover:bg-[#2A2A2A]"
                  >
                    Back to Verification
                  </button>
                </motion.div>
              )}

              {/* STEP 4: Reset Password */}
              {step === 4 && (
                <motion.form
                  key="step4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  onSubmit={handleStep4Submit}
                  className="space-y-4"
                >
                  <label className="block text-sm font-semibold text-[#1E1E1E] dark:text-[#D4D4D4] mb-2">
                    Enter Recovery Code & New Password
                  </label>

                  {/* Display code from Step 1 if available for testing */}
                  {recoveryCodeFromBackend && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="bg-amber-50 dark:bg-[#252526] border-2 border-amber-200 dark:border-[#f2a705] rounded-lg p-4 mb-4"
                    >
                      <p className="text-sm font-semibold text-amber-900 dark:text-[#f2a705] mb-2">
                        📧 Your Recovery Code
                      </p>
                      <div className="bg-white dark:bg-[#1E1E1E] p-3 rounded-lg font-mono text-lg font-bold text-center tracking-widest text-[#1F75FE] mb-3">
                        {recoveryCodeFromBackend}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setRecoveryCode(recoveryCodeFromBackend);
                          success('Code autofilled!');
                        }}
                        className="w-full bg-amber-200 dark:bg-[#3A3A3A] hover:bg-amber-300 dark:hover:bg-[#4A4A4A] text-amber-900 dark:text-[#f2a705] font-semibold py-2 rounded-lg transition text-sm"
                      >
                        Auto-fill Code
                      </button>
                    </motion.div>
                  )}

                  <div className="relative">
                    <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="12-Digit Recovery Code"
                      value={recoveryCode}
                      onChange={(e) => setRecoveryCode(e.target.value.replace(/\D/g, ''))}
                      maxLength="12"
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-[#3A3A3A] rounded-xl dark:bg-[#252526] dark:text-white focus:ring-2 focus:ring-[#1F75FE] focus:border-transparent transition"
                      required
                    />
                  </div>

                  <div className="relative">
                    <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="New Password (min 8 characters)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-3 border border-gray-300 dark:border-[#3A3A3A] rounded-xl dark:bg-[#252526] dark:text-white focus:ring-2 focus:ring-[#1F75FE] focus:border-transparent transition"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1F75FE]"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>

                  <div className="relative">
                    <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-3 border border-gray-300 dark:border-[#3A3A3A] rounded-xl dark:bg-[#252526] dark:text-white focus:ring-2 focus:ring-[#1F75FE] focus:border-transparent transition"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1F75FE]"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      type="button"
                      onClick={handleBackStep}
                      className="flex-1 bg-white dark:bg-[#252526] text-[#1E1E1E] dark:text-white border border-gray-300 dark:border-[#3A3A3A] font-semibold py-3 rounded-xl transition duration-300 flex items-center justify-center gap-2 hover:bg-gray-100 dark:hover:bg-[#2A2A2A]"
                    >
                      <ArrowLeft size={18} /> Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-[#1F75FE] hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition duration-300 flex items-center justify-center gap-2"
                    >
                      {loading ? 'Resetting...' : <>Reset Password <ArrowRight size={18} /></>}
                    </button>
                  </div>
                </motion.form>
              )}

              {/* STEP 5: Success */}
              {step === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="flex justify-center"
                  >
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <CheckCircle size={32} className="text-green-600" />
                    </div>
                  </motion.div>
                  
                  <div>
                    <h3 className="text-2xl font-bold text-[#1E1E1E] dark:text-[#D4D4D4] mb-2">
                      Password Reset Successfully!
                    </h3>
                    <p className="text-[#4A4A4A] dark:text-[#A0A0A0]">
                      Your account is now secured with your new password
                    </p>
                  </div>

                  {recoveryContact && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-5 mb-4"
                    >
                      <p className="text-sm font-semibold text-[#1E1E1E] dark:text-[#D4D4D4] mb-3">
                        Your Recovery Contacts:
                      </p>
                      <div className="space-y-2 text-sm text-[#4A4A4A] dark:text-[#A0A0A0]">
                        <p>
                          📧 Email: <span className="font-semibold">{recoveryContact.email}</span>
                        </p>
                        <p>
                          📱 Phone: <span className="font-semibold">{recoveryContact.mobile}</span>
                        </p>
                      </div>
                      <p className="text-xs text-[#4A4A4A] dark:text-[#A0A0A0] mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                        You can use these to recover your account in the future. Manage them in your Profile settings.
                      </p>
                    </motion.div>
                  )}

                  <button
                    onClick={handleGoToProfile}
                    className="w-full bg-[#1F75FE] hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition duration-300 flex items-center justify-center gap-2"
                  >
                    Go to Profile <ArrowRight size={18} />
                  </button>

                  <p className="text-xs text-[#4A4A4A] dark:text-[#A0A0A0]">
                    You can now manage your recovery email and phone in the Security section of your profile
                  </p>
                </motion.div>
              )}

            </AnimatePresence>
          </motion.div>

          {/* Back to Login */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="text-xs text-[#4A4A4A] dark:text-[#A0A0A0] text-center mt-6"
          >
            Remember your password?{" "}
            <a href="/login" className="text-[#1F75FE] hover:underline font-semibold">
              Back to Login
            </a>
          </motion.p>
        </div>
      </section>

      {/* Toast Notifications */}
      <Toast toasts={toasts} removeToast={removeToast} />
    </>
  );
}
