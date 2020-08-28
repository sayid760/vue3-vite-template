module.exports = {
  "root": true,
    "env": {
      "browser" : true,
      "node" : true,
      "es6" : true
    },
  "parser": "vue-eslint-parser",
  "extends": [
    "eslint:recommended"
  ],
  "rules" : {
    "no-unused-vars" : 2,
    "no-undef" : 2,
    "semi": ["error", "always"],
    "quotes": ["error", "double"]
  },
  "parserOptions": {
    "ecmaVersion": 2020,
    "sourceType": "module"
  },
  "overrides": [
    {
      "files": [
        "**/__tests__/*.{j,t}s?(x)",
        "**/tests/unit/**/*.spec.{j,t}s?(x)"
      ],
      "env": {
        "jest": true
      }
    }
  ]
}
