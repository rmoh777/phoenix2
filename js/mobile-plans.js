/**
 * Mobile Plans Data Structure
 * 
 * This file contains the complete list of mobile plans used by the Mobile Plan Finder application.
 * Each plan has the following structure:
 * - id: Unique identifier for the plan
 * - name: Name of the plan
 * - carrier: Mobile carrier offering the plan
 * - price: Monthly price in USD
 * - data: Data allowance description
 * - features: Array of features included in the plan
 * - hotspot: Hotspot capability description
 */

const MOBILE_PLANS = [
    // IM TELECOM Plans
    {
        id: 1,
        name: "Standard Plan",
        carrier: "IM TELECOM (Excess Telecom)",
        price: 0,
        data: "4.5GB",
        features: ["3,000 minutes", "Unlimited text", "Lifeline discount"],
        hotspot: "Not specified"
    },
    {
        id: 2,
        name: "Advantage Plan", 
        carrier: "IM TELECOM (Excess Telecom)",
        price: 1,
        data: "6.5GB",
        features: ["3,000 minutes", "Unlimited text", "Lifeline discount"],
        hotspot: "Not specified"
    },
    {
        id: 3,
        name: "Kentucky Standard Plan",
        carrier: "IM TELECOM (Excess Telecom)",
        price: 0,
        data: "4.5GB", 
        features: ["Unlimited talk", "Unlimited text", "Kentucky only"],
        hotspot: "Not specified"
    },
    {
        id: 4,
        name: "California Standard Plan",
        carrier: "IM TELECOM (Excess Telecom)",
        price: 0,
        data: "6GB",
        features: ["Unlimited talk", "Unlimited text", "California only"],
        hotspot: "Not specified"
    },
    {
        id: 5,
        name: "Tribal Standard Plan",
        carrier: "IM TELECOM (Excess Telecom)",
        price: 0,
        data: "6GB",
        features: ["3,000 minutes", "Unlimited text", "Qualifying Tribal Lands"],
        hotspot: "Not specified"
    },
    {
        id: 6,
        name: "Tribal Advantage Plan",
        carrier: "IM TELECOM (Excess Telecom)",
        price: 1,
        data: "8GB",
        features: ["3,000 minutes", "Unlimited text", "Qualifying Tribal Lands"],
        hotspot: "Not specified"
    },
    
    // TRACFONE WIRELESS Plans
    {
        id: 7,
        name: "Standard Lifeline Discount",
        carrier: "TRACFONE WIRELESS",
        price: 10,
        data: "At least 4.5GB",
        features: ["$10/month discount", "Caller ID", "Call Waiting", "Voicemail"],
        hotspot: "Depends on plan"
    },
    {
        id: 8,
        name: "Tribal Lifeline Discount", 
        carrier: "TRACFONE WIRELESS",
        price: 0,
        data: "At least 4.5GB",
        features: ["Up to $35/month discount", "Qualifying Tribal Lands", "Caller ID"],
        hotspot: "Depends on plan"
    },
    
    // ASSURANCE WIRELESS Plans
    {
        id: 9,
        name: "Standard Lifeline Service",
        carrier: "VIRGIN MOBILE USA (Assurance Wireless)", 
        price: 0,
        data: "4.5GB",
        features: ["3,000 minutes", "Unlimited text", "Free monthly service"],
        hotspot: "Not included"
    },
    {
        id: 10,
        name: "Data Peace of Mind Plan",
        carrier: "VIRGIN MOBILE USA (Assurance Wireless)",
        price: 10,
        data: "7GB/month hotspot",
        features: ["Mobile hotspot data", "Annual payment option"],
        hotspot: "7GB"
    },
    
    // AIRTALK WIRELESS Plans
    {
        id: 11,
        name: "Standard Lifeline Service",
        carrier: "AIR VOICE WIRELESS (AirTalk Wireless)",
        price: 0,
        data: "Up to 10GB (varies by state)",
        features: ["Unlimited talk", "Unlimited text", "5G+ high-speed", "Free smartphones"],
        hotspot: "Not specified"
    },
    
    // VERIZON Plans
    {
        id: 12,
        name: "Lifeline Discount (general)",
        carrier: "VERIZON",
        price: 9,
        data: "Variable",
        features: ["At least $9.25/month discount", "Depends on chosen plan"],
        hotspot: "Depends on plan"
    },
    {
        id: 13,
        name: "$25.00 Lifeline Plan",
        carrier: "VERIZON", 
        price: 16,
        data: "No data service",
        features: ["1,000 anytime minutes", "Unlimited text", "Local mobile to mobile"],
        hotspot: "No"
    },
    {
        id: 14,
        name: "$19.99 Home Phone Connect Plan",
        carrier: "VERIZON",
        price: 11,
        data: "N/A (home phone)",
        features: ["Unlimited minutes", "Home phone service", "Requires device"],
        hotspot: "N/A"
    }
];

// Export the data structure
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MOBILE_PLANS };
} else {
    // For browser usage
    window.MOBILE_PLANS = MOBILE_PLANS;
} 

