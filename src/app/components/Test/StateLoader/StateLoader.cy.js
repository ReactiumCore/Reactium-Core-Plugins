describe('State.registerDataLoader', () => {
    it('should load on route change', () => {
        cy.visit('/state/one');
        cy.get('.event-loaded').should('contain', 'state-load-one');
    });

    it('should load on dispatch change', () => {
        cy.visit('/state/two');
        cy.contains('Trigger 2').click();
        cy.get('.event-loaded').should('contain', 'state-load-two');
    });

    it('should load on Hook run', () => {
        cy.visit('/state/three');
        cy.contains('Trigger 3').click();
        cy.get('.event-loaded').should('contain', 'state-load-three');
    });
});
