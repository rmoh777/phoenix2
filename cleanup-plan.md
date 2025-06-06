# Interview Page Cleanup Plan

## Current Issues Identified

1. **Duplicate Interview Pages**:
   - `interview.html` (older version)
   - `interview-new.html` (current version)

2. **Duplicate JavaScript Files**:
   - `js/interview.js` (older version)
   - `js/interview-new.js` (current version)

3. **Inconsistent Navigation**:
   - Main navigation and link in hero section should consistently point to the same interview page
   - Fixed: Hero section "Find Lifeline Plans" button now points to `interview-new.html`

## Recommended Actions

### Immediate Actions (Completed)
- ✅ Update hero section link on homepage to point to `interview-new.html`

### Short-term Actions (Next Sprint)
1. Remove unused `interview.html` file
2. Remove unused `js/interview.js` file
3. Update architecture documentation to reflect current state

### Long-term Actions (Future Consideration)
1. Rename `interview-new.html` to `interview.html` for cleaner URLs
2. Rename `js/interview-new.js` to `js/interview.js` for consistency
3. Update all references accordingly

## Benefits of Cleanup
- Reduced maintenance burden
- Elimination of confusion when making changes
- More consistent user experience
- Cleaner codebase
- Better documentation

## Implementation Timeline
- **Phase 1**: Fix immediate navigation inconsistency (current PR)
- **Phase 2**: Remove unused files (next sprint)
- **Phase 3**: Consider file renaming for cleaner structure (future roadmap item) 