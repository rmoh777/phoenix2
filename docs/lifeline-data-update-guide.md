# Lifeline Data Update Guide

## Overview

This document describes the changes made to update the mobile plans data source to focus on Lifeline providers, and provides guidelines for future data updates without breaking the system.

## Changes Made

We updated the system to use Lifeline provider data by making these key changes:

1. **Data Structure Update (`js/mobile-plans.js`)**
   - Replaced the previous plan data with Lifeline-specific plans
   - Standardized the data structure with required fields: `id`, `name`, `carrier`, `price`, `data`, `features`, and `hotspot`

2. **AI Prompt Update (`js/interview-new.js`)**
   - Modified the `buildPrompt()` method to focus on Lifeline program expertise
   - Added specific focus areas: free/low-cost plans, Lifeline benefits, government assistance, and basic connectivity

3. **UI Enhancements (`js/interview-new.js`)**
   - Added visual indicator for free plans: `✓ FREE with Lifeline`
   - Updated button text from "Full Plan Details" to "Check Eligibility & Apply"

## Guidelines for Future Data Updates

When updating the data source in the future, follow these steps to ensure compatibility:

### 1. Maintain the Data Structure

The system expects each plan to have the following structure:

```javascript
{
    id: Number,             // Unique identifier for the plan
    name: String,           // Name of the plan
    carrier: String,        // Mobile carrier offering the plan
    price: Number,          // Monthly price in USD (use 0 for free plans)
    data: String,           // Data allowance description
    features: Array,        // Array of features included in the plan
    hotspot: String         // Hotspot capability description
}
```

**Critical requirements:**
- Each plan **MUST** have a unique `id` value
- The `price` field **MUST** be a number (not a string with "$" or other formatting)
- The `features` field **MUST** be an array of strings

### 2. Update Process

Follow this process to safely update the plan data:

1. **Create a new branch** for your changes
2. **Make a backup** of the existing data before modifying
3. **Validate the new data** structure before committing:
   - Ensure all required fields are present
   - Check that the data types are correct
   - Verify that all plans have unique IDs
4. **Test the changes** before merging:
   - Check that plan recommendations work correctly
   - Verify that UI displays properly
   - Test with different user inputs

### 3. Updating the AI Prompt

If you need to update the AI prompt to match your new data:

1. Locate the `buildPrompt()` method in `js/interview-new.js`
2. Modify the prompt text to focus on relevant aspects of your new data
3. Ensure the prompt still returns data in the expected format: `"1:Best,7:Great,12:Good"`

### 4. Troubleshooting

If you encounter issues after updating the data:

1. **Plan rendering issues:** Check that all plans have the required fields and proper data types
2. **No recommendations:** Verify that the AI prompt is formatted correctly and includes all necessary context
3. **Missing features:** Ensure that the `features` field is an array, not a string
4. **Price display issues:** Confirm that the `price` field is a number, not a string

### 5. Rollback Plan

If something breaks despite following these guidelines:

1. Revert to the previous version of `js/mobile-plans.js` from git history
2. If you also changed the prompt or UI elements, revert those changes as well
3. Deploy the reverted files

## Example: Adding a New Plan

Here's an example of how to add a new plan to the existing data:

```javascript
// Add to the MOBILE_PLANS array in js/mobile-plans.js
{
    id: 15,  // Use the next available ID number
    name: "New Lifeline Plan",
    carrier: "NEW PROVIDER NAME",
    price: 5,  // Monthly price as a number
    data: "5GB",
    features: ["Unlimited talk", "Unlimited text", "Special feature"],
    hotspot: "Included"
}
```

## Conclusion

By following these guidelines, you can safely update the plan data source without impacting the overall system functionality. The key is to maintain the expected data structure and ensure all required fields are present with the correct data types. 