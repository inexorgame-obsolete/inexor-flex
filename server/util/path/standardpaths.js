/**
 * @module path
 */

const os = require('os');
const process = require('process');
const util = require('util');
const xdgBasedir = require('xdg-basedir');

let homeDir = os.homedir();
let tmpDir = os.tmpdir();
let userName = os.userInfo().username;
let appName = 'inexor';

let appDir = process.env.PWD;
if (process.platform == 'win32') {
  appDir = process.cwd()
}

switch(os.platform()) {
  case 'linux':
    module.exports = {

      // Returns the user's desktop directory. This is a generic value. On
      // systems with no concept of a desktop.
      'desktopLocation': util.format('%s/Desktop', homeDir),

      // Returns the directory containing user document files. This is a
      // generic value. The returned path is never empty.
      'documentsLocation': util.format('%s/Documents', homeDir),

      // Returns the directory containing user's fonts. This is a generic
      // value. Note that installing fonts may require additional,
      // platform-specific operations.
      'fontsLocation': util.format('%s/.fonts', homeDir),

      // Returns the directory containing the user applications (either
      // executables, application bundles, or shortcuts to them). This is a
      // generic value. Note that installing applications may require
      // additional, platform-specific operations. Files, folders or shortcuts
      // in this directory are platform-specific.
      'applicationsLocation': [
        util.format('%s/.local/share/applications', homeDir),
        '/usr/local/share/applications',
        '/usr/share/applications'
      ],

      // Returns the directory containing the user's music or other audio
      // files. This is a generic value. If no directory specific for
      // music files exists, a sensible fallback for storing user documents
      // is returned.
      'musicLocation': util.format('%s/Music', homeDir),

      // Returns the directory containing the user's movies and videos. This
      // is a generic value. If no directory specific for movie files exists,
      // a sensible fallback for storing user documents is returned.
      'moviesLocation': util.format('%s/Videos', homeDir),

      // Returns the directory containing the user's movies and videos. This
      // is a generic value. If no directory specific for movie files exists,
      // a sensible fallback for storing user documents is returned.
      'picturesLocation': util.format('%s/Pictures', homeDir),

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
      'cacheLocation': util.format('%s/.cache/%s', homeDir, appName),

      // Returns a directory location where user-specific non-essential
      // (cached) data, shared across applications, should be written.
      // This is a generic value. Note that the returned path may be
      // empty if the system has no concept of shared cache.
      'genericDataLocation': [
        util.format('%s/.local/share', homeDir),
        '/usr/local/share',
        '/usr/share'
      ],

      // Returns a directory location where persistent data shared across
      // applications can be stored. This is a generic value. The returned
      // path is never empty.
      'runtimeLocation': util.format('/run/user/%s', userName),

      // Returns a directory location where runtime communication files
      // should be written, like Unix local sockets. This is a generic value.
      // The returned path may be empty on some systems.
      'configLocation': [
        util.format('%s/.config', homeDir),
        '/etc/xdg'
      ],

      // Returns a directory location where user-specific configuration files
      // should be written. This may be either a generic value or
      // application-specific, and the returned path is never empty.
      'genericConfigLocation': [
        util.format('%s/.config', homeDir),
        '/etc/xdg'
      ],

      // Returns a directory for user's downloaded files. This is a generic
      // value. If no directory specific for downloads exists, a sensible
      // fallback for storing user documents is returned.
      'downloadLocation': util.format('%s/Downloads', homeDir),

      // Returns a directory location where user-specific configuration files
      // shared between multiple applications should be written. This is a
      // generic value and the returned path is never empty.
      'genericCacheLocation': util.format('%s/.cache', homeDir),

      // Returns a directory location where persistent application data can be
      // stored. This is an application-specific directory. To obtain a path
      // to store data to be shared with other applications, use
      // QStandardPaths::GenericDataLocation. The returned path is never empty.
      // On the Windows operating system, this returns the roaming path. This
      // enum value was added in Qt 5.4.
      'appDataLocation': [
        util.format('%s/.local/share/%s', homeDir, appName),
        util.format('/usr/local/share/%s', appName),
        util.format('/usr/share/%s', appName),
        // The following deviates from qt standard path
        // and allows a portable distribution
        appDir
      ],

      // Returns the local settings path on the Windows operating system. On
      // all other platforms, it returns the same value as AppDataLocation.
      // This enum value was added in Qt 5.4.
      'appLocalDataLocation': [
        util.format('%s/.local/share/%s', homeDir, appName),
        util.format('/usr/local/share/%s', appName),
        util.format('/usr/share/%s', appName),
        // The following deviates from qt standard path
        // and allows a portable distribution
        appDir
      ],

      // Returns a directory location where user-specific configuration files
      // should be written. This is an application-specific directory, and the
      // returned path is never empty. This enum value was added in Qt 5.5.
      'appConfigLocation': [
        util.format('%s/.config/%s', homeDir, appName),
        util.format('/etc/xdg/%s', appName),
        // The following deviates from qt standard path
        // and allows a portable distribution
        util.format('%s/config', appDir)
      ]
    };
    break;

  case 'win32':
    module.exports = {

      'desktopLocation': util.format('%s/Desktop', homeDir),
      'documentsLocation': util.format('%s/Documents', homeDir),
      'fontsLocation': 'C:/Windows/Fonts',
      'applicationsLocation': util.format('%s/AppData/Roaming/Microsoft/Windows/Start Menu/Programs', homeDir),
      'musicLocation': util.format('%s/Music', homeDir),
      'moviesLocation': util.format('%s/Videos', homeDir),
      'picturesLocation': util.format('%s/Pictures', homeDir),
      'tempLocation': tmpDir, // util.format('%s/AppData/Local/Temp', homeDir),
      'homeLocation': homeDir,
      'cacheLocation': util.format('%s/AppData/Local/%s/cache', homeDir, appName),
      'genericDataLocation': [
        util.format('%s/AppData/Local', homeDir),
        'C:/ProgramData',
        appDir,
        util.format('%s/data', appDir),
      ],
      'runtimeLocation': homeDir,
      'configLocation': [
        util.format('%s/AppData/Local/%s', homeDir, appName),
        util.format('C:/ProgramData/%s', appName),
      ],
      'genericConfigLocation': [
        util.format('%s/AppData/Local', homeDir),
        'C:/ProgramData'
      ],
      'downloadLocation': util.format('%s/Documents', homeDir),
      'genericCacheLocation': util.format('%s/AppData/Local/cache', homeDir),
      'appDataLocation': [
        util.format('%s/AppData/Roaming/%s', homeDir, appName),
        util.format('C:/ProgramData/%s', appName),
        appDir,
        util.format('%s/data', appDir)
      ],
      'appLocalDataLocation': [
        util.format('%s/AppData/Local/%s', homeDir, appName),
        util.format('C:/ProgramData/%s', appName),
        appDir,
        util.format('%s/data', appDir)
      ],
      'appConfigLocation': [
        util.format('%s/AppData/Local/%s', homeDir, appName),
        util.format('C:/ProgramData/%s', appName)
      ]
    };
    break;

  case 'darwin':
    module.exports = {
      'desktopLocation': util.format('%s/Desktop', homeDir),
      'documentsLocation': util.format('%s/Documents', homeDir),
      'fontsLocation': '/System/Library/Fonts',
      'applicationsLocation': '/Applications',
      'musicLocation': util.format('%s/Music', homeDir),
      'moviesLocation': util.format('%s/Videos', homeDir),
      'picturesLocation': util.format('%s/Pictures', homeDir),
      'tempLocation': tmpDir,
      'homeLocation': homeDir,
      'cacheLocation': [
        util.format('%s/Library/Caches/%s', homeDir, appName),
        util.format('/Library/Caches/%s', appName)
      ],
      'genericDataLocation': [
        util.format('%s/Library/Application Support', homeDir),
        '/Library/Application Support'
      ],
      'runtimeLocation': util.format('%s/Library/Application Support', homeDir),
      'configLocation': util.format('%s/Library/Preferences', homeDir),
      'genericConfigLocation': util.format('%s/Library/Preferences', homeDir),
      'downloadLocation': util.format('%s/Downloads', homeDir),
      'genericCacheLocation': [
        util.format('%s/Library/Caches', homeDir),
        '/Library/Caches'
      ],
      'appDataLocation': [
        util.format('%s/Library/Application Support/%s', homeDir, appName),
        util.format('/Library/Application Support/%s', appName),
        util.format('%s/../Resources', appDir)
      ],
      'appLocalDataLocation': [
        util.format('%s/Library/Application Support/%s', homeDir, appName),
        util.format('/Library/Application Support/%s', appName),
        util.format('%s/../Resources', appDir)
      ],
      'appConfigLocation': [
        util.format('%s/Library/Preferences/%s', homeDir, appName)
      ]
    };
    break;

  default:
    module.exports = {};
    break;

};

