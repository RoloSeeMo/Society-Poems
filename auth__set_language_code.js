// auth__set_language_code.js
import { auth } from 'firebase-config.js'; // Import auth from centralized config

auth.languageCode = 'it';

// To apply the default browser preference instead of explicitly setting it.
// auth.useDeviceLanguage();