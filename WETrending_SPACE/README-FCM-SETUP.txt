# WETrending SPACE v2

This is the upgraded copy of the existing Tiny.host project.

Included:
- Intent website.html — existing app, preserved and upgraded
- manifest.json — static PWA manifest
- firebase-messaging-sw.js — service-worker foundation for future FCM

FCM is NOT activated yet.
The Firebase project configuration, VAPID key, token registration,
and background push handler should be added during the PC setup.

Deployment:
1. Keep the existing Tiny.host URL.
2. Upload/replace the files from this folder.
3. Keep manifest.json and firebase-messaging-sw.js in the same web root
   as Intent website.html.
4. Do not delete the old live version until the new copy is tested.

For the final FCM stage, we will add:
- Firebase Web SDK configuration
- getToken() with the project's VAPID key
- token storage
- background message handling
- notification click handling
