import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader, Building2, Tag } from "lucide-react";
import { API_BASE_URL } from "../../utils/constants";
import { apiPost } from "../../utils/api";
import { useToast } from "../../hooks/useToast";

function CreateBusiness() {
  const navigate = useNavigate();
  const { success, error, warning } = useToast();
  const [name, setName] = useState("");
  const [businessType, setBusinessType] = useState("retail");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const businessTypes = [
    { value: "retail", label: "Retail Store", emoji: "🛒" },
    { value: "service", label: "Service Business", emoji: "🔧" },
    { value: "online", label: "Online Store", emoji: "🌐" },
    { value: "creator", label: "Creator/Influencer", emoji: "⭐" },
  ];

  const validateForm = () => {
    const newErrors = {};
    
    if (!name.trim()) {
      newErrors.name = "Business name is required";
    } else if (name.trim().length < 2) {
      newErrors.name = "Business name must be at least 2 characters";
    } else if (name.trim().length > 100) {
      newErrors.name = "Business name must be less than 100 characters";
    }
    
    if (!businessType) {
      newErrors.businessType = "Please select a business type";
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      warning("Please fix the errors in the form");
      return;
    }
    
    setLoading(true);
    setErrors({});

    try {
      const requestData = {
        name: name.trim(),
        business_type: businessType,
      };
      
      const response = await apiPost(`${API_BASE_URL}/businesses/create/`, requestData);

      if (!response.ok) {
        let errorMessage = "Failed to create business";
        try {
          const data = await response.json();
          errorMessage = data.error || data.detail || JSON.stringify(data);
        } catch (parseErr) {
          errorMessage = `Server error (${response.status})`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      success(`Business "${data.name}" created successfully!`);
      setName("");
      setBusinessType("retail");
      
      // Navigate to business workspace after showing toast
      setTimeout(() => {
        navigate(`/business/${data.id}/overview`);
      }, 1500);
    } catch (err) {
      error(err.message || "Failed to create business");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* Business Name */}
      <div>
        <label className="block text-sm font-semibold text-[#1E1E1E] dark:text-[#E8E8E8] mb-3 flex items-center gap-2">
          <Building2 size={18} className="text-[#1F75FE]" />
          Business Name
          <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="e.g., Acme Store, Digital Marketing Co."
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors({ ...errors, name: "" });
          }}
          className={`w-full px-4 py-3 border-2 rounded-lg transition duration-200 
            bg-white dark:bg-[#1E1E1E] 
            text-[#1E1E1E] dark:text-white
            placeholder-gray-400 dark:placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-[#1F75FE] focus:border-[#1F75FE]
            ${errors.name ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-[#3A3A3A]'}
            hover:border-[#1F75FE] dark:hover:border-[#1F75FE]`}
        />
        {errors.name && (
          <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.name}</p>
        )}
      </div>

      {/* Business Type */}
      <div>
        <label className="block text-sm font-semibold text-[#1E1E1E] dark:text-[#E8E8E8] mb-3 flex items-center gap-2">
          <Tag size={18} className="text-[#1F75FE]" />
          Business Type
          <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {businessTypes.map((type) => (
            <motion.button
              key={type.value}
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setBusinessType(type.value);
                if (errors.businessType) setErrors({ ...errors, businessType: "" });
              }}
              className={`p-4 rounded-lg border-2 transition duration-200 text-left
                ${businessType === type.value
                  ? 'border-[#1F75FE] bg-[#1F75FE]/10 dark:bg-[#1F75FE]/20'
                  : 'border-gray-300 dark:border-[#3A3A3A] bg-white dark:bg-[#252526] hover:border-[#1F75FE]'
                }
              `}
            >
              <div className="text-2xl mb-2">{type.emoji}</div>
              <div className={`font-medium ${businessType === type.value ? 'text-[#1F75FE]' : 'text-[#1E1E1E] dark:text-white'}`}>
                {type.label}
              </div>
            </motion.button>
          ))}
        </div>
        {errors.businessType && (
          <p className="text-red-500 dark:text-red-400 text-xs mt-2">{errors.businessType}</p>
        )}
      </div>

      {/* Submit Button */}
      <motion.button
        type="submit"
        disabled={loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full px-6 py-3.5 bg-gradient-to-r from-[#1F75FE] to-blue-600 text-white font-semibold rounded-lg
          shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-blue-700
          disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
          transition-all duration-200 flex items-center justify-center gap-2
          dark:shadow-[0_4px_20px_rgba(31,117,254,0.3)]"
      >
        {loading ? (
          <>
            <Loader size={20} className="animate-spin" />
            Creating Business...
          </>
        ) : (
          <>
            <Building2 size={20} />
            Create Business
          </>
        )}
      </motion.button>
    </motion.form>
  );
}

export default CreateBusiness;
