const { defineConfig } = require('cypress');

module.exports = defineConfig({
    e2e: {
        specPattern: [
            'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
            'src/**/*.cy.{js,jsx}',
            'reactium_modules/**/*.cy.{js,jsx}',
        ],
        baseUrl: 'http://localhost:3030',
        setupNodeEvents(on, config) {
            // implement node event listeners here
        },
    },
});
