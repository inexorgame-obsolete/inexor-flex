/**
 * @module path
 */

const os = require('os');
const path = require('path');
const process = require('process');
const env = process.env;

let homeDir = os.homedir();
let tmpDir = os.tmpdir();
let userName = os.userInfo().username;
let appName = 'inexor';

let appDir = process.env.PWD;
if (process.platform == 'win32') {
  appDir = process.cwd()
}

/**
 * Returns the XDG location (localized) from the environment variable.
 * @param envVar The name of the environment variable.
 * @param defaultValue The default value to use if the environment variable doesn't exist.
 * @returns The location.-
 */
function getXdgLocationFromEnvironmentVariable(envVar, defaultValue) {
  if (env.hasOwnProperty(envVar)) {
    return env[envVar].replace('$HOME', homeDir);
  } else {
    return defaultValue;
  }
}

switch(os.platform()) {
  case 'linux':
    module.exports = {

      // Returns the user's desktop directory. This is a generic value. On
      // systems with no concept of a desktop.
      'desktopLocation': getXdgLocationFromEnvironmentVariable('XDG_DESKTOP_DIR', path.join(homeDir, 'Desktop')),

      // Returns the directory containing user document files. This is a
      // generic value. The returned path is never empty.
      'documentsLocation': getXdgLocationFromEnvironmentVariable('XDG_DOCUMENTS_DIR', path.join(homeDir, 'Documents')),

      // Returns the directory containing user's fonts. This is a generic
      // value. Note that installing fonts may require additional,
      // platform-specific operations.
      'fontsLocation': path.join(homeDir, '.fonts'),

      // Returns the directory containing the user applications (either
      // executables, application bundles, or shortcuts to them). This is a
      // generic value. Note that installing applications may require
      // additional, platform-specific operations. Files, folders or shortcuts
      // in this directory are platform-specific.
      'applicationsLocation': [
        path.join(homeDir, '.local', 'share', 'applications'),
        '/usr/local/share/applications',
        '/usr/share/applications'
      ],

      // Returns the directory containing the user's music or other audio
      // files. This is a generic value. If no directory specific for
      // music files exists, a sensible fallback for storing user documents
      // is returned.
      'musicLocation': getXdgLocationFromEnvironmentVariable('XDG_MUSIC_DIR', path.join(homeDir, 'Music')),

      // Returns the directory containing the user's movies and videos. This
      // is a generic value. If no directory specific for movie files exists,
      // a sensible fallback for storing user documents is returned.
      'moviesLocation': getXdgLocationFromEnvironmentVariable('XDG_VIDEOS_DIR', path.join(homeDir, 'Videos')),

      // Returns the directory containing the user's movies and videos. This
      // is a generic value. If no directory specific for movie files exists,
      // a sensible fallback for storing user documents is returned.
      'picturesLocation': getXdgLocationFromEnvironmentVariable('XDG_PICTURES_DIR', path.join(homeDir, 'Pictures')),

      // Returns a directory where temporary files can be stored. The returned
      // value might be application-specific, shared among other applications
      // for this user, or even system-wide. The returned path is never empty.
      'tempLocation': tmpDir,

      // Returns the user's home directory (the same as QDir::homePath()). On
      // Unix systems, this is equal to the HOME environment variable. This
      // value might be generic or application-specific, but the returned path
      // is never empty.
      'homeLocation': homeDir,

      // Returns a directory location where user-specific non-essential
      // (cached) data should be written. This is an application-specific
      // directory. The returned path is never empty.
      'cacheLocation': path.join(homeDir, '.cache', appName),

      // Returns a directory location where user-specific non-essential
      // (cached) data, shared across applications, should be written.
      // This is a generic value. Note that the returned path may be
      // empty if the system has no concept of shared cache.
      'genericDataLocation': [
        path.join(homeDir, '.local', 'share'),
        '/usr/local/share',
        '/usr/share'
      ],

      // Returns a directory location where persistent data shared across
      // applications can be stored. This is a generic value. The returned
      // path is never empty.
      'runtimeLocation': path.join('/run/user', userName),

      // Returns a directory location where runtime communication files
      // should be written, like Unix local sockets. This is a generic value.
      // The returned path may be empty on some systems.
      'configLocation': [
        path.join(homeDir, '.config'),
        '/etc/xdg'
      ],

      // Returns a directory location where user-specific configuration files
      // should be written. This may be either a generic value or
      // application-specific, and the returned path is never empty.
      'genericConfigLocation': [
        path.join(homeDir, '.config'),
        '/etc/xdg'
      ],

      // Returns a directory for user's downloaded files. This is a generic
      // value. If no directory specific for downloads exists, a sensible
      // fallback for storing user documents is returned.
      'downloadLocation': path.join(homeDir, 'Downloads'),

      // Returns a directory location where user-specific configuration files
      // shared between multiple applications should be written. This is a
      // generic value and the returned path is never empty.
      'genericCacheLocation': path.join(homeDir, '.cache'),

      // Returns a directory location where persistent application data can be
      // stored. This is an application-specific directory. To obtain a path
      // to store data to be shared with other applications, use
      // QStandardPaths::GenericDataLocation. The returned path is never empty.
      // On the Windows operating system, this returns the roaming path. This
      // enum value was added in Qt 5.4.
      'appDataLocation': [
        path.join(homeDir, '.local', 'share', appName),
        path.join('/usr/local/share', appName),
        path.join('/usr/share', appName),
        // The following deviates from qt standard path
        // and allows a portable distribution
        appDir
      ],

      // Returns the local settings path on the Windows operating system. On
      // all other platforms, it returns the same value as AppDataLocation.
      // This enum value was added in Qt 5.4.
      'appLocalDataLocation': [
        path.join(homeDir, '.local', 'share', appName),
        path.join('/usr/local/share', appName),
        path.join('/usr/share', appName),
        // The following deviates from qt standard path
        // and allows a portable distribution
        appDir
      ],

      // Returns a directory location where user-specific configuration files
      // should be written. This is an application-specific directory, and the
      // returned path is never empty. This enum value was added in Qt 5.5.
      'appConfigLocation': [
        path.join(homeDir, '.config', appName),
        path.join('/etc/xdg', appName),
        // The following deviates from qt standard path
        // and allows a portable distribution
        path.join(appDir, 'config')
      ]
    };
    break;

  case 'win32':
    module.exports = {

      'desktopLocation': path.join(homeDir, 'Desktop'),
      'documentsLocation': path.join(homeDir, 'Documents'),
      'fontsLocation': 'C:\\Windows\\Fonts',
      'applicationsLocation': path.join(homeDir, 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu', 'Programs'),
      'musicLocation': path.join(homeDir, 'Music'),
      'moviesLocation': path.join(homeDir, 'Videos'),
      'picturesLocation': path.join(homeDir, 'Pictures'),
      'tempLocation': tmpDir, // path.join(homeDir, 'AppData', 'Local', 'Temp'),
      'homeLocation': homeDir,
      'cacheLocation': path.join(homeDir, 'AppData', 'Local', appName, 'cache'),
      'genericDataLocation': [
        path.join(homeDir, 'AppData', 'Local'),
        'C:\\ProgramData',
        appDir,
        path.join(appDir, 'data'),
      ],
      'runtimeLocation': homeDir,
      'configLocation': [
        path.join(homeDir, 'AppData', 'Local', appName),
        path.join('C:\\ProgramData', appName),
      ],
      'genericConfigLocation': [
        path.join(homeDir, 'AppData', 'Local'),
        'C:\\ProgramData'
      ],
      'downloadLocation': path.join(homeDir, 'Documents'),
      'genericCacheLocation': path.join(homeDir, 'AppData', 'Local', 'cache'),
      'appDataLocation': [
        path.join(homeDir, 'Documents', 'My Games', appName),
        path.join(homeDir, 'AppData', 'Roaming', appName),
        path.join('C:\\ProgramData', appName),
        appDir,
        path.join(appDir, 'data')
      ],
      'appLocalDataLocation': [
        path.join(homeDir, 'AppData', 'Local', appName),
        path.join('C:\\ProgramData', appName),
        appDir,
        path.join(appDir, 'data')
      ],
      'appConfigLocation': [
        path.join(homeDir, 'AppData', 'Local', appName),
        path.join('C:\\ProgramData', appName, 'config'),
        // The following deviates from qt standard path
        // and allows a portable distribution
        path.join(appDir, 'config')
      ]
    };
    break;

  case 'darwin':
    module.exports = {
      'desktopLocation': path.join(homeDir, 'Desktop'),
      'documentsLocation': path.join(homeDir, 'Documents'),
      'fontsLocation': '/System/Library/Fonts',
      'applicationsLocation': '/Applications',
      'musicLocation': path.join(homeDir, 'Music'),
      'moviesLocation': path.join(homeDir, 'Videos'),
      'picturesLocation': path.join(homeDir, 'Pictures'),
      'tempLocation': tmpDir,
      'homeLocation': homeDir,
      'cacheLocation': [
        path.join(homeDir, 'Library', 'Caches', appName),
        path.join('/Library/Caches', appName)
      ],
      'genericDataLocation': [
        path.join(homeDir, 'Library', 'Application Support'),
        '/Library/Application Support'
      ],
      'runtimeLocation': path.join(homeDir, 'Library', 'Application Support'),
      'configLocation': path.join(homeDir, 'Library', 'Preferences'),
      'genericConfigLocation': path.join(homeDir, 'Library', 'Preferences'),
      'downloadLocation': path.join(homeDir, 'Downloads'),
      'genericCacheLocation': [
        path.join(homeDir, 'Library', 'Caches'),
        '/Library/Caches'
      ],
      'appDataLocation': [
        path.join(homeDir, 'Library', 'Application Support', appName),
        path.join('/Library/Application Support', appName),
        path.resolve(path.join(appDir, '..', 'Resources'))
      ],
      'appLocalDataLocation': [
        path.join(homeDir, 'Library', 'Application Support', appName),
        path.join('/Library/Application Support', appName),
        path.resolve(path.join(appDir, '..', 'Resources'))
      ],
      'appConfigLocation': [
        path.join(homeDir, 'Library', 'Preferences', appName)
      ],
    };
    break;

  default:
    module.exports = {};
    break;

}
