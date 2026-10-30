# Public Forms Integration

The public registration page at `/forms` displays forms created in the CSE Society admin panel. It is intentionally accessible without login.

- Cards are loaded from the dashboard's public `GET /api/forms` endpoint; the page does not display hard-coded sample forms.
- The admin form has separate URL fields: **Registration link** is required; **Document link** is optional.
- **Register now** opens the dashboard's `/forms/{id}` route and redirects to the required registration URL.
- The document icon is shown only when a document link was added; it opens the document through the guarded `/forms/{id}?document=1` route.
- Expired forms remain visible as closed and are blocked by the dashboard form-open route.
- Apply `CSE Society/shuffal/supabase/migrations/035_add_registration_document_url.sql` to add the optional document URL column.
- During local development, run the dashboard at `http://localhost:3000`; the Vite dev server proxies `/api/forms` there.
- When deploying the public site separately from the dashboard, set `VITE_FORMS_DASHBOARD_URL` to the dashboard's public origin at build time.

# Registration Forms

## Overview

The Forms feature provides a public page for browsing registration forms and an admin-panel workflow for creating and managing them. Each form is represented by a shareable card with its own link.

## Public Forms Page

- Display registration forms as cards.
- Sort cards in last-in, first-out order: the most recently created form appears first.
- Show active forms in colour.
- Show expired forms in a muted or uncoloured style.
- Each card displays the form name and end date.
- Each card includes a share action that shares that form's unique link.
- Clicking an active card opens its configured resource link.

## Form Expiration

- A form is expired once its end date has passed.
- Expired forms must not open from the public Forms page. Clicking an expired card displays a **“Form closed”** pop-up.
- A form's unique, shared link must also enforce expiration; it must not allow visitors to bypass the closed status or open the resource after expiration.
- Expired forms remain accessible to admins from the admin dashboard. This admin-only access is the exception to the public expiration restriction.
- Expiration must be enforced wherever a form can be opened, not only indicated by the card's appearance.

## Admin Management

- Admins and users with any of these roles can create forms:
  - `general_secretary` (General Secretary)
  - `technical_secretary` (Technical Secretary)
  - `cultural_secretary` (Cultural Secretary)
- Authorized users can manually create a form from the admin panel by providing:
  - **Form name**
  - **End date**
  - **Resource link** — the destination opened when an active card is selected
- Once created, the form appears on the public Forms page in the appropriate newest-first position.
- Only admins can extend or change a form's end date.
- Only admins can delete a form from the dashboard.

## Form Links and Sharing

- Each form has a separate, shareable link to that form.
- The card's share action shares its form-specific link, rather than only the general Forms page link.
- Opening a form-specific link must follow the same expiration and access rules as selecting its public card.
- Admins can still open expired forms from the admin dashboard; public visitors cannot.

## Acceptance Criteria

1. Creating a form with a name, end date, and resource link makes it appear as a card.
2. Newly created forms appear before older forms.
3. Before expiration, a form card is coloured and opens its resource link.
4. After expiration, a form card is muted; selecting it shows **“Form closed”** and does not open its resource.
5. A shared form-specific link does not let a public visitor open an expired form.
6. An admin can open an expired form from the admin dashboard.
7. Admins and General, Technical, and Cultural Secretaries can create forms.
8. Only admins can extend or change form end dates and delete forms.
9. Other non-admin users cannot create or delete forms.
10. The share action provides a link specific to the selected form.
