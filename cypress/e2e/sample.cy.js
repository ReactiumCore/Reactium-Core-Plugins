describe('The default component', () => {
    it('should display NotFound component', () => {
        cy.visit('/');
        cy.contains('Page Not Found');
    });
});
