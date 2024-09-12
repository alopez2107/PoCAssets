/*
 * Copyright 2015-2023 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */
/**
 * This is a Policy Condition example script. It demonstrates how to access a user's information,
 * use that information in external HTTP calls and make a policy decision based on the outcome.
 */

var tppConsentHS, tppConsent, txType;

if (environment) {
  tppConsentHS = environment.get("tppConsent");
  tppConsent = JSON.parse(tppConsentHS.iterator().next());
  authorized = true;
  logger.error("ALEXLOG: Received TPPConsent object is: {}", JSON.stringify(tppConsent));
  var accountNumber = environment.get("acctNumber");
  var acctNumber = accountNumber.iterator().next();
  logger.error("ALEXLOG: Requested account number is {}", acctNumber);
  var consentedAccounts = tppConsent["consentedAccounts"];
  var account = consentedAccounts.find((consentedAccount) => consentedAccount["acctNumber"] == acctNumber );
  if (account) {
    logger.error("ALEXLOG: Account found {}", JSON.stringify(account));
    authorized = true;
  }
  else {
    logger.error("ALEXLOG: Account {} has not been consented for access.", JSON.stringify(accountNumber));
    authorized = false;
  }
}
else {
  authorized = false;
}