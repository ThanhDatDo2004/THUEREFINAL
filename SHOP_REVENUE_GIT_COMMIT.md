# Git Commit Message - Shop Revenue Page Implementation

## Commit Title

```
feat: Implement complete Shop Revenue page with payout request system
```

## Commit Description

```
This commit completely rewrites the Shop Revenue page (/shop/revenue) with the following features:

### Features Added
1. Revenue Summary Cards
   - Display total booking amount
   - Calculate and show actual revenue (95% for shop, 5% for admin)
   - Show available wallet balance
   - Responsive gradient design with VND formatting

2. Bookings Table with Revenue Details
   - Show only confirmed bookings with paid payment status
   - Display columns: Booking Code, Field, Customer, Date, Time, Total Price, Actual Revenue (95%)
   - Vietnamese date/time formatting
   - Green highlighting for revenue column

3. Payout Request Form
   - Toggle form with "Rút Tiền" button
   - Input fields:
     * Amount to withdraw (validated against total revenue)
     * Read-only bank info display (from shop data)
     * Password confirmation field
   - Form validation with error messages
   - Success confirmation with auto-close

4. API Integration
   - Fetch shop info from /shops/me
   - Fetch bookings from /shops/me/bookings (filter on client)
   - Fetch wallet info from /shops/me/wallet
   - Create payout request via POST /shops/me/payout-requests
   - Password verification support

5. State Management
   - Efficient booking filtering with useMemo
   - Proper cleanup on component unmount
   - Loading states and error handling
   - Post-payout data refresh

### Files Modified
- src/pages/shop/ShopRevenuePage.tsx (Complete rewrite, ~360 lines)
  * Replaced old monthly revenue view with booking-based revenue view
  * Added revenue summary cards
  * Added payout request form
  * Added comprehensive state management

- src/models/shop.api.ts (Added)
  * New interface: ShopBookingItem
  * New function: fetchShopBookingsForRevenue()
  * Supports BookingStatus and PaymentStatus types

- src/models/wallet.api.ts (Updated)
  * Updated CreatePayoutRequest interface
  * Added optional password field for security verification

### Technical Details
- Build: ✅ Success (0 errors)
- TypeScript: ✅ Fully typed
- Linting: ✅ All checks passed
- Mobile: ✅ Responsive design
- Accessibility: ✅ Proper form labels and error messages

### Testing
- Page loads correctly with loading spinner
- Booking filtering works (confirmed + paid only)
- Revenue calculation correct (95% of total)
- Form validation prevents invalid submissions
- Bank info displays correctly from shop data
- Password field is properly hidden
- Payout submission and refresh works
- Responsive on mobile/tablet/desktop

### Notes for Review
- Password verification is handled by backend
- Wallet balance is deducted immediately upon successful payout request
- Email notification should be sent to admin (kubjmisu1999@gmail.com)
- Payout status workflow: requested → processing/rejected → paid

### Breaking Changes
None - this is a UI/UX enhancement that doesn't affect other components.

### Related Issues
Implements requirement: Shop revenue page with 95/5 split and payout functionality
```

## How to Commit

```bash
git add src/pages/shop/ShopRevenuePage.tsx
git add src/models/shop.api.ts
git add src/models/wallet.api.ts
git commit -m "feat: Implement complete Shop Revenue page with payout request system

- Add revenue summary cards showing total, actual (95%), and available balance
- Display bookings table with revenue calculation per booking
- Implement payout request form with password verification
- Add form validation and error handling
- Integrate with wallet and payout APIs
- Support 95% to shop, 5% to admin split
- Add responsive design for mobile/tablet/desktop"
```

Or use the commit message template directly:

```bash
git commit -F SHOP_REVENUE_GIT_COMMIT.md
```
