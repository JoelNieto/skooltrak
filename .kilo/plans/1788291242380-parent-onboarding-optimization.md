# Parent Onboarding Optimization Plan

## Problem
In the parent onboarding flow, after registering and providing personal information (first name, last name, email), parents are asked to provide the same information again in the verify-parent step when linking their account to a child using an enrollment code.

## Root Cause
The verify-parent component does not utilize the already authenticated user's information from the Auth service and instead presents empty form fields for information that was already provided during registration.

## Solution
Modify the verify-parent component to:
1. Pre-populate form fields with the user's existing information from the Auth service
2. Allow users to edit pre-populated fields if needed
3. Keep requesting only genuinely new information (enrollmentCode, documentId, phone, relationship)

## Implementation Steps
1. In verify-parent.ts:
   - Import Auth service (already imported)
   - In constructor or afterRenderEffect, load user data from auth service
   - Pre-populate the form model with user's firstName, lastName (as fatherName), and email
   - Keep enrollmentCode, documentId, phone, and relationship as empty/default values
   - Update form validation to handle pre-populated values

2. Template updates:
   - Keep the same form structure
   - Form fields will automatically show pre-populated values via Angular forms
   - No template changes needed if using [formField] binding correctly

## Files to Modify
- apps/web-dashboard/src/app/onboarding/verify-parent.ts

## Validation Approach
- Verify that pre-populated fields show correct user information
- Verify that users can still edit pre-populated fields
- Verify that form submission works with both pre-populated and edited values
- Verify that the link-child API call receives all required fields
- Test with both new and existing user data

## Alternative Considered
- Eliminating the request for redundant information entirely
- Rejected because: the link-child API might require these fields for verification/update purposes, and pre-populating is safer and provides better UX

## Risk Assessment
- Low risk: Only changes form initialization, not submission logic
- Backward compatible: Existing API contract unchanged
- Improves user experience by reducing redundant data entry