
/**
 * Browser-compatible utility for SMS operations.
 * Credentials here are used for the Admin Balance check and direct SMS sending.
 */

// Safe access helper
const getEnv = (key: string, fallback: string) => {
  try {
    return (import.meta as any).env?.[key] || fallback;
  } catch {
    return fallback;
  }
};

const API_KEY = getEnv('VITE_SMS_API_KEY', 'otxMrnZcEdTRCGapdmqU');
const SENDER_ID = '8809617631033';

/**
 * Formats a raw input (e.g., 01712345678) into E.164 (+8801712345678)
 * as required by Supabase Auth.
 */
export const formatPhoneForSupabase = (phone: string): string => {
  let cleaned = phone.replace(/\D/g, ''); // Remove non-digits
  
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  if (cleaned.startsWith('880')) {
    cleaned = cleaned.substring(3);
  }

  return `+880${cleaned}`;
};

/**
 * Formats a phone number specifically for BulkSMSBD API (8801XXXXXXXXX)
 */
export const formatPhoneForBulkSms = (phone: string): string => {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '88' + cleaned;
  } else if (cleaned.startsWith('1')) {
    cleaned = '880' + cleaned;
  }
  // Ensure it doesn't have the '+' prefix
  return cleaned.startsWith('+') ? cleaned.substring(1) : cleaned;
};

/**
 * Sends an OTP SMS directly via BulkSMSBD API.
 * This bypasses Supabase's native SMS provider requirement.
 */
export const sendOtpSmsDirect = async (number: string, otp: string): Promise<{ success: boolean; message: string }> => {
  const formattedNumber = formatPhoneForBulkSms(number);
  const message = `Your Duyar OTP is ${otp}`;
  const url = `https://bulksmsbd.net/api/smsapi?api_key=${API_KEY}&type=text&number=${formattedNumber}&senderid=${SENDER_ID}&message=${encodeURIComponent(message)}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    // BulkSMSBD returns 202 for success
    if (data.response_code === 202 || data.response_code === "202") {
      return { success: true, message: 'SMS Sent Successfully' };
    } else {
      console.error('BulkSMSBD Error:', data);
      return { success: false, message: data.success || 'Failed to send SMS' };
    }
  } catch (error) {
    console.error('SMS Network Error:', error);
    return { success: false, message: 'Network error. Please try again.' };
  }
};

/**
 * Fetches the current credit balance from BulkSMSBD for the Admin Dashboard
 */
export const getSmsBalance = async (): Promise<string> => {
  try {
    const response = await fetch(`https://bulksmsbd.net/api/getBalanceApi?api_key=${API_KEY}`);
    const data = await response.json();
    return data.balance || "0.00";
  } catch (error) {
    console.error('Failed to fetch balance:', error);
    return "N/A";
  }
};
