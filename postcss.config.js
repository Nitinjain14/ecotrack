module.exports = {
  plugins: [
    require('postcss-flexbugs-fixes'),
    require('tailwindcss'),
    require('postcss-preset-env')({
      stage: 3,
      features: {
        'nesting-rules': true,
      },
    }),
    require('autoprefixer'),
  ],
};
