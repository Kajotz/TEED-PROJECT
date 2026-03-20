// src/components/AdditionalInfo.jsx
import React from "react";
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";

export default function AdditionalInfo() {
  return (
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#3A3A3A] rounded-2xl p-8 shadow-lg"
      >
        <div className="flex items-start gap-4">
          <AlertCircle size={24} className="text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h2 className="text-2xl font-bold text-[#1F75FE] mb-2">Additional Information</h2>
            <p className="text-gray-600 dark:text-gray-400">
              All additional information fields are managed in the Personal Information section.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
