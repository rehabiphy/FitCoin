module.exports = {
  presets: ['module:@react-native/babel-preset'],
  // Must stay last: powers Reanimated 4 worklets.
  plugins: ['react-native-worklets/plugin'],
};
