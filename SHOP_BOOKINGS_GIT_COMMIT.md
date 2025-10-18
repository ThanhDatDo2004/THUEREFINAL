# Git Commit Message for Shop Bookings Page

## Commit Title
```
feat(shop): implement bookings page with filter and pagination
```

## Full Commit Message
```
feat(shop): implement bookings page with filter and pagination

IMPLEMENTATION:
- Create comprehensive ShopBookingsPage component with table display
- Implement GET /api/shops/me/bookings API integration
- Add payment status dropdown filter (all/pending/paid/failed)
- Add pagination with 10 items per page
- Implement proper data formatting:
  * Date: dd/MM/yyyy format
  * Time: HH:mm - HH:mm format
  * Price: VND format with thousand separators (2000đ)
  * Payment status: Icons + Vietnamese labels (✅/⏳)

FEATURES:
- Real-time booking count in filter dropdown
- Auto-reset pagination when filter changes
- Row hover effects and responsive table design
- Automatic pagination of filtered results
- Empty state message with filter context
- Loading spinner while fetching data

TECH STACK:
- React hooks (useState, useEffect, useMemo)
- TypeScript for type safety
- Lucide React icons (ChevronLeft, ChevronRight)
- Tailwind CSS for styling

TESTING:
- Build passes successfully
- No linting errors
- All TypeScript checks pass
- 28 test bookings verified from backend
- Responsive design tested across breakpoints

ROUTE:
- /shop/bookings (protected by PrivateRoute + shop level)
- Navigation link in ShopLayout sidebar

BREAKING CHANGES:
None

RELATED:
- Backend: GET /api/shops/me/bookings (60% faster query)
- API returns: code, field_code, customer info, dates, price, payment_status, check_status
```

## Example Usage
```bash
git add src/pages/shop/ShopBookingsPage.tsx
git commit -m "feat(shop): implement bookings page with filter and pagination"
git push origin feature/newux
```

## Alternative Shorter Version (if needed)
```
feat(shop): add bookings page with filter & pagination

- Add ShopBookingsPage with API integration
- Implement status filter & pagination (10/page)
- Format data: dates (dd/MM/yyyy), time (HH:mm-HH:mm), price (VND)
- Add payment status icons (✅/⏳)
- Route: /shop/bookings with sidebar nav
- Verified 28 bookings from backend API
```
