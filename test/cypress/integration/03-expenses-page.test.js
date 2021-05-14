describe('New expense flow ', () => {
  it('Show the /expenses page', () => {
    cy.visit(`/railsgirlsatl/expenses`);
    cy.get('[data-cy^="expense-container"]').should('have.length', 10);
    cy.getByDataCy('pagination-total').contains(4);
    cy.contains('[data-cy^="expense-container"]:nth-child(1)', 'Food and Beverages');
  });

  it('Filter expenses', () => {
    cy.visit(`/railsgirlsatl/expenses`);

    // Filter by tag
    cy.contains('[data-cy="expense-tags-link"]', 'communication').click();
    cy.get('[data-cy^="expense-container"]').should('have.length', 7);
    cy.getByDataCy('pagination-total').contains(1);

    // Filter on amount
    cy.getByDataCy('expenses-filter-amount').click();
    cy.getByDataCy('select-option').contains('$50 to $500').click();

    // Remove tag
    cy.get('[data-cy="expense-tag"] [data-cy="remove-btn"]').click();
    cy.get('[data-cy^="expense-container"]').should('have.length', 10);

    // Filter on status
    cy.getByDataCy('expenses-filter-status').click();
    cy.getByDataCy('select-option').contains('Rejected').click();
    cy.get('[data-cy^="expense-container"]').should('have.length', 1);

    // Filter by period
    cy.getByDataCy('period-filter').click();
    cy.get('input[name="dateFrom"]').type('2021-01-01');
    cy.getByDataCy('btn-apply-period-filter').click();
    cy.get('[data-cy^="expense-container"]').should('have.length', 0);

    // Reset filters
    cy.getByDataCy('reset-expenses-filters').click();
    cy.get('[data-cy^="expense-container"]').should('have.length', 10);
  });
});
