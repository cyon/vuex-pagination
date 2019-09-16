# Changelog

## v1.3.4

- Moved Vue plugin functionality from `created` into `beforeMount` to support SSR mechanisms
- Added a few files to `.npmignore`

## v1.3.2

- Fixed a major bug where the library would not work in a built application

## v1.3.1

- Fixed a bug where updating an instance before it got initialized would fail

## v1.3.0

- Introduced a changelog 🎉
- Better documentation
- More examples
- Changed naming of `controller` to `resource` (`controller` will continue to work for 1.x)
- Removed unused dependencies
- Moved `index.js` into `src/` folder
