# Security Specification: Campus Lost & Found Portal

## 1. Data Invariants
1. **User Identity Integrity**: A user can only write or modify their own profile (`/users/{userId}` where `userId == request.auth.uid`). Users cannot grant themselves `admin` role or alter administrative permissions.
2. **Item Ownership & Mutation**: An item can only be created by an authenticated user matching `reportedBy == request.auth.uid`. Regular users can only edit items they reported, or an admin can update item status (`open`, `claimed`, `returned`, `closed`).
3. **Claim Integrity**: Claims can only be submitted by authenticated users for valid items with `claimantId == request.auth.uid`. Only admins or the assigned reviewer can approve, reject, or mark claims as returned.
4. **Immutability of Audit Fields**: `createdAt`, `reportedBy`, `claimantId`, `itemId` must not be tampered with or modified after creation.
5. **Admin Access Control**: Admin privileges require presence in `/admins/$(request.auth.uid)` or verified bootstrap admin email (`nr3428614@gmail.com`).

---

## 2. The Dirty Dozen Attack Payloads

1. **Payload 1 (Privilege Escalation on User Profile)**:
   - Attempt: Non-admin student attempts to create or update profile with `role: "admin"`.
   - Expected: PERMISSION_DENIED.
2. **Payload 2 (Spoofed Reporter UID in Item)**:
   - Attempt: User `attacker-123` submits item with `reportedBy: "victim-456"`.
   - Expected: PERMISSION_DENIED.
3. **Payload 3 (Oversized Description - Denial of Wallet)**:
   - Attempt: Submitting item description larger than 2,000 characters or 100KB payload.
   - Expected: PERMISSION_DENIED.
4. **Payload 4 (Unauthenticated Read of Private Profiles)**:
   - Attempt: Unauthenticated request to read `/users/{userId}`.
   - Expected: PERMISSION_DENIED.
5. **Payload 5 (Cross-User Claim Update - Hijack Approval)**:
   - Attempt: Student `student-abc` attempts to update claim `status: "approved"` without admin privileges.
   - Expected: PERMISSION_DENIED.
6. **Payload 6 (Claimant Identity Spoofing)**:
   - Attempt: Submitting a claim with `claimantId: "innocent-student-id"` when logged in as `attacker`.
   - Expected: PERMISSION_DENIED.
7. **Payload 7 (Path Variable Poisoning)**:
   - Attempt: Document ID injection with special control characters or excessive path length (e.g. `/items/..%2F..%2Fadmin`).
   - Expected: PERMISSION_DENIED.
8. **Payload 8 (Terminal State Lock Bypass)**:
   - Attempt: Modifying an item that has reached the `returned` terminal state back to `open` without admin override.
   - Expected: PERMISSION_DENIED.
9. **Payload 9 (Shadow Field Injection)**:
   - Attempt: Item payload contains undeclared field `__shadow_is_verified: true` to bypass verification checks.
   - Expected: PERMISSION_DENIED.
10. **Payload 10 (Unauthorized Deletion of Item)**:
    - Attempt: Random authenticated student attempts to delete an item posted by someone else.
    - Expected: PERMISSION_DENIED.
11. **Payload 11 (Claim Snooping / Privacy Breach)**:
    - Attempt: Student queries all claims across the campus to inspect private proof details and photos of other students.
    - Expected: PERMISSION_DENIED (Students can only list their own claims; admins can list all).
12. **Payload 12 (Admin Record Self-Creation)**:
    - Attempt: Non-admin writes directly into `/admins/{theirUid}`.
    - Expected: PERMISSION_DENIED.

---

## 3. Test Runner Specification (`firestore.rules.test.ts`)
The security test runner verifies all 12 attack vectors against the security rules to ensure that every unauthorized write, injection, and privilege escalation returns `PERMISSION_DENIED`.
