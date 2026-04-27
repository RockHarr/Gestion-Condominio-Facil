1. **Improve UX and Accessibility in Amenities and Reservation Types Managers**
   - In `components/AmenitiesManager.tsx` and `components/ReservationTypesManager.tsx`, the icon-only buttons for actions like Edit, Delete, Back, and Close Modal lack `aria-label`, `type="button"`, `title`, and proper keyboard focus indicators. They also have an opacity transition that hides them from keyboard-only users.
   - I will add `type="button"`, descriptive `aria-label`, `title`, and `focus:outline-none focus:ring-2` styles to these buttons.
   - I will add `focus-within:opacity-100` to the action button container to ensure they become visible when a user tabs into them.
2. **Complete pre-commit steps**
   - Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
3. **Submit the change**
   - Once formatting, linting, and tests pass, I will submit the pull request.
