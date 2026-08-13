WETrendingTeam — GitHub Ready Production Build
================================================

This package is the production build for the main WETrendingTeam website.

Included:
- Existing campaign website and navigation
- New compact Community page
- Community Features / Polls / Results / Discussions sections
- Dean + Moth Red Flag meters
- Anonymous Firebase community sign-in with optional fan name
- Replies to original comments AND replies to specific replies
- Updated community rules
- YOU MANIAC release countdown set for 4:00 PM Thailand time on 13 August 2026
- Official GMMTV announcement link
- Existing Firebase, FCM, admin, and site files

GitHub upload:
1. Extract this package.
2. Upload the files/folders inside the extracted folder to the root of the existing GitHub Pages repository.
3. Preserve the folder structure, especially /images, /backend, and /functions.
4. Do not rename index.html.
5. Publish the included firestore.rules in Firebase if your current Firestore rules do not already contain the community rules.
6. Firebase Authentication must have Anonymous sign-in enabled and the live GitHub Pages domain must be an authorized domain.

Important:
- This build is intended to replace/update the current website files as a complete production build.
- Do not delete your Firebase project or create a new one just for this upload.
- If GitHub Pages is already connected to the repository, pushing these files will publish the updated site after GitHub finishes the deployment.
