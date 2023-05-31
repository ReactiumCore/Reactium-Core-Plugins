describe('The default component', () => {
    it('should display NotFound component', () => {
        cy.visit('/asdf'); // probably does not exist
        cy.contains('Page Not Found');
    });
});
