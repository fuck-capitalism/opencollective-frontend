describe('Recurring contributions', () => {
  let user;
  let collectiveSlug;

  before(() => {
    cy.createHostedCollective({ type: 'COLLECTIVE' })
      .then(collective => {
        collectiveSlug = collective.slug;
        cy.login({ redirect: `/${collectiveSlug}/edit/tiers` });
        cy.getByDataCy('add-tier-button').click();
        cy.get('[data-cy="tier-input-field-name"] input').last().type('Recurring Fixed Donation Tier');
        cy.get('[data-cy="tier-input-field-interval"] [data-cy="interval"]').last().click();
        cy.contains('[data-cy="select-option"]', 'monthly').click();
        cy.get('[data-cy="tier-input-field-amount"] input').last().type('10');
        cy.getByDataCy('collective-save').click();
        cy.logout();
      })
      .then(() => {
        cy.signup({ redirect: `/${collectiveSlug}/donate` }).then(u => {
          user = u;
          cy.get('#interval > :nth-child(2)').click();
          cy.get('button[data-cy="cf-next-step"]').click();
          cy.contains('Contribute as');
          cy.get('button[data-cy="cf-next-step"]').click();
          cy.useAnyPaymentMethod();
          cy.contains('button', 'Contribute').click();
          cy.getByDataCy('order-success');
        });
      });
  });

  it('Has contributions in the right categories', () => {
    cy.login({ email: user.email, redirect: `/${user.collective.slug}/recurring-contributions` }).then(() => {
      cy.getByDataCy('filter-button monthly').click();
      cy.getByDataCy('recurring-contribution-card').should('have.length', 1);
      cy.getByDataCy('filter-button yearly').click();
      cy.getByDataCy('recurring-contribution-card').should('have.length', 0);
    });
  });

  it(
    'Can add a new payment method and use it for the recurring contribution',
    {
      retries: {
        runMode: 2,
        openMode: 1,
      },
    },
    () => {
      cy.login({ email: user.email, redirect: `/${user.collective.slug}/recurring-contributions` }).then(() => {
        cy.getByDataCy('recurring-contribution-edit-activate-button').first().click();
        cy.getByDataCy('recurring-contribution-menu-payment-option').click();
        cy.getByDataCy('recurring-contribution-payment-menu').should('exist');
        cy.getByDataCy('recurring-contribution-add-pm-button').click();
        cy.wait(3000);
        cy.fillStripeInput();
        cy.getByDataCy('recurring-contribution-submit-pm-button').click();
        cy.contains('[data-cy="recurring-contribution-pm-box"]', 'VISA **** 4242').within(() => {
          cy.getByDataCy('radio-select').check();
        });
        cy.getByDataCy('recurring-contribution-update-pm-button').click();
        cy.getByDataCy('toast-notification').contains('Your recurring contribution has been updated.');
      });
    },
  );

  it('Can change the tier and amount of the order', () => {
    cy.login({ email: user.email, redirect: `/${user.collective.slug}/recurring-contributions` }).then(() => {
      cy.getByDataCy('recurring-contribution-edit-activate-button').first().click();
      cy.getByDataCy('recurring-contribution-menu-tier-option').click();
      cy.getByDataCy('recurring-contribution-order-menu').should('exist');
      cy.contains('[data-cy="recurring-contribution-tier-box"]', 'Backer').within(() => {
        cy.getByDataCy('radio-select').check();
      });
      cy.getByDataCy('recurring-contribution-update-order-button').click();
      cy.getByDataCy('toast-notification').contains('Your recurring contribution has been updated.');
      cy.getByDataCy('recurring-contribution-amount-contributed').contains('$5.00 USD / month');
    });
  });

  it('Can select a fixed recurring contribution tier', () => {
    cy.login({ email: user.email, redirect: `/${user.collective.slug}/recurring-contributions` }).then(() => {
      cy.getByDataCy('recurring-contribution-edit-activate-button').first().click();
      cy.getByDataCy('recurring-contribution-menu-tier-option').click();
      cy.getByDataCy('recurring-contribution-order-menu').should('exist');
      cy.contains('[data-cy="recurring-contribution-tier-box"]', 'Recurring Fixed Donation Tier').within(() => {
        cy.getByDataCy('radio-select').check();
      });
      cy.getByDataCy('recurring-contribution-update-order-button').click();
      cy.getByDataCy('toast-notification').contains('Your recurring contribution has been updated.');
      cy.getByDataCy('recurring-contribution-amount-contributed').contains('$10.00 USD / month');
    });
  });

  it('Can change the amount in a flexible contribution tier', () => {
    cy.login({ email: user.email, redirect: `/${user.collective.slug}/recurring-contributions` }).then(() => {
      cy.getByDataCy('recurring-contribution-edit-activate-button').first().click();
      cy.getByDataCy('recurring-contribution-menu-tier-option').click();
      cy.getByDataCy('recurring-contribution-order-menu').should('exist');
      cy.contains('[data-cy="recurring-contribution-tier-box"]', 'Sponsor').within(() => {
        cy.getByDataCy('radio-select').check();
      });
      cy.getByDataCy('tier-amount-select').click();
      cy.contains('[data-cy="select-option"]', '$250').click();
      cy.getByDataCy('recurring-contribution-update-order-button').click();
      cy.getByDataCy('toast-notification').contains('Your recurring contribution has been updated.');
      cy.getByDataCy('recurring-contribution-amount-contributed').contains('$250.00 USD / month');
    });
  });

  it('Can contribute a custom contribution amount', () => {
    cy.login({ email: user.email, redirect: `/${user.collective.slug}/recurring-contributions` }).then(() => {
      cy.getByDataCy('recurring-contribution-edit-activate-button').first().click();
      cy.getByDataCy('recurring-contribution-menu-tier-option').click();
      cy.getByDataCy('recurring-contribution-order-menu').should('exist');
      cy.contains('[data-cy="recurring-contribution-tier-box"]', 'Sponsor').within(() => {
        cy.getByDataCy('radio-select').check();
      });
      cy.getByDataCy('tier-amount-select').click();
      cy.contains('[data-cy="select-option"]', 'Other').click();
      cy.getByDataCy('recurring-contribution-tier-box').contains('Min. amount: $100.00');
      cy.getByDataCy('recurring-contribution-custom-amount-input').clear().type('150');

      cy.getByDataCy('recurring-contribution-update-order-button').scrollIntoView().click();
      cy.getByDataCy('toast-notification').contains('Your recurring contribution has been updated.');
      cy.getByDataCy('recurring-contribution-amount-contributed').contains('$150.00 USD / month');
    });
  });

  it('Cannot contribute a contribution amount less than the minimum allowable amount', () => {
    cy.login({ email: user.email, redirect: `/${user.collective.slug}/recurring-contributions` }).then(() => {
      cy.getByDataCy('recurring-contribution-edit-activate-button').first().click();
      cy.getByDataCy('recurring-contribution-menu-tier-option').click();
      cy.getByDataCy('recurring-contribution-order-menu').should('exist');
      cy.contains('[data-cy="recurring-contribution-tier-box"]', 'Sponsor').within(() => {
        cy.getByDataCy('radio-select').check();
      });

      cy.getByDataCy('tier-amount-select').click();
      cy.contains('[data-cy="select-option"]', 'Other').click();
      cy.getByDataCy('recurring-contribution-tier-box').contains('Min. amount: $100.00');
      cy.getByDataCy('recurring-contribution-custom-amount-input').type('50');

      cy.getByDataCy('recurring-contribution-update-order-button').scrollIntoView().click();
      cy.getByDataCy('toast-notification').contains('Amount is less than minimum value allowed for this Tier.');
    });
  });

  it('Can cancel an active contribution', () => {
    cy.login({ email: user.email, redirect: `/${user.collective.slug}/recurring-contributions` }).then(() => {
      cy.getByDataCy('recurring-contribution-edit-activate-button').first().contains('Edit');
      cy.getByDataCy('recurring-contribution-edit-activate-button').first().click();
      cy.getByDataCy('recurring-contribution-menu').should('exist');
      cy.getByDataCy('recurring-contribution-menu-cancel-option').click();
      cy.getByDataCy('recurring-contribution-cancel-menu').should('exist');
      cy.getByDataCy('recurring-contribution-cancel-menu').contains('Are you sure?');
      cy.getByDataCy('recurring-contribution-cancel-no').contains('No, wait');
      cy.getByDataCy('recurring-contribution-cancel-yes')
        .click()
        .then(() => {
          cy.getByDataCy('toast-notification').contains('Your recurring contribution has been cancelled');
          cy.getByDataCy('filter-button cancelled').click();
          cy.getByDataCy('recurring-contribution-card').should('have.length', 1);
        });
    });
  });
});
