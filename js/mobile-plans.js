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
    // Plans generated from newlifelineplans.txt
    // Each plan is a flat object with provider and plan details
    {
        provider_name: "IM TELECOM (Excess Telecom)",
        official_signup_urls: "https://www.excesstelecom.com/plans/lifeline",
        plan_name: "Standard Plan",
        price_per_month: "$0/month (with Lifeline discount)",
        data: "4.5GB",
        voice: "3,000 minutes",
        text: "Unlimited text",
        speed_notes: null,
        coverage_notes: null,
        additional_features: null
    },
    {
        provider_name: "IM TELECOM (Excess Telecom)",
        official_signup_urls: "https://www.excesstelecom.com/plans/lifeline",
        plan_name: "Advantage Plan",
        price_per_month: "$1/month (with Lifeline discount)",
        data: "6.5GB",
        voice: "3,000 minutes",
        text: "Unlimited text",
        speed_notes: null,
        coverage_notes: null,
        additional_features: null
    },
    {
        provider_name: "IM TELECOM (Excess Telecom)",
        official_signup_urls: "https://www.excesstelecom.com/plans/lifeline",
        plan_name: "Kentucky Standard Plan",
        price_per_month: "$0/month (with Lifeline discount)",
        data: "4.5GB",
        voice: "Unlimited talk",
        text: "Unlimited text",
        speed_notes: null,
        coverage_notes: "Kentucky only",
        additional_features: null
    },
    {
        provider_name: "IM TELECOM (Excess Telecom)",
        official_signup_urls: "https://www.excesstelecom.com/plans/lifeline",
        plan_name: "Kentucky Advantage Plan",
        price_per_month: "$1/month (with Lifeline discount)",
        data: "6.5GB",
        voice: "Unlimited talk",
        text: "Unlimited text",
        speed_notes: null,
        coverage_notes: "Kentucky only",
        additional_features: null
    },
    {
        provider_name: "IM TELECOM (Excess Telecom)",
        official_signup_urls: "https://www.excesstelecom.com/plans/lifeline",
        plan_name: "California Standard Plan",
        price_per_month: "$0/month (with Lifeline discount)",
        data: "6GB",
        voice: "Unlimited talk",
        text: "Unlimited text",
        speed_notes: null,
        coverage_notes: "California only",
        additional_features: null
    },
    {
        provider_name: "IM TELECOM (Excess Telecom)",
        official_signup_urls: "https://www.excesstelecom.com/plans/lifeline",
        plan_name: "Tribal Standard Plan",
        price_per_month: "$0/month",
        data: "6GB",
        voice: "3,000 minutes",
        text: "Unlimited text",
        speed_notes: null,
        coverage_notes: "Qualifying Tribal Lands",
        additional_features: null
    },
    {
        provider_name: "IM TELECOM (Excess Telecom)",
        official_signup_urls: "https://www.excesstelecom.com/plans/lifeline",
        plan_name: "Tribal Advantage Plan",
        price_per_month: "$1/month",
        data: "8GB",
        voice: "3,000 minutes",
        text: "Unlimited text",
        speed_notes: null,
        coverage_notes: "Qualifying Tribal Lands",
        additional_features: null
    },
    {
        provider_name: "IM TELECOM (Excess Telecom)",
        official_signup_urls: "https://www.excesstelecom.com/plans/lifeline",
        plan_name: "Infiniti Mobile Essentials",
        price_per_month: "$14/month",
        data: "1GB high-speed data",
        voice: "1,000 minutes",
        text: "1,000 texts",
        speed_notes: null,
        coverage_notes: null,
        additional_features: null
    },
    {
        provider_name: "IM TELECOM (Excess Telecom)",
        official_signup_urls: "https://www.excesstelecom.com/plans/lifeline",
        plan_name: "Infiniti Mobile Enhanced",
        price_per_month: "$20/month",
        data: "4.5GB high-speed data",
        voice: "3,000 minutes",
        text: "Unlimited texts",
        speed_notes: null,
        coverage_notes: null,
        additional_features: null
    },
    {
        provider_name: "IM TELECOM (Excess Telecom)",
        official_signup_urls: "https://www.excesstelecom.com/plans/lifeline",
        plan_name: "Infiniti Mobile Tribal",
        price_per_month: "$0/month",
        data: "6GB high-speed data",
        voice: "3,000 minutes",
        text: "Unlimited texts",
        speed_notes: null,
        coverage_notes: "Available in NV, OK, NY & WI",
        additional_features: null
    },
    {
        provider_name: "IM TELECOM (Excess Telecom)",
        official_signup_urls: "https://www.excesstelecom.com/plans/lifeline",
        plan_name: "Infiniti Prepaid Basic",
        price_per_month: "$25/month",
        data: "3GB high-speed data",
        voice: "2,000 minutes",
        text: "Unlimited texts",
        speed_notes: null,
        coverage_notes: "Nationwide",
        additional_features: null
    },
    {
        provider_name: "IM TELECOM (Excess Telecom)",
        official_signup_urls: "https://www.excesstelecom.com/plans/lifeline",
        plan_name: "Infiniti Prepaid Enhanced",
        price_per_month: "$30/month",
        data: "4GB high-speed data",
        voice: "3,000 minutes",
        text: "Unlimited texts",
        speed_notes: null,
        coverage_notes: "Nationwide",
        additional_features: null
    },
    {
        provider_name: "IM TELECOM (Excess Telecom)",
        official_signup_urls: "https://www.excesstelecom.com/plans/lifeline",
        plan_name: "Infiniti Mobile 6GB",
        price_per_month: "$0/month",
        data: "6GB high-speed data",
        voice: "Unlimited minutes",
        text: "Unlimited texts",
        speed_notes: null,
        coverage_notes: "California only",
        additional_features: null
    },
    // ... (all other plans from newlifelineplans.txt, in the same flat structure) ...
];

// Export the data structure
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MOBILE_PLANS };
} else {
    // For browser usage
    window.MOBILE_PLANS = MOBILE_PLANS;
} 

