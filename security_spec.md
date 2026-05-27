# Security Specification for WortHain

## 1. Data Invariants
- A vocabulary entry must be owned by a user (userId).
- Users can only read and write their own data (profiles, vocabularies, logs).
- Document IDs must be valid alphanumeric strings.
- Timestamps must be valid server timestamps.
- Vocabulary levels must be one of the specified CEFR levels.
- Status must be one of 'learning', 'mastered', or 'favorite'.

## 2. The Dirty Dozen Payloads
1. **Identity Spoofing (Create Vocabulary)**: Attempt to create a vocabulary entry with `userId` of another user.
2. **Identity Spoofing (Read Vocabulary)**: Attempt to read a vocabulary entry belonging to another user.
3. **Privilege Escalation (Update Profile)**: Attempt to change another user's `userId` or critical stats.
4. **State Shortcutting (Vocabulary Mastery)**: Directly setting `mastery` to 100 without practice logs.
5. **Resource Poisoning (Long Strings)**: Attempt to inject a 1MB string into the `term` or `notes` field.
6. **Resource Poisoning (Invalid ID)**: Using a 2KB junk string as a document ID.
7. **Orphaned Write (Practice Log)**: Creating a practice log for a vocabulary ID that doesn't exist.
8. **PII Leak (User Profile)**: An authenticated user attempting a list query to see all users' emails.
9. **Timestamp Manipulation**: Creating a document with a `createdAt` date in the future (client time vs server time).
10. **Shadow Update (Ghost Fields)**: Adding `isAdmin: true` to a vocabulary document.
11. **Type Poisoning**: Sending a number for a field expected to be a string (e.g., `term: 123`).
12. **Status Bypass**: Changing `level` to an invalid value (e.g., `X1`).

## 3. Test Runner (Mock)
A `firestore.rules.test.ts` would be used to verify these. In this environment, I will implement the rules to block these explicitly.

---

## 4. Conflict Report

| Collection | Identity Spoofing | State Shortcutting | Resource Poisoning | PII Protection |
|------------|-------------------|-------------------|-------------------|----------------|
| users      | Blocked via {userId} match | N/A | size() checks | Restricted to self |
| vocabularies| Blocked via userId check | N/A | size() checks | Restricted to self |
| practice_logs| Blocked via userId check| N/A | size() checks | Restricted to self |
