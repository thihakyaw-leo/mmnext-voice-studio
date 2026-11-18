# Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Owner-Isolated Workspace**: `/users/{userId}` can only be read, created, updated, or deleted by the authenticated, email-verified user whose `request.auth.uid == userId`.
2. **Master Gate on Subcollections**: Every subcollection document under `/users/{userId}/favorites/{voiceName}`, `/users/{userId}/customNames/{voiceName}`, and `/users/{userId}/castingHistory/{castingId}` requires that the parent `/users/{userId}` document exists (or `existsAfter` during atomic batch initialization) and is owned by `request.auth.uid`.
3. **Immutable Ownership & Timestamps**: `userId` and `createdAt` can never be modified after creation. `createdAt` and `updatedAt` must strictly equal `request.time`.
4. **Path/Payload Synchronization**: For `favorites/{voiceName}` and `customNames/{voiceName}`, `incoming().voiceName` must strictly match the `{voiceName}` path parameter.
5. **No Ghost Fields or Unbounded Payloads**: Every `create` checks `keys().hasAll(...)` and `keys().hasOnly(...)`; every `update` checks `affectedKeys().hasOnly(...)` inside action-based gates and validates the resulting document via `isValid[Entity]()`.
6. **Verified Identity Only**: All read/write operations require `request.auth != null && request.auth.token.email_verified == true`.

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return `PERMISSION_DENIED`)

1. **Unauthenticated Read/Write**: Read or write `/users/alice` with `auth = null`.
2. **Unverified Email Spoof**: Write `/users/alice` with `auth = { uid: 'alice', token: { email_verified: false } }`.
3. **Cross-Tenant Ownership Spoof (Create)**: User `bob` tries to create `/users/bob/favorites/Zephyr` with `{ userId: 'alice', voiceName: 'Zephyr', createdAt: serverTimestamp() }`.
4. **Cross-Tenant Path Access (Get/List)**: User `bob` tries to `get` `/users/alice` or `list` `/users/alice/favorites` (or `list` without matching `userId`).
5. **Shadow / Ghost Field Injection (Create)**: User `alice` creates `/users/alice` including `{ ..., isAdmin: true }`.
6. **Shadow / Ghost Field Injection (Update)**: User `alice` updates `/users/alice` adding `{ role: 'superadmin', updatedAt: serverTimestamp() }`.
7. **Immutable Field Mutation**: User `alice` updates `/users/alice` attempting to change `userId` or `createdAt`.
8. **Client-Spoofed Timestamp**: User `alice` creates `/users/alice/favorites/Zephyr` with `createdAt: new Date('2020-01-01')` instead of `request.time`.
9. **ID Poisoning (Oversized / Invalid Path ID)**: User `alice` writes `/users/alice/favorites/${'A'.repeat(200)}` or `/users/alice/favorites/bad$id`.
10. **Unbounded Array / Invalid Element Type**: User `alice` creates `/users/alice/castingHistory/c1` with `voiceNames` of length 15, or `voiceNames: [123]`.
11. **Oversized String / Resource Poisoning**: User `alice` writes `/users/alice/castingHistory/c1` with `prompt` of length 5000 (`> 1000` limit).
12. **Orphaned Subcollection Write**: User `alice` creates `/users/alice/favorites/Zephyr` when `/users/alice` parent document does not exist in the database or batch.
