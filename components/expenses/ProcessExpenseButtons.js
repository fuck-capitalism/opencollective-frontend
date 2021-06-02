import React from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { Ban as UnapproveIcon } from '@styled-icons/fa-solid/Ban';
import { Check as ApproveIcon } from '@styled-icons/fa-solid/Check';
import { Times as RejectIcon } from '@styled-icons/fa-solid/Times';
import { FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';

import { EDIT_COLLECTIVE_SECTIONS } from '../edit-collective/Menu';
import { getI18nLink } from '../I18nFormatters';
import Link from '../Link';
import StyledButton from '../StyledButton';
import { TOAST_TYPE, useToasts } from '../ToastProvider';
import { useUser } from '../UserProvider';

import { expensePageExpenseFieldsFragment } from './graphql/fragments';
import MarkExpenseAsUnpaidButton from './MarkExpenseAsUnpaidButton';
import PayExpenseButton from './PayExpenseButton';

const processExpenseMutation = gqlV2/* GraphQL */ `
  mutation ProcessExpense(
    $id: String
    $legacyId: Int
    $action: ExpenseProcessAction!
    $paymentParams: ProcessExpensePaymentParams
  ) {
    processExpense(expense: { id: $id, legacyId: $legacyId }, action: $action, paymentParams: $paymentParams) {
      ...ExpensePageExpenseFields
    }
  }

  ${expensePageExpenseFieldsFragment}
`;

const ButtonLabel = styled.span({ marginLeft: 6 });

/**
 * A small helper to know if expense process buttons should be displayed
 */
export const hasProcessButtons = permissions => {
  if (!permissions) {
    return false;
  }

  return (
    permissions.canApprove ||
    permissions.canUnapprove ||
    permissions.canReject ||
    permissions.canPay ||
    permissions.canMarkAsUnpaid
  );
};

const getErrorContent = (intl, error, host, LoggedInUser) => {
  // TODO: The proper way to check for error types is with error.type, not the message
  const message = error?.message;
  if (message) {
    if (message.startsWith('Insufficient Paypal balance')) {
      return {
        title: 'Insufficient Paypal balance',
        message: (
          <React.Fragment>
            <Link href={`/${host.slug}/dashboard`}>
              <FormattedMessage
                id="PayExpenseModal.RefillBalanceError"
                defaultMessage="Refill your balance from the Host dashboard"
              />
            </Link>
          </React.Fragment>
        ),
      };
    } else if (message.startsWith('Host has two-factor authentication enabled for large payouts')) {
      return {
        title: 'Host has two-factor authentication enabled for large payouts',
        message: (
          <FormattedMessage
            id="PayExpenseModal.HostTwoFactorAuthEnabled"
            defaultMessage="Please go to your <SettingsLink>settings</SettingsLink> to enable two-factor authentication for your account."
            values={{
              SettingsLink: getI18nLink({
                as: Link,
                href: `${LoggedInUser.collective.slug}/edit/${EDIT_COLLECTIVE_SECTIONS.TWO_FACTOR_AUTH}`,
                openInNewTab: true,
              }),
            }}
          />
        ),
      };
    } else if (message.startsWith('Two-factor authentication')) {
      return {
        type: TOAST_TYPE.INFO,
        message: (
          <FormattedMessage
            id="2FA.PleaseEnterCode"
            defaultMessage="Two-factor authentication enabled: please enter your code."
          />
        ),
      };
    }
  }

  return { message: i18nGraphqlException(intl, error) };
};

/**
 * All the buttons to process an expense, displayed in a React.Fragment to let the parent
 * in charge of the layout.
 */
const ProcessExpenseButtons = ({ expense, collective, host, permissions, buttonProps, onSuccess }) => {
  const [selectedAction, setSelectedAction] = React.useState(null);
  const onUpdate = (cache, response) => onSuccess?.(response.data.processExpense, cache, selectedAction);
  const mutationOptions = { context: API_V2_CONTEXT, update: onUpdate };
  const [processExpense, { loading, error }] = useMutation(processExpenseMutation, mutationOptions);
  const intl = useIntl();
  const { addToast } = useToasts();
  const { LoggedInUser } = useUser();

  const triggerAction = async (action, paymentParams) => {
    // Prevent submitting the action if another one is being submitted at the same time
    if (loading) {
      return;
    }

    setSelectedAction(action);

    try {
      const variables = { id: expense.id, legacyId: expense.legacyId, action, paymentParams };
      await processExpense({ variables });
    } catch (e) {
      // Display a toast with light variant since we're in a modal
      addToast({ type: TOAST_TYPE.ERROR, variant: 'light', ...getErrorContent(intl, e, host, LoggedInUser) });
    }
  };

  const getButtonProps = (action, hasOnClick = true) => {
    const isSelectedAction = selectedAction === action;
    return {
      ...buttonProps,
      disabled: loading && !isSelectedAction,
      loading: loading && isSelectedAction,
      onClick: hasOnClick ? () => triggerAction(action) : undefined,
    };
  };

  return (
    <React.Fragment>
      {permissions.canApprove && (
        <StyledButton {...getButtonProps('APPROVE')} buttonStyle="secondary" data-cy="approve-button">
          <ApproveIcon size={12} />
          <ButtonLabel>
            <FormattedMessage id="actions.approve" defaultMessage="Approve" />
          </ButtonLabel>
        </StyledButton>
      )}
      {permissions.canReject && (
        <StyledButton {...getButtonProps('REJECT')} buttonStyle="dangerSecondary" data-cy="reject-button">
          <RejectIcon size={14} />
          <ButtonLabel>
            <FormattedMessage id="actions.reject" defaultMessage="Reject" />
          </ButtonLabel>
        </StyledButton>
      )}
      {permissions.canMarkAsSpam && (
        <StyledButton {...getButtonProps('MARK_AS_SPAM')} buttonStyle="dangerSecondary" data-cy="spam-button">
          <RejectIcon size={14} />
          <ButtonLabel>
            <FormattedMessage id="actions.spam" defaultMessage="Mark as Spam" />
          </ButtonLabel>
        </StyledButton>
      )}
      {permissions.canPay && (
        <PayExpenseButton
          {...getButtonProps('PAY', false)}
          onSubmit={triggerAction}
          expense={expense}
          collective={collective}
          host={host}
          error={error}
        />
      )}
      {permissions.canUnapprove && (
        <StyledButton {...getButtonProps('UNAPPROVE')} buttonStyle="dangerSecondary" data-cy="unapprove-button">
          <UnapproveIcon size={12} />
          <ButtonLabel>
            <FormattedMessage id="expense.unapprove.btn" defaultMessage="Unapprove" />
          </ButtonLabel>
        </StyledButton>
      )}
      {permissions.canUnschedulePayment && (
        <StyledButton
          {...getButtonProps('UNSCHEDULE_PAYMENT')}
          buttonStyle="dangerSecondary"
          data-cy="unapprove-button"
        >
          <UnapproveIcon size={12} />
          <ButtonLabel>
            <FormattedMessage id="expense.unschedulePayment.btn" defaultMessage="Unschedule Payment" />
          </ButtonLabel>
        </StyledButton>
      )}
      {permissions.canMarkAsUnpaid && (
        <MarkExpenseAsUnpaidButton
          data-cy="mark-as-unpaid-button"
          {...getButtonProps('MARK_AS_UNPAID', false)}
          onConfirm={hasPaymentProcessorFeesRefunded =>
            triggerAction('MARK_AS_UNPAID', {
              paymentProcessorFee: hasPaymentProcessorFeesRefunded ? 1 : 0,
            })
          }
        />
      )}
    </React.Fragment>
  );
};

ProcessExpenseButtons.propTypes = {
  permissions: PropTypes.shape({
    canApprove: PropTypes.bool,
    canUnapprove: PropTypes.bool,
    canReject: PropTypes.bool,
    canMarkAsSpam: PropTypes.bool,
    canPay: PropTypes.bool,
    canMarkAsUnpaid: PropTypes.bool,
    canUnschedulePayment: PropTypes.bool,
  }).isRequired,
  expense: PropTypes.shape({
    id: PropTypes.string,
    legacyId: PropTypes.number,
  }).isRequired,
  /** The account where the expense has been submitted */
  collective: PropTypes.object.isRequired,
  host: PropTypes.object,
  /** Props passed to all buttons. Useful to customize sizes, spaces, etc. */
  buttonProps: PropTypes.object,
  showError: PropTypes.bool,
  onSuccess: PropTypes.func,
};

export const DEFAULT_PROCESS_EXPENSE_BTN_PROPS = {
  buttonSize: 'small',
  minWidth: 130,
  mx: 2,
  mt: 2,
};

ProcessExpenseButtons.defaultProps = {
  buttonProps: DEFAULT_PROCESS_EXPENSE_BTN_PROPS,
};

export default ProcessExpenseButtons;
